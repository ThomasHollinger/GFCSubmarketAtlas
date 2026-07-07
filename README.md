# Gulf Coast Demographics GitHub Action v6

This patch fixes the false API-key failure in v5.

The v5 workflow validated the key using a single tract/block group request:
`state:01 county:003 tract:010700`. Census returned HTTP 204 because that test geography may not exist in the selected ACS release. V6 validates using a broad Baldwin County request instead.

Replace these files in the repository:

- `.github/workflows/build-demographics.yml`
- `scripts/build_demographics.py`

Then run **Actions > Build Demographics Dataset > Run workflow**.
