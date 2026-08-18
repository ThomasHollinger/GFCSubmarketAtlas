Gulf Coast Submarket Atlas v2.9.86 - Locked New Deal Local View

Upload these files to the repository, preserving folders:
- index.html
- js/app-v2_9_80.js
- README.md
- GITHUB_UPLOAD_README.txt
- data/metadata.json

NEW IN v2.9.83:
- New Deal sidebar selection now flies to zoom level 7 for a much wider surrounding-area view.

- Expand/collapse the complete New Deals list in the sidebar.
- Click any deal name to fly to its pin and open the full popup.
- List stays synced with Firebase.

PREVIOUS v2.9.78:
- Hover a clickable marker to temporarily show its information.
- Move off the marker to close the hover preview.
- Click a marker to keep the full popup open.

PREVIOUS v2.9.77:
- Search result marker is now a generic blue marker.
- Clicking elsewhere on the map or pressing Escape clears the temporary marker.

PREVIOUS v2.9.76:
- Number-led address searches use direct ArcGIS address candidates, so full house-number matches can appear instead of generic street suggestions.
- Address candidates already contain resolved coordinates; selecting one flies directly to it.
- Map-center bias is applied only when zoomed into a local market (zoom 8+).
- Search-result pin no longer disappears when the map is clicked.
- Letter-led place/business search keeps the existing Photon proximity behavior.

- New Deals list is grouped by populated submarket in Atlas map-number order; empty submarkets are omitted.

- New Deals pins are now silver so they are easier to distinguish from Builder Subdivision markers.

NEW IN v2.9.85:
- New Deal sidebar clicks now fly to zoom level 12 (previously 7).
- Silver New Deal markers and all other v2.9.83 behavior are preserved.

NEW IN v2.9.86:
- Stops any pending map animation before a New Deal sidebar jump.
- Forces zoom 12 without animation.
- New Deal popup auto-pan is disabled so the view stays local.

