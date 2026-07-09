# v2.8.0 - Builder Subdivisions

- Added Builder Subdivisions layer using the uploaded Zonda subdivision export.
- Added static builder subdivision data files under data/.
- Added Builder Activity map theme.
- Added sidebar Builder Subdivisions card with active/future counts, builders, units remaining, annual starts, and VDLs.
- Added Builder Display filters for Single Family Detached, Townhomes, Active, Future, and Built Out.
- Added builder subdivision search support.
- Preserved retail clustering/filters, verified school ratings, demographics, and healthcare framework.

Note: the uploaded source file contains 482 records. All records are currently tagged as Single-Family in the Product Style column, so the Townhomes filter is available but will show zero until townhome records are included in a future source export.


## v2.8.1 - Builder Pin Refinement
- Changed Builder Subdivisions rendering from clustered markers to individual pins, matching the school layer behavior.
- Added builder-specific pin colors: Lennar blue, D.R. Horton red, Adams green, DSLD purple, Holiday black, Meritage yellow, Maronda brown, Century maroon, Valor pink, and all others orange.
- Changed builder pin labels from product type initials to the first letter of the builder name.
