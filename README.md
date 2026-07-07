# Gulf Coast Healthcare Builder v2.7.1 Fix

This patch fixes the healthcare builder so it does not silently produce a hospital-only dataset.

Replace these files in the root of the GFCSubmarketAtlas repository:

- `.github/workflows/build-healthcare.yml`
- `scripts/build_healthcare.py`

Then run:

`Actions > Build Healthcare Dataset > Run workflow`

What changed:

- Queries OpenStreetMap/Overpass by category: pharmacies, clinics/offices, urgent care.
- Falls back to smaller tiled queries if the full atlas bounding box fails.
- Fails loudly if Overpass returns zero non-hospital facilities, instead of committing a hospital-only dataset.
- Keeps HIFLD hospitals as the hospital source.

Expected outputs committed to `data/`:

- `healthcare_facilities.geojson`
- `submarket_healthcare_summary.json`
- `healthcare_facility_audit.csv`
- `healthcare_metadata.json`
