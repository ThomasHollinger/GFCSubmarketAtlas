# Gulf Coast Submarket Atlas v2.10.1

## Market Preview rendering fix

This patch fixes a runtime error in the v2.10.0 Market Preview rebuild:

`incomeBandLowerBound is not defined`

The income-band lower-bound parser is now a global helper shared by the Market Quickview and Market Preview renderers instead of being scoped to one renderer.

### Upload
Replace:
- `index.html`
- `js/app-v2_10_1.js`

No data files or Firebase configuration need to be changed.

After committing, hard-refresh the Atlas with Ctrl+Shift+R.
