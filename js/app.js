async function boot(){
  initMap(); await loadAtlasData(); buildSubmarketLayer(); renderHubList(); renderQuickSearch(); updateSearchIndex(); loadSchools(false).catch(e=>console.warn('School background load failed',e));
  document.getElementById('statusText').textContent=`${GCSA.features.length} submarkets • School layer ready`;
  document.getElementById('sidebarToggle').addEventListener('click',()=>document.getElementById('appShell').classList.toggle('panel-collapsed'));
  document.getElementById('mapThemeSelect').addEventListener('change',e=>{ GCSA.mapTheme=e.target.value; refreshSubmarketStyles(); });
  document.getElementById('toggleSubmarkets').addEventListener('change',e=>{ if(e.target.checked) GCSA.submarketLayer.addTo(GCSA.map); else GCSA.map.removeLayer(GCSA.submarketLayer); });
  document.getElementById('toggleSchools').addEventListener('change',e=>setSchoolsVisible(e.target.checked));
  document.getElementById('searchBtn').addEventListener('click',searchAtlas); document.getElementById('topSearchBtn').addEventListener('click',()=>document.getElementById('searchInput').focus()); document.getElementById('searchInput').addEventListener('input',searchAtlas); document.getElementById('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')searchAtlas();});
  document.getElementById('resetBtn').addEventListener('click',resetView); document.getElementById('basemapSelect').addEventListener('change',e=>changeBasemap(e.target.value)); document.getElementById('exportMissingRatingsBtn').addEventListener('click',exportMissingRatings);
}
boot().catch(err=>{ console.error(err); document.getElementById('statusText').textContent='Error loading atlas data'; });
