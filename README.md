# Gulf Coast Submarket Atlas v2.9.59

## v2.9.59 — Zonda Mean Income fix

- Fixed the Zonda Demographics Data overview Mean Income metric in Market Preview.
- Zonda labels this source field `Household Income: Average`; the Preview had been looking for `Household Income: Mean`.
- Mean Income is now household-weighted across usable Zonda blocks with no additional data request.
- No other Market Preview calculations or Quickview/ACS mechanics were changed.

## v2.9.58 — Market Preview

- Replaced the separate Market Quickview and Market Snapshot controls with one **Market Preview** workflow.
- Preserved the existing 1 / 3 / 5 / 10 mile radius selection and Open Preview / No map confirmation.
- Preview order: **Zonda Demographics Data**, **ACS Demographics Data**, **Schools**, **Competition**, **Retail & Dining**, **Lifestyle & Amenities**.
- Zonda demographics continue to use the existing Quickview block aggregation with no calculation changes.
- ACS demographics continue to use the bundled 17,313-record ACS 2020-2024 block-group radius dataset with no live Census dependency.
- Schools, Competition, Retail & Dining, and Lifestyle & Amenities retain the prior Snapshot radius logic.
- The Preview opens immediately from loaded data and refreshes once any background market-context layers finish loading.


## v2.9.57 — Market Snapshot local ACS radius restore

- Restored Market Snapshot demographics to the proven pre-Quickview local ACS block-group radius workflow.
- Bundles 17,313 ACS 2020-2024 block-group population-center records in `data/demographics_block_groups.geojson`.
- Snapshot population, households, median household income, and median age are calculated from block-group records inside the selected radius rather than submarket centroids.
- Removes the live Census/TIGER runtime dependency introduced in v2.9.56.
- Market Quickview code and datasets are unchanged from v2.9.55.

Deployment build for the Gulf Coast / Enterprise Submarket Atlas.

## v2.9.54 — Market Quickview income-band performance fix

- Income Bands now render immediately from demographic snapshot data when the income-by-age table is empty.
- Removed misleading “still loading” placeholders for Quickview sections that have already finished loading.
- No additional network request is required to display income bands.

## v2.9.53 — Retail & Lifestyle performance + release notes
- Retail & Dining now starts loading in the background after the core Atlas is ready instead of waiting for the first checkbox click.
- Lifestyle & Amenities now starts loading in the background after the core Atlas is ready.
- Processed OpenStreetMap POI results are cached locally in the browser for 30 days, so repeat visits normally avoid the long Overpass request entirely.
- Marker layers are built only when displayed, keeping the initial map interaction responsive while the POI data warms in the background.
- Added this `README.md` to the GitHub-ready deployment so repository release notes no longer remain stuck on the older v2.9.0/v2.9.1 README.

## v2.9.52 — Healthcare + Demographics fixes
- Hardened Healthcare loading so Quickview polygons cannot be mistaken for healthcare facilities.
- Demographics returns the map theme to **Hub View** when deselected.
- Versioned the deployed JavaScript asset to avoid stale-browser caching of the broken loader.

## v2.9.51 — Marianna Quickview
- Added the 63-block Marianna Market Quickview grid.
- Wired 10 supplied demographic block packages; 53 cells remain explicit no-data.

## v2.9.50 — Panama City Quickview
- Added the 73-block Panama City Market Quickview grid.
- Wired 26 supplied demographic block packages; 47 cells remain explicit no-data.
- Corrected the Defuniak Springs initial Quickview loader path.

## v2.9.49 — Townhomes + Builder defaults
- Builder Subdivisions expanded to 1,062 communities, including 161 Townhomes.
- Default Builder filters: **Single Family Detached + Active + Future ON**; **Townhomes + Built Out OFF**.

## v2.9.48 — Built Out subdivisions
- Added 215 Built Out communities to the Builder Subdivisions layer.

## v2.9.47 — Builder Subdivisions refresh
- Rebuilt Builder Subdivisions from the August 12 source table.
- Updated community attributes, spatial assignments, filters, KML export, and summaries.

## Deployment
Extract the GitHub-ready ZIP and upload the **contents** to the GitHub Pages repository root. Do not upload the ZIP itself as the website content.


## v2.9.55
- Market Quickview Income Bands now use a fixed low-to-high income order: Less than 25k through Above 200k, independent of household counts.
