# v2.9.43
- Wired Laurel Hill demographic block data into Market Quickview.
- Added the 42-block Laurel Hill Quickview GeoJSON layer with 4 populated demographic blocks and 38 explicit no-data blocks.
- Added Laurel Hill to both Quickview dataset loading paths.

# v2.9.42
- Wired Crestview demographic block data into Market Quickview.
- Added the 38-block Crestview Quickview GeoJSON layer with 12 populated demographic blocks and 26 explicit no-data blocks.
- Added Crestview to both Quickview dataset loading paths.

# v2.9.6
- Added a new Builder Display Tier filter based on community Price Max.
- Tier buckets are editable in the atlas and persist in the browser.
- Added a Tier line to builder popups for quick reference.

# v2.9.0
- Applied the latest verified school grades and exclusion flags from the user review file.

# Gulf Coast Submarket Atlas v2.8.5

## Sidebar dropdown persistence
- Sidebar dropdowns now remember their expanded/collapsed state when switching between submarkets.
- If a user opens Starts by Builder, Communities in boundary, Facilities in boundary, or Schools used in calculation, it stays open until the user closes it.
- Updated Healthcare Atlas Health fallback label to Layer Ready.

Built from v2.8.4.


## v2.8.6 Builder Filter Update
- Added Builder Subdivisions sub-filter by builder name.
- Builder filter list prioritizes Lennar first when present, sorts remaining builders alphabetically, and places unknown `?` builders last.
- Builder filter list scopes to the selected submarket when a submarket is selected.
- Leaving all builder names unchecked shows all builders; selecting one or more builder names limits the pins and sidebar counts to those builders.


## v2.8.7
- Updated Avery Cove builder from Lennar to Lennar Homes.

## v2.8.8 Builder Lennar normalization
- Merged legacy `Lennar` builder values into `Lennar Homes`.
- Builder filters now group Lennar and Lennar Homes together.
- Builder pins now prioritize Lennar Homes when a community has multiple builders, so any Lennar Homes community displays as a blue `L`.
- Popups and sidebar lists display normalized builder names.


## v2.8.9
- Fixed Builder Subdivisions load error caused by Lennar normalization runtime references.
- Submarket single-click now selects without zooming or recentering.
- Submarket double-click now zooms/recenters to the selected boundary.
- Search selection still zooms to the chosen submarket.


## v2.9.1
- Updated school ratings and verified school type overrides from the user review workbook.

## v2.9.35
- Wired South Baldwin block demographics into Market Quickview.
- Added an 87-block South Baldwin Quickview layer generated from the project South Baldwin boundary using the established 2-mile grid convention.
- Populated the 31 supplied South Baldwin demographic block exports; remaining blocks are explicitly marked no data.
- Added South Baldwin to both Quickview block-loading paths and updated the Quickview release status label.

## v2.9.36
- Wired Pensacola block demographics into Market Quickview.
- Added the 67-block Pensacola Quickview layer using the established 2-mile grid convention.
- Populated the 44 supplied Pensacola demographic block exports; remaining 23 blocks are explicitly marked no data.
- Added Pensacola to both Quickview block-loading paths.

## v2.9.37
- Wired Cantonment block demographics into Market Quickview.
- Added the 48-block Cantonment Quickview layer using the established 2-mile grid convention.
- Populated the 24 supplied Cantonment demographic block exports; remaining 24 blocks are explicitly marked no data.
- Added Cantonment to both Quickview block-loading paths.

## v2.9.38
- Wired Pace block demographics into Market Quickview.
- Added the 45-block Pace Quickview layer using the established 2-mile grid convention.
- Populated the 16 supplied Pace demographic block exports; remaining 29 blocks are explicitly marked no data.
- Added Pace to both Quickview block-loading paths.

## v2.9.39
- Wired Milton block demographics into Market Quickview.
- Added the 42-block Milton Quickview layer using the established 2-mile grid convention.
- Populated the 14 supplied Milton demographic block exports; remaining 28 blocks are explicitly marked no data.
- Added Milton to both Quickview block-loading paths.

## v2.9.40
- Wired Pensacola Beaches block demographics into Market Quickview.
- Added the 45-block Pensacola Beaches Quickview layer using the established 2-mile grid convention.
- Populated the 17 supplied Pensacola Beaches demographic block exports; remaining 28 blocks are explicitly marked no data.
- Added Pensacola Beaches to both Quickview block-loading paths.

## v2.9.41
- Wired Fort Walton block demographics into Market Quickview.
- Added the 39-block Fort Walton Quickview layer using the established 2-mile grid convention.
- Populated the 19 supplied Fort Walton demographic block exports; remaining 20 blocks are explicitly marked no data.
- Added Fort Walton to both Quickview block-loading paths.
