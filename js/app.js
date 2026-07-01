const state = {
  map: null,
  submarketLayer: null,
  schoolLayer: null,
  selected: null,
  features: [],
  schools: [],
  schoolsLoaded: false,
  basemaps: {},
  searchIndex: [],
  metadata: null
};

const hubOrder = ['Alabama Hub', 'Pensacola Hub', 'Panama City Hub', 'Growth Markets'];
const hubBaseColors = {
  'Alabama Hub': '#F4A261',
  'Pensacola Hub': '#4EA3D8',
  'Panama City Hub': '#8CCB6E',
  'Growth Markets': '#A7A7A7'
};

const NCES_URL = 'https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_GEOCODE_PUBLICSCH_2425/MapServer/0/query';

const schoolRatingRecords = [{"Submarket": "North Baldwin", "SchoolName": "Bay Minette Elementary", "SchoolType": "Elementary", "Rating": 4}, {"Submarket": "North Baldwin", "SchoolName": "Bay Minette Middle", "SchoolType": "Middle", "Rating": 8}, {"Submarket": "North Baldwin", "SchoolName": "Baldwin County High", "SchoolType": "High", "Rating": 8}, {"Submarket": "North Baldwin", "SchoolName": "Delta Elementary", "SchoolType": "Elementary", "Rating": 8}, {"Submarket": "North Baldwin", "SchoolName": "Pine Grove Elementary", "SchoolType": "Elementary", "Rating": 7}, {"Submarket": "North Baldwin", "SchoolName": "Stapleton Elementary", "SchoolType": "Elementary", "Rating": 8}, {"Submarket": "Central Baldwin", "SchoolName": "Belforest Elementary", "SchoolType": "Elementary", "Rating": 10}, {"Submarket": "Central Baldwin", "SchoolName": "Daphne East Elementary", "SchoolType": "Elementary", "Rating": 10}, {"Submarket": "Central Baldwin", "SchoolName": "Daphne Elementary", "SchoolType": "Elementary", "Rating": 8}, {"Submarket": "Central Baldwin", "SchoolName": "Daphne Middle", "SchoolType": "Middle", "Rating": 6}, {"Submarket": "Central Baldwin", "SchoolName": "Daphne High", "SchoolType": "High", "Rating": 10}, {"Submarket": "Central Baldwin", "SchoolName": "Rockwell Elementary", "SchoolType": "Elementary", "Rating": 10}, {"Submarket": "Central Baldwin", "SchoolName": "Spanish Fort Elementary", "SchoolType": "Elementary", "Rating": 10}, {"Submarket": "Central Baldwin", "SchoolName": "Spanish Fort Middle", "SchoolType": "Middle", "Rating": 10}, {"Submarket": "Central Baldwin", "SchoolName": "Spanish Fort High", "SchoolType": "High", "Rating": 10}, {"Submarket": "Central Baldwin", "SchoolName": "Stonebridge Elementary", "SchoolType": "Elementary", "Rating": 10}, {"Submarket": "West Baldwin", "SchoolName": "Central Baldwin Middle", "SchoolType": "Middle", "Rating": 8}, {"Submarket": "West Baldwin", "SchoolName": "Elsanor Elementary", "SchoolType": "Elementary", "Rating": 9}, {"Submarket": "West Baldwin", "SchoolName": "Loxley Elementary", "SchoolType": "Elementary", "Rating": 8}, {"Submarket": "West Baldwin", "SchoolName": "Robertsdale Elementary", "SchoolType": "Elementary", "Rating": 5}, {"Submarket": "West Baldwin", "SchoolName": "Robertsdale High", "SchoolType": "High", "Rating": 8}, {"Submarket": "West Baldwin", "SchoolName": "Rosinton Elementary", "SchoolType": "Elementary", "Rating": 7}, {"Submarket": "West Baldwin", "SchoolName": "Silverhill Elementary", "SchoolType": "Elementary", "Rating": 5}, {"Submarket": "South Baldwin", "SchoolName": "Elberta Elementary", "SchoolType": "Elementary", "Rating": 7}, {"Submarket": "South Baldwin", "SchoolName": "Elberta Middle", "SchoolType": "Middle", "Rating": 9}, {"Submarket": "South Baldwin", "SchoolName": "Elberta High", "SchoolType": "High", "Rating": 8}, {"Submarket": "South Baldwin", "SchoolName": "Fairhope East Elementary", "SchoolType": "Elementary", "Rating": 10}, {"Submarket": "South Baldwin", "SchoolName": "Fairhope West Elementary", "SchoolType": "Elementary", "Rating": 10}, {"Submarket": "South Baldwin", "SchoolName": "Fairhope Middle", "SchoolType": "Middle", "Rating": 10}, {"Submarket": "South Baldwin", "SchoolName": "Fairhope High", "SchoolType": "High", "Rating": 9}, {"Submarket": "South Baldwin", "SchoolName": "Florence B. Mathis Elementary", "SchoolType": "Elementary", "Rating": 3}, {"Submarket": "South Baldwin", "SchoolName": "Foley Elementary", "SchoolType": "Elementary", "Rating": 4}, {"Submarket": "South Baldwin", "SchoolName": "Foley Middle", "SchoolType": "Middle", "Rating": 4}, {"Submarket": "South Baldwin", "SchoolName": "Foley High", "SchoolType": "High", "Rating": 7}, {"Submarket": "South Baldwin", "SchoolName": "J. Larry Newton Elementary", "SchoolType": "Elementary", "Rating": 9}, {"Submarket": "South Baldwin", "SchoolName": "Magnolia School", "SchoolType": "K-6", "Rating": 8}];
state.mapTheme = 'hub';

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\bschool\b/g, '')
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ratingForSchoolName(name) {
  const n = normalizeName(name);
  let rec = schoolRatingRecords.find(r => normalizeName(r.SchoolName) === n);
  if (!rec) rec = schoolRatingRecords.find(r => {
    const rn = normalizeName(r.SchoolName);
    return n.includes(rn) || rn.includes(n);
  });
  return rec || null;
}

