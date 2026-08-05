from __future__ import annotations
import csv, io, json, os, re, zipfile, math
from pathlib import Path
import xml.etree.ElementTree as ET

WORK = Path('/mnt/data/gcsa_quickview_work')
KML_PATH = Path('/mnt/data/Central_Mobile_174_blocks_combined_zero_padded.kml')
BLOCK_ZIP_PATH = Path('/mnt/data/Central Mobile.zip')
COMPILED_JSON_PATH = Path('/mnt/data/central_mobile_quickview_data.json')
OUT_PATH = WORK / 'data/market_quickview/central_mobile_quickview_blocks.geojson'

ns = {'kml': 'http://www.opengis.net/kml/2.2'}


def parse_num(s):
    if s is None:
        return None
    t = str(s).strip()
    if not t or t == '-' or t.upper() == 'N/A':
        return None
    if t.endswith('%'):
        try:
            return float(t[:-1].replace(',', '').strip())
        except Exception:
            return None
    try:
        if '.' in t:
            return float(t.replace(',', ''))
        return int(t.replace(',', ''))
    except Exception:
        return None


def parse_csv_rows(text):
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        return []
    header = rows[0]
    out = []
    for row in rows[1:]:
        if not row:
            continue
        # pad
        row = row + [''] * (len(header) - len(row))
        item = {'label': row[0].strip()}
        for i, col in enumerate(header[1:], start=1):
            item[col.strip()] = parse_num(row[i]) if i < len(row) else None
        out.append(item)
    return out


def parse_income_age_csv(text):
    lines = [ln.rstrip('\n') for ln in text.splitlines() if ln.strip()]
    if not lines:
        return {}
    header = next(csv.reader([lines[0]]))
    age_cols = [c.strip() for c in header[1:]]
    data = {'2020': {}, '2024': {}, '2029': {}}
    current_year = None
    for line in lines[1:]:
        row = next(csv.reader([line]))
        label = row[0].strip()
        if label in {'2020', '2024', '2029'} and len(row) <= 2:
            current_year = label
            data.setdefault(current_year, {})
            continue
        if current_year is None:
            continue
        if label in {'Age Capture', 'Income Capture'}:
            continue
        vals = {}
        for age, cell in zip(age_cols, row[1:]):
            n = parse_num(cell)
            if n is not None:
                vals[age] = n
        if vals:
            data[current_year][label] = vals
    return data


def centroid_from_ring(coords):
    # coordinates are [lon, lat]
    pts = [(float(x), float(y)) for x, y in coords if x is not None and y is not None]
    if not pts:
        return None
    # closed ring sometimes includes repeated point; ignore last if same as first
    if len(pts) > 2 and pts[0] == pts[-1]:
        pts = pts[:-1]
    # planar centroid approximation
    area = 0.0
    cx = 0.0
    cy = 0.0
    n = len(pts)
    for i in range(n):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]
        cross = x1 * y2 - x2 * y1
        area += cross
        cx += (x1 + x2) * cross
        cy += (y1 + y2) * cross
    area *= 0.5
    if abs(area) < 1e-12:
        xs = [x for x, _ in pts]
        ys = [y for _, y in pts]
        return [sum(xs) / len(xs), sum(ys) / len(ys)]
    cx /= (6.0 * area)
    cy /= (6.0 * area)
    return [cx, cy]


def kml_to_geojson(path):
    tree = ET.parse(path)
    root = tree.getroot()
    features = []
    for pm in root.findall('.//kml:Placemark', ns):
        name = pm.findtext('kml:name', default='', namespaces=ns)
        coords_text = pm.findtext('.//kml:coordinates', default='', namespaces=ns)
        coords = []
        for part in coords_text.strip().split():
            bits = part.split(',')
            if len(bits) >= 2:
                coords.append([float(bits[0]), float(bits[1])])
        if not coords:
            continue
        # rectangle/simple polygons are fine
        centroid = centroid_from_ring(coords)
        features.append({
            'type': 'Feature',
            'properties': {
                'block': name.strip(),
                'block_num': int(name.strip()) if name.strip().isdigit() else name.strip(),
                'CentroidLon': centroid[0] if centroid else None,
                'CentroidLat': centroid[1] if centroid else None,
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [coords],
            }
        })
    return {'type': 'FeatureCollection', 'features': features}


def block_zip_files():
    with zipfile.ZipFile(BLOCK_ZIP_PATH) as z:
        return sorted([n for n in z.namelist() if n.endswith('.zip')])


