GitHub upload patch for Gulf Coast Submarket Atlas v2.9.90.

Replace the existing app-v2_9_89.js with js/app-v2_9_90.js and index.html with the patched index.html.
No map data files are changed.

IMPORTANT: before deploying, publish the Firestore rule in firestore-new-deals-private.rules.txt so unauthenticated users cannot read the `newDeals` collection.