function avg(nums) {
  const clean = nums.filter(n => typeof n === 'number' && !Number.isNaN(n));
  if (!clean.length) return null;
  return clean.reduce((a,b)=>a+b,0) / clean.length;
}

function gradeForScore(score) {
  if (score === null || score === undefined) return 'Pending';
  if (score >= 9) return 'A';
  if (score >= 8) return 'B';
  if (score >= 7) return 'C';
  if (score >= 6) return 'D';
  return 'F';
}

function colorForSchoolScore(score) {
  if (score === null || score === undefined) return '#d0d5dd';
  if (score >= 9) return '#1f8f4d';
  if (score >= 8) return '#74b816';
  if (score >= 7) return '#f2c94c';
  if (score >= 6) return '#f2994a';
  return '#d64545';
}

function scoreSummaryForSubmarket(name) {
  const rows = schoolRatingRecords.filter(r => r.Submarket === name);
  const typeRows = type => rows.filter(r => r.SchoolType === type || (type === 'Elementary' && r.SchoolType === 'K-6'));
  return {
    overall: avg(rows.map(r => r.Rating)),
    elementary: avg(typeRows('Elementary').map(r => r.Rating)),
    middle: avg(typeRows('Middle').map(r => r.Rating)),
    high: avg(typeRows('High').map(r => r.Rating)),
    count: rows.length,
    elementaryCount: typeRows('Elementary').length,
    middleCount: typeRows('Middle').length,
    highCount: typeRows('High').length,
    rows
  };
}

