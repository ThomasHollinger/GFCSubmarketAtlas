from __future__ import annotations

import csv
import io
import json
import math
import sys
import zipfile
from pathlib import Path

from shapely.geometry import box, mapping, shape

ROOT = Path(__file__).resolve().parents[1]
SUBMARKETS_PATH = ROOT / 'data' / 'submarkets.geojson'
OUT_PATH = ROOT / 'data' / 'market_quickview' / 'crestview_quickview_blocks.geojson'

MILES_PER_DEG_LAT = 69.172
CELL_MILES = 2.0
SUBMARKET_NAME = 'Crestview'


def parse_num(value):
    if value is None:
        return None
    text = str(value).strip()
    if not text or text == '-' or text.upper() == 'N/A':
        return None
    pct = text.endswith('%')
    if pct:
        text = text[:-1].strip()
    try:
        number = float(text.replace(',', ''))
    except ValueError:
        return None
    if number.is_integer() and not pct:
        return int(number)
    return number


def parse_standard_csv(text: str):
    reader = csv.DictReader(io.StringIO(text))
    out = {}
    for row in reader:
        label = (row.get('Demographic') or '').strip()
        if not label:
            continue
        out[label] = {k: parse_num(v) for k, v in row.items() if k is not None}
    return out


def parse_income_age_csv(text: str):
    lines = [line.rstrip('\n') for line in text.splitlines() if line.strip()]
    if not lines:
        return {'2020': {}, '2024': {}, '2029': {}}
    header = next(csv.reader([lines[0]]))
    age_cols = [col.strip() for col in header[1:]]
    matrix = {'2020': {}, '2024': {}, '2029': {}}
    current_year = None
    for line in lines[1:]:
        row = next(csv.reader([line]))
        if not row:
            continue
        label = row[0].strip()
        if label in matrix and len(row) <= 2:
            current_year = label
            continue
        if current_year is None or label in {'Household Totals', '% of Total Households', 'Age Capture', 'Income Capture'}:
            continue
        vals = {}
        for age, cell in zip(age_cols, row[1:]):
            number = parse_num(cell)
            if number is not None:
                vals[age] = number
        if vals:
            matrix[current_year][label] = vals
    return matrix


def parse_consumer_segments(text: str):
    reader = csv.DictReader(io.StringIO(text))
    segments = {}
    for row in reader:
        label = (row.get('Name') or '').strip()
        if not label or label.lower() == 'total':
            continue
        households = parse_num(row.get('# 0F HOUSEHOLDS') or row.get('# OF HOUSEHOLDS'))
        if households is None:
            continue
        segments[label] = {
            'households': households,
            'pct': parse_num(row.get('% OF TOTAL')),
        }
    return segments


def parse_block_zip(data: bytes):
    tables = {}
    files_present = []
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for name in sorted(archive.namelist()):
            if name.endswith('/'):
                continue
            files_present.append(Path(name).name)
            text = archive.read(name).decode('utf-8', errors='replace')
            base = Path(name).name
            if base.startswith('DemographicSnapshot'):
                tables['demographic_snapshot'] = parse_standard_csv(text)
            elif base.startswith('PopulationTrends'):
                tables['population_trends'] = parse_standard_csv(text)
            elif base.startswith('HouseholdTrends'):
                tables['household_trends'] = parse_standard_csv(text)
            elif base.startswith('HouseholdIncomeByAge'):
                tables['income_age'] = parse_income_age_csv(text)
            elif base.startswith('ConsumerSegmentation'):
                tables['consumer_segments'] = parse_consumer_segments(text)
    return tables, files_present


def summary_properties(tables):
    ds = tables.get('demographic_snapshot', {})
    pt = tables.get('population_trends', {})
    ht = tables.get('household_trends', {})
    return {
        'population_2024': pt.get('Total Population', {}).get('2024') or ds.get('Total Population', {}).get('2024'),
        'population_2029': pt.get('Total Population', {}).get('2029') or ds.get('Total Population', {}).get('2029'),
        'households_2024': ht.get('Households', {}).get('2024') or ds.get('Households', {}).get('2024'),
        'households_2029': ht.get('Households', {}).get('2029') or ds.get('Households', {}).get('2029'),
        'median_household_income_2024': ds.get('Household Income: Median', {}).get('2024'),
        'median_household_income_2029': ds.get('Household Income: Median', {}).get('2029'),
        'mean_household_income_2024': pt.get('Household Income: Mean', {}).get('2024') or ds.get('Household Income: Mean', {}).get('2024'),
        'mean_household_income_2029': pt.get('Household Income: Mean', {}).get('2029') or ds.get('Household Income: Mean', {}).get('2029'),
        'median_age_2024': ds.get('Total population: Median age', {}).get('2024') or pt.get('Total population: Median Age', {}).get('2024'),
        'median_age_2029': ds.get('Total population: Median age', {}).get('2029') or pt.get('Total population: Median Age', {}).get('2029'),
        'median_home_value_2024': ds.get('Home Value: Median', {}).get('2024'),
        'average_household_size_2024': ht.get('Average Household Size', {}).get('2024'),
        'average_household_size_2029': ht.get('Average Household Size', {}).get('2029'),
        'population_growth_2024_2029': ds.get('Population Growth', {}).get('2024'),
        'households_growth_2024_2029': ds.get('Households Growth', {}).get('2024'),
    }


