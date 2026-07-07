#!/usr/bin/env python3
"""Build healthcare facilities dataset for Gulf Coast Submarket Atlas.

Sources:
- HIFLD Hospitals public ArcGIS FeatureServer
- OpenStreetMap / Overpass healthcare, clinic, urgent care, pharmacy and medical-office POIs

Outputs:
- data/healthcare_facilities.geojson
- data/submarket_healthcare_summary.json
- data/healthcare_facility_audit.csv
- data/healthcare_metadata.json
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import requests
from shapely.geometry import Point, shape, mapping
from shapely.prepared import prep

HIFLD_HOSPITALS_URL = "https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/Hospitals_hifld/FeatureServer/0/query"
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]


def log(msg: str) -> None:
    print(f"[{datetime.now(timezone.utc).isoformat(timespec='seconds')}] {msg}", flush=True)


def load_submarkets(path: Path) -> List[Dict[str, Any]]:
    data = json.loads(path.read_text())
    features = []
    for f in data.get("features", []):
        props = f.get("properties", {})
        geom = shape(f.get("geometry"))
        if geom.is_empty:
            continue
        features.append({
            "feature": f,
            "geometry": geom,
            "prepared": prep(geom),
            "id": props.get("SubmarketID") or props.get("id") or props.get("Name") or props.get("DisplayName"),
            "name": props.get("DisplayName") or props.get("Name") or props.get("Submarket") or "Unknown",
            "hub": props.get("Hub") or "",
            "area_sqmi": float(props.get("AreaSqMi") or 0),
        })
    if not features:
        raise RuntimeError(f"No submarket polygons found in {path}")
    return features


def bbox_for_submarkets(submarkets: List[Dict[str, Any]], pad: float = 0.15) -> Tuple[float, float, float, float]:
    minx, miny, maxx, maxy = submarkets[0]["geometry"].bounds
    for s in submarkets[1:]:
        x1, y1, x2, y2 = s["geometry"].bounds
        minx, miny, maxx, maxy = min(minx, x1), min(miny, y1), max(maxx, x2), max(maxy, y2)
    return minx - pad, miny - pad, maxx + pad, maxy + pad


def classify_facility(name: str, tags: Dict[str, Any], source_category: str = "") -> str:
    text = " ".join(str(x or "") for x in [name, source_category, tags.get("amenity"), tags.get("healthcare"), tags.get("type"), tags.get("TYPE"), tags.get("NAICS_DESC")]).lower()
    if "urgent" in text or "immediate care" in text or "walk-in" in text or "walk in" in text:
        return "Urgent Care"
    if "hospital" in text or source_category.lower() == "hospital":
        return "Hospital"
    if "pharmacy" in text or "chemist" in text:
        return "Pharmacy"
    if any(x in text for x in ["clinic", "doctor", "medical office", "physician", "health centre", "health center", "dental", "dentist", "laboratory", "imaging", "rehab", "rehabilitation"]):
        return "Clinic / Medical Office"
    return "Other Healthcare"


def clean_text(value: Any) -> str:
    return " ".join(str(value or "").replace("\n", " ").replace("\r", " ").split())


def hash_id(*parts: Any) -> str:
    raw = "|".join(clean_text(p).lower() for p in parts)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def find_submarket(point: Point, submarkets: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    for s in submarkets:
        if s["prepared"].covers(point):
            return s
    return None


def haversine_mi(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    r = 3958.7613
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def query_arcgis_geojson(url: str, bbox: Tuple[float, float, float, float]) -> List[Dict[str, Any]]:
    west, south, east, north = bbox
    features: List[Dict[str, Any]] = []
    offset = 0
    page_size = 2000
    while True:
        params = {
            "where": "1=1",
            "outFields": "*",
            "returnGeometry": "true",
            "outSR": "4326",
            "f": "geojson",
            "geometry": f"{west},{south},{east},{north}",
            "geometryType": "esriGeometryEnvelope",
            "inSR": "4326",
            "spatialRel": "esriSpatialRelIntersects",
            "resultOffset": offset,
            "resultRecordCount": page_size,
        }
        r = requests.get(url, params=params, timeout=60)
        if not r.ok:
            raise RuntimeError(f"ArcGIS request failed {r.status_code}: {r.text[:500]}")
        data = r.json()
        batch = data.get("features", [])
        features.extend(batch)
        log(f"HIFLD hospitals page offset {offset}: {len(batch)} features")
        if len(batch) < page_size:
            break
        offset += page_size
        time.sleep(0.5)
    return features


def hifld_hospitals_to_facilities(features: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for f in features:
        geom = f.get("geometry") or {}
        if geom.get("type") != "Point":
            continue
        lon, lat = geom.get("coordinates", [None, None])[:2]
        if lon is None or lat is None:
            continue
        p = f.get("properties", {})
        name = clean_text(p.get("NAME") or p.get("Name") or p.get("name") or "Hospital")
        address = clean_text(p.get("ADDRESS") or p.get("Address") or p.get("ADDRESS1") or "")
        city = clean_text(p.get("CITY") or p.get("City") or "")
        state = clean_text(p.get("STATE") or p.get("State") or "")
        ftype = classify_facility(name, p, "Hospital")
        out.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [float(lon), float(lat)]},
            "properties": {
                "HealthcareID": "hifld_" + hash_id(name, address, city, state, lon, lat),
                "Name": name,
                "FacilityType": ftype,
                "Address": address,
                "City": city,
                "State": state,
                "Source": "HIFLD Hospitals",
                "SourceID": clean_text(p.get("ID") or p.get("OBJECTID") or p.get("FID") or ""),
                "RawType": clean_text(p.get("TYPE") or p.get("type") or p.get("HOSPITAL_T") or ""),
            }
        })
    return out


def split_bbox(bbox: Tuple[float, float, float, float], cols: int = 4, rows: int = 3) -> List[Tuple[float, float, float, float]]:
    """Split a large bbox into smaller tiles to avoid Overpass timeout/size failures."""
    west, south, east, north = bbox
    dx = (east - west) / cols
    dy = (north - south) / rows
    tiles = []
    for i in range(cols):
        for j in range(rows):
            tiles.append((west + i * dx, south + j * dy, west + (i + 1) * dx, south + (j + 1) * dy))
    return tiles


def overpass_query_for_category(bbox: Tuple[float, float, float, float], category: str) -> str:
    west, south, east, north = bbox
    bb = f"{south},{west},{north},{east}"
    if category == "pharmacies":
        return f'''[out:json][timeout:120];(
  node["amenity"="pharmacy"]({bb});
  way["amenity"="pharmacy"]({bb});
  relation["amenity"="pharmacy"]({bb});
  node["healthcare"="pharmacy"]({bb});
  way["healthcare"="pharmacy"]({bb});
  relation["healthcare"="pharmacy"]({bb});
);out center tags;'''
    if category == "urgent_care":
        return f'''[out:json][timeout:120];(
  node["healthcare"="urgent_care"]({bb});
  way["healthcare"="urgent_care"]({bb});
  relation["healthcare"="urgent_care"]({bb});
  node["name"~"urgent|immediate care|walk[- ]?in",i]({bb});
  way["name"~"urgent|immediate care|walk[- ]?in",i]({bb});
  relation["name"~"urgent|immediate care|walk[- ]?in",i]({bb});
);out center tags;'''
    if category == "clinics":
        return f'''[out:json][timeout:120];(
  node["amenity"~"^(clinic|doctors|dentist)$"]({bb});
  way["amenity"~"^(clinic|doctors|dentist)$"]({bb});
  relation["amenity"~"^(clinic|doctors|dentist)$"]({bb});
  node["healthcare"~"^(clinic|doctor|dentist|centre|center|laboratory|rehabilitation)$"]({bb});
  way["healthcare"~"^(clinic|doctor|dentist|centre|center|laboratory|rehabilitation)$"]({bb});
  relation["healthcare"~"^(clinic|doctor|dentist|centre|center|laboratory|rehabilitation)$"]({bb});
);out center tags;'''
    return f'''[out:json][timeout:120];(
  node["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"]({bb});
  way["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"]({bb});
  relation["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"]({bb});
  node["healthcare"]({bb});
  way["healthcare"]({bb});
  relation["healthcare"]({bb});
);out center tags;'''


def fetch_overpass(query: str) -> Dict[str, Any]:
    last_error = None
    for url in OVERPASS_URLS:
        try:
            log(f"Querying Overpass: {url}")
            r = requests.post(url, data=query.encode("utf-8"), headers={"Content-Type": "text/plain;charset=UTF-8"}, timeout=240)
            if not r.ok:
                raise RuntimeError(f"{r.status_code}: {r.text[:500]}")
            return r.json()
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            log(f"Overpass source failed: {exc}")
            time.sleep(4)
    raise RuntimeError(f"All Overpass sources failed: {last_error}")


def fetch_overpass_healthcare(bbox: Tuple[float, float, float, float]) -> Dict[str, Any]:
    """Fetch OSM healthcare POIs in category/tile queries.

    The previous builder made one large Overpass query and swallowed failures, which
    allowed the dataset to succeed with HIFLD hospitals only. This version queries
    pharmacies, clinics/offices, and urgent care separately and tiles the atlas bbox
    if a full-bbox request fails.
    """
    all_elements: List[Dict[str, Any]] = []
    seen = set()
    categories = ["pharmacies", "clinics", "urgent_care"]
    failures = []
    for cat in categories:
        log(f"Overpass category: {cat}")
        try:
            data = fetch_overpass(overpass_query_for_category(bbox, cat))
            elements = data.get("elements", [])
            log(f"Overpass {cat} full bbox: {len(elements)} elements")
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{cat} full bbox failed: {exc}")
            elements = []
            for idx, tile in enumerate(split_bbox(bbox), start=1):
                try:
                    data = fetch_overpass(overpass_query_for_category(tile, cat))
                    batch = data.get("elements", [])
                    log(f"Overpass {cat} tile {idx}: {len(batch)} elements")
                    elements.extend(batch)
                    time.sleep(1)
                except Exception as tile_exc:  # noqa: BLE001
                    failures.append(f"{cat} tile {idx} failed: {tile_exc}")
                    log(f"WARNING: Overpass {cat} tile {idx} failed: {tile_exc}")
        for el in elements:
            key = (el.get("type"), el.get("id"))
            if key in seen:
                continue
            seen.add(key)
            all_elements.append(el)
    if not all_elements:
        raise RuntimeError("Overpass returned zero non-hospital healthcare POIs. Failures: " + " | ".join(failures[:8]))
    return {"elements": all_elements}

def osm_to_facilities(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    out = []
    for el in data.get("elements", []):
        lon = el.get("lon") if el.get("lon") is not None else (el.get("center") or {}).get("lon")
        lat = el.get("lat") if el.get("lat") is not None else (el.get("center") or {}).get("lat")
        if lon is None or lat is None:
            continue
        tags = el.get("tags") or {}
        name = clean_text(tags.get("name") or tags.get("brand") or "Healthcare Facility")
        ftype = classify_facility(name, tags)
        if ftype == "Other Healthcare" and name == "Healthcare Facility":
            continue
        address = clean_text(" ".join(filter(None, [tags.get("addr:housenumber"), tags.get("addr:street")])) or tags.get("addr:full") or "")
        city = clean_text(tags.get("addr:city") or "")
        state = clean_text(tags.get("addr:state") or "")
        oid = f"{el.get('type')}/{el.get('id')}"
        out.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [float(lon), float(lat)]},
            "properties": {
                "HealthcareID": "osm_" + hash_id(oid),
                "Name": name,
                "FacilityType": ftype,
                "Address": address,
                "City": city,
                "State": state,
                "Source": "OpenStreetMap",
                "SourceID": oid,
                "RawType": clean_text(tags.get("healthcare") or tags.get("amenity") or ""),
            }
        })
    return out


def dedupe_facilities(facilities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Keep HIFLD hospitals over OSM duplicates, then de-dupe by normalized name plus rounded coordinates.
    ranked = sorted(facilities, key=lambda f: 0 if f["properties"].get("Source") == "HIFLD Hospitals" else 1)
    seen = set()
    out = []
    for f in ranked:
        lon, lat = f["geometry"]["coordinates"]
        p = f["properties"]
        key = (clean_text(p.get("Name")).lower(), round(float(lon), 3), round(float(lat), 3), p.get("FacilityType"))
        if key in seen:
            continue
        seen.add(key)
        out.append(f)
    return out


def assign_and_filter(facilities: List[Dict[str, Any]], submarkets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for f in facilities:
        lon, lat = f["geometry"]["coordinates"]
        pt = Point(lon, lat)
        s = find_submarket(pt, submarkets)
        if not s:
            continue
        props = f["properties"]
        props["SubmarketID"] = s["id"]
        props["SubmarketName"] = s["name"]
        props["Hub"] = s["hub"]
        out.append(f)
    return out


def build_summary(facilities: List[Dict[str, Any]], submarkets: List[Dict[str, Any]]) -> Dict[str, Any]:
    hospitals = [f for f in facilities if f["properties"].get("FacilityType") == "Hospital"]
    out = {
        "metadata": {
            "status": "built",
            "created_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "sources": ["HIFLD Hospitals", "OpenStreetMap Overpass"],
            "method": "Points assigned to custom submarkets using point-in-polygon against data/submarkets.geojson.",
        },
        "submarkets": {},
    }
    for s in submarkets:
        sid = s["id"]
        rows = [f for f in facilities if f["properties"].get("SubmarketID") == sid]
        counts = {
            "total": len(rows),
            "hospitals": 0,
            "urgent_care": 0,
            "clinics": 0,
            "pharmacies": 0,
            "other": 0,
        }
        for f in rows:
            t = f["properties"].get("FacilityType")
            if t == "Hospital":
                counts["hospitals"] += 1
            elif t == "Urgent Care":
                counts["urgent_care"] += 1
            elif t == "Pharmacy":
                counts["pharmacies"] += 1
            elif t == "Clinic / Medical Office":
                counts["clinics"] += 1
            else:
                counts["other"] += 1
        centroid = s["geometry"].centroid
        nearest_name = ""
        nearest_mi: Optional[float] = None
        for h in hospitals:
            lon, lat = h["geometry"]["coordinates"]
            d = haversine_mi(centroid.x, centroid.y, lon, lat)
            if nearest_mi is None or d < nearest_mi:
                nearest_mi = d
                nearest_name = h["properties"].get("Name") or "Hospital"
        facilities_short = sorted([
            {"id": f["properties"].get("HealthcareID"), "name": f["properties"].get("Name"), "type": f["properties"].get("FacilityType"), "source": f["properties"].get("Source")}
            for f in rows
        ], key=lambda x: ((x.get("type") or ""), (x.get("name") or "")))
        out["submarkets"][sid] = {
            **counts,
            "density": counts["total"] / s["area_sqmi"] if s["area_sqmi"] else 0,
            "nearest_hospital_name": nearest_name,
            "nearest_hospital_mi": round(nearest_mi, 2) if nearest_mi is not None else None,
            "facilities": facilities_short,
        }
    return out


def write_outputs(facilities: List[Dict[str, Any]], summary: Dict[str, Any], outdir: Path) -> None:
    outdir.mkdir(parents=True, exist_ok=True)
    fc = {"type": "FeatureCollection", "features": facilities}
    (outdir / "healthcare_facilities.geojson").write_text(json.dumps(fc, indent=2))
    (outdir / "submarket_healthcare_summary.json").write_text(json.dumps(summary, indent=2))
    metadata = summary.get("metadata", {}).copy()
    metadata.update({"facility_count": len(facilities)})
    (outdir / "healthcare_metadata.json").write_text(json.dumps(metadata, indent=2))
    with (outdir / "healthcare_facility_audit.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["HealthcareID", "Name", "FacilityType", "Source", "SourceID", "Address", "City", "State", "SubmarketID", "SubmarketName", "Hub", "Longitude", "Latitude"])
        w.writeheader()
        for feat in facilities:
            p = feat["properties"]
            lon, lat = feat["geometry"]["coordinates"]
            w.writerow({
                "HealthcareID": p.get("HealthcareID"),
                "Name": p.get("Name"),
                "FacilityType": p.get("FacilityType"),
                "Source": p.get("Source"),
                "SourceID": p.get("SourceID"),
                "Address": p.get("Address"),
                "City": p.get("City"),
                "State": p.get("State"),
                "SubmarketID": p.get("SubmarketID"),
                "SubmarketName": p.get("SubmarketName"),
                "Hub": p.get("Hub"),
                "Longitude": lon,
                "Latitude": lat,
            })


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--submarkets", required=True, type=Path)
    ap.add_argument("--output-dir", required=True, type=Path)
    args = ap.parse_args()
    submarkets = load_submarkets(args.submarkets)
    bbox = bbox_for_submarkets(submarkets)
    log(f"Loaded {len(submarkets)} submarkets; bbox={bbox}")

    facilities: List[Dict[str, Any]] = []
    try:
        hifld = query_arcgis_geojson(HIFLD_HOSPITALS_URL, bbox)
        facilities.extend(hifld_hospitals_to_facilities(hifld))
        log(f"HIFLD hospital facilities parsed: {len(facilities)}")
    except Exception as exc:  # noqa: BLE001
        log(f"WARNING: HIFLD hospitals failed: {exc}")

    try:
        osm = fetch_overpass_healthcare(bbox)
        osm_facilities = osm_to_facilities(osm)
        facilities.extend(osm_facilities)
        log(f"OSM healthcare facilities parsed: {len(osm_facilities)}")
        if len(osm_facilities) == 0:
            raise RuntimeError("OSM/Overpass returned zero clinic, urgent care, or pharmacy facilities.")
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"OSM/Overpass healthcare source failed; refusing to write hospital-only dataset. Details: {exc}") from exc

    if not facilities:
        raise RuntimeError("No healthcare facilities could be fetched from any source.")
    deduped = dedupe_facilities(facilities)
    assigned = assign_and_filter(deduped, submarkets)
    if not assigned:
        raise RuntimeError("Healthcare sources returned records, but none intersected the custom submarkets.")
    log(f"Facilities after de-dupe: {len(deduped)}; inside submarkets: {len(assigned)}")
    summary = build_summary(assigned, submarkets)
    write_outputs(assigned, summary, args.output_dir)
    log("Healthcare outputs written successfully")
    return 0


if __name__ == "__main__":
    sys.exit(main())