function scoreSummaryForFeatures(features) {
  const names = new Set(features.map(f => f.properties.DisplayName));
  const rows = schoolRatingRecords.filter(r => names.has(r.Submarket));
  const typeRows = type => rows.filter(r => r.SchoolType === type || (type === 'Elementary' && r.SchoolType === 'K-6'));
  return {
    overall: avg(rows.map(r => r.Rating)),
    elementary: avg(typeRows('Elementary').map(r => r.Rating)),
    middle: avg(typeRows('Middle').map(r => r.Rating)),
    high: avg(typeRows('High').map(r => r.Rating)),
    count: rows.length,
    elementaryCount: typeRows('Elementary').length,
    middleCount: typeRows('Middle').length,
    highCount: typeRows('High').length,
    rows
  };
}

function fmtScore(v) {
  return v === null || v === undefined ? 'Pending' : v.toFixed(1);
}

function fmt(v, suffix = '') {
  if (v === null || v === undefined || v === '') return 'Coming Soon';
  if (typeof v === 'number') return `${v.toLocaleString()}${suffix}`;
  return `${v}${suffix}`;
}

function styleFeature(feature) {
  const p = feature.properties;
  const selected = state.selected && state.selected.properties.SubmarketID === p.SubmarketID;
  return {
    color: selected ? '#061827' : '#26384f',
    weight: selected ? 3.5 : 1.4,
    fillColor: state.mapTheme === 'schools' ? colorForSchoolScore(scoreSummaryForSubmarket(p.DisplayName).overall) : (p.HubColor || p.HubBaseColor || '#8ea0ad'),
    fillOpacity: selected ? 0.72 : 0.48
  };
}


function legendHtml() {
  if (state.mapTheme === 'schools') {
    return `<b>School Score</b><div class="legend-subtitle">GreatSchools Average</div>` + [
      ['#1f8f4d','A','9.0-10.0'], ['#74b816','B','8.0-8.9'], ['#f2c94c','C','7.0-7.9'], ['#f2994a','D','6.0-6.9'], ['#d64545','F','Below 6.0'], ['#d0d5dd','Pending','No rating']
    ].map(r => `<div class="legend-row"><i class="legend-swatch" style="background:${r[0]}"></i><span>${r[1]}</span><small>${r[2]}</small></div>`).join('');
  }
  return `<b>Hubs</b><div class="legend-subtitle">Count of Submarkets</div>` + hubOrder.map(hub => {
    const count = state.features.filter(f => f.properties.Hub === hub).length;
    return `<div class="legend-row"><i class="legend-swatch" style="background:${hubBaseColors[hub]}"></i><span>${hub.replace(' Hub','')}</span><small>${count}</small></div>`;
  }).join('');
}

function updateLegend() {
  const el = document.querySelector('.legend');
  if (el) el.innerHTML = legendHtml();
}

function setMapTheme(theme) {
  state.mapTheme = theme;
  if (state.submarketLayer) state.submarketLayer.setStyle(styleFeature);
  updateLegend();
  if (state.selected) renderSelected(state.selected.properties); else renderHomeSummary();
}

function initMap() {
  state.map = L.map('map', { zoomControl: false, preferCanvas: true });
  L.control.zoom({ position: 'bottomright' }).addTo(state.map);

  state.basemaps.light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 20
  }).addTo(state.map);
  state.basemaps.streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
  });
  state.basemaps.topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenTopoMap contributors', maxZoom: 17
  });

  L.control.scale({ imperial: true, metric: true }).addTo(state.map);
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = () => {
    const d = L.DomUtil.create('div', 'legend compact');
    d.innerHTML = legendHtml();
    return d;
  };
  state.legend = legend;
}

async function loadData() {
  const [geojson, meta] = await Promise.all([
    fetch('data/submarkets.geojson').then(r => r.json()),
    fetch('data/metadata.json').then(r => r.json())
  ]);

  state.features = geojson.features;
  state.metadata = meta;
  buildSearchIndex();
  renderRelease(meta);
  renderHubList(meta);
  renderSearchResults('');
  renderHomeSummary();

  state.submarketLayer = L.geoJSON(geojson, {
    style: styleFeature,
    onEachFeature: (feature, layer) => {
      layer.on({
        mouseover: () => layer.setStyle({ weight: 2.8, fillOpacity: 0.64 }),
        mouseout: () => state.submarketLayer.resetStyle(layer),
        click: () => selectFeature(feature, layer)
      });
      const p = feature.properties;
      layer.bindTooltip(`${p.DisplayName}`, { sticky: true, className: 'submarket-label' });
    }
  }).addTo(state.map);

  state.map.fitBounds(state.submarketLayer.getBounds(), { padding: [24, 24] });
  state.legend.addTo(state.map);
}

