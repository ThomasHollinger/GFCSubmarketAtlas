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
