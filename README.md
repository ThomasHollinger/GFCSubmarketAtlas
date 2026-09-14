Gulf Coast Submarket Atlas v2.10.15

Change: Added a close-zoom Addresses layer with house-number labels and full-address hover details.

Upload index.html and js/app-v2_10_15.js, replacing the prior JS reference. Keep the Bay County Submarket 2 Quickview GeoJSON included in this ZIP if it has not already been deployed.

Changes in v2.10.15:
- Added an Addresses checkbox under Market Data.
- House numbers load only at zoom 18 or closer and appear as white labels with a dark outline over mapped address points/buildings.
- Hovering a house number shows the complete address fields available from OpenStreetMap.
- Address results refresh as the map moves, use session caching, and stay unloaded at normal zoom levels to protect map performance.
- Preserved the Bay County Submarket 2 Zonda Quickview data and all v2.10.14 functionality.