function renderRelease(meta) {
  document.getElementById('releasePanel').innerHTML = `
    Version: <b>${meta.version}</b><br>
    Submarkets loaded: <b>${meta.uniqueSubmarketsLoaded}</b><br>
    Health score: <b>${meta.healthScore}/100</b><br>
    Schools: <b>${state.schoolsLoaded ? state.schools.length + ' loaded' : 'Layer ready'}</b><br>
    Updated: <b>${meta.releaseDate}</b>
  `;
  document.getElementById('statusText').textContent = `${meta.uniqueSubmarketsLoaded} submarkets • School layer ready`;
}

function renderHubList(meta) {
  const hubCounts = hubOrder.map(hub => ({
    name: hub,
    color: hubBaseColors[hub],
    count: state.features.filter(f => f.properties.Hub === hub).length
  }));
  const box = document.getElementById('hubList');
  box.innerHTML = hubCounts.map(h => `
    <button class="hub-item" data-hub="${h.name}">
      <i class="hub-swatch" style="background:${h.color}"></i>
      <b>${h.name}</b>
      <span>${h.count}</span>
    </button>
  `).join('');
  box.querySelectorAll('.hub-item').forEach(btn => {
    btn.addEventListener('click', () => zoomToHub(btn.dataset.hub));
  });
}

function zoomToHub(hub) {
  const layers = [];
  state.submarketLayer.eachLayer(layer => {
    if (layer.feature.properties.Hub === hub) layers.push(layer);
  });
  if (!layers.length) return;
  let bounds = layers[0].getBounds();
  layers.slice(1).forEach(layer => bounds.extend(layer.getBounds()));
  state.map.fitBounds(bounds, { padding: [40, 40] });
  renderHubSummary(hub);
}

function schoolCountsFor(features) {
  const ids = new Set(features.map(f => f.properties.SubmarketID));
  const schools = state.schools.filter(s => ids.has(s.properties.SubmarketID));
  return summarizeSchools(schools);
}

function summarizeSchools(schools) {
  const out = { total: schools.length, Elementary: 0, Middle: 0, High: 0, Other: 0 };
  schools.forEach(s => out[s.properties.SchoolType] = (out[s.properties.SchoolType] || 0) + 1);
  return out;
}

function renderSchoolCountCard(counts, scoreSummary = null) {
  if (!scoreSummary) {
    if (!state.schoolsLoaded) return `<div class="school-count-card"><b>Schools</b><br>Turn on the Schools layer to load public school points.</div>`;
    return `<div class="school-count-card"><b>Public Schools</b><br>${counts.total} total • ${counts.Elementary} elem • ${counts.Middle} middle • ${counts.High} high</div>`;
  }
  return `<div class="school-score-card">
    <div class="score-head"><b>School Rating</b><span class="score-grade grade-${gradeForScore(scoreSummary.overall)}">${gradeForScore(scoreSummary.overall)}</span></div>
    <div class="overall-score"><span>${fmtScore(scoreSummary.overall)}</span><small>/10 Overall • ${scoreSummary.count} schools</small></div>
    <div class="score-breakdown">
      <div><span>Elementary</span><b>${fmtScore(scoreSummary.elementary)}</b><small>${scoreSummary.elementaryCount}</small></div>
      <div><span>Middle</span><b>${fmtScore(scoreSummary.middle)}</b><small>${scoreSummary.middleCount}</small></div>
      <div><span>High</span><b>${fmtScore(scoreSummary.high)}</b><small>${scoreSummary.highCount}</small></div>
    </div>
  </div>`;
}

