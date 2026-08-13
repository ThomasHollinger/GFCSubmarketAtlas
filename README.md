# Gulf Coast Submarket Atlas v2.9.53

Deployment build for the Gulf Coast / Enterprise Submarket Atlas.

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