def load_submarket_geometry():
    data = json.loads(SUBMARKETS_PATH.read_text())
    for feature in data.get('features', []):
        if feature.get('properties', {}).get('DisplayName') == SUBMARKET_NAME:
            return shape(feature['geometry'])
    raise RuntimeError(f'{SUBMARKET_NAME} not found in {SUBMARKETS_PATH}')


def build_grid(geom):
    min_lon, min_lat, max_lon, max_lat = geom.bounds
    latitude = geom.centroid.y
    cell_height = CELL_MILES / MILES_PER_DEG_LAT
    cell_width = CELL_MILES / (MILES_PER_DEG_LAT * math.cos(math.radians(latitude)))
    pieces = []
    y = min_lat
    while y < max_lat:
        x = min_lon
        while x < max_lon:
            clipped = geom.intersection(box(x, y, min(x + cell_width, max_lon), min(y + cell_height, max_lat)))
            if not clipped.is_empty and clipped.area > 1e-12:
                centroid = clipped.centroid
                pieces.append((centroid.y, centroid.x, clipped))
            x += cell_width
        y += cell_height
    pieces.sort(key=lambda item: (-item[0], item[1]))
    return pieces, cell_width, cell_height


def suspicious_reason(props):
    pop = props.get('population_2024')
    hh = props.get('households_2024')
    med_income = props.get('median_household_income_2024')
    med_age = props.get('median_age_2024')
    if pop is not None and (pop < 0 or pop > 50000):
        return 'Population is outside expected block-level range.'
    if hh is not None and (hh < 0 or hh > 20000):
        return 'Households are outside expected block-level range.'
    if med_income is not None and (med_income < 0 or med_income > 1000000):
        return 'Median household income is outside expected range.'
    if med_age is not None and (med_age < 0 or med_age > 100):
        return 'Median age is outside expected range.'
    return None


def main(zip_path: Path):
    if not zip_path.exists():
        raise FileNotFoundError(zip_path)

    block_archives = {}
    with zipfile.ZipFile(zip_path) as outer:
        for name in outer.namelist():
            base = Path(name).name
            if not base.lower().endswith('.zip'):
                continue
            stem = Path(base).stem
            if stem.isdigit():
                block_archives[stem.zfill(3)] = outer.read(name)

    geom = load_submarket_geometry()
    cells, cell_width, cell_height = build_grid(geom)
    if len(cells) != 38:
        raise RuntimeError(f'Expected 38 Crestview blocks from project boundary, generated {len(cells)}')

    features = []
    for index, (centroid_lat, centroid_lon, clipped) in enumerate(cells, start=1):
        block = f'{index:03d}'
        props = {
            'block': block,
            'block_num': index,
            'submarket': SUBMARKET_NAME,
            'CentroidLon': centroid_lon,
            'CentroidLat': centroid_lat,
            'data_status': 'no data',
            'is_anomalous': False,
            'anomaly_reason': None,
            'files_present': '',
        }
        payload = block_archives.get(block)
        if payload is not None:
            tables, files_present = parse_block_zip(payload)
            props.update(summary_properties(tables))
            props['consumer_segments'] = tables.get('consumer_segments', {})
            props['income_age'] = tables.get('income_age', {})
            props['population_trends'] = tables.get('population_trends', {})
            props['demographic_snapshot'] = tables.get('demographic_snapshot', {})
            props['household_trends'] = tables.get('household_trends', {})
            props['files_present'] = ';'.join(files_present)
            props['data_status'] = 'usable'
            reason = suspicious_reason(props)
            if reason:
                props['is_anomalous'] = True
                props['anomaly_reason'] = reason
                props['data_status'] = 'anomalous'
        features.append({
            'type': 'Feature',
            'properties': props,
            'geometry': mapping(clipped),
        })

    missing_ids = sorted(set(block_archives) - {f'{i:03d}' for i in range(1, len(cells) + 1)})
    if missing_ids:
        raise RuntimeError(f'Demographic archive IDs outside generated block range: {missing_ids}')

    collection = {
        'type': 'FeatureCollection',
        'metadata': {
            'submarket': SUBMARKET_NAME,
            'grid_cell_miles': CELL_MILES,
            'grid_cell_width_degrees': cell_width,
            'grid_cell_height_degrees': cell_height,
            'total_blocks': len(features),
            'blocks_with_demographic_data': len(block_archives),
            'source_zip': zip_path.name,
        },
        'features': features,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(collection, separators=(',', ':')))

    usable = sum(f['properties']['data_status'] == 'usable' for f in features)
    anomalous = sum(f['properties']['data_status'] == 'anomalous' for f in features)
    no_data = sum(f['properties']['data_status'] == 'no data' for f in features)
    pop = sum((f['properties'].get('population_2024') or 0) for f in features if f['properties']['data_status'] == 'usable')
    hh = sum((f['properties'].get('households_2024') or 0) for f in features if f['properties']['data_status'] == 'usable')
    print(f'wrote {OUT_PATH}')
    print(f'blocks={len(features)} usable={usable} anomalous={anomalous} no_data={no_data}')
    print(f'usable population_2024={pop:,} households_2024={hh:,}')
    print('data block ids=' + ','.join(sorted(block_archives)))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: build_crestview_quickview.py /path/to/Crestview Zip.zip')
    main(Path(sys.argv[1]))
