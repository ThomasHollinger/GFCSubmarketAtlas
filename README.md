# Gulf Coast Submarket Atlas

## v2.9.71 — Move New Deal pins

- Added **Move Pin** to every New Deal popup.
- Move Pin uses the same shared-password authorization as Add/Delete.
- After selecting Move Pin, drag the marker to its corrected location and release; confirm the new coordinates to save.
- The updated latitude/longitude plus city and submarket context are written to Firestore and appear live for everyone.
- Only New Deals are draggable; Builder Subdivisions and all other Atlas layers remain read-only.

## v2.9.70 — Remove legacy New Deals sync

- Removed the legacy New Deals browser-migration control and its one-time migration function.
- New Deals now uses the live Firebase/Firestore workflow only for shared add/delete activity.
- Shared password editing, deal initials, coordinate search, KML export, and all other Atlas behavior are unchanged.

## v2.9.69 — Live shared New Deals (Firebase)

- New Deals can now save/delete directly in Firebase Firestore instead of requiring GeoJSON download/upload.
- Google sign-in gates the shared New Deals collection; supplied Firestore rules require verified `@lennar.com` accounts.
- Firestore real-time listeners push additions/deletions to coworkers automatically.
- Green pins continue to show the first character of the deal name.
- Coordinate search and New Deals KML export remain unchanged.
- One-time setup instructions are in `FIREBASE_SETUP.md`.

# Gulf Coast Submarket Atlas v2.9.66

## v2.9.66 — Shared New Deals + deal initials

- New Deals now has a repository-backed master layer at `data/new_deals.geojson` so published deals are visible to every Atlas user and computer.
- Existing browser-saved New Deals are preserved during the upgrade; the same `gcsa.newDeals.v1` working-copy key is retained.
- Added **Download Shared Map File**. It creates `new_deals.geojson`; upload/replace that one file at `data/new_deals.geojson` in GitHub to publish the current working set to coworkers.
- Green New Deal pins now display the first character of the deal name (for example, **Williams Farm → W**) instead of a fixed `D`.
- Add/delete actions remain the only editable layer actions. Changes are local until the shared data file is published, avoiding any GitHub credentials or write tokens in the public GitHub Pages code.
- Existing New Deals KML export remains available.

# Gulf Coast Submarket Atlas v2.9.64


## v2.9.64 — New Deals editable layer

- Added **New Deals** below Builder Subdivisions as the Atlas's only editable map layer.
- New Deals can be toggled on/off and use green 24px circular pins matching the Builder Subdivision marker size and shape.
- **Add Pin to Map** enters placement mode; click the map, enter a deal name, and save.
- Saved pins persist in browser local storage and show name, coordinates, inferred city when a nearby Atlas record is available, and exact Atlas submarket when inside a boundary.
- Each New Deal popup includes **Delete Pin**.
- Added **New Deals (.kml)** to the Download Layer section.
- Market Preview, Builder Subdivision filtering, flood zones, contours, and all other layers are unchanged.

## v2.9.60 — ACS Mean Income

- Added **Mean Income** to the ACS Demographics Data section of Market Preview.
- Uses U.S. Census ACS 2017-2021 Detailed Table B19025 (Aggregate Household Income), matching the ACS vintage behind the bundled PDB block-group records.
- Mean Household Income is calculated as allocated aggregate household income divided by allocated households across the same radius-weighted block groups.
- The B19025 data is processed in the background and cached locally in the browser for 30 days; repeat visits use the processed cache.
- Zonda demographics and all other Market Preview sections are unchanged.

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


## v2.9.62
- Added Homesite Size to Builder Subdivision popups using Zonda LotSizeMin/LotSizeMax values; missing/zero values display as `-`.



## v2.9.62
- Builder Subdivision popups now show Homesite Size as Zonda lot dimensions (for example, 70' x 120') instead of total lot square footage.
- Dimensions use the Zonda lot-width field and derive depth from lot area divided by width; missing values display `-`.

## v2.9.63 - FEMA Flood Zones + USGS Contours
- Added optional FEMA NFHL Flood Zones overlay in the top-right map controls.
- Added optional USGS The National Map / 3DEP elevation contours overlay.
- Both overlays default off, can be combined with Light/Streets/Topo, and render below Atlas operational layers.
- Overlay detail is zoom-aware to limit unnecessary map load.

## v2.9.65 - New Deals Coordinate Search
- Added a latitude / longitude search bar to New Deals.
- Supports DMS coordinates such as `30°37'14.93"N 88°16'53.89"W` and decimal latitude/longitude pairs.
- Search flies the map to zoom 17 and does not create a New Deal pin automatically.



## v2.9.69 — New Deals shared-password editing
- Atlas and shared New Deals remain viewable without sign-in.
- Add/Delete prompts for a shared team password only when editing is needed.
- Firebase Email/Password Authentication protects writes; the password is not embedded in GitHub code.
- Firestore reads are public to Atlas visitors; writes are restricted to the configured shared editor identity.
- Authorization uses session persistence, so the password is not requested for every edit in the same browser session.

## v2.9.72 - Satellite Basemap
- Added Satellite as a fourth basemap option alongside Light, Streets, and Topo.
- Satellite uses Esri World Imagery and remains compatible with Flood Zones, Contours, New Deals, and all existing Atlas layers.


### v2.9.75 — Address search reliability
- Number-led **Find a Place / Address** queries now use Esri World Geocoding autocomplete and address resolution for stronger US street-address coverage.
- Letter-led place/business queries continue to use Photon with the current map-center proximity bias.
- The temporary selected-search marker now uses the Atlas DivIcon pattern instead of Leaflet's default image icon to prevent intermittent missing pins.


### v2.9.76 — Direct address candidates + persistent search pin
- Number-led **Find a Place / Address** queries now call ArcGIS `findAddressCandidates` directly rather than relying on street-name autocomplete suggestions.
- Full house-number address candidates are shown with coordinates already resolved.
- Local map-center bias is used only when zoomed into a market (zoom 8+); broad-map searches are not artificially suppressed.
- The temporary search-result pin now stays on the map until another search replaces it; clicking the map no longer removes it.
- Letter-led Photon place/business proximity search remains unchanged.


### v2.9.78 — Marker hover previews
- Hovering a clickable Atlas marker temporarily opens that marker's existing information popup.
- Moving the cursor off the marker closes a hover-only popup.
- Clicking a marker pins the full popup open until it is closed or another map interaction closes it.
- Applies to New Deals, Builder Subdivisions, Schools, Healthcare, Retail & Dining, and Lifestyle & Amenities.
- New Deal Move/Delete controls and all existing click behavior are preserved.

### v2.9.77 — Blue temporary search marker
- Place/address search results now use a simple blue temporary marker.
- Clicking elsewhere on the map or pressing Escape clears only the temporary search marker.
- New Deal pins and all other operational layers are unchanged.
