const state = {
  map: null,
  submarketLayer: null,
  selected: null,
  features: [],
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
    fillColor: p.HubColor || p.HubBaseColor || '#8ea0ad',
    fillOpacity: selected ? 0.72 : 0.48
  };
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
    const d = L.DomUtil.create('div', 'legend');
    d.innerHTML = `<b>Submarket Hubs</b>` + hubOrder.map(hub => {
      const count = state.features.filter(f => f.properties.Hub === hub).length;
      return `<div class="legend-row"><i class="legend-swatch" style="background:${hubBaseColors[hub]}"></i><span>${hub}</span><small>${count}</small></div>`;
    }).join('');
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
    Updated: <b>${meta.releaseDate}</b>
  `;
  document.getElementById('statusText').textContent = `${meta.uniqueSubmarketsLoaded} submarkets • Hub color model active`;
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

function renderHubSummary(hub) {
  const items = state.features.filter(f => f.properties.Hub === hub);
  const acres = items.reduce((sum, f) => sum + Number(f.properties.Acres || 0), 0);
  const sqmi = items.reduce((sum, f) => sum + Number(f.properties.AreaSqMi || 0), 0);
  document.getElementById('selectedPanel').classList.remove('empty');
  document.getElementById('selectedPanel').innerHTML = `
    <h3 class="selected-title">${hub}</h3>
    <p class="selected-meta">${items.length} submarkets</p>
    <div class="metric-grid">
      <div class="metric"><div class="label">Area</div><div class="value">${fmt(Math.round(sqmi), ' sq mi')}</div></div>
      <div class="metric"><div class="label">Acres</div><div class="value">${fmt(Math.round(acres))}</div></div>
      <div class="metric"><div class="label">Schools</div><div class="value">Pending</div></div>
      <div class="metric"><div class="label">Builders</div><div class="value">Pending</div></div>
    </div>
    <div class="focus-list">
      ${items.map(f => `<div class="focus-row"><span>${f.properties.DisplayName}</span><b>${f.properties.SubmarketID}</b></div>`).join('')}
    </div>
  `;
}

function renderHomeSummary() {
  const total = state.features.length;
  document.getElementById('selectedPanel').classList.remove('empty');
  document.getElementById('selectedPanel').innerHTML = `
    <h3 class="selected-title">Enterprise Snapshot</h3>
    <p class="selected-meta">Foundation ready</p>
    <div class="metric-grid">
      <div class="metric"><div class="label">Submarkets</div><div class="value">${total}</div></div>
      <div class="metric"><div class="label">Hubs</div><div class="value">4</div></div>
      <div class="metric"><div class="label">Schools</div><div class="value">Pending</div></div>
      <div class="metric"><div class="label">Builders</div><div class="value">Pending</div></div>
    </div>
    <div class="focus-list">
      <div class="focus-row"><span>Boundaries</span><b>Verified</b></div>
      <div class="focus-row"><span>Hub color model</span><b>Active</b></div>
      <div class="focus-row"><span>Next release</span><b>Schools</b></div>
    </div>
  `;
}

function buildSearchIndex() {
  state.searchIndex = state.features.map(feature => {
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

  // Future releases will add schools, cities, builders, retail, and sites to this same index.
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
  document.getElementById('selectedPanel').classList.remove('empty');
  document.getElementById('selectedPanel').innerHTML = `
    <h3 class="selected-title">${p.DisplayName}</h3>
    <p class="selected-meta">${p.Hub}<span class="sep">•</span>${p.SubmarketID}</p>
    <div class="metric-grid">
      <div class="metric"><div class="label">Area</div><div class="value">${fmt(p.AreaSqMi, ' sq mi')}</div></div>
      <div class="metric"><div class="label">Acres</div><div class="value">${fmt(Math.round(Number(p.Acres || 0)))}</div></div>
      <div class="metric"><div class="label">Population</div><div class="value">Pending</div></div>
      <div class="metric"><div class="label">Median Income</div><div class="value">Pending</div></div>
    </div>
    <div class="focus-list">
      <div class="focus-row"><span>Boundaries</span><b>Verified</b></div>
      <div class="focus-row"><span>School Intelligence</span><b>Pending</b></div>
      <div class="focus-row"><span>Demographics</span><b>Pending</b></div>
      <div class="focus-row"><span>Builder Competition</span><b>Pending</b></div>
    </div>
    <button class="profile-btn" type="button">View Market Profile <span>›</span></button>
  `;
}

function performSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q) return;
  const results = getSearchResults(q);
  if (results.length) selectFeature(results[0].feature, findLayerForFeature(results[0].feature));
  else alert('No matching result found.');
}

function getSearchResults(q) {
  if (!q) return state.searchIndex.slice(0, 5);
  return state.searchIndex
    .filter(item => item.keywords.includes(q))
    .sort((a, b) => scoreSearch(b, q) - scoreSearch(a, q))
    .slice(0, 8);
}

function scoreSearch(item, q) {
  const title = item.title.toLowerCase();
  const id = item.id.toLowerCase();
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
    <button class="result-item" data-id="${item.id}">
      <span class="result-icon">${item.icon}</span>
      <span><b>${item.title}</b><small>${item.subtitle}</small></span>
    </button>
  `).join('') + `
    <div class="future-search-note">Search is ready to include schools, cities, builders, and retail as those layers are added.</div>
  `;

  box.querySelectorAll('.result-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = state.searchIndex.find(x => x.id === btn.dataset.id);
      if (item) selectFeature(item.feature, findLayerForFeature(item.feature));
    });
  });
}

function resetView() {
  state.selected = null;
  if (state.submarketLayer) {
    state.submarketLayer.setStyle(styleFeature);
    state.map.fitBounds(state.submarketLayer.getBounds(), { padding: [24, 24] });
  }
  renderHomeSummary();
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
  document.getElementById('statusText').textContent = 'Error loading atlas data';
});
