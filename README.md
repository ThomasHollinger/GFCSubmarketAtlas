# Gulf Coast Submarket Atlas v2.9.95

## Restore all Market Preview buttons

This patch rolls the Market Preview prompt handling back to the last known working implementation from v2.9.93. v2.9.94 introduced a direct Leaflet DOM binding change that broke the Preview prompt buttons.

Preserved from v2.9.93:
- Regular Market Preview / Open Preview button works again.
- Market Preview / No prompt buttons work.
- New Deal 3 Mile Preview works.
- New Deal 5 Mile Preview works.
- New Deal Preview button sizing remains at the smaller, readable size.
- Move Pin supports Escape to cancel and restore the original location.
- Delete Pin remains unchanged.
- Private New Deals authentication/count behavior remains in place.

### GitHub upload
Replace the existing root `index.html` with this patch's `index.html` and add/replace:

`js/app-v2_9_95.js`

Do not remove your existing Firebase config or data files.

After publishing, hard-refresh the Atlas (Ctrl+Shift+R) so the new versioned JS is loaded.
