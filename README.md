# Gulf Coast Submarket Atlas v2.8.0

Adds a Builder Subdivisions layer from the uploaded subdivision CSV source. Communities are assigned to custom submarket boundaries by latitude/longitude and loaded as static atlas data.

Primary files added:
- data/builder_subdivisions.geojson
- data/submarket_builder_summary.json
- data/builder_subdivision_audit.csv

Builder filters included:
- Single Family Detached
- Townhomes
- Active
- Future
- Built Out


### v2.8.1 Builder Pin Refinement
Builder subdivision markers now render as individual pins rather than clusters. Pin colors follow the requested builder color profile and pin labels use the builder initial.
