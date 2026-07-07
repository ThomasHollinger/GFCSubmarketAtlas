# Gulf Coast Demographics GitHub Action v5

This package builds the precomputed Census demographics dataset for the Gulf Coast Submarket Atlas using your custom KML boundaries.

## Important
Do not commit your Census API key into the public repository. Add it as a GitHub Actions secret:

`Settings > Secrets and variables > Actions > New repository secret`

Name: `CENSUS_API_KEY`

Value: your activated Census API key only, with no quotes or spaces.

## Files to replace/upload

- `.github/workflows/build-demographics.yml`
- `scripts/build_demographics.py`

Keep your existing:

- `data/submarkets.kml`
- `requirements.txt`

## What V5 changes

- Validates the Census API key at the start of the job before the long geometry processing.
- Fails fast with a clear message if the secret is missing or invalid.
- Does not expose or print the API key.

## Output artifact

The workflow produces:

- `submarket_demographics_combined.json`
- `submarket_demographics_current_and_forecast.csv`
- `submarket_demographics_audit.csv`
- `submarket_demographics_metadata.json`
