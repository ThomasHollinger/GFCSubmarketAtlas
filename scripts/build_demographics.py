#!/usr/bin/env python3
"""
Gulf Coast Submarket Atlas - Demographics Builder

This script builds a precomputed demographics dataset for custom KML submarket
boundaries using Census ACS 5-year block-group data and TIGER block-group geometry.
It is designed to run in GitHub Actions, Codespaces, or locally.

Outputs:
  output/submarket_demographics_combined.json
  output/submarket_demographics_current_and_forecast.csv
  output/submarket_demographics_audit.csv
  output/submarket_demographics_metadata.json
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import time
import zipfile
from pathlib import Path
from typing import Dict, Iterable, List, Tuple
import xml.etree.ElementTree as ET

import geopandas as gpd
import pandas as pd
import requests
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union

CURRENT_YEAR = 2023
PRIOR_YEAR = 2018
STATES = {"01": "Alabama", "12": "Florida"}
EA_CRS = "EPSG:5070"  # NAD83 / Conus Albers - appropriate for area weighting

ACS_VARS = {
    "population": "B01003_001E",
    "households": "B11001_001E",
    "median_household_income": "B19013_001E",
    "median_age": "B01002_001E",
    "occupied_housing_units": "B25003_001E",
    "owner_occupied_units": "B25003_002E",
    "renter_occupied_units": "B25003_003E",
    "population_25_plus": "B15003_001E",
    "bachelors_degree": "B15003_022E",
    "masters_degree": "B15003_023E",
    "professional_degree": "B15003_024E",
    "doctorate_degree": "B15003_025E",
}

BAD_VALUE_CUTOFF = -1_000_000


def log(msg: str) -> None:
    print(msg, flush=True)


def clean_name(name: str) -> str:
    name = (name or "Unnamed Submarket").strip()
    name = re.sub(r"\s+", " ", name)
    return name


def make_valid_geom(geom):
    if geom is None or geom.is_empty:
        return None
    try:
        if not geom.is_valid:
            geom = geom.buffer(0)
    except Exception:
        geom = geom.buffer(0)
    if geom.is_empty:
        return None
    return geom


def _coords_to_ring(coord_text: str) -> List[Tuple[float, float]]:
    coords = []
    for token in coord_text.strip().replace("\n", " ").split():
        parts = token.split(",")
        if len(parts) >= 2:
            try:
                lon = float(parts[0])
                lat = float(parts[1])
                coords.append((lon, lat))
            except ValueError:
                pass
    if coords and coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords


def _polygon_from_kml_polygon(poly_el, ns) -> Polygon | None:
    outer = poly_el.find(".//kml:outerBoundaryIs/kml:LinearRing/kml:coordinates", ns)
    if outer is None or not outer.text:
        outer = poly_el.find(".//outerBoundaryIs/LinearRing/coordinates")
    if outer is None or not outer.text:
        return None
    shell = _coords_to_ring(outer.text)
    holes = []
    for inner in poly_el.findall(".//kml:innerBoundaryIs/kml:LinearRing/kml:coordinates", ns):
        if inner.text:
            ring = _coords_to_ring(inner.text)
            if len(ring) >= 4:
                holes.append(ring)
    if len(shell) < 4:
        return None
    try:
        return Polygon(shell, holes)
    except Exception:
        return None


def read_kml_boundaries(kml_path: Path) -> gpd.GeoDataFrame:
    log(f"Reading KML boundaries: {kml_path}")
    tree = ET.parse(kml_path)
    root = tree.getroot()
    ns = {"kml": "http://www.opengis.net/kml/2.2"}
    placemarks = root.findall(".//kml:Placemark", ns)
    if not placemarks:
        placemarks = root.findall(".//Placemark")

    records = []
    for pm in placemarks:
        name_el = pm.find("kml:name", ns)
        if name_el is None:
            name_el = pm.find("name")
        name = clean_name(name_el.text if name_el is not None else "Unnamed Submarket")
        polygons = []
        poly_elements = pm.findall(".//kml:Polygon", ns)
        if not poly_elements:
            poly_elements = pm.findall(".//Polygon")
        for poly_el in poly_elements:
            poly = _polygon_from_kml_polygon(poly_el, ns)
            poly = make_valid_geom(poly)
            if poly is not None and not poly.is_empty:
                polygons.append(poly)
        if not polygons:
            continue
        geom = polygons[0] if len(polygons) == 1 else MultiPolygon(polygons)
        geom = make_valid_geom(geom)
        if geom is not None:
            records.append({"submarket": name, "geometry": geom})

    if not records:
        raise RuntimeError("No polygon boundaries were found in the KML file.")

    gdf = gpd.GeoDataFrame(records, crs="EPSG:4326")
    # Dissolve duplicate placemarks by name, which handles duplicated Bay County style entries.
    gdf = gdf.dissolve(by="submarket", as_index=False)
    gdf["geometry"] = gdf.geometry.apply(make_valid_geom)
    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty].copy()
    log(f"Loaded {len(gdf)} unique submarket boundaries.")
    return gdf


def download_file(url: str, out_path: Path, retries: int = 4, sleep_seconds: int = 5) -> Path:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if out_path.exists() and out_path.stat().st_size > 0:
        return out_path
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            log(f"Downloading {url} (attempt {attempt}/{retries})")
            r = requests.get(url, timeout=90)
            if r.status_code != 200:
                preview = r.text[:500] if hasattr(r, "text") else ""
                raise RuntimeError(f"HTTP {r.status_code}: {preview}")
            out_path.write_bytes(r.content)
            return out_path
        except Exception as exc:
            last_err = exc
            log(f"Download failed: {exc}")
            if attempt < retries:
                time.sleep(sleep_seconds * attempt)
    raise RuntimeError(f"Failed to download {url}: {last_err}")


def load_tiger_block_groups(year: int, states: Iterable[str], cache_dir: Path) -> gpd.GeoDataFrame:
    frames = []
    tiger_year = year
    for state in states:
        url = f"https://www2.census.gov/geo/tiger/TIGER{tiger_year}/BG/tl_{tiger_year}_{state}_bg.zip"
        zip_path = cache_dir / f"tl_{tiger_year}_{state}_bg.zip"
        download_file(url, zip_path)
        log(f"Reading TIGER block groups for {STATES.get(state, state)}")
        frames.append(gpd.read_file(zip_path))
    bg = pd.concat(frames, ignore_index=True)
    bg = gpd.GeoDataFrame(bg, geometry="geometry", crs=frames[0].crs).to_crs("EPSG:4326")
    for col in ["STATEFP", "COUNTYFP", "TRACTCE", "BLKGRPCE", "GEOID"]:
        if col in bg.columns:
            bg[col] = bg[col].astype(str)
    log(f"Loaded {len(bg):,} TIGER block groups across {len(list(states))} states.")
    return bg


def census_get_json(url: str, params: Dict[str, str], retries: int = 5) -> list:
    """Fetch JSON from Census.

    The Census API redirects to /data/missing_key.html or /data/invalid_key.html
    when a blank/invalid key is passed. This function detects that case, removes
    the key parameter, and retries keyless before failing.
    """
    request_params = dict(params)
    if request_params.get("key", "").strip() == "":
        request_params.pop("key", None)
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            r = requests.get(url, params=request_params, timeout=90)
            bad_key_response = (
                "missing_key" in str(r.url).lower()
                or "invalid_key" in str(r.url).lower()
                or "<title>missing key</title>" in r.text.lower()
                or "<title>invalid key</title>" in r.text.lower()
            )
            if bad_key_response:
                if "key" in request_params:
                    log("Census rejected the API key parameter. Retrying without a key.")
                    request_params.pop("key", None)
                    r = requests.get(url, params=request_params, timeout=90)
                    bad_key_response = (
                        "missing_key" in str(r.url).lower()
                        or "invalid_key" in str(r.url).lower()
                        or "<title>missing key</title>" in r.text.lower()
                        or "<title>invalid key</title>" in r.text.lower()
                    )
                if bad_key_response:
                    raise RuntimeError("Census API rejected the API request because no valid key was accepted. Confirm the repo secret CENSUS_API_KEY exactly matches the activated Census key, or rerun after removing the bad secret so the script can try keyless requests.")
            if r.status_code != 200:
                raise RuntimeError(f"HTTP {r.status_code}. URL: {r.url}. Response: {r.text[:800]}")
            try:
                return r.json()
            except Exception as exc:
                preview = r.text[:1000]
                raise RuntimeError(f"Non-JSON Census response. URL: {r.url}. Response: {preview}") from exc
        except Exception as exc:
            last_err = exc
            log(f"Census request failed attempt {attempt}/{retries}: {exc}")
            if attempt < retries:
                time.sleep(8 * attempt)
    raise RuntimeError(f"Census API request failed after {retries} attempts: {last_err}")



def validate_census_key_or_fail() -> None:
    """Validate the Census API key with a broad county-level request.

    Earlier versions tested a single Baldwin County tract/block group that may not exist
    in the selected ACS release, which produced HTTP 204 and incorrectly looked like
    an invalid key. This version validates against the county geography instead.
    """
    api_key = os.getenv("CENSUS_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "CENSUS_API_KEY is missing. Add it in GitHub under Settings > Secrets and variables > Actions. "
            "Name the secret exactly CENSUS_API_KEY. Do not put the key in the public repository."
        )
    log(f"Census API key detected. Length: {len(api_key)} characters. Validating with a county-level ACS request...")
    test_url = f"https://api.census.gov/data/{CURRENT_YEAR}/acs/acs5"
    test_params = {
        "get": "NAME,B01003_001E",
        "for": "county:003",
        "in": "state:01",
        "key": api_key,
    }
    try:
        data = census_get_json(test_url, test_params, retries=2)
    except Exception as exc:
        raise RuntimeError(
            "Census API key validation failed before the full build. "
            "This should be a broad county-level test, so a failure here usually means the secret value is wrong, "
            "not activated, or Census is temporarily rejecting requests. "
            f"Underlying error: {exc}"
        ) from exc
    if not isinstance(data, list) or len(data) < 2:
        raise RuntimeError("Census API key validation returned no county data. Check the key and try again.")
    log("Census API key validated successfully.")

def fetch_acs_for_counties(year: int, counties: pd.DataFrame) -> pd.DataFrame:
    base_url = f"https://api.census.gov/data/{year}/acs/acs5"
    variables = list(ACS_VARS.values())
    get_clause = "NAME," + ",".join(variables)
    api_key = os.getenv("CENSUS_API_KEY", "").strip()
    # GitHub Actions may pass an empty or placeholder secret. Do not send a blank key.
    if not api_key or api_key.startswith("${{") or api_key.lower() in {"none", "null", "changeme", "your_key_here"}:
        api_key = ""
        log("No valid Census API key detected; using keyless Census API requests.")
    rows = []
    for _, row in counties.iterrows():
        state = str(row["STATEFP"]).zfill(2)
        county = str(row["COUNTYFP"]).zfill(3)
        params = {
            "get": get_clause,
            "for": "block group:*",
            "in": f"state:{state} county:{county} tract:*",
        }
        if api_key:
            params["key"] = api_key
        log(f"Fetching ACS {year} block-group data for state {state}, county {county}")
        data = census_get_json(base_url, params)
        if len(data) <= 1:
            continue
        header = data[0]
        for values in data[1:]:
            rows.append(dict(zip(header, values)))
    if not rows:
        raise RuntimeError(f"No ACS rows returned for {year}.")
    df = pd.DataFrame(rows)
    rename = {v: k for k, v in ACS_VARS.items()}
    df = df.rename(columns=rename)
    df["GEOID"] = df["state"].astype(str).str.zfill(2) + df["county"].astype(str).str.zfill(3) + df["tract"].astype(str).str.zfill(6) + df["block group"].astype(str).str.zfill(1)
    for col in ACS_VARS.keys():
        df[col] = pd.to_numeric(df[col], errors="coerce")
        df.loc[df[col] <= BAD_VALUE_CUTOFF, col] = pd.NA
    df["bachelors_plus_count"] = df[["bachelors_degree", "masters_degree", "professional_degree", "doctorate_degree"]].sum(axis=1, min_count=1)
    log(f"Fetched {len(df):,} ACS {year} block-group rows.")
    return df


def find_intersecting_block_groups(submarkets: gpd.GeoDataFrame, bg: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    sub_ea = submarkets.to_crs(EA_CRS)[["submarket", "geometry"]].copy()
    bg_ea = bg.to_crs(EA_CRS)[["GEOID", "STATEFP", "COUNTYFP", "TRACTCE", "BLKGRPCE", "geometry"]].copy()
    bg_ea["bg_area_sqm"] = bg_ea.geometry.area
    log("Intersecting submarket polygons with Census block groups...")
    inter = gpd.overlay(
        bg_ea,
        sub_ea,
        how="intersection",
        keep_geom_type=True,
        make_valid=True,
    )
    inter["overlap_area_sqm"] = inter.geometry.area
    inter["overlap_pct_of_bg"] = inter["overlap_area_sqm"] / inter["bg_area_sqm"]
    inter = inter[inter["overlap_pct_of_bg"] > 0.000001].copy()
    log(f"Created {len(inter):,} block-group/submarket intersections.")
    return inter


def aggregate_year(inter: gpd.GeoDataFrame, acs: pd.DataFrame, year: int) -> Tuple[pd.DataFrame, pd.DataFrame]:
    df = inter.drop(columns="geometry").merge(acs, on="GEOID", how="left", validate="many_to_one")
    missing = df["population"].isna().sum()
    if missing:
        log(f"Warning: {missing:,} intersections did not match ACS rows for {year}.")

    additive_cols = [
        "population", "households", "occupied_housing_units", "owner_occupied_units",
        "renter_occupied_units", "population_25_plus", "bachelors_plus_count"
    ]
    for col in additive_cols:
        df[f"alloc_{col}"] = df[col].fillna(0) * df["overlap_pct_of_bg"]

    # Weighted medians/median-like estimates. This is not a true median recomputation,
    # but it is a stable submarket estimate using block-group values weighted by overlap and relevant base.
    df["income_weight"] = df["alloc_households"].fillna(0)
    df["age_weight"] = df["alloc_population"].fillna(0)
    df["median_income_weighted"] = df["median_household_income"].fillna(0) * df["income_weight"]
    df["median_age_weighted"] = df["median_age"].fillna(0) * df["age_weight"]

    agg = df.groupby("submarket", dropna=False).agg(
        population=("alloc_population", "sum"),
        households=("alloc_households", "sum"),
        occupied_housing_units=("alloc_occupied_housing_units", "sum"),
        owner_occupied_units=("alloc_owner_occupied_units", "sum"),
        renter_occupied_units=("alloc_renter_occupied_units", "sum"),
        population_25_plus=("alloc_population_25_plus", "sum"),
        bachelors_plus_count=("alloc_bachelors_plus_count", "sum"),
        income_weight=("income_weight", "sum"),
        age_weight=("age_weight", "sum"),
        median_income_weighted=("median_income_weighted", "sum"),
        median_age_weighted=("median_age_weighted", "sum"),
        contributing_block_groups=("GEOID", "nunique"),
        total_overlap_area_sqm=("overlap_area_sqm", "sum"),
    ).reset_index()

    agg["median_household_income"] = agg.apply(lambda r: r["median_income_weighted"] / r["income_weight"] if r["income_weight"] > 0 else pd.NA, axis=1)
    agg["median_age"] = agg.apply(lambda r: r["median_age_weighted"] / r["age_weight"] if r["age_weight"] > 0 else pd.NA, axis=1)
    agg["owner_occupancy_pct"] = agg.apply(lambda r: 100 * r["owner_occupied_units"] / r["occupied_housing_units"] if r["occupied_housing_units"] > 0 else pd.NA, axis=1)
    agg["renter_occupancy_pct"] = agg.apply(lambda r: 100 * r["renter_occupied_units"] / r["occupied_housing_units"] if r["occupied_housing_units"] > 0 else pd.NA, axis=1)
    agg["bachelors_plus_pct"] = agg.apply(lambda r: 100 * r["bachelors_plus_count"] / r["population_25_plus"] if r["population_25_plus"] > 0 else pd.NA, axis=1)
    agg["year"] = year

    out_cols = [
        "submarket", "year", "population", "households", "median_household_income", "median_age",
        "owner_occupancy_pct", "renter_occupancy_pct", "bachelors_plus_pct", "occupied_housing_units",
        "owner_occupied_units", "renter_occupied_units", "population_25_plus", "bachelors_plus_count",
        "contributing_block_groups", "total_overlap_area_sqm"
    ]
    audit_cols = [
        "submarket", "GEOID", "STATEFP", "COUNTYFP", "TRACTCE", "BLKGRPCE",
        "overlap_area_sqm", "overlap_pct_of_bg", "population", "households",
        "median_household_income", "median_age", "owner_occupied_units", "occupied_housing_units"
    ]
    audit = df[audit_cols].copy()
    audit["year"] = year
    return agg[out_cols], audit


def round_or_none(value, digits=0):
    if value is None or pd.isna(value):
        return None
    try:
        if digits == 0:
            return int(round(float(value)))
        return round(float(value), digits)
    except Exception:
        return None


def forecast_row(current: pd.Series, prior: pd.Series | None) -> Dict[str, float | None]:
    def val(row, col):
        if row is None or col not in row or pd.isna(row[col]):
            return None
        return float(row[col])

    result = {}
    additive = ["population", "households", "occupied_housing_units", "owner_occupied_units", "renter_occupied_units", "population_25_plus", "bachelors_plus_count"]
    for col in additive:
        c = val(current, col)
        p = val(prior, col)
        if c is None:
            result[col] = None
        elif p is not None and p > 0 and c >= 0:
            result[col] = c * (c / p)  # repeat the prior 5-year growth factor once more
        else:
            result[col] = c

    for col in ["median_household_income", "median_age"]:
        c = val(current, col)
        p = val(prior, col)
        if c is None:
            result[col] = None
        elif p is not None:
            result[col] = c + (c - p)
        else:
            result[col] = c

    for col in ["owner_occupancy_pct", "renter_occupancy_pct", "bachelors_plus_pct"]:
        c = val(current, col)
        p = val(prior, col)
        if c is None:
            result[col] = None
        elif p is not None:
            result[col] = max(0.0, min(100.0, c + (c - p)))
        else:
            result[col] = c
    return result


def build_combined(current: pd.DataFrame, prior: pd.DataFrame) -> Tuple[dict, pd.DataFrame]:
    prior_by_name = {r["submarket"]: r for _, r in prior.iterrows()}
    records = []
    combined = {
        "metadata": {
            "source": "U.S. Census ACS 5-Year block-group data with TIGER block-group geometry",
            "current_year": CURRENT_YEAR,
            "prior_year": PRIOR_YEAR,
            "forecast_year": CURRENT_YEAR + 5,
            "forecast_label": "5-Year Forecast",
            "forecast_method": "Repeats the observed prior-to-current five-year change/growth once more. Current values are ACS-derived; forecast values are model-based, not official Census projections.",
            "allocation_method": "Area-weighted overlap between Census block groups and custom KML submarket polygons using EPSG:5070 area calculations.",
        },
        "submarkets": {},
    }

    metric_cols = [
        "population", "households", "median_household_income", "median_age", "owner_occupancy_pct",
        "renter_occupancy_pct", "bachelors_plus_pct", "occupied_housing_units", "owner_occupied_units",
        "renter_occupied_units", "population_25_plus", "bachelors_plus_count"
    ]

    for _, cur in current.iterrows():
        name = cur["submarket"]
        prev = prior_by_name.get(name)
        fc = forecast_row(cur, prev)
        cur_obj = {}
        prev_obj = {}
        fc_obj = {}
        for col in metric_cols:
            digits = 1 if col.endswith("_pct") or col == "median_age" else 0
            cur_obj[col] = round_or_none(cur.get(col), digits)
            prev_obj[col] = round_or_none(prev.get(col) if prev is not None else None, digits)
            fc_obj[col] = round_or_none(fc.get(col), digits)

        # Growth rates for display.
        pop_cur = cur_obj.get("population")
        pop_prev = prev_obj.get("population")
        hh_cur = cur_obj.get("households")
        hh_prev = prev_obj.get("households")
        cur_obj["population_growth_prior_5yr_pct"] = round_or_none(100 * (pop_cur - pop_prev) / pop_prev, 1) if pop_cur and pop_prev else None
        cur_obj["household_growth_prior_5yr_pct"] = round_or_none(100 * (hh_cur - hh_prev) / hh_prev, 1) if hh_cur and hh_prev else None
        fc_obj["population_growth_next_5yr_pct"] = cur_obj["population_growth_prior_5yr_pct"]
        fc_obj["household_growth_next_5yr_pct"] = cur_obj["household_growth_prior_5yr_pct"]

        combined["submarkets"][name] = {
            "current": cur_obj,
            "prior": prev_obj,
            "forecast_5yr": fc_obj,
            "audit": {
                "contributing_block_groups": int(cur.get("contributing_block_groups", 0) or 0),
                "total_overlap_area_sqm": round_or_none(cur.get("total_overlap_area_sqm"), 0),
            },
        }
        row = {"submarket": name}
        for col in metric_cols:
            row[f"current_{col}"] = cur_obj[col]
            row[f"prior_{col}"] = prev_obj[col]
            row[f"forecast_5yr_{col}"] = fc_obj[col]
        row["current_population_growth_prior_5yr_pct"] = cur_obj["population_growth_prior_5yr_pct"]
        row["forecast_population_growth_next_5yr_pct"] = fc_obj["population_growth_next_5yr_pct"]
        row["contributing_block_groups"] = int(cur.get("contributing_block_groups", 0) or 0)
        records.append(row)

    return combined, pd.DataFrame(records)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build submarket-level demographics from KML + Census ACS block groups.")
    parser.add_argument("--kml", default="data/submarkets.kml", help="Path to custom submarket KML file.")
    parser.add_argument("--output-dir", default="output", help="Output directory.")
    parser.add_argument("--cache-dir", default=".cache/census", help="Cache directory.")
    args = parser.parse_args()

    kml_path = Path(args.kml)
    out_dir = Path(args.output_dir)
    cache_dir = Path(args.cache_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    cache_dir.mkdir(parents=True, exist_ok=True)

    validate_census_key_or_fail()

    submarkets = read_kml_boundaries(kml_path)
    bg_current = load_tiger_block_groups(CURRENT_YEAR, STATES.keys(), cache_dir)

    # Keep only block groups near/intersecting the submarket footprint before API calls.
    inter = find_intersecting_block_groups(submarkets, bg_current)
    counties = inter[["STATEFP", "COUNTYFP"]].drop_duplicates().sort_values(["STATEFP", "COUNTYFP"])
    log("Counties in custom boundary footprint:")
    log(counties.to_string(index=False))

    current_acs = fetch_acs_for_counties(CURRENT_YEAR, counties)
    prior_acs = fetch_acs_for_counties(PRIOR_YEAR, counties)

    current_agg, current_audit = aggregate_year(inter, current_acs, CURRENT_YEAR)
    prior_agg, prior_audit = aggregate_year(inter, prior_acs, PRIOR_YEAR)
    combined, wide = build_combined(current_agg, prior_agg)

    combined_path = out_dir / "submarket_demographics_combined.json"
    wide_path = out_dir / "submarket_demographics_current_and_forecast.csv"
    audit_path = out_dir / "submarket_demographics_audit.csv"
    metadata_path = out_dir / "submarket_demographics_metadata.json"

    combined_path.write_text(json.dumps(combined, indent=2), encoding="utf-8")
    wide.to_csv(wide_path, index=False)
    pd.concat([current_audit, prior_audit], ignore_index=True).to_csv(audit_path, index=False)
    metadata_path.write_text(json.dumps(combined["metadata"], indent=2), encoding="utf-8")

    log("Done. Created outputs:")
    for path in [combined_path, wide_path, audit_path, metadata_path]:
        log(f"  {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
