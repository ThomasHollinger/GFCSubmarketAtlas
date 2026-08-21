Gulf Coast Submarket Atlas v2.9.99

Market Preview complete event/reliability rewrite.

This build is based on the v2.9.91 Atlas and rewrites the Market Preview interaction path so all of these use the same preview engine:
- Sidebar Market Preview: 1, 3, 5, and 10 mile radius
- Open Preview / No prompt actions
- New Deal: 3 Mile Preview
- New Deal: 5 Mile Preview

Fixes include:
- Removes inline onclick handlers from the radius prompt.
- Uses Leaflet DOM event binding with click propagation disabled.
- Opens the Market Preview modal shell before rendering heavy data so a click always produces visible feedback.
- Centralizes report opening in openMarketSnapshotReportAt().
- Adds error-safe rendering so a data-builder exception is shown in the modal instead of failing silently.
- Keeps New Deal preview clicks from being lost to Leaflet popup/map event handling.
- Bridges marker hover to the popup so action buttons remain usable when a popup was opened by hover.
- Preserves private New Deals behavior and Move Pin Escape cancellation.
- Keeps New Deal preview button text at 12px.

GitHub upload:
Replace your current index.html with the included index.html and add/replace js/app-v2_9_99.js. Do not upload or keep an older app-v2_9_92 through app-v2_9_98 script referenced by index.html.
After GitHub Pages publishes, hard refresh with Ctrl+Shift+R.
