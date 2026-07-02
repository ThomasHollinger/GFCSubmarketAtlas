function initMap(){
  GCSA.map=L.map('map',{zoomControl:true});
  GCSA.baseLayers.light=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(GCSA.map);
  GCSA.baseLayers.streets=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'});
  GCSA.baseLayers.topo=L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'&copy; OpenTopoMap contributors'});
  L.control.scale({imperial:true,metric:true}).addTo(GCSA.map);
}
function buildSubmarketLayer(){
  GCSA.submarketLayer=L.geoJSON({type:'FeatureCollection',features:GCSA.features},{
    style:styleSubmarket,
    onEachFeature:(feature,layer)=>{
      const p=feature.properties;
      layer.bindTooltip(p.DisplayName||p.SubmarketName,{className:'submarket-tooltip',sticky:true});
      layer.on('click',()=>selectSubmarket(p,layer));
      layer.on('mouseover',()=>layer.setStyle({weight:3}));
      layer.on('mouseout',()=>refreshSubmarketStyles());
      p._layer=layer;
    }
  }).addTo(GCSA.map);
  GCSA.map.fitBounds(GCSA.submarketLayer.getBounds(),{padding:[30,30]});
  renderLegend();
}
function selectSubmarket(p,layer){
  GCSA.selected=p;
  renderMarketSummary(p);
  refreshSubmarketStyles();
  if(layer) layer.bringToFront();
}
function resetView(){ if(GCSA.submarketLayer) GCSA.map.fitBounds(GCSA.submarketLayer.getBounds(),{padding:[30,30]}); }
function changeBasemap(key){ Object.values(GCSA.baseLayers).forEach(l=>{ if(GCSA.map.hasLayer(l)) GCSA.map.removeLayer(l);}); GCSA.baseLayers[key].addTo(GCSA.map); }
