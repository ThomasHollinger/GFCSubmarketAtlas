(() => {
  const BALDWIN = {
    county: 'Baldwin County, AL',
    district: 'Baldwin County Public Schools',
    schoolYear: '2026-27',
    officialLocatorUrl: 'https://www.schoolsitelocator.com/apps/baldwin/',
    redistrictingUrl: 'https://www.bcbe.org/departments/communications/redistricting',
    arcgisAppId: 'cbc5aa49364a4a65ad17098ec6a33d6b',
    arcgisAppUrl: 'https://www.arcgis.com/apps/instant/lookup/index.html?appid=cbc5aa49364a4a65ad17098ec6a33d6b',
    sourceMaps: [
      { label: 'Daphne Elementary map', url: 'https://www.bcbe.org/fs/resource-manager/view/2158e114-a956-4601-a214-9e7522d3fde7' },
      { label: 'Belforest Elementary map', url: 'https://www.bcbe.org/fs/resource-manager/view/e4f89a4f-5b10-4da6-9b57-6f14bee7d095' },
      { label: 'Daphne East Elementary map', url: 'https://www.bcbe.org/fs/resource-manager/view/60a1d7a8-21d7-4f73-a8d2-dbbe8d62081c' },
      { label: 'Daphne Middle School map', url: 'https://www.bcbe.org/fs/resource-manager/view/7d5df28e-4382-47da-b1f2-2911ebe5584d' },
      { label: 'Jubilee Elementary map', url: 'https://www.bcbe.org/fs/resource-manager/view/b9cf8ee6-50fe-4574-b303-7f001fec8dd7' },
      { label: 'W. J. Carroll Middle map', url: 'https://www.bcbe.org/fs/resource-manager/view/1606694a-841b-4dd3-aa29-2a4cac5898b7' },
      { label: 'Loxley Elementary map', url: 'https://www.bcbe.org/fs/resource-manager/view/2a96e514-08ed-47e0-b135-6def0f5c8275' },
      { label: 'Elsanor Elementary map', url: 'https://www.bcbe.org/fs/resource-manager/view/b145c0cf-a671-49d8-8011-ad5782c927d1' },
      { label: 'Robertsdale Elementary map', url: 'https://www.bcbe.org/fs/resource-manager/view/e8eed95a-8f06-4eae-a6c3-fa0fb42faf57' },
      { label: 'Rosinton Elementary map', url: 'https://www.bcbe.org/fs/resource-manager/view/dc9949cf-0ee5-40c2-929b-fd446cc4b2b8' },
      { label: 'Silverhill Elementary map', url: 'https://www.bcbe.org/fs/resource-manager/view/b634f5c7-ca76-4d3b-9613-6fdaa8038d9e' },
      { label: 'Summerdale School map', url: 'https://www.bcbe.org/fs/resource-manager/view/4970da9d-06de-4bfe-92c1-b649b1f94f75' }
    ]
  };

  const state = {
    map: null,
    mapClickHandler: null,
    dockEl: null,
    resultsEl: null,
    statusEl: null,
    searchEl: null,
    sourceListEl: null,
    toggleEl: null,
    openExternalEl: null,
    currentBtn: null,
    resetBtn: null,
    searchBtn: null,
    marker: null,
    point: null,
    active: false,
    loading: false,
    loaded: false,
    sourceDiscoveryPromise: null,
    sourceData: null,
    boundaryLayers: [],
    boundaryFeatures: []
  };

  const GEO_SEARCH = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=';
  const ARCGIS_ITEM_DATA = `https://www.arcgis.com/sharing/rest/content/items/${BALDWIN.arcgisAppId}/data?f=json`;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setStatus(message, tone = 'neutral') {
    if (!state.statusEl) return;
    state.statusEl.textContent = message;
    state.statusEl.dataset.tone = tone;
  }

  function setResults(html) {
    if (state.resultsEl) state.resultsEl.innerHTML = html;
  }

  function pointInRing(point, ring) {
    if (!Array.isArray(ring) || ring.length < 3) return false;
    const x = point[0];
    const y = point[1];
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function pointInGeometry(point, geometry) {
    if (!geometry) return false;
    if (geometry.type === 'Polygon') {
      return geometry.coordinates.some(poly => pointInRing(point, poly[0]));
    }
    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.some(poly => poly.some(ring => pointInRing(point, ring)));
    }
    return false;
  }

  function esriPolygonToGeoJSONFeature(geometry, properties = {}) {
    if (!geometry) return null;
    if (geometry.rings) {
      return {
        type: 'Feature',
        properties,
        geometry: { type: 'Polygon', coordinates: geometry.rings }
      };
    }
    if (geometry.paths) {
      return {
        type: 'Feature',
        properties,
        geometry: { type: 'LineString', coordinates: geometry.paths[0] || [] }
      };
    }
    if (typeof geometry.x === 'number' && typeof geometry.y === 'number') {
      return {
        type: 'Feature',
        properties,
        geometry: { type: 'Point', coordinates: [geometry.x, geometry.y] }
      };
    }
    return null;
  }

  function normalizeTitle(value) {
    return String(value || '').toLowerCase();
  }

  function inferLevel(text) {
    const t = normalizeTitle(text);
    if (t.includes('elementary')) return 'Elementary';
    if (t.includes('middle')) return 'Middle';
    if (t.includes('high')) return 'High';
    return '';
  }

  function inferSchoolName(properties = {}, fallbackTitle = '') {
    const keys = [
      'SchoolName', 'SCHOOLNAME', 'NAME', 'School', 'school', 'Label', 'label',
      'DISPLAYNAME', 'DisplayName', 'ASSIGNED_SCH', 'School_Name'
    ];
    for (const key of keys) {
      if (properties[key]) return String(properties[key]).trim();
    }
    const level = inferLevel(fallbackTitle);
    if (level) return `${level} attendance area`;
    return fallbackTitle || 'Assigned area';
  }

  function collectStrings(value, bucket = new Set()) {
    if (!value) return bucket;
    if (typeof value === 'string') {
      bucket.add(value);
      return bucket;
    }
    if (Array.isArray(value)) {
      value.forEach(v => collectStrings(v, bucket));
      return bucket;
    }
    if (typeof value === 'object') {
      Object.values(value).forEach(v => collectStrings(v, bucket));
    }
    return bucket;
  }

  function urlsFromStrings(strings) {
    const urls = new Set();
    for (const s of strings) {
      const matches = String(s).match(/https?:\/\/[^\s"'<>]+?(?:FeatureServer|MapServer)(?:\/\d+)?(?:\/query)?(?:\?[^\s"'<>]*)?/gi);
      if (matches) matches.forEach(m => urls.add(m.replace(/[),.]+$/, '')));
    }
    return [...urls];
  }

  async function fetchJson(url) {
    const response = await fetch(url, { credentials: 'omit' });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.json();
  }

  async function discoverSourceData() {
    if (state.sourceDiscoveryPromise) return state.sourceDiscoveryPromise;
    state.sourceDiscoveryPromise = (async () => {
      try {
        const data = await fetchJson(ARCGIS_ITEM_DATA);
        state.sourceData = data;
        const strings = collectStrings(data);
        const urls = urlsFromStrings(strings);
        const candidateUrls = new Set(urls);

        const walker = (node) => {
          if (!node || typeof node !== 'object') return;
          if (Array.isArray(node)) {
            node.forEach(walker);
            return;
          }
          const maybeUrl = node.url || node.serviceUrl || node.layerUrl || node.itemUrl || node.itemURL;
          const title = node.title || node.name || node.label || node.id || '';
          if (maybeUrl && /(?:FeatureServer|MapServer)/i.test(String(maybeUrl))) candidateUrls.add(String(maybeUrl));
          if (title && /attendance|boundary|school/i.test(String(title))) {
            const fromUrl = node.url || node.serviceUrl || node.layerUrl;
            if (fromUrl && /(?:FeatureServer|MapServer)/i.test(String(fromUrl))) candidateUrls.add(String(fromUrl));
          }
          Object.values(node).forEach(walker);
        };
        walker(data);
        return { raw: data, candidateUrls: [...candidateUrls] };
      } catch (err) {
        console.warn('Baldwin locator source discovery failed:', err);
        return { raw: null, candidateUrls: [] };
      }
    })();
    return state.sourceDiscoveryPromise;
  }

  async function loadServiceMetadata(url) {
    const base = url.split('?')[0].replace(/\/+$/, '');
    try {
      return await fetchJson(`${base}?f=json`);
    } catch (err) {
      return null;
    }
  }

  function layerUrlFromService(baseUrl, layerId) {
    const clean = baseUrl.split('?')[0].replace(/\/+$/, '');
    return `${clean}/${layerId}`;
  }

  async function queryLayerFeatures(layerUrl) {
    const base = layerUrl.split('?')[0].replace(/\/+$/, '');
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      returnGeometry: 'true',
      outSR: '4326',
      f: 'json'
    });
    const data = await fetchJson(`${base}/query?${params.toString()}`);
    const features = (data.features || []).map(f => {
      const geometry = esriPolygonToGeoJSONFeature(f.geometry, f.attributes || {});
      return geometry ? { ...geometry, properties: f.attributes || {}, __source: base } : null;
    }).filter(Boolean);
    return { layerUrl: base, features };
  }

  async function loadBoundaryLayers() {
    if (state.loaded || state.loading) return;
    state.loading = true;
    setStatus('Searching the Baldwin County ArcGIS source for attendance boundary layers…');
    try {
      const discovery = await discoverSourceData();
      const metadataUrls = new Set();
      for (const candidate of discovery.candidateUrls) {
        const meta = await loadServiceMetadata(candidate);
        if (!meta) continue;
        if (Array.isArray(meta.layers) && meta.layers.length) {
          const levelLayers = meta.layers.filter(layer => /attendance|boundary|school/i.test(`${layer.name || ''} ${layer.title || ''}`));
          if (levelLayers.length) {
            levelLayers.forEach(layer => metadataUrls.add(layerUrlFromService(candidate, layer.id)));
          } else {
            meta.layers.forEach(layer => metadataUrls.add(layerUrlFromService(candidate, layer.id)));
          }
        } else if (/attendance|boundary|school/i.test(`${meta.name || ''} ${meta.serviceDescription || ''}`)) {
          metadataUrls.add(candidate.split('?')[0]);
        }
      }

      const candidateLayers = [];
      for (const layerUrl of metadataUrls) {
        try {
          const meta = await loadServiceMetadata(layerUrl);
          if (!meta) continue;
          const title = `${meta.name || meta.title || ''} ${meta.description || ''}`;
          const level = inferLevel(title);
          if (!level && !/attendance|boundary|school/i.test(title)) continue;
          candidateLayers.push({ layerUrl, title, level: level || inferLevel(layerUrl) || '' });
        } catch (err) {
          console.warn('Failed metadata inspection for', layerUrl, err);
        }
      }

      const uniqueByLevel = new Map();
      for (const layer of candidateLayers) {
        if (!uniqueByLevel.has(layer.level)) uniqueByLevel.set(layer.level, layer);
      }

      const nextLayers = [];
      for (const [level, layer] of uniqueByLevel.entries()) {
        try {
          setStatus(`Loading ${level || 'boundary'} polygons from Baldwin County sources…`);
          const result = await queryLayerFeatures(layer.layerUrl);
          if (result.features.length) {
            nextLayers.push({ ...layer, features: result.features });
          }
        } catch (err) {
          console.warn('Layer query failed', layer, err);
        }
      }

      state.boundaryLayers = nextLayers;
      state.boundaryFeatures = nextLayers.flatMap(layer => layer.features.map(feature => ({ ...feature, __level: layer.level, __layerTitle: layer.title })));
      state.loaded = state.boundaryFeatures.length > 0;
      if (state.loaded) {
        setStatus(`Loaded ${state.boundaryLayers.length} boundary layer(s) for Baldwin County. Drop a pin or search an address.`);
      } else {
        setStatus('No public polygon service was exposed yet. The source pack is ready while we wire county boundary data.', 'warning');
      }
      renderSourceList();
      if (state.point) {
        const matches = findMatchesForPoint(state.point.lng, state.point.lat);
        renderLookupResult({ address: state.point.label || 'Selected point' }, matches);
      }
    } finally {
      state.loading = false;
    }
  }

  function renderSourceList() {
    if (!state.sourceListEl) return;
    const links = BALDWIN.sourceMaps.map(m => `<a href="${m.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(m.label)}</a>`).join('');
    state.sourceListEl.innerHTML = `
      <h3>Official Baldwin source pack</h3>
      <p>Redistricting maps and the district’s locator are available here while we finish wiring the county lookup.</p>
      <div class="locator-source-list">
        ${links}
        <a href="${BALDWIN.arcgisAppUrl}" target="_blank" rel="noopener noreferrer">Open ArcGIS zone lookup</a>
        <a href="${BALDWIN.officialLocatorUrl}" target="_blank" rel="noopener noreferrer">Open SchoolSite Locator</a>
        <a href="${BALDWIN.redistrictingUrl}" target="_blank" rel="noopener noreferrer">View BCBE redistricting page</a>
      </div>`;
  }

  function geocodeAddress(query) {
    const url = `${GEO_SEARCH}${encodeURIComponent(query)}&countrycodes=us&viewbox=-88.3,31.1,-87.0,30.0&bounded=1`;
    return fetch(url, { credentials: 'omit' })
      .then(r => r.json())
      .then(rows => rows && rows.length ? rows : []);
  }

  function formatAddressDisplay(location) {
    const parts = [location.display_name || '', location.address?.city || '', location.address?.state || '']
      .map(v => String(v || '').trim())
      .filter(Boolean);
    return parts.length ? parts.join(' • ') : (location.display_name || 'Selected location');
  }

  function schoolRatingForName(schoolName, level = '') {
    if (!window.schoolRatingRecords || typeof window.ratingForSchoolName !== 'function') return null;
    const fakeProps = { NAME: schoolName, CITY: '', STATE: '', NMCNTY: BALDWIN.county };
    const rec = window.ratingForSchoolName(fakeProps);
    if (rec && (!level || inferLevel(rec.SchoolType) === level || rec.SchoolType === level)) return rec;
    return rec;
  }

  function renderLookupResult(point, matches, title = 'Assigned schools') {
    const address = point?.address || 'Selected point';
    if (!matches.length) {
      setResults(`
        <div class="baldwin-locator-result">
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml(address)}</p>
          <div class="result-grid">
            <div class="baldwin-locator-row"><strong>Status</strong><span>No public boundary polygon was matched yet.</span></div>
          </div>
        </div>
      `);
      return;
    }

    const rows = matches.map(match => {
      const rating = schoolRatingForName(match.schoolName, match.level);
      const ratingLabel = rating && rating.Rating ? `${rating.Rating}/10` : 'Not rated';
      const note = rating && rating.Excluded ? ` • ${rating.ExcludedReason || 'Excluded from average'}` : '';
      return `<div class="baldwin-locator-row"><strong>${escapeHtml(match.level || 'School')}</strong><span>${escapeHtml(match.schoolName)}${ratingLabel ? ` • ${escapeHtml(ratingLabel)}` : ''}${escapeHtml(note)}</span></div>`;
    }).join('');

    setResults(`
      <div class="baldwin-locator-result">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(address)}</p>
        <div class="result-grid">
          ${rows}
        </div>
      </div>
    `);
  }

  function findMatchesForPoint(lng, lat) {
    const point = [lng, lat];
    const byLevel = new Map();
    for (const feature of state.boundaryFeatures) {
      if (!pointInGeometry(point, feature.geometry)) continue;
      const level = feature.__level || inferLevel(feature.__layerTitle) || inferLevel(feature.properties?.NAME) || 'Boundary';
      const name = inferSchoolName(feature.properties, feature.__layerTitle);
      if (!byLevel.has(level)) {
        byLevel.set(level, { level, schoolName: name, feature });
      }
    }

    const preferredOrder = ['Elementary', 'Middle', 'High'];
    const out = [];
    for (const level of preferredOrder) {
      if (byLevel.has(level)) out.push(byLevel.get(level));
    }
    for (const [level, value] of byLevel.entries()) {
      if (!preferredOrder.includes(level)) out.push(value);
    }
    return out;
  }

  function setPoint(lng, lat, label = '') {
    state.point = { lng, lat, label };
    if (state.marker) state.marker.remove();
    if (state.map && window.L) {
      state.marker = L.circleMarker([lat, lng], {
        radius: 10,
        weight: 3,
        color: '#1e40af',
        fillColor: '#3b82f6',
        fillOpacity: 0.4
      }).addTo(state.map);
      state.map.panTo([lat, lng]);
    }
    const matches = findMatchesForPoint(lng, lat);
    renderLookupResult({ address: label || `Point: ${lat.toFixed(5)}, ${lng.toFixed(5)}` }, matches);
  }

  async function searchAddress() {
    const q = (state.searchEl?.value || '').trim();
    if (!q) {
      setStatus('Type an address or place name first.', 'warning');
      return;
    }
    if (!state.active) setActive(true);
    setStatus('Geocoding address…');
    try {
      const results = await geocodeAddress(q);
      if (!results.length) {
        setStatus('No geocoded match found. Try a more specific address.', 'warning');
        return;
      }
      const first = results[0];
      const lng = parseFloat(first.lon);
      const lat = parseFloat(first.lat);
      setStatus(`Matched ${formatAddressDisplay(first)}. Looking up school zones…`);
      setPoint(lng, lat, formatAddressDisplay(first));
    } catch (err) {
      console.error(err);
      setStatus('Address search failed. Check the connection and try again.', 'warning');
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus('Current location is not available in this browser.', 'warning');
      return;
    }
    if (!state.active) setActive(true);
    setStatus('Waiting for your device location…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { longitude, latitude } = pos.coords;
        setStatus('Using current location…');
        setPoint(longitude, latitude, 'Current location');
      },
      () => setStatus('Location request was denied or timed out.', 'warning'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  function resetLocator() {
    state.point = null;
    if (state.marker) {
      state.marker.remove();
      state.marker = null;
    }
    setStatus('Turn on School Locator mode, then click the atlas map or search an address.');
    setResults('');
  }

  function attachMap(map) {
    state.map = map;
    if (!state.map || !window.L) return;
    if (state.mapClickHandler) state.map.off('click', state.mapClickHandler);
    state.mapClickHandler = e => {
      if (!state.active) return;
      setStatus('Resolving the clicked location…');
      setPoint(e.latlng.lng, e.latlng.lat, 'Clicked point');
      if (!state.loaded) {
        setStatus('The boundary source is still loading. Once it is ready, this click will resolve the assigned schools.', 'warning');
      }
    };
    state.map.on('click', state.mapClickHandler);
  }

  function setActive(next) {
    state.active = !!next;
    if (state.toggleEl) state.toggleEl.checked = state.active;
    if (state.dockEl) state.dockEl.hidden = !state.active;
    if (state.active) {
      if (!state.loaded && !state.loading) loadBoundaryLayers();
      setStatus(state.loaded
        ? 'Click the atlas map or search an address to find assigned Baldwin County schools.'
        : 'Loading Baldwin County boundary sources… click the map once they are ready.');
      if (state.map) setTimeout(() => state.map.invalidateSize(), 80);
    } else {
      setStatus('School Locator is off. Turn it on to use Baldwin County assignment lookup.');
    }
  }

  function openOfficialSite() {
    window.open(BALDWIN.officialLocatorUrl, '_blank', 'noopener,noreferrer');
  }

  async function reload() {
    state.loading = false;
    state.loaded = false;
    state.sourceDiscoveryPromise = null;
    state.sourceData = null;
    state.boundaryLayers = [];
    state.boundaryFeatures = [];
    setStatus('Reloading Baldwin County sources…');
    setResults('');
    if (state.active) await loadBoundaryLayers();
  }

  function wireEvents() {
    state.dockEl = document.getElementById('baldwinLocatorDock');
    state.resultsEl = document.getElementById('baldwinLocatorResults');
    state.statusEl = document.getElementById('baldwinLocatorStatus');
    state.searchEl = document.getElementById('baldwinLocatorSearch');
    state.sourceListEl = document.getElementById('baldwinLocatorSourceList');
    state.toggleEl = document.getElementById('toggleBaldwinLocator');
    state.openExternalEl = document.getElementById('locatorOpenExternalBtn');
    state.currentBtn = document.getElementById('baldwinLocatorCurrentBtn');
    state.resetBtn = document.getElementById('baldwinLocatorResetBtn');
    state.searchBtn = document.getElementById('baldwinLocatorSearchBtn');
    const dockClose = document.getElementById('baldwinLocatorDockClose');

    if (state.toggleEl) {
      state.toggleEl.addEventListener('change', e => setActive(e.target.checked));
    }
    if (state.openExternalEl) state.openExternalEl.addEventListener('click', openOfficialSite);
    if (state.currentBtn) state.currentBtn.addEventListener('click', useCurrentLocation);
    if (state.resetBtn) state.resetBtn.addEventListener('click', resetLocator);
    if (state.searchBtn) state.searchBtn.addEventListener('click', searchAddress);
    if (dockClose) dockClose.addEventListener('click', () => setActive(false));
    if (state.searchEl) {
      state.searchEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') searchAddress();
      });
    }

    renderSourceList();
    if (state.toggleEl?.checked) setActive(true);
    else setStatus('Turn on School Locator mode, then click the atlas map or search an address.');
  }

  function init() {
    wireEvents();
    renderSourceList();
  }

  window.GCSchoolLocator = {
    init,
    attachMap,
    setActive,
    openOfficialSite,
    reload,
    open: () => setActive(true),
    close: () => setActive(false),
    isOpen: () => state.active
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
