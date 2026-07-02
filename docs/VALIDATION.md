# Validation Notes

- Submarkets load from `data/submarkets.geojson`.
- School ratings load from `data/school_ratings_master.csv`.
- School points load from the NCES public school locations service.
- School Rating uses Option A: rated school points physically located inside each submarket polygon.
- Unrated schools are ignored and are never counted as zero.
