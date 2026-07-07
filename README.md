# Healthcare Workflow Fix

Replace `.github/workflows/build-healthcare.yml` with the included file.

This fixes the prior error by running:

`python scripts/build_healthcare.py --submarkets data/submarkets.geojson --output-dir data`
