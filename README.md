# Gulf Coast Demographics Builder for GitHub Actions

This package adds a GitHub Action that precomputes demographics for the Gulf Coast Submarket Atlas using your custom KML boundaries.

## What it does

The action:

1. Reads `data/submarkets.kml`.
2. Downloads Census TIGER block-group geometry for Alabama and Florida.
3. Finds the Census block groups that intersect your custom submarkets.
4. Pulls ACS 5-Year block-group data for the intersecting counties.
5. Area-weights block-group demographics into each custom submarket.
6. Creates current demographics and a 5-year forecast.
7. Uploads output files as a GitHub Actions artifact.

## Outputs

The workflow creates:

- `output/submarket_demographics_combined.json` — the file to plug into the atlas
- `output/submarket_demographics_current_and_forecast.csv` — readable summary table
- `output/submarket_demographics_audit.csv` — block-group/submarket intersection audit
- `output/submarket_demographics_metadata.json` — source and method notes

## How to install in your repo

Upload/copy these items into the root of your GitHub repository:

```text
.github/workflows/build-demographics.yml
scripts/build_demographics.py
requirements.txt
data/submarkets.kml
```

The included `data/submarkets.kml` is the reconstructed custom boundary KML. You can replace it with your original KML later if needed, but keep the same filename.

## How to run it

1. Go to your GitHub repository.
2. Click the **Actions** tab.
3. Select **Build Demographics Dataset**.
4. Click **Run workflow**.
5. Wait for it to finish, usually 15-35 minutes.
6. Open the completed workflow run.
7. Download the artifact named `gulf-coast-submarket-demographics`.
8. Upload the generated files back into ChatGPT so they can be plugged into the atlas.

## Optional Census API key

The workflow will run without a Census API key, but it may be more reliable with one.

To add one:

1. Get a Census API key.
2. In GitHub, go to **Settings > Secrets and variables > Actions**.
3. Add a repository secret named:

```text
CENSUS_API_KEY
```

## Method note

Current values are ACS-derived. Future values are labeled as **5-Year Forecast** and are model-based forecasts calculated from the observed ACS trend between 2018 ACS 5-Year and 2023 ACS 5-Year. They are not official Census projections.
