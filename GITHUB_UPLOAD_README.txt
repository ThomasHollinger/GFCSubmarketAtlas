Gulf Coast Submarket Atlas v2.9.77 - Blue Temporary Search Marker

Upload these files to the repository, preserving folders:
- index.html
- js/app-v2_9_77.js
- README.md
- GITHUB_UPLOAD_README.txt
- data/metadata.json

NEW IN v2.9.77:
- Search result marker is now a generic blue marker.
- Clicking elsewhere on the map or pressing Escape clears the temporary marker.

PREVIOUS v2.9.76:
- Number-led address searches use direct ArcGIS address candidates, so full house-number matches can appear instead of generic street suggestions.
- Address candidates already contain resolved coordinates; selecting one flies directly to it.
- Map-center bias is applied only when zoomed into a local market (zoom 8+).
- Search-result pin no longer disappears when the map is clicked.
- Letter-led place/business search keeps the existing Photon proximity behavior.
