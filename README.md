Gulf Coast Submarket Atlas v2.10.17

Change: Show address labels one zoom step earlier and add click-to-copy controls.

Upload index.html, js/address-tiles-vendor.js, and js/app-v2_10_17.js, replacing the prior JS reference. Keep the Bay County Submarket 2 Quickview GeoJSON included in this ZIP if it has not already been deployed.

Changes in v2.10.17:
- Reduced the Addresses activation threshold from zoom 18 to zoom 17, exactly one Leaflet zoom step earlier.
- Clicking a house number now opens the full address with a Copy Address button.
- The copy popup closes when the map starts moving, Escape is pressed, or the user clicks elsewhere.
- Preserved residential coverage, full-address hover details, session caching, Bay County Submarket 2 Zonda Quickview data, and all other v2.10.16 functionality.
