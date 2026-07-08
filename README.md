# Gulf Coast Submarket Atlas v2.7.3

This release adds the Healthcare Facilities module framework.

## What is included
- Healthcare layer toggle in Market Data.
- Healthcare Access map theme.
- Sidebar Healthcare Facilities card for each submarket/hub/enterprise view.
- Search support for healthcare facilities after the dataset is built.
- GitHub Action healthcare builder:
  - `.github/workflows/build-healthcare.yml`
  - `scripts/build_healthcare.py`
  - `requirements-healthcare.txt`

## Healthcare data workflow
The app ships with empty healthcare data files so the site will not break before the healthcare dataset is built.

To build the real facility dataset:
1. Upload this release to the `GFCSubmarketAtlas` repository.
2. Go to GitHub > Actions.
3. Run `Build Healthcare Dataset`.
4. The workflow will fetch public healthcare facility sources, assign points to the custom submarket boundaries in `data/submarkets.geojson`, write the output files into `data/`, and commit them back to the repository.

## Healthcare outputs
- `data/healthcare_facilities.geojson`
- `data/submarket_healthcare_summary.json`
- `data/healthcare_facility_audit.csv`
- `data/healthcare_metadata.json`

## Sources
- HIFLD Hospitals for hospitals.
- OpenStreetMap/Overpass for urgent care, clinics, doctors, dental, pharmacy, and related healthcare points.

## Notes
This is a facility-count and access layer, not a healthcare quality score. A later version can add a Healthcare Access Score after the facility data is reviewed.


## v2.7.3 School Ratings Update
School ratings were updated from `Gulf_Coast_School_Ratings_Verification_Template.xlsx` using the `Thomas Verified Grade` column. `Unranked` entries are excluded from scoring and displayed as `Not Rated (Excluded)`.
