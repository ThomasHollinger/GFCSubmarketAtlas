Gulf Coast Submarket Atlas v2.9.60 - ACS Mean Income GitHub delta patch

Upload the CONTENTS of this patch to the repository root used by GitHub Pages.
ACS Demographics Data in Market Preview now includes Mean Income from official ACS B19025 aggregate household income.
The source table is processed in the background and cached locally for 30 days. Zonda and all other Preview calculations are unchanged.

Do not upload the ZIP itself as website content; extract it first and upload the files/folders inside.


v2.9.62: Builder Subdivision popup now includes Homesite Size from Zonda lot-size data.


v2.9.62: Builder Subdivision Homesite Size now displays lot dimensions (width x depth), with `-` when unavailable.

## v2.9.63 - FEMA Flood Zones + USGS Contours
- Added optional FEMA NFHL Flood Zones overlay in the top-right map controls.
- Added optional USGS The National Map / 3DEP elevation contours overlay.
- Both overlays default off, can be combined with Light/Streets/Topo, and render below Atlas operational layers.
- Overlay detail is zoom-aware to limit unnecessary map load.