def parse_block_zip(data: bytes):
    bz = zipfile.ZipFile(io.BytesIO(data))
    tables = {}
    for fn in bz.namelist():
        text = bz.read(fn).decode('utf-8', errors='replace')
        if fn.startswith('ConsumerSegmentation'):
            rows = parse_csv_rows(text)
            segs = {}
            for row in rows:
                label = row['label']
                if label.lower() == 'total' or not label or label == 'RANK':
                    continue
                count = parse_num(row.get('# 0F HOUSEHOLDS') or row.get('# OF HOUSEHOLDS'))
                if count is None:
                    continue
                segs[label] = {'households': count, 'pct': parse_num(row.get('% OF TOTAL'))}
            tables['consumer_segments'] = segs
        elif fn.startswith('HouseholdIncomeByAge'):
            tables['income_age'] = parse_income_age_csv(text)
        elif fn.startswith('DemographicSnapshot'):
            rows = parse_csv_rows(text)
            tables['demographic_snapshot'] = {r['label']: {'2020': r.get('2020'), '2024': r.get('2024'), '2029': r.get('2029'), '2020_pct': r.get('% OF TOTAL'), '2024_pct': r.get('% OF TOTAL_1') if '% OF TOTAL_1' in r else None, '2029_pct': r.get('% OF TOTAL_2') if '% OF TOTAL_2' in r else None} for r in rows}
        elif fn.startswith('PopulationTrends'):
            rows = parse_csv_rows(text)
            # store same structure but keep only useful numeric columns
            tables['population_trends'] = {r['label']: {'2020': r.get('2020'), '2024': r.get('2024'), '2029': r.get('2029'), '2020_pct': r.get('% OF TOTAL'), '2024_pct': r.get('% OF TOTAL_1') if '% OF TOTAL_1' in r else None, '2029_pct': r.get('% OF TOTAL_2') if '% OF TOTAL_2' in r else None} for r in rows}
        elif fn.startswith('HouseholdTrends'):
            rows = parse_csv_rows(text)
            tables['household_trends'] = {r['label']: {'2020': r.get('2020'), '2024': r.get('2024'), '2029': r.get('2029'), '2020_pct': r.get('% OF TOTAL'), '2024_pct': r.get('% OF TOTAL_1') if '% OF TOTAL_1' in r else None, '2029_pct': r.get('% OF TOTAL_2') if '% OF TOTAL_2' in r else None} for r in rows}
    return tables


# Better parser with exact columns for these CSVs

def parse_standard_csv(text):
    reader = csv.DictReader(io.StringIO(text))
    out = {}
    for row in reader:
        label = (row.get('Demographic') or row.get('Income/Age') or row.get('RANK') or row.get('Name') or '').strip()
        if not label:
            continue
        out[label] = {k: parse_num(v) for k, v in row.items()}
    return out


def parse_block_zip2(data: bytes):
    bz = zipfile.ZipFile(io.BytesIO(data))
    tables = {}
    for fn in bz.namelist():
        text = bz.read(fn).decode('utf-8', errors='replace')
        if fn.startswith('ConsumerSegmentation'):
            reader = csv.DictReader(io.StringIO(text))
            segs = {}
            for row in reader:
                label = (row.get('Name') or '').strip()
                if not label or label.lower() == 'total':
                    continue
                count = parse_num(row.get('# 0F HOUSEHOLDS') or row.get('# OF HOUSEHOLDS'))
                if count is None:
                    continue
                segs[label] = {'households': count, 'pct': parse_num(row.get('% OF TOTAL'))}
            tables['consumer_segments'] = segs
        elif fn.startswith('HouseholdIncomeByAge'):
            # parse detailed matrix: year -> band -> age -> count
            lines = [ln.rstrip('\n') for ln in text.splitlines() if ln.strip()]
            if not lines:
                continue
            header = next(csv.reader([lines[0]]))
            age_cols = [c.strip() for c in header[1:]]
            matrix = {'2020': {}, '2024': {}, '2029': {}}
            current_year = None
            for line in lines[1:]:
                row = next(csv.reader([line]))
                label = row[0].strip()
                if label in matrix and len(row) <= 2:
                    current_year = label
                    continue
                if current_year is None or label in {'Household Totals', 'Age Capture', 'Income Capture'}:
                    continue
                vals = {}
                for age, cell in zip(age_cols, row[1:]):
                    n = parse_num(cell)
                    if n is not None:
                        vals[age] = n
                if vals:
                    matrix[current_year][label] = vals
            tables['income_age'] = matrix
        elif fn.startswith('DemographicSnapshot'):
            tables['demographic_snapshot'] = parse_standard_csv(text)
        elif fn.startswith('PopulationTrends'):
            tables['population_trends'] = parse_standard_csv(text)
        elif fn.startswith('HouseholdTrends'):
            tables['household_trends'] = parse_standard_csv(text)
    return tables


