# Healthcare Builder v2.7.2 Fix

Fixes Overpass API HTTP 429 errors by adding a meaningful User-Agent / From header and a third Overpass mirror. This keeps the same workflow and output files.

Replace these files in the repository:

- `.github/workflows/build-healthcare.yml`
- `scripts/build_healthcare.py`

Then rerun: Actions > Build Healthcare Dataset > Run workflow.
