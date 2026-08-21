# Gulf Coast Submarket Atlas v2.10.0

## Market Preview rebuild

This release completely rebuilds the Market Preview interaction layer. The report content remains the designed combined Preview with: Zonda Demographics Data, ACS Demographics Data, Schools, Competition, Retail & Dining, and Lifestyle & Amenities.

### Market Preview flow
1. Click **Market Preview** in the sidebar.
2. Select **1, 3, 5, or 10 Miles**.
3. Click anywhere on the map.
4. A stable DOM prompt appears with **Open Preview** / **No** buttons.
5. **Open Preview** opens the Market Preview report immediately, then refreshes as background data finishes loading.

### New Deals flow
Each New Deal popup has **3 Mile Preview** and **5 Mile Preview** buttons. These use the exact New Deal coordinates and open the same Market Preview report engine directly.

### Stability changes
- Preview prompt is no longer implemented as an interactive Leaflet marker popup.
- Preview buttons use direct DOM event listeners with propagation stopped.
- The Market Preview modal opens before heavy calculations begin, preventing silent failures.
- Rendering failures are shown inside the Preview instead of doing nothing.
- New Deal popup clicks are isolated from the Leaflet map click handler.
- Preview button text remains compact (12px).

## GitHub upload
Replace `index.html`, add/replace `js/app-v2_10_0.js`, and replace `data/metadata.json`. Keep the existing Firebase configuration and all existing data files. Then commit the changes and hard refresh the Atlas with Ctrl+Shift+R.