def merge_tables(base, add):
    # not needed here
    pass


def load_compiled_meta():
    with open(COMPILED_JSON_PATH) as f:
        data = json.load(f)
    meta = data.get('metadata', {})
    usable = {str(b['block']).zfill(3): b for b in data.get('blocks', [])}
    return meta, usable


def main():
    meta, usable_blocks = load_compiled_meta()
    geo = kml_to_geojson(KML_PATH)
    result = {'type': 'FeatureCollection', 'features': []}
    with zipfile.ZipFile(BLOCK_ZIP_PATH) as z:
        for feat in geo['features']:
            block = str(feat['properties']['block']).zfill(3)
            zip_name = f'Central Mobile/{int(block)}.zip' if int(block) != 0 else f'Central Mobile/{block}.zip'
            # lookup with exact names in zip archive (possibly zero-padded)
            candidates = [f'Central Mobile/{int(block):03d}.zip', f'Central Mobile/{int(block)}.zip']
            data = None
            matched = None
            for candidate in candidates:
                if candidate in z.namelist():
                    matched = candidate
                    data = z.read(candidate)
                    break
            props = feat['properties']
            props['data_status'] = 'no data'
            props['is_anomalous'] = False
            props['anomaly_reason'] = None
            props['files_present'] = ''
            if data is not None:
                tables = parse_block_zip2(data)
                props['data_status'] = 'usable'
                if block in usable_blocks:
                    props['is_anomalous'] = bool(usable_blocks[block].get('is_anomalous'))
                    props['anomaly_reason'] = usable_blocks[block].get('anomaly_reason')
                    props['data_status'] = usable_blocks[block].get('data_status', 'usable')
                # summary fields
                ds = tables.get('demographic_snapshot', {})
                pt = tables.get('population_trends', {})
                ht = tables.get('household_trends', {})
                segs = tables.get('consumer_segments', {})
                inc = tables.get('income_age', {})
                props['population_2024'] = pt.get('Total Population', {}).get('2024') or ds.get('Total Population', {}).get('2024')
                props['population_2029'] = pt.get('Total Population', {}).get('2029') or ds.get('Total Population', {}).get('2029')
                props['households_2024'] = ht.get('Households', {}).get('2024') or ds.get('Households', {}).get('2024')
                props['households_2029'] = ht.get('Households', {}).get('2029') or ds.get('Households', {}).get('2029')
                props['median_household_income_2024'] = ds.get('Household Income: Median', {}).get('2024')
                props['median_household_income_2029'] = ds.get('Household Income: Median', {}).get('2029')
                props['mean_household_income_2024'] = pt.get('Household Income: Mean', {}).get('2024') or ds.get('Household Income: Mean', {}).get('2024')
                props['mean_household_income_2029'] = pt.get('Household Income: Mean', {}).get('2029') or ds.get('Household Income: Mean', {}).get('2029')
                props['median_age_2024'] = ds.get('Total population: Median age', {}).get('2024') or pt.get('Total population: Median Age', {}).get('2024')
                props['median_age_2029'] = ds.get('Total population: Median age', {}).get('2029') or pt.get('Total population: Median Age', {}).get('2029')
                props['median_home_value_2024'] = ds.get('Home Value: Median', {}).get('2024')
                props['average_household_size_2024'] = ht.get('Average Household Size', {}).get('2024')
                props['average_household_size_2029'] = ht.get('Average Household Size', {}).get('2029')
                props['population_growth_2024_2029'] = ds.get('Population Growth', {}).get('2024')
                props['households_growth_2024_2029'] = ds.get('Households Growth', {}).get('2024')
                # education / race / employment / occupation from population trends / snapshot
                props['consumer_segments'] = segs
                props['income_age'] = inc
                props['population_trends'] = pt
                props['demographic_snapshot'] = ds
                props['household_trends'] = ht
                props['files_present'] = ';'.join(['DemographicSnapshot-26.08.05.csv', 'PopulationTrends-26.08.05.csv', 'HouseholdIncomeByAge-26.08.05.csv', 'HouseholdTrends-26.08.05.csv', 'ConsumerSegmentation-26.08.05.csv'])
                # preserve concise summary if data found
                if int(block) == 97:
                    props['is_anomalous'] = True
                    props['anomaly_reason'] = 'Extreme values detected in original compiled dataset.'
                    props['data_status'] = 'anomalous'
            result['features'].append(feat)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, 'w') as f:
        json.dump(result, f)
    print('wrote', OUT_PATH, 'features', len(result['features']))

if __name__ == '__main__':
    main()
