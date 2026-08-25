# Gulf Coast Submarket Atlas v2.10.4

## Retail & Dining predictive search

This patch adds Google-style predictive suggestions to the existing Retail & Dining search.

### Behavior
- Suggestions begin once 3 normalized characters have been typed.
- Suggestions are generated across the full loaded Retail & Dining dataset.
- Matching ignores capitalization, apostrophes, hyphens, spaces, and similar punctuation, so `McDonalds` and `McDonald's` match the same locations.
- Suggestions show up to 8 likely brand/store names with their location counts.
- Clicking a suggestion commits the search and shows every matching location across the map.
- Pressing Enter still commits the current query directly.
- Pressing Escape hides the suggestion list without clearing the committed search.
- Clicking outside the search box/list hides suggestions.
- Existing Clear behavior is unchanged.

## GitHub upload
Replace:
- `index.html`
- `js/app-v2_10_4.js`

Do not remove other atlas data files.

After GitHub Pages deploys, hard-refresh with Ctrl+Shift+R.
