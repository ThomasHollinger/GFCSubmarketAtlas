# Gulf Coast Submarket Atlas v2.9.94

## New Deal Preview Buttons + Cancel Move

This patch keeps the v2.9.92 Preview button sizing but restores robust click handling for:
- 3 Mile Preview
- 5 Mile Preview
- Move Pin
- Delete Pin

It also adds **Escape = Cancel Move Pin**. When a New Deal is in move mode, pressing Escape immediately restores the marker to its original location, exits move mode, and does not save any change.

### GitHub upload
Replace the existing root `index.html` with this patch's `index.html` and add the new file:

`js/app-v2_9_93.js`

Do not remove the existing Firebase config or data files.