function renderHubSummary(hub) {
  const items = state.features.filter(f => f.properties.Hub === hub);
  const acres = items.reduce((sum, f) => sum + Number(f.properties.Acres || 0), 0);
  const sqmi = items.reduce((sum, f) => sum + Number(f.properties.AreaSqMi || 0), 0);
  const counts = schoolCountsFor(items);
  const scoreSummary = scoreSummaryForFeatures(items);
  document.getElementById('selectedPanel').classList.remove('empty');
  document.getElementById('selectedPanel').innerHTML = `
    <h3 class="selected-title">${hub}</h3>
    <p class="selected-meta">${items.length} submarkets</p>
    <div class="metric-grid">
      <div class="metric"><div class="label">Area</div><div class="value">${fmt(Math.round(sqmi), ' sq mi')}</div></div>
      <div class="metric"><div class="label">Acres</div><div class="value">${fmt(Math.round(acres))}</div></div>
      <div class="metric"><div class="label">School Score</div><div class="value">${fmtScore(scoreSummary.overall)}</div></div>
      <div class="metric"><div class="label">Builders</div><div class="value">Pending</div></div>
    </div>
    ${renderSchoolCountCard(counts, scoreSummary)}
    <div class="focus-list">
      ${items.map(f => `<div class="focus-row"><span>${f.properties.DisplayName}</span><b>${f.properties.SubmarketID}</b></div>`).join('')}
    </div>
  `;
}

function renderHomeSummary() {
  const total = state.features.length;
  const counts = schoolCountsFor(state.features);
  const scoreSummary = scoreSummaryForFeatures(state.features);
  document.getElementById('selectedPanel').classList.remove('empty');
  document.getElementById('selectedPanel').innerHTML = `
    <h3 class="selected-title">Enterprise Snapshot</h3>
    <p class="selected-meta">Market intelligence foundation</p>
    <div class="metric-grid">
      <div class="metric"><div class="label">Submarkets</div><div class="value">${total}</div></div>
      <div class="metric"><div class="label">Hubs</div><div class="value">4</div></div>
      <div class="metric"><div class="label">School Score</div><div class="value">${fmtScore(scoreSummary.overall)}</div></div>
      <div class="metric"><div class="label">Builders</div><div class="value">Pending</div></div>
    </div>
    ${renderSchoolCountCard(counts, scoreSummary)}
    <div class="focus-list">
      <div class="focus-row"><span>Boundaries</span><b>Verified</b></div>
      <div class="focus-row"><span>Hub color model</span><b>Active</b></div>
      <div class="focus-row"><span>School layer</span><b>${state.schoolsLoaded ? 'Loaded' : 'Ready'}</b></div>
    </div>
  `;
}

function buildSearchIndex() {
  const submarkets = state.features.map(feature => {
    const p = feature.properties;
    return {
      type: 'Submarket',
      icon: 'SM',
      id: p.SubmarketID,
      title: p.DisplayName,
      subtitle: `${p.Hub} • ${p.SubmarketID}`,
      keywords: `${p.SubmarketID} ${p.DisplayName} ${p.Hub} ${p.SourceNames || ''}`.toLowerCase(),
      feature
    };
  });
  const schools = state.schools.map(school => {
    const p = school.properties;
    return {
      type: 'School',
      icon: p.SchoolType === 'Elementary' ? 'E' : p.SchoolType === 'Middle' ? 'M' : p.SchoolType === 'High' ? 'H' : 'S',
      id: p.NCESSCH || p.NAME,
      title: p.NAME,
      subtitle: `${p.SchoolType} • ${p.CITY || ''}, ${p.STATE || ''}${p.SubmarketName ? ' • ' + p.SubmarketName : ''}`,
      keywords: `${p.NAME} ${p.CITY} ${p.STATE} ${p.NMCNTY} ${p.SchoolType} ${p.SubmarketID} ${p.SubmarketName}`.toLowerCase(),
      school
    };
  });
  state.searchIndex = submarkets.concat(schools);
}

