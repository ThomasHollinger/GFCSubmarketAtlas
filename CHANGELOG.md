# v2.7.3 - Thomas Verified School Ratings

- Updated school scoring with the Thomas Verified Grade column from the verification workbook.
- Schools marked Unranked are now excluded from scoring and shown as Not Rated (Excluded).
- Preserved current demographics, healthcare framework, sidebar order, and school-sidebar behavior.
- Included latest healthcare builder workflow/script fixes to avoid regressing healthcare dataset generation.

# Changelog

## v2.7.0 - Healthcare Facilities Framework
- Added Healthcare Facilities card to Market Summary.
- Added Healthcare layer toggle and Healthcare Access map theme.
- Added healthcare markers for hospitals, urgent care, clinics/medical offices, and pharmacies.
- Added healthcare search support after data is built.
- Added GitHub Action builder to fetch and precompute healthcare facility data against custom submarket boundaries.
- Preserved current ACS 2020-2024 demographics, school rating sidebar behavior, retail layer, and sidebar order.

## v2.6.4 - ACS 2020-2024 Demographics
- Updated demographics dataset to 2024 ACS 5-Year / ACS 2020-2024 current estimates.
- Forecast values remain hidden pending a separate calibrated forecast model.
