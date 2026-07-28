#!/usr/bin/env python3
"""Build a first-pass active builder subdivision dataset for the Gulf Coast Submarket Atlas.

This collector is intentionally semi-automated. It crawls seed pages from builder and
new-home listing sites, extracts likely community pages and structured data, geocodes
missing coordinates when possible, assigns communities to custom submarket polygons,
and writes atlas-ready files plus a review workbook.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import time
from collections import defaultdict, deque
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import geopandas as gpd
import pandas as pd
import requests
from bs4 import BeautifulSoup
from geopy.geocoders import Nominatim
from shapely.geometry import Point

USER_AGENT = "GulfCoastSubmarketAtlas-BuilderSubdivisionCollector/1.0 (research dataset; contact via repository owner)"
HEADERS = {"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"}
RELEVANT_STATES = {"AL", "FL", "Alabama", "Florida"}
MARKET_TERMS = [
    "baldwin", "mobile", "pensacola", "pace", "milton", "gulf breeze", "navarre",
    "crestview", "fort walton", "destin", "niceville", "defuniak", "freeport",
    "panama city", "lynn haven", "santa rosa", "okaloosa", "walton", "bay county",
    "foley", "fairhope", "daphne", "spanish fort", "loxley", "robertsdale", "gulf shores",
    "orange beach", "seminole", "silverhill", "elberta", "cantonment", "laurel hill"
]
COMMUNITY_TERMS = ["community", "communities", "new homes", "new-home", "newhomes", "subdivision", "floorplans", "available homes"]
STATUS_TERMS = {
    "Coming Soon": ["coming soon"],
    "Closeout": ["closeout", "final opportunity", "final opportunities", "last chance"],
    "Sold Out": ["sold out"],
    "Active": ["now selling", "move-in ready", "available homes", "homes for sale", "new homes"]
}

@dataclass
class Candidate:
    CommunityName: str = ""
    Builder: str = ""
    Status: str = "Unknown"
    ProductType: str = "Unknown"
    Address: str = ""
    City: str = ""
    County: str = ""
    State: str = ""
    Latitude: float | None = None
    Longitude: float | None = None
    StartingPrice: str = ""
    HomesAvailable: str = ""
    SourceURL: str = ""
    SourceDomain: str = ""
    ExtractionMethod: str = ""
    Confidence: str = "Low"
    NeedsReview: str = "Yes"
    SubmarketID: str = ""
    SubmarketName: str = "Outside / Unassigned"
    Notes: str = ""
    CommunityID: str = ""


def norm_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def read_sources(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("sources", [])


def fetch(url: str, timeout: int = 30) -> str | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        if r.status_code >= 400:
            print(f"WARN fetch {r.status_code}: {url}")
            return None
        ctype = r.headers.get("content-type", "")
        if "text" not in ctype and "html" not in ctype and "json" not in ctype:
            return None
        return r.text
    except Exception as exc:
        print(f"WARN fetch failed {url}: {exc}")
        return None


def same_domain(a: str, b: str) -> bool:
    return urlparse(a).netloc.replace("www.", "") == urlparse(b).netloc.replace("www.", "")


def likely_community_url(url: str, text: str = "") -> bool:
    u = url.lower()
    combined = f"{u} {text.lower()}"
    if any(bad in u for bad in ["/blog", "/privacy", "/terms", "facebook.com", "instagram.com", "youtube.com"]):
        return False
    return any(term in combined for term in COMMUNITY_TERMS) or any(term in combined for term in MARKET_TERMS)


def discover_links(seed: str, html: str, max_links: int = 80) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    links: list[str] = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = urljoin(seed, a.get("href"))
        href = href.split("#")[0]
        if href in seen or not href.startswith("http"):
            continue
        if not same_domain(seed, href):
            continue
        label = norm_text(a.get_text(" "))
        if likely_community_url(href, label):
            seen.add(href)
            links.append(href)
        if len(links) >= max_links:
            break
    return links


def iter_jsonld(soup: BeautifulSoup) -> list[Any]:
    objects = []
    for script in soup.find_all("script", type="application/ld+json"):
        raw = script.string or script.get_text() or ""
        raw = raw.strip()
        if not raw:
            continue
        try:
            data = json.loads(raw)
            if isinstance(data, list):
                objects.extend(data)
            else:
                objects.append(data)
        except Exception:
            continue
    return objects


def walk_json(obj: Any):
    if isinstance(obj, dict):
        yield obj
        for v in obj.values():
            yield from walk_json(v)
    elif isinstance(obj, list):
        for item in obj:
            yield from walk_json(item)


def find_lat_lon_from_obj(obj: dict[str, Any]) -> tuple[float | None, float | None]:
    geo = obj.get("geo") if isinstance(obj, dict) else None
    if isinstance(geo, dict):
        lat = geo.get("latitude") or geo.get("lat")
        lon = geo.get("longitude") or geo.get("lng") or geo.get("lon")
        try:
            return float(lat), float(lon)
        except Exception:
            pass
    for lat_key in ["latitude", "lat"]:
        for lon_key in ["longitude", "lng", "lon"]:
            if lat_key in obj and lon_key in obj:
                try:
                    return float(obj[lat_key]), float(obj[lon_key])
                except Exception:
                    pass
    return None, None


def find_lat_lon_from_text(html: str) -> tuple[float | None, float | None]:
    patterns = [
        r'"latitude"\s*:\s*"?(-?\d+\.\d+)"?.{0,80}"longitude"\s*:\s*"?(-?\d+\.\d+)"?',
        r'"lat"\s*:\s*"?(-?\d+\.\d+)"?.{0,80}"lng"\s*:\s*"?(-?\d+\.\d+)"?',
        r'lat\s*[:=]\s*"?(-?\d+\.\d+)"?.{0,80}lon[g]?\s*[:=]\s*"?(-?\d+\.\d+)"?'
    ]
    for pat in patterns:
        m = re.search(pat, html, re.I | re.S)
        if m:
            try:
                return float(m.group(1)), float(m.group(2))
            except Exception:
                pass
    return None, None


def parse_address_obj(addr: Any) -> tuple[str, str, str, str]:
    if isinstance(addr, dict):
        street = norm_text(addr.get("streetAddress"))
        city = norm_text(addr.get("addressLocality"))
        state = norm_text(addr.get("addressRegion"))
        postal = norm_text(addr.get("postalCode"))
        full = ", ".join([p for p in [street, city, state, postal] if p])
        return full, city, "", state
    if isinstance(addr, str):
        return norm_text(addr), "", "", ""
    return "", "", "", ""


def status_from_text(text: str) -> str:
    low = text.lower()
    for status, terms in STATUS_TERMS.items():
        if any(t in low for t in terms):
            return status
    return "Unknown"


def product_from_text(text: str) -> str:
    low = text.lower()
    types = []
    if any(t in low for t in ["single family", "single-family", "single family homes"]):
        types.append("Single-family")
    if any(t in low for t in ["townhome", "town home", "townhouse"]):
        types.append("Townhome")
    if any(t in low for t in ["condo", "condominium"]):
        types.append("Condo")
    return " / ".join(types) if types else "Unknown"


def price_from_text(text: str) -> str:
    pats = [
        r'(?:from|starting(?: at)?|priced from)\s+(?:the\s+)?(\$[0-9][0-9,]*(?:s|\+)?(?:\s*-\s*\$[0-9][0-9,]*(?:s|\+)?)?)',
        r'(\$[0-9][0-9,]{2,}(?:s|\+)?\s*-\s*\$[0-9][0-9,]{2,}(?:s|\+)?)'
    ]
    for pat in pats:
        m = re.search(pat, text, re.I)
        if m:
            return norm_text(m.group(1))
    return ""


def homes_available_from_text(text: str) -> str:
    pats = [r'(\d+)\s+(?:quick move-in|move-in ready|available homes|homes available)', r'(?:homes available|available homes)\s*[:\-]?\s*(\d+)']
    for pat in pats:
        m = re.search(pat, text, re.I)
        if m:
            return m.group(1)
    return ""


def title_from_soup(soup: BeautifulSoup, url: str) -> str:
    for sel in ["h1", "meta[property='og:title']", "title"]:
        node = soup.select_one(sel)
        if not node:
            continue
        txt = node.get("content") if node.name == "meta" else node.get_text(" ")
        txt = norm_text(txt)
        txt = re.sub(r"\s*\|\s*.*$", "", txt)
        txt = re.sub(r"\s*-\s*New Homes.*$", "", txt, flags=re.I)
        if txt and len(txt) <= 120:
            return txt
    path = urlparse(url).path.strip("/").split("/")[-1]
    return re.sub(r"[-_]+", " ", path).title()


def extract_candidates_from_page(url: str, builder: str, html: str) -> list[Candidate]:
    soup = BeautifulSoup(html, "html.parser")
    text = norm_text(soup.get_text(" "))
    domain = urlparse(url).netloc.replace("www.", "")
    candidates: list[Candidate] = []

    # 1) Structured data can include one object per community.
    for obj in iter_jsonld(soup):
        for item in walk_json(obj):
            typ = item.get("@type") or item.get("type") or ""
            name = norm_text(item.get("name") or item.get("headline") or item.get("title"))
            if not name or len(name) > 120:
                continue
            blob = json.dumps(item, default=str).lower()
            if not (any(t in blob for t in COMMUNITY_TERMS) or any(t in blob for t in MARKET_TERMS)):
                continue
            lat, lon = find_lat_lon_from_obj(item)
            address, city, county, state = parse_address_obj(item.get("address"))
            c = Candidate(
                CommunityName=name,
                Builder=builder,
                Status=status_from_text(blob),
                ProductType=product_from_text(blob),
                Address=address,
                City=city,
                County=county,
                State=state,
                Latitude=lat,
                Longitude=lon,
                StartingPrice=price_from_text(blob),
                HomesAvailable=homes_available_from_text(blob),
                SourceURL=url,
                SourceDomain=domain,
                ExtractionMethod="jsonld",
            )
            candidates.append(c)

    # 2) Page-level fallback.
    title = title_from_soup(soup, url)
    if likely_community_url(url, f"{title} {text[:1200]}"):
        lat, lon = find_lat_lon_from_text(html)
        c = Candidate(
            CommunityName=title,
            Builder=builder,
            Status=status_from_text(text),
            ProductType=product_from_text(text),
            Latitude=lat,
            Longitude=lon,
            StartingPrice=price_from_text(text),
            HomesAvailable=homes_available_from_text(text),
            SourceURL=url,
            SourceDomain=domain,
            ExtractionMethod="page",
        )
        # Try simple city/state extraction around known market terms.
        for city in ["Foley", "Fairhope", "Daphne", "Spanish Fort", "Loxley", "Robertsdale", "Gulf Shores", "Orange Beach", "Mobile", "Pensacola", "Milton", "Pace", "Cantonment", "Navarre", "Gulf Breeze", "Crestview", "Niceville", "Destin", "Freeport", "DeFuniak Springs", "Panama City", "Lynn Haven"]:
            if re.search(r"\b" + re.escape(city) + r"\b", text, re.I):
                c.City = city
                break
        if re.search(r"\bAL\b|Alabama", text, re.I):
            c.State = "AL"
        elif re.search(r"\bFL\b|Florida", text, re.I):
            c.State = "FL"
        candidates.append(c)

    return candidates


def community_key(c: Candidate) -> str:
    base = "|".join([slug(c.CommunityName), slug(c.Builder), slug(c.City), slug(c.State)])
    if not c.CommunityName:
        base = c.SourceURL
    return hashlib.sha1(base.encode("utf-8")).hexdigest()[:14]


def dedupe(candidates: list[Candidate]) -> list[Candidate]:
    by_key: dict[str, Candidate] = {}
    for c in candidates:
        if not c.CommunityName or c.CommunityName.lower() in ["new homes", "find your home", "communities", "available homes"]:
            continue
        key = community_key(c)
        c.CommunityID = key
        existing = by_key.get(key)
        if not existing:
            by_key[key] = c
        else:
            # Keep richer record.
            score_new = sum(bool(getattr(c, f)) for f in ["Address", "City", "State", "Latitude", "StartingPrice", "HomesAvailable"])
            score_old = sum(bool(getattr(existing, f)) for f in ["Address", "City", "State", "Latitude", "StartingPrice", "HomesAvailable"])
            if score_new > score_old:
                by_key[key] = c
    return list(by_key.values())


def confidence(c: Candidate) -> None:
    score = 0
    if c.CommunityName: score += 1
    if c.Builder: score += 1
    if c.Latitude is not None and c.Longitude is not None: score += 3
    if c.City or c.Address: score += 1
    if c.Status != "Unknown": score += 1
    if c.SourceURL: score += 1
    if c.SubmarketID: score += 2
    if score >= 8:
        c.Confidence = "High"
        c.NeedsReview = "No"
    elif score >= 5:
        c.Confidence = "Medium"
        c.NeedsReview = "Yes"
    else:
        c.Confidence = "Low"
        c.NeedsReview = "Yes"
    if c.Status == "Sold Out":
        c.NeedsReview = "Yes"
        c.Notes = (c.Notes + " Sold out status detected; decide whether to exclude.").strip()


def geocode_missing(candidates: list[Candidate], max_geocode: int = 80) -> None:
    geolocator = Nominatim(user_agent=USER_AGENT)
    count = 0
    for c in candidates:
        if c.Latitude is not None and c.Longitude is not None:
            continue
        if count >= max_geocode:
            c.Notes = (c.Notes + " Geocode skipped due to max_geocode limit.").strip()
            continue
        query_parts = [c.Address, c.City, c.State]
        if not c.Address:
            query_parts = [c.CommunityName, c.City, c.State or "AL FL"]
        query = ", ".join([p for p in query_parts if p])
        if not query or len(query) < 6:
            continue
        try:
            loc = geolocator.geocode(query, timeout=15, country_codes="us")
            time.sleep(1.1)
            count += 1
            if loc:
                c.Latitude = float(loc.latitude)
                c.Longitude = float(loc.longitude)
                c.ExtractionMethod = c.ExtractionMethod + "+nominatim"
            else:
                c.Notes = (c.Notes + " Geocode failed.").strip()
        except Exception as exc:
            c.Notes = (c.Notes + f" Geocode error: {exc}").strip()


def assign_submarkets(candidates: list[Candidate], submarkets_path: Path) -> None:
    sub = gpd.read_file(submarkets_path).to_crs("EPSG:4326")
    name_col = next((c for c in ["Submarket", "SubmarketName", "name", "Name", "SUBMARKET"] if c in sub.columns), None)
    id_col = next((c for c in ["SubmarketID", "id", "ID", "SM_ID"] if c in sub.columns), None)
    if name_col is None:
        name_col = sub.columns[0]
    if id_col is None:
        id_col = name_col

    for c in candidates:
        if c.Latitude is None or c.Longitude is None:
            continue
        pt = Point(c.Longitude, c.Latitude)
        matches = sub[sub.geometry.contains(pt)]
        if len(matches):
            row = matches.iloc[0]
            c.SubmarketID = str(row.get(id_col, ""))
            c.SubmarketName = str(row.get(name_col, ""))
        else:
            c.SubmarketName = "Outside / Unassigned"
            c.Notes = (c.Notes + " Point is outside current custom submarket polygons.").strip()


def crawl_sources(sources: list[dict[str, str]], max_pages_per_source: int = 35) -> list[Candidate]:
    all_candidates: list[Candidate] = []
    for source in sources:
        builder = source.get("builder", "Unknown")
        seed = source.get("url")
        if not seed:
            continue
        print(f"SOURCE {builder}: {seed}")
        queue = deque([seed])
        visited: set[str] = set()
        pages = 0
        while queue and pages < max_pages_per_source:
            url = queue.popleft()
            if url in visited:
                continue
            visited.add(url)
            html = fetch(url)
            if not html:
                continue
            pages += 1
            page_candidates = extract_candidates_from_page(url, builder, html)
            all_candidates.extend(page_candidates)
            for link in discover_links(url, html):
                if link not in visited and len(queue) < max_pages_per_source * 2:
                    queue.append(link)
            time.sleep(0.4)
        print(f"  visited {pages} pages; candidates so far {len(all_candidates)}")
    return all_candidates


def write_outputs(candidates: list[Candidate], output_dir: Path, submarkets_path: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    rows = [asdict(c) for c in candidates]
    df = pd.DataFrame(rows)
    if df.empty:
        raise RuntimeError("No builder subdivision candidates were found. Review source URLs or website access logs.")
    order = [
        "CommunityID", "CommunityName", "Builder", "Status", "ProductType", "Address", "City", "County", "State",
        "Latitude", "Longitude", "SubmarketID", "SubmarketName", "StartingPrice", "HomesAvailable", "Confidence",
        "NeedsReview", "SourceURL", "SourceDomain", "ExtractionMethod", "Notes"
    ]
    for col in order:
        if col not in df.columns:
            df[col] = ""
    df = df[order]
    df.to_csv(output_dir / "builder_subdivision_audit.csv", index=False, quoting=csv.QUOTE_MINIMAL)
    df.to_excel(output_dir / "builder_subdivision_candidates.xlsx", index=False)

    gdf_rows = df.dropna(subset=["Latitude", "Longitude"]).copy()
    gdf_rows = gdf_rows[(gdf_rows["Latitude"].astype(str) != "") & (gdf_rows["Longitude"].astype(str) != "")]
    geometry = [Point(float(x), float(y)) for x, y in zip(gdf_rows["Longitude"], gdf_rows["Latitude"])]
    gdf = gpd.GeoDataFrame(gdf_rows, geometry=geometry, crs="EPSG:4326")
    gdf.to_file(output_dir / "builder_subdivisions.geojson", driver="GeoJSON")

    summary = {}
    for sm_name, grp in df[df["SubmarketName"].ne("Outside / Unassigned")].groupby("SubmarketName"):
        active = grp[grp["Status"].isin(["Active", "Unknown", "Coming Soon", "Closeout"])]
        builders = sorted([b for b in active["Builder"].dropna().unique().tolist() if b])
        summary[str(sm_name)] = {
            "total": int(len(active)),
            "active": int((active["Status"] == "Active").sum()),
            "comingSoon": int((active["Status"] == "Coming Soon").sum()),
            "closeout": int((active["Status"] == "Closeout").sum()),
            "unknownStatus": int((active["Status"] == "Unknown").sum()),
            "builderCount": int(len(builders)),
            "builders": builders[:20],
            "needsReview": int((active["NeedsReview"] == "Yes").sum())
        }
    with (output_dir / "submarket_builder_summary.json").open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    meta = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "Semi-automated builder subdivision collector from configured builder/new-home source URLs",
        "submarketFile": str(submarkets_path),
        "candidateCount": int(len(df)),
        "geocodedCount": int(len(gdf_rows)),
        "assignedCount": int((df["SubmarketName"] != "Outside / Unassigned").sum()),
        "highConfidenceCount": int((df["Confidence"] == "High").sum()),
        "reviewNote": "This is a first-pass collector. Review the Excel candidate file before treating counts as complete."
    }
    with (output_dir / "builder_subdivision_metadata.json").open("w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--submarkets", required=True, help="Path to data/submarkets.geojson")
    parser.add_argument("--sources", default="data/builder_source_targets.json", help="Source target JSON")
    parser.add_argument("--output-dir", default="data", help="Output directory")
    parser.add_argument("--max-pages-per-source", type=int, default=35)
    parser.add_argument("--max-geocode", type=int, default=80)
    args = parser.parse_args()

    submarkets_path = Path(args.submarkets)
    sources_path = Path(args.sources)
    output_dir = Path(args.output_dir)
    if not submarkets_path.exists():
        raise FileNotFoundError(f"Submarkets file not found: {submarkets_path}")
    if not sources_path.exists():
        raise FileNotFoundError(f"Source target file not found: {sources_path}")

    sources = read_sources(sources_path)
    candidates = crawl_sources(sources, max_pages_per_source=args.max_pages_per_source)
    candidates = dedupe(candidates)
    geocode_missing(candidates, max_geocode=args.max_geocode)
    assign_submarkets(candidates, submarkets_path)
    for c in candidates:
        confidence(c)
    write_outputs(candidates, output_dir, submarkets_path)
    print(f"Wrote {len(candidates)} builder subdivision candidates to {output_dir}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