function selectFeature(feature, layer) {
  state.selected = feature;
  state.submarketLayer.setStyle(styleFeature);
  const targetLayer = layer || findLayerForFeature(feature);
  if (targetLayer) {
    targetLayer.setStyle(styleFeature(feature));
    state.map.fitBounds(targetLayer.getBounds(), { padding: [50, 50], maxZoom: 10 });
  }
  renderSelected(feature.properties);
}

function findLayerForFeature(feature) {
  let match = null;
  state.submarketLayer.eachLayer(layer => {
    if (layer.feature.properties.SubmarketID === feature.properties.SubmarketID) match = layer;
  });
  return match;
}

function renderSelected(p) {
  const schools = state.schools.filter(s => s.properties.SubmarketID === p.SubmarketID);
  const counts = summarizeSchools(schools);
  const scoreSummary = scoreSummaryForSubmarket(p.DisplayName);
  document.getElementById('selectedPanel').classList.remove('empty');
  document.getElementById('selectedPanel').innerHTML = `
    <h3 class="selected-title">${p.DisplayName}</h3>
    <p class="selected-meta">${p.Hub}<span class="sep">•</span>${p.SubmarketID}</p>
    <div class="metric-grid">
      <div class="metric"><div class="label">Area</div><div class="value">${fmt(p.AreaSqMi, ' sq mi')}</div></div>
      <div class="metric"><div class="label">Acres</div><div class="value">${fmt(Math.round(Number(p.Acres || 0)))}</div></div>
      <div class="metric"><div class="label">School Score</div><div class="value">${fmtScore(scoreSummary.overall)}</div></div>
      <div class="metric"><div class="label">Median Income</div><div class="value">Pending</div></div>
    </div>
    ${renderSchoolCountCard(counts, scoreSummary)}
    <div class="focus-list">
      <div class="focus-row"><span>Boundaries</span><b>Verified</b></div>
      <div class="focus-row"><span>School Rating</span><b>${state.schoolsLoaded ? 'Loaded' : 'Ready'}</b></div>
      <div class="focus-row"><span>Demographics</span><b>Pending</b></div>
      <div class="focus-row"><span>Builder Competition</span><b>Pending</b></div>
    </div>
    <button class="profile-btn" type="button">View Market Profile <span>›</span></button>
  `;
}

function getSearchResults(q) {
  if (!q) return state.searchIndex.slice(0, 5);
  return state.searchIndex
    .filter(item => item.keywords.includes(q))
    .sort((a, b) => scoreSearch(b, q) - scoreSearch(a, q))
    .slice(0, 10);
}

function scoreSearch(item, q) {
  const title = item.title.toLowerCase();
  const id = String(item.id || '').toLowerCase();
  const subtitle = item.subtitle.toLowerCase();
  if (id === q || title === q) return 100;
  if (id.startsWith(q) || title.startsWith(q)) return 80;
  if (subtitle.includes(q)) return 55;
  if (title.includes(q)) return 50;
  return 10;
}

function renderSearchResults(query) {
  const box = document.getElementById('searchResults');
  const q = (query || '').trim().toLowerCase();
  const results = getSearchResults(q);
  const title = q ? 'Results' : 'Quick search';
  box.innerHTML = `<div class="results-title">${title}</div>` + results.map(item => `
    <button class="result-item" data-type="${item.type}" data-id="${item.id}">
      <span class="result-icon">${item.icon}</span>
      <span><b>${item.title}</b><small>${item.subtitle}</small></span>
    </button>
  `).join('') + `
    <div class="future-search-note">Search now includes submarkets${state.schoolsLoaded ? ' and schools' : ''}. Additional city, builder, and retail search will be added as those layers are loaded.</div>
  `;

  box.querySelectorAll('.result-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = state.searchIndex.find(x => x.type === btn.dataset.type && String(x.id) === btn.dataset.id);
      if (!item) return;
      if (item.type === 'School') selectSchool(item.school);
      else selectFeature(item.feature, findLayerForFeature(item.feature));
    });
  });
}

function performSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q) return;
  const results = getSearchResults(q);
  if (!results.length) return alert('No matching result found.');
  const first = results[0];
  if (first.type === 'School') selectSchool(first.school);
  else selectFeature(first.feature, findLayerForFeature(first.feature));
}

function resetView() {
  state.selected = null;
  if (state.submarketLayer) {
    state.submarketLayer.setStyle(styleFeature);
    state.map.fitBounds(state.submarketLayer.getBounds(), { padding: [24, 24] });
  }
  renderHomeSummary();
}

function schoolType(props) {
  const name = String(props.NAME || '').toLowerCase();
  if (name.includes('elementary') || name.includes('elem')) return 'Elementary';
  if (name.includes('middle') || name.includes('junior high') || name.includes('jr high')) return 'Middle';
  if (name.includes('high school') || name.endsWith(' high') || name.includes('senior high')) return 'High';
  return 'Other';
}

function schoolIcon(type) {
  const cls = type === 'Elementary' ? 'school-elementary' : type === 'Middle' ? 'school-middle' : type === 'High' ? 'school-high' : 'school-other';
  const letter = type === 'Elementary' ? 'E' : type === 'Middle' ? 'M' : type === 'High' ? 'H' : 'S';
  return L.divIcon({ className: '', html: `<div class="school-marker ${cls}">${letter}</div>`, iconSize: [18,18], iconAnchor: [9,9] });
}

function pointInRing(point, ring) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInFeature(point, feature) {
  const geom = feature.geometry;
  if (!geom) return false;
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  return polys.some(poly => pointInRing(point, poly[0]));
}

function assignSchoolToSubmarket(school) {
  const coords = school.geometry.coordinates;
  const match = state.features.find(f => pointInFeature(coords, f));
  if (match) {
    school.properties.SubmarketID = match.properties.SubmarketID;
    school.properties.SubmarketName = match.properties.DisplayName;
    school.properties.Hub = match.properties.Hub;
  } else {
    school.properties.SubmarketID = '';
    school.properties.SubmarketName = '';
    school.properties.Hub = '';
  }
}

function bboxForSubmarkets() {
  const pts = [];
  state.features.forEach(f => {
    const geom = f.geometry;
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    polys.forEach(poly => poly.forEach(ring => ring.forEach(pt => pts.push(pt))));
  });
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  return [Math.min(...xs)-0.15, Math.min(...ys)-0.15, Math.max(...xs)+0.15, Math.max(...ys)+0.15];
}

async function loadSchools() {
  if (state.schoolsLoaded) return;
  document.getElementById('schoolCountBadge').textContent = 'Loading...';
  const bbox = bboxForSubmarkets();
  const params = new URLSearchParams({
    where: "STATE in ('AL','FL')",
    outFields: 'NCESSCH,LEAID,NAME,STREET,CITY,STATE,ZIP,NMCNTY,LAT,LON,SCHOOLYEAR',
    geometry: bbox.join(','),
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson'
  });
  const url = `${NCES_URL}?${params.toString()}`;
  const data = await fetch(url).then(r => r.json());
  state.schools = (data.features || []).filter(f => f.geometry && f.geometry.coordinates).map(f => {
    f.properties.SchoolType = schoolType(f.properties);
    const ratingRec = ratingForSchoolName(f.properties.NAME);
    if (ratingRec) {
      f.properties.GreatSchoolsRating = ratingRec.Rating;
      f.properties.RatingSubmarket = ratingRec.Submarket;
      f.properties.RatingSchoolType = ratingRec.SchoolType;
    }
    assignSchoolToSubmarket(f);
    return f;
  });

  state.schoolLayer = L.geoJSON({ type: 'FeatureCollection', features: state.schools }, {
    pointToLayer: (feature, latlng) => L.marker(latlng, { icon: schoolIcon(feature.properties.SchoolType) }),
    onEachFeature: (feature, layer) => {
      const p = feature.properties;
      layer.bindPopup(`<div class="school-popup"><h3>${p.NAME}</h3><p><b>Type:</b> ${p.SchoolType}</p><p><b>GreatSchools:</b> ${p.GreatSchoolsRating ? p.GreatSchoolsRating + '/10' : 'Not loaded'}</p><p><b>Location:</b> ${p.CITY}, ${p.STATE}</p><p><b>County:</b> ${p.NMCNTY || ''}</p><p><b>Submarket:</b> ${p.SubmarketName || 'Outside submarket boundary'}</p><p><b>NCES ID:</b> ${p.NCESSCH || ''}</p></div>`);
      layer.on('click', () => selectSchool(feature, false));
      layer.on('dblclick', () => selectSchool(feature, true));
    }
  }).addTo(state.map);
  state.schoolsLoaded = true;
  buildSearchIndex();
  renderSearchResults(document.getElementById('searchInput').value || '');
  document.getElementById('schoolCountBadge').textContent = `${state.schools.length} loaded`;
  renderRelease(state.metadata);
  if (state.selected) renderSelected(state.selected.properties); else renderHomeSummary();
}

