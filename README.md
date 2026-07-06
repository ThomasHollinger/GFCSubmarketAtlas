# Gulf Coast Demographics GitHub Action v3

This package builds ACS Census demographics against the custom submarket KML.

## Important
The Census API may require an API key from GitHub Actions. Add a repository secret before running:

1. Go to your GitHub repo.
2. Settings > Secrets and variables > Actions.
3. Click New repository secret.
4. Name: `CENSUS_API_KEY`
5. Value: paste your Census API key.

Then rerun Actions > Build Demographics Dataset.

## Files to replace
- `.github/workflows/build-demographics.yml`
- `scripts/build_demographics.py`

Outputs are uploaded as the `gulf-coast-submarket-demographics` artifact.
