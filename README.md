# Gulf Coast Builder Subdivision Collector v1

This package adds a GitHub Actions workflow that builds a first-pass active builder subdivision dataset for the Gulf Coast Submarket Atlas.

## What it does

- Starts from configured builder/new-home source pages in `data/builder_source_targets.json`.
- Crawls likely community pages on those sites.
- Extracts community name, builder, status, product type, location, price text, homes available, and source URL when available.
- Geocodes missing coordinates where possible.
- Assigns each community point to `data/submarkets.geojson`.
- Writes atlas-ready files and a review workbook.

## Files to add to the repo root

```text
.github/workflows/build-builder-subdivisions.yml
scripts/build_builder_subdivisions.py
requirements-builder-subdivisions.txt
data/builder_source_targets.json
```

## How to run

1. Upload the files above into the root of `GFCSubmarketAtlas`.
2. Go to **Actions**.
3. Run **Build Builder Subdivisions Dataset**.
4. When it finishes, it will commit these files:

```text
data/builder_subdivisions.geojson
data/submarket_builder_summary.json
data/builder_subdivision_audit.csv
data/builder_subdivision_candidates.xlsx
data/builder_subdivision_metadata.json
```

## Important QA note

This is a semi-automated first-pass collector. Builder sites and new-home aggregator pages are inconsistent. The output should be treated as a candidate dataset until the Excel review workbook is spot-checked.

The most important file for review is:

```text
data/builder_subdivision_candidates.xlsx
```

Rows with `NeedsReview = Yes` should be checked before we treat subdivision counts as final.
