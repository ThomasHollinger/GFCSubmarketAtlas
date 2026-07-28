async function loadAtlasData(){
  const [submarkets, meta, ratingsText] = await Promise.all([
    fetch('data/submarkets.geojson').then(r=>r.json()),
    fetch('data/metadata.json').then(r=>r.json()).catch(()=>({})),
    fetch('data/school_ratings_master.csv').then(r=>r.text()).catch(()=>'')
  ]);
  GCSA.features = submarkets.features || [];
  GCSA.ratings = csvParse(ratingsText).map(r=>({
    County:r.County||'', City:r.City||'', SchoolName:r.SchoolName||r['School Name']||'', SchoolType:r.SchoolType||r['School Type']||'', Rating:Number(r.Rating||r['GreatSchools Rating (1-10)']||r['GreatSchools Rating (1–10)']||'')
  })).filter(r=>r.SchoolName && !Number.isNaN(r.Rating));
  GCSA.meta = meta;
  document.getElementById('releasePanel').innerHTML = `Version: <b>${GCSA_CONFIG.version}</b><br>Submarkets loaded: <b>${GCSA.features.length}</b><br>Updated: <b>${GCSA_CONFIG.updated}</b>`;
}
function ratingForSchoolName(name){
  const key = normName(name);
  let m = GCSA.ratings.find(r=>normName(r.SchoolName)===key);
  if(!m) m = GCSA.ratings.find(r=>key.includes(normName(r.SchoolName)) || normName(r.SchoolName).includes(key));
  return m || null;
}
