const map = L.map('map', { zoomControl: true });

const street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19,
  attribution: 'Tiles &copy; Esri'
});

const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxZoom: 17,
  attribution: '&copy; OpenTopoMap contributors'
});

const palette = [
  '#2f6f9f','#f28e2b','#59a14f','#e15759','#b07aa1','#9c755f','#edc948','#76b7b2',
  '#4e79a7','#ff9da7','#8cd17d','#bab0ac','#1b9e77','#d95f02','#7570b3','#e7298a',
  '#66a61e','#e6ab02','#a6761d','#666666'
];

let submarketLayer;
let labelLayer = L.layerGroup().addTo(map);
let schoolsLayer = L.layerGroup().addTo(map);
let featureIndex = [];

function colorFor(id) {
  const n = parseInt(String(id).replace('SM-', ''), 10) || 1;
  return palette[(n - 1) % palette.length];
}

function number(value, decimals = 0) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function renderDetails(props) {
  const html = `
    <div class="metric"><span>ID</span><span>${props.SubmarketID || '—'}</span></div>
    <div class="metric"><span>Name</span><span>${props.SubmarketName || '—'}</span></div>
    <div class="metric"><span>Area</span><span>${number(props.AreaSqMi, 2)} sq mi</span></div>
    <div class="metric"><span>Acres</span><span>${number(props.Acres, 0)}</span></div>
    <div class="metric"><span>Centroid</span><span>${props.CentroidLat || '—'}, ${props.CentroidLon || '—'}</span></div>
    <div class="metric"><span>Version</span><span>${props.Version || '—'}</span></div>
  `;
  document.getElementById('details').innerHTML = html;
}

function popupHtml(props) {
  return `
    <strong>${props.SubmarketID || ''} | ${props.SubmarketName || ''}</strong><br>
    Area: ${number(props.AreaSqMi, 2)} sq mi<br>
    Acres: ${number(props.Acres, 0)}<br>
    Version: ${props.Version || '—'}
  `;
}

async function loadSubmarkets() {
  const response = await fetch('data/submarkets.geojson');
  const data = await response.json();

  submarketLayer = L.geoJSON(data, {
    style: feature => ({
      color: '#243447',
      weight: 1.6,
      fillColor: colorFor(feature.properties.SubmarketID),
      fillOpacity: 0.36
    }),
    onEachFeature: (feature, layer) => {
      const p = feature.properties;
      layer.bindPopup(popupHtml(p));
      layer.on('click', () => renderDetails(p));
      featureIndex.push({ id: String(p.SubmarketID || '').toLowerCase(), name: String(p.SubmarketName || '').toLowerCase(), layer, props: p });

      const center = layer.getBounds().getCenter();
      L.marker(center, {
        interactive: false,
        icon: L.divIcon({ className: 'submarket-label', html: `${p.SubmarketID}<br>${p.SubmarketName}`, iconSize: null })
      }).addTo(labelLayer);
    }
  }).addTo(map);

  map.fitBounds(submarketLayer.getBounds(), { padding: [25, 25] });
}

async function loadSchools() {
  try {
    const response = await fetch('data/schools.geojson');
    const data = await response.json();
    if (!data.features || data.features.length === 0) return;
    L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 5, weight: 1, color: '#1f3145', fillOpacity: 0.8 }),
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        layer.bindPopup(`<strong>${p.SchoolName || 'School'}</strong><br>${p.SchoolType || ''}<br>${p.SubmarketName || ''}`);
      }
    }).addTo(schoolsLayer);
  } catch (e) {
    console.warn('No schools layer loaded yet.', e);
  }
}

function search() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q) return;
  const match = featureIndex.find(f => f.id.includes(q) || f.name.includes(q));
  if (!match) {
    alert('No matching submarket found.');
    return;
  }
  map.fitBounds(match.layer.getBounds(), { padding: [40, 40] });
  match.layer.openPopup();
  renderDetails(match.props);
}

document.getElementById('searchButton').addEventListener('click', search);
document.getElementById('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') search(); });

document.getElementById('toggleSubmarkets').addEventListener('change', e => {
  if (e.target.checked) submarketLayer.addTo(map); else map.removeLayer(submarketLayer);
});
document.getElementById('toggleLabels').addEventListener('change', e => {
  if (e.target.checked) labelLayer.addTo(map); else map.removeLayer(labelLayer);
});
document.getElementById('toggleSchools').addEventListener('change', e => {
  if (e.target.checked) schoolsLayer.addTo(map); else map.removeLayer(schoolsLayer);
});

L.control.layers({ 'Street': street, 'Satellite': satellite, 'Topo': topo }, {}, { collapsed: false }).addTo(map);
L.control.scale({ imperial: true, metric: true }).addTo(map);

loadSubmarkets();
loadSchools();