function selectSchool(school, shouldZoom = true) {
  if (!state.schoolsLoaded && !state.schoolLayer) return;
  if (!state.map.hasLayer(state.schoolLayer)) state.schoolLayer.addTo(state.map);
  document.getElementById('toggleSchools').checked = true;
  const coords = school.geometry.coordinates;
  if (shouldZoom) state.map.setView([coords[1], coords[0]], 13);
  let target = null;
  state.schoolLayer.eachLayer(layer => {
    if (layer.feature && layer.feature.properties.NCESSCH === school.properties.NCESSCH) target = layer;
  });
  if (target) target.openPopup();
}

function bindUI() {
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('appShell').classList.toggle('collapsed');
    setTimeout(() => state.map && state.map.invalidateSize(), 260);
  });
  document.getElementById('topSearchBtn').addEventListener('click', () => {
    document.getElementById('appShell').classList.remove('collapsed');
    setTimeout(() => {
      state.map && state.map.invalidateSize();
      document.getElementById('searchInput').focus();
    }, 250);
  });
  document.getElementById('searchBtn').addEventListener('click', performSearch);
  document.getElementById('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') performSearch(); });
  document.getElementById('searchInput').addEventListener('input', e => renderSearchResults(e.target.value));
  document.getElementById('resetBtn').addEventListener('click', resetView);
  document.getElementById('toggleSubmarkets').addEventListener('change', e => {
    if (e.target.checked) state.submarketLayer.addTo(state.map);
    else state.map.removeLayer(state.submarketLayer);
  });
  document.getElementById('toggleSchools').addEventListener('change', async e => {
    try {
      if (e.target.checked) {
        await loadSchools();
        if (state.schoolLayer && !state.map.hasLayer(state.schoolLayer)) state.schoolLayer.addTo(state.map);
        document.getElementById('mapThemeSelect').value = 'schools';
        setMapTheme('schools');
      } else if (state.schoolLayer) {
        state.map.removeLayer(state.schoolLayer);
        // When the school layer is turned off, return the map to the standard Hub View.
        document.getElementById('mapThemeSelect').value = 'hub';
        setMapTheme('hub');
      }
    } catch (err) {
      console.error(err);
      e.target.checked = false;
      document.getElementById('schoolCountBadge').textContent = 'Error';
      alert('The school layer could not be loaded from NCES. Try again later.');
    }
  });
  document.getElementById('mapThemeSelect').addEventListener('change', e => setMapTheme(e.target.value));
  document.getElementById('basemapSelect').addEventListener('change', e => {
    Object.values(state.basemaps).forEach(l => state.map.removeLayer(l));
    state.basemaps[e.target.value].addTo(state.map);
    state.basemaps[e.target.value].bringToBack();
  });
}

initMap();
bindUI();
loadData().catch(err => {
  console.error(err);
  document.getElementById('statusText').textContent = 'Error loading atlas data: ' + (err && err.message ? err.message : err);
});
