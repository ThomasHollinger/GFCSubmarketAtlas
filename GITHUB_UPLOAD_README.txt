Gulf Coast Submarket Atlas v2.9.75 - Address Search Reliability

Upload/replace these files in the repository:
- index.html
- js/app-v2_9_75.js
- data/metadata.json
- README.md

This patch is based on v2.9.74 and preserves the existing Firebase configuration, Firestore rules, CSS, and all data files already in the repository.

NEW IN v2.9.75:
- Queries beginning with a number use Esri World Geocoding autocomplete/address resolution for stronger US street-address coverage.
- Queries beginning with a letter continue to use Photon proximity-biased place/business search.
- The selected search-result pin uses the Atlas DivIcon marker pattern and is no longer removed merely by clicking elsewhere on the map/UI.

No Firebase configuration changes are required.
