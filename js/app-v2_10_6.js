const state = {
  map: null,
  submarketLayer: null,
  submarketNumberLayer: null,
  schoolLayer: null,
  poiLayer: null,
  poiMarkerIndex: new Map(),
  lifestyleLayer: null,
  lifestyleMarkerIndex: new Map(),
  lifestyleFilters: { Golf: true, Tennis: true, Pickleball: true, Fitness: true, Center: true, Other: true },
  lifestyle: [],
  lifestyleLoaded: false,
  lifestyleLoadPromise: null,
  retailFilters: { Restaurant: true, Grocery: true, Retail: true, Convenience: true, NationalBrandsOnly: false },
  retailSearchQuery: '',
  builderFilters: { SingleFamily: true, Townhomes: false, Active: true, Future: true, BuiltOut: false, BuilderNames: {}, TierNames: {} },
  builderTierConfig: {
    Tier0: { key: 'Tier0', label: 'Tier 0', min: 0, max: 220000 },
    Tier1: { key: 'Tier1', label: 'Tier 1', min: 220001, max: 270000 },
    Tier2: { key: 'Tier2', label: 'Tier 2', min: 270001, max: 336000 },
    Tier3: { key: 'Tier3', label: 'Tier 3', min: 336001, max: 450000 },
    Tier4Plus: { key: 'Tier4Plus', label: 'Tier 4+', min: 450001, max: null }
  },
  builderLayer: null,
  builderMarkerIndex: new Map(),
  newDeals: [],
  newDealsLayer: null,
  newDealsAddMode: false,
  newDealsFirebaseReady: false,
  newDealsUser: null,
  newDealsUnsubscribe: null,
  newDealsCloudLoaded: false,
  newDealsListExpanded: false,
  healthcareLayer: null,
  selected: null,
  features: [],
  schools: [],
  schoolsLoaded: false,
  schoolFilters: {
    types: { Elementary: true, Middle: true, High: true, Other: true },
    ratings: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true, '8': true, '9': true, '10': true, 'Not Rated': true }
  },
  pois: [],
  poisLoaded: false,
  poisLoadPromise: null,
  healthcare: [],
  healthcareLoaded: false,
  healthcareSummary: null,
  returnTheme: 'hub',
  builders: [],
  buildersLoaded: false,
  buildersLoadPromise: null,
  builderSummary: null,
  builderExportKml: null,
  builderExportKmlCount: 0,
  demographics: null,
  demographicsLoaded: false,
  demographicsBlockGroups: [],
  demographicsBlockGroupsLoaded: false,
  acsMeanIncomeLoaded: false,
  acsMeanIncomeAttempted: false,
  acsMeanIncomeLoadPromise: null,
  basemaps: {},
  referenceOverlays: {},
  searchIndex: [],
  metadata: null,
  detailOpen: {},
  marketSnapshot: { active: false, radiusMiles: null, awaitingPoint: false, busy: false, pendingCenter: null, radiusLayer: null, radiusCircle: null, promptMarker: null },
  marketQuickview: { active: false, loaded: false, data: null, submarket: 'Central Mobile', radiusMiles: null, awaitingPoint: false, busy: false, pendingCenter: null, radiusLayer: null, radiusCircle: null, promptMarker: null },
  quickviewBlocks: [],
  quickviewBlocksLoaded: false
};

const hubOrder = ['Alabama Hub', 'Pensacola Hub', 'Panama City Hub', 'Growth Markets'];
const hubBaseColors = {
  'Alabama Hub': '#F4A261',
  'Pensacola Hub': '#4EA3D8',
  'Panama City Hub': '#8CCB6E',
  'Growth Markets': '#A7A7A7'
};

function normalizeSubmarketName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const submarketNumberLookup = Object.freeze({
  [normalizeSubmarketName('South Mobile')]: 1,
  [normalizeSubmarketName('Central Mobile')]: 2,
  [normalizeSubmarketName('North Mobile')]: 3,
  [normalizeSubmarketName('North Mobile / Saraland')]: 3,
  [normalizeSubmarketName('North Baldwin')]: 4,
  [normalizeSubmarketName('Central Baldwin')]: 5,
  [normalizeSubmarketName('West Baldwin')]: 6,
  [normalizeSubmarketName('South Baldwin')]: 7,
  [normalizeSubmarketName('South Baldiwn')]: 7,
  [normalizeSubmarketName('Pensacola')]: 8,
  [normalizeSubmarketName('Cantonment')]: 9,
  [normalizeSubmarketName('Pace')]: 10,
  [normalizeSubmarketName('Milton')]: 11,
  [normalizeSubmarketName('Pensacola Beaches')]: 12,
  [normalizeSubmarketName('Fort Walton')]: 13,
  [normalizeSubmarketName('Crestview')]: 14,
  [normalizeSubmarketName('Laurel Hill')]: 15,
  [normalizeSubmarketName('Defuniak Springs')]: 16,
  [normalizeSubmarketName('DeFuniak Springs')]: 16,
  [normalizeSubmarketName('Freeport')]: 17,
  [normalizeSubmarketName('Walton and Bay Beaches')]: 18,
  [normalizeSubmarketName('Panama City')]: 19,
  [normalizeSubmarketName('Marianna')]: 20
});

function submarketNumberForFeature(feature) {
  const p = feature && feature.properties ? feature.properties : {};
  const candidates = [p.DisplayName, p.SubmarketName, p.SubmarketID];
  for (const candidate of candidates) {
    const key = normalizeSubmarketName(candidate);
    if (Object.prototype.hasOwnProperty.call(submarketNumberLookup, key)) {
      return submarketNumberLookup[key];
    }
  }
  return null;
}

function submarketNumberAnchorForFeature(feature, layer) {
  const p = feature && feature.properties ? feature.properties : {};
  const labelPoint = Array.isArray(p.LabelPoint) && p.LabelPoint.length === 2 ? p.LabelPoint : null;
  if (labelPoint) {
    return L.latLng(labelPoint[1], labelPoint[0]);
  }
  const centroidLon = Number(p.CentroidLon);
  const centroidLat = Number(p.CentroidLat);
  if (Number.isFinite(centroidLon) && Number.isFinite(centroidLat)) {
    return L.latLng(centroidLat, centroidLon);
  }
  try {
    const center = layer && layer.getBounds ? layer.getBounds().getCenter() : null;
    return center ? L.latLng(center.lat, center.lng) : null;
  } catch (err) {
    return null;
  }
}

const overlayThemes = new Set(['schools', 'retail', 'healthcare', 'builders', 'lifestyle']);

const NCES_URL = 'https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_GEOCODE_PUBLICSCH_2425/MapServer/0/query';
const OVERPASS_URLS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const tierOneBrands = ['publix','walmart','walmart supercenter','aldi','costco',"sam's club",'sams club','bj wholesale','bjs wholesale',"bj\'s wholesale club",'target','winn-dixie','rouses','piggly wiggly','whole foods','the fresh market',"trader joe's",'chick-fil-a','starbucks','chipotle','panera','panera bread','texas roadhouse','cracker barrel','home depot','the home depot',"lowe's",'academy sports','academy sports + outdoors','bass pro shops',"kohl's",'tj maxx','marshalls','hobby lobby'];
const BUILDER_TIER_STORAGE_KEY = 'gcsa-builder-tier-state-v1';
const BUILDER_TIER_ORDER = ['Tier0', 'Tier1', 'Tier2', 'Tier3', 'Tier4Plus'];
const MARKET_SNAPSHOT_RADII = [1, 3, 5, 10];
const MARKET_QUICKVIEW_DEFAULT_SUBMARKET = 'Central Mobile';
const ACS_MEAN_INCOME_CACHE_KEY = 'gcsa-acs-mean-income-2017-2021-v1';
const ACS_MEAN_INCOME_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const ACS_MEAN_INCOME_SOURCE_URL = 'https://www2.census.gov/programs-surveys/acs/summary_file/2021/table-based-SF/data/5YRData/acsdt5y2021-b19025.dat';

const schoolRatingRecords = [
{"County":"Escambia County","City":"Atmore","SchoolName":"A C Moore Primary School","SchoolType":"Elementary","Rating":null,"NCESID":"10135002667","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Lynn Haven","SchoolName":"A. Crawford Mosley High School","SchoolType":"High","Rating":6,"NCESID":"120009000067","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City Beach","SchoolName":"A. Gary Walsingham Academy","SchoolType":"Other","Rating":null,"NCESID":"120009008970","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"A. K. Suter Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"120051000811","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Acceleration Day And Evening Academy","SchoolType":"Other","Rating":null,"NCESID":"10019702432","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Acceleration Preparatory Academy","SchoolType":"Other","Rating":null,"NCESID":"10019702527","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Achieve Academy At Mcmillian","SchoolType":"Other","Rating":null,"NCESID":"120051004345","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Valparaiso","SchoolName":"Addie R. Lewis School","SchoolType":"Middle","Rating":7,"NCESID":"120138001353","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Adjudicated Youth Facility","SchoolType":"Other","Rating":null,"NCESID":"120138003881","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Chickasaw","SchoolName":"Alabama Destinations Career Academy","SchoolType":"Other","Rating":null,"NCESID":"10018802514","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Semmes","SchoolName":"Allentown Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"10237000572","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Irvington","SchoolName":"Alma Bryant High School","SchoolType":"High","Rating":5,"NCESID":"10237000989","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Calhoun County","City":"Altha","SchoolName":"Altha Public School","SchoolType":"High","Rating":5,"NCESID":"120021000293","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Amikids Maritime Academy","SchoolType":"Other","Rating":null,"NCESID":"120009008901","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Irvington","SchoolName":"Anna F Booth Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"10237001559","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Annette P. Edwins Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"120138001320","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Antioch Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"120138003209","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Franklin County","City":"Apalachicola","SchoolName":"Apalachicola Bay Charter School","SchoolType":"Middle","Rating":6,"NCESID":"120057003708","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Liberty County","City":"Bristol","SchoolName":"Apalachicola Forest Youth Academy","SchoolType":"Other","Rating":null,"NCESID":"120117004171","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Augusta Evans School","SchoolType":"Other","Rating":null,"NCESID":"10237001618","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Avalon Middle School","SchoolType":"Middle","Rating":7,"NCESID":"120165003664","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Bagdad Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"120165001815","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Baker High School","SchoolType":"High","Rating":7,"NCESID":"10237000899","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Baker","SchoolName":"Baker School","SchoolType":"High","Rating":7,"NCESID":"120138001321","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Bay Minette","SchoolName":"Baldwin County High School","SchoolType":"High","Rating":8,"NCESID":"10027001810","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Daphne","SchoolName":"Baldwin County Virtual School","SchoolType":"Other","Rating":null,"NCESID":"10027002443","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Baldwin County","City":"Loxley","SchoolName":"Baldwin Preparatory Academy","SchoolType":"Other","Rating":null,"NCESID":"10027002701","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Barton Academy For Advanced World Studies","SchoolType":"Other","Rating":null,"NCESID":"10237002509","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"Bay Haven Charter Academy","SchoolType":"Other","Rating":null,"NCESID":"120009003676","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"Bay Haven Charter Middle School","SchoolType":"Middle","Rating":10,"NCESID":"120009005429","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Bay High School","SchoolType":"High","Rating":4,"NCESID":"120009000039","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Bay Minette","SchoolName":"Bay Minette Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"10027001708","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Bay Minette","SchoolName":"Bay Minette Middle School","SchoolType":"Middle","Rating":8,"NCESID":"10027001859","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Bay Regional Juvenile Detention Center","SchoolType":"Other","Rating":null,"NCESID":"120009003289","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Santa Rosa","SchoolName":"Bay School","SchoolType":"Other","Rating":null,"NCESID":"120198008863","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"Bay Virtual Franchise","SchoolType":"Other","Rating":null,"NCESID":"120009007830","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"Bay Virtual Instruction Program","SchoolType":"Other","Rating":null,"NCESID":"120009007771","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"Bay Virtual Instruction Program (District Provided)","SchoolType":"Other","Rating":null,"NCESID":"120009008742","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Baldwin County","City":"Daphne","SchoolName":"Belforest Elementary School","SchoolType":"Elementary","Rating":10,"NCESID":"10027002492","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Bellview Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"120051000776","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Bellview Middle School","SchoolType":"Middle","Rating":2,"NCESID":"120051000777","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Ben C Rain High School","SchoolType":"High","Rating":2,"NCESID":"10237000898","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Bennett C Russell Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120165005376","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Bernice J Causey Middle School","SchoolType":"Middle","Rating":9,"NCESID":"10237001435","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Berryhill Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120165001814","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Holmes County","City":"Bonifay","SchoolName":"Bethlehem High School","SchoolType":"High","Rating":4,"NCESID":"120090001047","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Beulah Academy Of Science","SchoolType":"Other","Rating":null,"NCESID":"120051003366","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Beulah Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"120051002164","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Beulah Middle School","SchoolType":"Middle","Rating":5,"NCESID":"120051008511","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Calhoun County","City":"Blountstown","SchoolName":"Blountstown Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120021000294","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Calhoun County","City":"Blountstown","SchoolName":"Blountstown High School","SchoolType":"High","Rating":6,"NCESID":"120021000290","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Blue Angels Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120051004346","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Niceville","SchoolName":"Bluewater Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"120138002774","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Bob Sikes Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120138001322","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Holmes County","City":"Bonifay","SchoolName":"Bonifay K-8 School","SchoolType":"Middle","Rating":5,"NCESID":"120090008604","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Booker T Washington Middle School","SchoolType":"Middle","Rating":2,"NCESID":"10237000901","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Century","SchoolName":"Bratt Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120051000780","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City Beach","SchoolName":"Breakfast Point Academy","SchoolType":"Other","Rating":null,"NCESID":"120009007518","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Grand Bay","SchoolName":"Breitling Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"10237002083","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Brentwood Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"120051000781","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Brewton","SchoolName":"Brewton Elementary School","SchoolType":"Elementary","Rating":10,"NCESID":"10045000214","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Brewton","SchoolName":"Brewton Middle School","SchoolType":"Middle","Rating":10,"NCESID":"10045000215","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Brown Barge Middle School","SchoolType":"Middle","Rating":9,"NCESID":"120051000824","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Burns Middle School","SchoolType":"Middle","Rating":2,"NCESID":"10237000990","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Century","SchoolName":"Byrneville Elementary School Inc.","SchoolType":"Elementary","Rating":4,"NCESID":"120051003847","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"C. A. Weis Elementary School","SchoolType":"Elementary","Rating":2,"NCESID":"120051002819","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Niceville","SchoolName":"C. W. Ruckel Middle School","SchoolType":"Middle","Rating":9,"NCESID":"120138001327","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mount Vernon","SchoolName":"Calcedeaver Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"10237000904","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Calhoun County","City":"Blountstown","SchoolName":"Calhoun Virtual Franchise","SchoolType":"Other","Rating":null,"NCESID":"120021008042","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Calhoun County","City":"Blountstown","SchoolName":"Calhoun Virtual Instruction Program","SchoolType":"Other","Rating":null,"NCESID":"120021007757","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"Callaway Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120009000042","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Calloway Smith Middle School","SchoolType":"Middle","Rating":4,"NCESID":"10237000992","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Capstone Academy","SchoolType":"Other","Rating":null,"NCESID":"120051004173","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Calhoun County","City":"Clarksville","SchoolName":"Carr Elementary & Middle School","SchoolType":"Middle","Rating":8,"NCESID":"120021000292","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Cedar Grove Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120009000041","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Jackson County","City":"Marianna","SchoolName":"Center For The Advancement Of Children'S Learning","SchoolType":"Other","Rating":null,"NCESID":"120096010864","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Baldwin County","City":"Robertsdale","SchoolName":"Central Baldwin Middle School","SchoolType":"Middle","Rating":8,"NCESID":"10027000162","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Central High School","SchoolType":"High","Rating":2,"NCESID":"120009008471","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Central School","SchoolType":"High","Rating":3,"NCESID":"120165001813","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Robertsdale","SchoolName":"Cf Taylor Alternative School","SchoolType":"Other","Rating":null,"NCESID":"10027002180","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Prichard","SchoolName":"Cf Vigor High School","SchoolType":"High","Rating":1,"NCESID":"10237000964","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Chastang Fournier Middle School","SchoolType":"Middle","Rating":2,"NCESID":"10237000963","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Gadsden County","City":"Chattahoochee","SchoolName":"Chattahoochee Elementary School","SchoolType":"Elementary","Rating":2,"NCESID":"120060000855","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Chautauqua Charter School","SchoolType":"Other","Rating":null,"NCESID":"120009005431","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Chickasaw","SchoolName":"Chickasaw City Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"10018802193","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Chickasaw","SchoolName":"Chickasaw City High School","SchoolType":"High","Rating":1,"NCESID":"10018802194","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Chickasaw","SchoolName":"Chickasaw Intermediate School","SchoolType":"Middle","Rating":null,"NCESID":"10018802709","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Chickasaw","SchoolName":"Chickasaw Middle School","SchoolType":"Middle","Rating":2,"NCESID":"10018802428","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Washington County","City":"Chipley","SchoolName":"Chipley High School","SchoolType":"High","Rating":4,"NCESID":"120201002027","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Choctawhatchee Senior High School","SchoolType":"High","Rating":4,"NCESID":"120138001347","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Jay","SchoolName":"Chumuckla Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120165001816","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Citronelle","SchoolName":"Citronelle Center For Advanced Technology","SchoolType":"Other","Rating":null,"NCESID":"10237002477","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Citronelle","SchoolName":"Citronelle High School","SchoolType":"High","Rating":4,"NCESID":"10237000906","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Cl Scarborough Model Middle School","SchoolType":"Middle","Rating":7,"NCESID":"10237000954","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Clark Shaw Magnet School","SchoolType":"Middle","Rating":10,"NCESID":"10237000931","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Shalimar","SchoolName":"Clifford Meigs Middle School","SchoolType":"Middle","Rating":7,"NCESID":"120138001324","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Coastal Connections Academy","SchoolType":"Other","Rating":null,"NCESID":"120165008959","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Niceville","SchoolName":"Collegiate High School At Northwest Florida State College","SchoolType":"High","Rating":9,"NCESID":"120138004392","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Eight Mile","SchoolName":"Collins Rhodes Elementary School","SchoolType":"Elementary","Rating":2,"NCESID":"10237000919","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Continuous Learning Center","SchoolType":"Other","Rating":null,"NCESID":"10237001686","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Miramar","SchoolName":"Contracted Residential Services","SchoolType":"Other","Rating":null,"NCESID":"120138008737","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Grand Bay","SchoolName":"Cora Castlen Elementary","SchoolType":"Elementary","Rating":9,"NCESID":"10237000924","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Cordova Park Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"120051000790","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Jackson County","City":"Cottondale","SchoolName":"Cottondale Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120096001076","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Jackson County","City":"Cottondale","SchoolName":"Cottondale High School","SchoolType":"High","Rating":6,"NCESID":"120096001075","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Houston County","City":"Cottonwood","SchoolName":"Cottonwood Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"10177002508","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Houston County","City":"Cottonwood","SchoolName":"Cottonwood High School","SchoolType":"High","Rating":6,"NCESID":"10177000612","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"County Administrative Annex","SchoolType":"Other","Rating":null,"NCESID":"120051002602","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Covenant Academy Of Mobile","SchoolType":"Other","Rating":null,"NCESID":"10358302559","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Crestview High School","SchoolType":"High","Rating":5,"NCESID":"120138001348","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Crestview Youth Academy","SchoolType":"Other","Rating":null,"NCESID":"120138003446","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Crestview Youth Academy (Non Secure)","SchoolType":"Other","Rating":null,"NCESID":"120138008864","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Baldwin County","City":"Daphne","SchoolName":"Daphne East Elementary School","SchoolType":"Elementary","Rating":10,"NCESID":"10027002072","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Daphne","SchoolName":"Daphne Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"10027001709","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Daphne","SchoolName":"Daphne High School","SchoolType":"High","Rating":10,"NCESID":"10027001759","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Daphne","SchoolName":"Daphne Middle School","SchoolType":"Middle","Rating":6,"NCESID":"10027000013","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Dauphin Island","SchoolName":"Dauphin Island Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10237000911","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Davidson Middle School","SchoolType":"Middle","Rating":8,"NCESID":"120138003210","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Dawes Intermediate School","SchoolType":"Middle","Rating":9,"NCESID":"10237002168","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Deane Bozeman School","SchoolType":"High","Rating":6,"NCESID":"120009004304","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Deer Point Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120009007649","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Bay Minette","SchoolName":"Delta Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"10027001783","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Denton Magnet School Of Technology","SchoolType":"Other","Rating":null,"NCESID":"10237000897","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Destin","SchoolName":"Destin Elementary School","SchoolType":"Elementary","Rating":10,"NCESID":"120138001328","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Destin","SchoolName":"Destin High School","SchoolType":"High","Rating":4,"NCESID":"120138008938","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Destin","SchoolName":"Destin Middle School","SchoolType":"Middle","Rating":9,"NCESID":"120138003211","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Jackson County","City":"Marianna","SchoolName":"Dist Wide Gifted Program","SchoolType":"Other","Rating":null,"NCESID":"120096007913","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Marianna","SchoolName":"Dist Wide Homebound Program","SchoolType":"Other","Rating":null,"NCESID":"120096001080","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Irvington","SchoolName":"Dixon Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"10237000914","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Dr Robert W Gilliard Elementary","SchoolType":"Elementary","Rating":8,"NCESID":"10237001595","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Dunbar Creative Performing Arts","SchoolType":"Other","Rating":null,"NCESID":"10237000916","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Santa Rosa Beach","SchoolName":"Dune Lakes Elementary School","SchoolType":"Elementary","Rating":null,"NCESID":"120198004144","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Santa Rosa County","City":"Gulf Breeze","SchoolName":"East Bay K-8 School","SchoolType":"Middle","Rating":7,"NCESID":"120165008721","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"East Milton Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120165001817","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Eglin Afb","SchoolName":"Eglin Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"120138001330","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Eichold Mertz School Of Math And Science","SchoolType":"Other","Rating":null,"NCESID":"10237002208","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Baldwin County","City":"Elberta","SchoolName":"Elberta Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10027000625","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Elberta","SchoolName":"Elberta High School","SchoolType":"High","Rating":8,"NCESID":"10027000057","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Elberta","SchoolName":"Elberta Middle School","SchoolType":"Middle","Rating":9,"NCESID":"10027002490","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Elizabeth Fonde Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10237000920","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Elliott Point Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"120138001343","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Robertsdale","SchoolName":"Elsanor School","SchoolType":"Elementary","Rating":9,"NCESID":"10027000058","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Elsie Collier Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"10237001436","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Emerald Coast Career Institute N","SchoolType":"Other","Rating":null,"NCESID":"120138005628","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Santa Rosa Beach","SchoolName":"Emerald Coast Middle School","SchoolType":"Middle","Rating":8,"NCESID":"120198004175","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"Emerald Coast Technical College","SchoolType":"Other","Rating":null,"NCESID":"120198002644","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Ensley Elementary School","SchoolType":"Elementary","Rating":2,"NCESID":"120051000793","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Er Dickson Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"10237000913","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Walnut Hill","SchoolName":"Ernest Ward Middle School","SchoolType":"Middle","Rating":5,"NCESID":"120051000813","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Erwin Craighead Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10237001775","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Escambia Boys' Base","SchoolType":"Other","Rating":null,"NCESID":"120051002601","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Brewton","SchoolName":"Escambia Brewton Career Technical Center","SchoolType":"Other","Rating":null,"NCESID":"10135000841","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Escambia County Acceleration Academy","SchoolType":"Other","Rating":null,"NCESID":"120051009008","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Flomaton","SchoolName":"Escambia County Alternative School","SchoolType":"Other","Rating":null,"NCESID":"10135000840","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Atmore","SchoolName":"Escambia County High School","SchoolType":"High","Rating":1,"NCESID":"10135000484","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Atmore","SchoolName":"Escambia County Middle School","SchoolType":"Middle","Rating":7,"NCESID":"10135000485","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Escambia High School","SchoolType":"High","Rating":3,"NCESID":"120051000794","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Escambia Juvenile Detention","SchoolType":"Other","Rating":null,"NCESID":"120051002304","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Escambia Sch. Dist. Jail Prog.","SchoolType":"Other","Rating":null,"NCESID":"120051003704","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Escambia Virtual Academy Franchise","SchoolType":"Other","Rating":null,"NCESID":"120051007672","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Escambia Virtual Instruction Program","SchoolType":"Other","Rating":null,"NCESID":"120051007541","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Escambia Virtual Instructional Program (District Provided)","SchoolType":"Other","Rating":null,"NCESID":"120051008310","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Escambia Westgate Center","SchoolType":"Other","Rating":null,"NCESID":"120051002431","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Ese Development Center","SchoolType":"Other","Rating":null,"NCESID":"120165003666","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Evening Educational Options","SchoolType":"Other","Rating":null,"NCESID":"10237002177","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"Exceptional Student Education","SchoolType":"Other","Rating":null,"NCESID":"120009002034","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Baldwin County","City":"Fairhope","SchoolName":"Fairhope East Elementary","SchoolType":"Elementary","Rating":10,"NCESID":"10027001710","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Fairhope","SchoolName":"Fairhope High School","SchoolType":"High","Rating":9,"NCESID":"10027000100","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Fairhope","SchoolName":"Fairhope Middle School","SchoolType":"Middle","Rating":10,"NCESID":"10027000059","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Fairhope","SchoolName":"Fairhope West Elementary","SchoolType":"Elementary","Rating":10,"NCESID":"10027001711","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Ferry Pass Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"120051000795","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Ferry Pass Middle School","SchoolType":"Middle","Rating":4,"NCESID":"120051000796","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Flomaton","SchoolName":"Flomaton Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"10135001504","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Flomaton","SchoolName":"Flomaton High School","SchoolType":"High","Rating":6,"NCESID":"10135000487","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Covington County","City":"Florala","SchoolName":"Florala High School","SchoolType":"High","Rating":3,"NCESID":"10093000360","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Foley","SchoolName":"Florence B Mathis Elementary","SchoolType":"Elementary","Rating":3,"NCESID":"10027001713","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Florence Howard Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10237001030","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Floretta P Carson Visual And Performing Arts Academy","SchoolType":"Other","Rating":null,"NCESID":"10358602690","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Mary Esther","SchoolName":"Florosa Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"120138001350","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Foley","SchoolName":"Foley Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"10027001712","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Foley","SchoolName":"Foley High School","SchoolType":"High","Rating":7,"NCESID":"10027001784","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Foley","SchoolName":"Foley Middle School","SchoolType":"Middle","Rating":4,"NCESID":"10027000060","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Forest Hill Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10237000922","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Fort Walton Beach High School","SchoolType":"High","Rating":5,"NCESID":"120138001351","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Franklin County","City":"Eastpoint","SchoolName":"Franklin County Learning Center","SchoolType":"Other","Rating":null,"NCESID":"120057000846","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Franklin County","City":"Eastpoint","SchoolName":"Franklin County School","SchoolType":"High","Rating":2,"NCESID":"120057000845","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Franklin County","City":"Eastpoint","SchoolName":"Franklin Virtual Franchise-Paec Flvs","SchoolType":"Other","Rating":null,"NCESID":"120057008815","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Franklin County","City":"Eastpoint","SchoolName":"Franklin Virtual Instruction Program","SchoolType":"Other","Rating":null,"NCESID":"120057007934","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Franklin County","City":"East Point","SchoolName":"Franklin Virtual Instruction Program","SchoolType":"Other","Rating":null,"NCESID":"120057008923","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Freeport","SchoolName":"Freeport Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120198002541","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Walton County","City":"Freeport","SchoolName":"Freeport Learning Center","SchoolType":"Other","Rating":null,"NCESID":"120198010896","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Freeport","SchoolName":"Freeport Middle School","SchoolType":"Middle","Rating":7,"NCESID":"120198003524","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Walton County","City":"Freeport","SchoolName":"Freeport Senior High School","SchoolType":"High","Rating":8,"NCESID":"120198002022","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Gadsden County","City":"Quincy","SchoolName":"Gadsden Elementary Magnet School","SchoolType":"Elementary","Rating":7,"NCESID":"120060000853","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Hartford","SchoolName":"Geneva County Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"10166001791","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Hartford","SchoolName":"Geneva County High School","SchoolType":"High","Rating":6,"NCESID":"10166000570","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Hartford","SchoolName":"Geneva County Middle School","SchoolType":"Middle","Rating":10,"NCESID":"10166001792","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Geneva","SchoolName":"Geneva High School","SchoolType":"High","Rating":6,"NCESID":"10164000567","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Geneva","SchoolName":"Geneva Middle School","SchoolType":"Middle","Rating":10,"NCESID":"10164001788","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Geneva","SchoolName":"Geneva Regional Career Technical Center","SchoolType":"Other","Rating":null,"NCESID":"10166002418","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Irvington","SchoolName":"George H Bryant Vocational Agricultural Center","SchoolType":"Other","Rating":null,"NCESID":"10237001086","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"George Hall Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"10237001556","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"George Stone Technical College","SchoolType":"Other","Rating":null,"NCESID":"120051000836","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Global Learning Academy","SchoolType":"Other","Rating":null,"NCESID":"120051007989","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Goodwill Easter Seal Center Special Child","SchoolType":"Other","Rating":null,"NCESID":"10237001597","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Graceville","SchoolName":"Graceville School","SchoolType":"High","Rating":3,"NCESID":"120096001078","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Holmes County","City":"Bonifay","SchoolName":"Graduation Assistance Program","SchoolType":"Other","Rating":null,"NCESID":"120090007853","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Grand Bay","SchoolName":"Grand Bay Middle School","SchoolType":"Middle","Rating":5,"NCESID":"10237000938","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Jackson County","City":"Grand Ridge","SchoolName":"Grand Ridge School","SchoolType":"Middle","Rating":5,"NCESID":"120096001072","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Prichard","SchoolName":"Grant Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"10237001028","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Gadsden County","City":"Quincy","SchoolName":"Greensboro Elementary School","SchoolType":"Elementary","Rating":2,"NCESID":"120060000854","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Gulf County","City":"Port St Joe","SchoolName":"Gulf Apex","SchoolType":"Other","Rating":null,"NCESID":"120069008924","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Santa Rosa County","City":"Gulf Breeze","SchoolName":"Gulf Breeze Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"120165001819","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Gulf Breeze","SchoolName":"Gulf Breeze High School","SchoolType":"High","Rating":7,"NCESID":"120165001821","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Gulf Breeze","SchoolName":"Gulf Breeze Middle School","SchoolType":"Middle","Rating":8,"NCESID":"120165001820","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Gulf Shores","SchoolName":"Gulf Shores Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"10020202469","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Gulf Shores","SchoolName":"Gulf Shores High School","SchoolType":"High","Rating":8,"NCESID":"10020202473","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Gulf Shores","SchoolName":"Gulf Shores Middle School","SchoolType":"Middle","Rating":10,"NCESID":"10020202471","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Gulf County","City":"Port St Joe","SchoolName":"Gulf Virtual Franchise","SchoolType":"Other","Rating":null,"NCESID":"120069007970","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Hellen Caro Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"120051002746","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"High Road","SchoolType":"High","Rating":1,"NCESID":"120165008958","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Hiland Park Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"120009000047","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Hl Sonny Callahan School For The Deaf And Blind","SchoolType":"Other","Rating":null,"NCESID":"10237001689","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Hobbs Middle School","SchoolType":"Middle","Rating":5,"NCESID":"120165001832","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Navarre","SchoolName":"Holley-Navarre Intermediate","SchoolType":"Other","Rating":null,"NCESID":"120165001834","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Santa Rosa County","City":"Navarre","SchoolName":"Holley-Navarre Middle School","SchoolType":"Middle","Rating":7,"NCESID":"120165002670","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Navarre","SchoolName":"Holley-Navarre Primary","SchoolType":"Elementary","Rating":null,"NCESID":"120165005375","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Hollingers Island Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"10237000927","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Holloway Elementary","SchoolType":"Elementary","Rating":5,"NCESID":"10237001617","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Holmes County","City":"Bonifay","SchoolName":"Holmes County High School","SchoolType":"High","Rating":3,"NCESID":"120090001044","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Holmes County","City":"Bonifay","SchoolName":"Holmes Virtual-District Instruction Program","SchoolType":"Other","Rating":null,"NCESID":"120090008313","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Holmes County","City":"Bonifay","SchoolName":"Holmes Virtual-Franchise Flvs","SchoolType":"Other","Rating":null,"NCESID":"120090008039","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Holmes County","City":"Bonifay","SchoolName":"Holmes Virtual-Vendor Instruction Program","SchoolType":"Other","Rating":null,"NCESID":"120090007694","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Hope Horizon At Judy Andrews Center","SchoolType":"Other","Rating":null,"NCESID":"120051002306","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Marianna","SchoolName":"Hope School","SchoolType":"Other","Rating":null,"NCESID":"120096001073","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Liberty County","City":"Hosford","SchoolName":"Hosford Elementary Junior High School","SchoolType":"High","Rating":5,"NCESID":"120117001207","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Hospital & Homebound","SchoolType":"Other","Rating":null,"NCESID":"120051002305","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Hospital Homebound","SchoolType":"Other","Rating":null,"NCESID":"120165008716","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Hutchens Elementary School","SchoolType":"Elementary","Rating":10,"NCESID":"10237001414","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City Beach","SchoolName":"Hutchison Beach Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"120009000040","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Eight Mile","SchoolName":"Indian Springs Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"10237000928","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Wilmer","SchoolName":"J E Turner Elementary","SchoolType":"Elementary","Rating":8,"NCESID":"10237001516","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Fairhope","SchoolName":"J Larry Newton School","SchoolType":"Elementary","Rating":9,"NCESID":"10027000660","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"J. H. Workman Middle School","SchoolType":"Middle","Rating":4,"NCESID":"120051000819","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Cantonment","SchoolName":"J. M. Tate Senior High School","SchoolType":"High","Rating":5,"NCESID":"120051000812","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City Beach","SchoolName":"J.R. Arnold High School","SchoolType":"High","Rating":4,"NCESID":"120009004305","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Jackie Harris Preparatory Academy","SchoolType":"Other","Rating":null,"NCESID":"120051003705","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Marianna","SchoolName":"Jackson Alternative School","SchoolType":"Other","Rating":null,"NCESID":"120096007169","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Marianna","SchoolName":"Jackson County Early Childhood Center","SchoolType":"Other","Rating":null,"NCESID":"120096003192","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Marianna","SchoolName":"Jackson County Home/Night Instruction","SchoolType":"Other","Rating":null,"NCESID":"120096010863","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Marianna","SchoolName":"Jackson County Jail Instruction","SchoolType":"Other","Rating":null,"NCESID":"120096010862","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Marianna","SchoolName":"Jackson County Teen Parenting Program","SchoolType":"Other","Rating":null,"NCESID":"120096010865","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Marianna","SchoolName":"Jackson Virtual Franchise","SchoolType":"Other","Rating":null,"NCESID":"120096008478","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Marianna","SchoolName":"Jackson Virtual Instruction Program","SchoolType":"Other","Rating":null,"NCESID":"120096007662","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Marianna","SchoolName":"Jackson Virtual School","SchoolType":"Other","Rating":null,"NCESID":"120096009017","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Niceville","SchoolName":"James E Plew Elementary School","SchoolType":"Elementary","Rating":10,"NCESID":"120138001346","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Jay","SchoolName":"Jay Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"120165001824","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Jay","SchoolName":"Jay High School","SchoolType":"High","Rating":4,"NCESID":"120165001823","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Jackson County","City":"Marianna","SchoolName":"Jcsb Tapp Contract Site","SchoolType":"Other","Rating":null,"NCESID":"120096008675","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Cantonment","SchoolName":"Jim Allen Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"120051000774","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Jim C. Bailey Middle School","SchoolType":"Middle","Rating":5,"NCESID":"120051002994","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Jinks Middle School","SchoolType":"Middle","Rating":2,"NCESID":"120009000048","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"John L Leflore Magnet School","SchoolType":"High","Rating":2,"NCESID":"10237000962","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"John Will Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10237000930","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Just 4 Development Laboratory","SchoolType":"Other","Rating":null,"NCESID":"10237001799","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Washington County","City":"Chipley","SchoolName":"Kate M. Smith Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120201002028","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Kate Shepard Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10237000956","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Theodore","SchoolName":"Katherine H Hankins Middle School","SchoolType":"Middle","Rating":5,"NCESID":"10237000961","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Kenwood Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"120138001349","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Cantonment","SchoolName":"Kingsfield Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"120051008560","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"L. D. Mcarthur Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"120051000840","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Laurel Hill","SchoolName":"Laurel Hill School","SchoolType":"High","Rating":4,"NCESID":"120138001332","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Learning Academy Of Santa Rosa","SchoolType":"Other","Rating":null,"NCESID":"120165003505","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Leinkauf Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10237000932","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Liberty County","City":"Bristol","SchoolName":"Liberty County High School","SchoolType":"High","Rating":3,"NCESID":"120117001205","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Liberty County","City":"Bristol","SchoolName":"Liberty Early Learning Center","SchoolType":"Other","Rating":null,"NCESID":"120117003730","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Liberty County","City":"Bristol","SchoolName":"Liberty K12 Virtual","SchoolType":"Other","Rating":null,"NCESID":"120117008854","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Liberty County","City":"Bristol","SchoolName":"Liberty Virtual Franchise","SchoolType":"Other","Rating":null,"NCESID":"120117007958","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Liberty County","City":"Bristol","SchoolName":"Liberty Virtual Instruction Program","SchoolType":"Other","Rating":null,"NCESID":"120117007739","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Liberty County","City":"Bristol","SchoolName":"Liberty Wilderness Crossroads","SchoolType":"Other","Rating":null,"NCESID":"120117003423","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Lillie B Williamson High School","SchoolType":"High","Rating":1,"NCESID":"10237000969","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Lincoln Park Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"120051002063","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Liza Jackson Preparatory School","SchoolType":"Elementary","Rating":10,"NCESID":"120138003735","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Longleaf Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"120051000838","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Shalimar","SchoolName":"Longwood Elementary School","SchoolType":"Elementary","Rating":2,"NCESID":"120138001354","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Citronelle","SchoolName":"Lott Middle School","SchoolType":"Middle","Rating":4,"NCESID":"10237001438","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Loxley","SchoolName":"Loxley Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"10027001714","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Lucille Moore Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120009000045","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Niceville","SchoolName":"Lula J. Edge Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"120138001329","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Lynn Haven","SchoolName":"Lynn Haven Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120009000049","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Walton County","City":"Inlet Beach","SchoolName":"Magnet Innovation Center","SchoolType":"Other","Rating":null,"NCESID":"120198010829","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Baldwin County","City":"Foley","SchoolName":"Magnolia School","SchoolType":"Elementary","Rating":8,"NCESID":"10027000648","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Jackson County","City":"Malone","SchoolName":"Malone School","SchoolType":"High","Rating":6,"NCESID":"120096001069","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Margaret K. Lewis In Millville","SchoolType":"Other","Rating":null,"NCESID":"120009002037","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Marianna","SchoolName":"Marianna High School","SchoolType":"High","Rating":4,"NCESID":"120096001065","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Jackson County","City":"Marianna","SchoolName":"Marianna K-8 School","SchoolType":"Middle","Rating":5,"NCESID":"120096008933","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Martin Luther King Middle School","SchoolType":"Middle","Rating":4,"NCESID":"120165001833","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Mary B Austin Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"10237000896","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Mary Esther","SchoolName":"Mary Esther Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120138001345","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Semmes","SchoolName":"Mary G Montgomery High School","SchoolType":"High","Rating":4,"NCESID":"10237000934","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Theodore","SchoolName":"Mary W Burroughs Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"10237000935","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Maryvale Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"10237000936","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Eight Mile","SchoolName":"Mattie T Blount High School","SchoolType":"High","Rating":2,"NCESID":"10237000900","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"Maude Saunders Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120198002026","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Max Bruner Junior Middle School","SchoolType":"Middle","Rating":7,"NCESID":"120138001352","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Citronelle","SchoolName":"Mc David Jones Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"10237001437","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Meadowlake Elementary","SchoolType":"Elementary","Rating":4,"NCESID":"10237001619","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Merriam Cherry Street Elementary","SchoolType":"Elementary","Rating":5,"NCESID":"120009000043","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Merritt Brown Middle School","SchoolType":"Middle","Rating":4,"NCESID":"120009002589","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Milton High School","SchoolType":"High","Rating":4,"NCESID":"120165001826","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Mobile County Training Middle School","SchoolType":"Middle","Rating":3,"NCESID":"10237000939","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Mobile Mental Health Center","SchoolType":"Other","Rating":null,"NCESID":"10237001605","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Molino","SchoolName":"Molino Park Elementary","SchoolType":"Elementary","Rating":9,"NCESID":"120051004081","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Montclair Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"120051000801","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Morningside Elementary School","SchoolType":"Elementary","Rating":2,"NCESID":"10237000940","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"Mossy Head School","SchoolType":"Elementary","Rating":8,"NCESID":"120198007324","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Lynn Haven","SchoolName":"Mowat Middle School","SchoolType":"Middle","Rating":5,"NCESID":"120009000063","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Geneva","SchoolName":"Mulkey Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10164000568","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Murphy High School","SchoolType":"High","Rating":4,"NCESID":"10237000942","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Myrtle Grove Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"120051000802","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"N. B. Cook Elementary School","SchoolType":"Elementary","Rating":10,"NCESID":"120051003581","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Theodore","SchoolName":"Nan Gray Davis Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"10237000910","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Navarre","SchoolName":"Navarre High School","SchoolType":"High","Rating":5,"NCESID":"120165003122","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Navy Point Elementary School","SchoolType":"Elementary","Rating":2,"NCESID":"120051000803","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"New Horizons Learning Center","SchoolType":"Other","Rating":null,"NCESID":"120009003147","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Niceville","SchoolName":"Niceville Senior High School","SchoolType":"High","Rating":7,"NCESID":"120138001333","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Bay Minette","SchoolName":"North Baldwin Center For Technology","SchoolType":"Other","Rating":null,"NCESID":"10027000664","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"North Bay Haven Career Academy","SchoolType":"Other","Rating":null,"NCESID":"120009007903","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"North Bay Haven Charter Academy Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120009007896","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"North Bay Haven Charter Academy Middle School","SchoolType":"Middle","Rating":10,"NCESID":"120009007791","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Axis","SchoolName":"North Mobile County Middle School","SchoolType":"Middle","Rating":8,"NCESID":"10237002136","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Northside Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120009000065","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Century","SchoolName":"Northview High School","SchoolType":"High","Rating":3,"NCESID":"120051002995","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Northwest Florida Ballet Academie","SchoolType":"Other","Rating":null,"NCESID":"120138003880","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Northwood Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120138001334","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"O. J. Semmes Elementary School","SchoolType":"Elementary","Rating":1,"NCESID":"120051000809","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Oakcrest Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"120051000804","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Okaloosa Academy","SchoolType":"Other","Rating":null,"NCESID":"120138003088","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Okaloosa Online Non Franchised","SchoolType":"Other","Rating":null,"NCESID":"120138008315","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Okaloosa Regional Detention","SchoolType":"Other","Rating":null,"NCESID":"120138003621","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Valparaiso","SchoolName":"Okaloosa Stemm Center","SchoolType":"Other","Rating":null,"NCESID":"120138008072","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Okaloosa Technical College","SchoolType":"Other","Rating":null,"NCESID":"120138002443","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Okaloosa Virtual Franchise","SchoolType":"Other","Rating":null,"NCESID":"120138007168","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Okaloosa Virtual Instruction Program","SchoolType":"Other","Rating":null,"NCESID":"120138007675","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Okaloosa Youth Academy","SchoolType":"Other","Rating":null,"NCESID":"120138003447","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Old Shell Road Magnet School","SchoolType":"Other","Rating":null,"NCESID":"10237000943","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Olive J Dodge Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"10237000915","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Orange Beach","SchoolName":"Orange Beach Elementary School","SchoolType":"Elementary","Rating":null,"NCESID":"10358102554","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Baldwin County","City":"Orange Beach","SchoolName":"Orange Beach Middle High School","SchoolType":"High","Rating":null,"NCESID":"10358102555","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Orchard Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"10237000944","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Gulf Breeze","SchoolName":"Oriole Beach Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"120165002258","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Orourke Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"10237001813","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Oscar Patterson Academy","SchoolType":"Other","Rating":null,"NCESID":"120009010622","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Santa Rosa County","City":"Pace","SchoolName":"Pace High School","SchoolType":"High","Rating":6,"NCESID":"120165001830","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Pace Program","SchoolType":"Other","Rating":null,"NCESID":"120051003057","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"Palm Bay Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120009008597","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Palm Bay Preparatory Academy 6-12","SchoolType":"Other","Rating":null,"NCESID":"120009007472","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"Parker Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120009000052","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City Beach","SchoolName":"Patronis Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"120009002976","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Walton County","City":"Paxton","SchoolName":"Paxton School","SchoolType":"High","Rating":5,"NCESID":"120198002020","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Pace","SchoolName":"Pea Ridge Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120165002097","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Irvington","SchoolName":"Pearl Haskew Elementary","SchoolType":"Elementary","Rating":4,"NCESID":"10237001620","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola Beach","SchoolName":"Pensacola Beach Elementary School Inc","SchoolType":"Elementary","Rating":null,"NCESID":"120051003848","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Pensacola High School","SchoolType":"High","Rating":4,"NCESID":"120051000805","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Pensacola State Charter Academy","SchoolType":"Other","Rating":null,"NCESID":"120051010638","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Baldwin County","City":"Perdido","SchoolName":"Perdido Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"10027000062","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Bayou La Batre","SchoolName":"Peter F Alba Middle School","SchoolType":"Middle","Rating":8,"NCESID":"10237000895","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Phillips Preparatory Middle School","SchoolType":"Middle","Rating":8,"NCESID":"10237000947","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Pillans Middle School","SchoolType":"Middle","Rating":2,"NCESID":"10237000946","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Pine Forest High School","SchoolType":"High","Rating":2,"NCESID":"120051000837","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Bay Minette","SchoolName":"Pine Grove Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10027001715","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Pine Meadow Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"120051000806","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Pleasant Grove Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"120051000807","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Covington County","City":"Andalusia","SchoolName":"Pleasant Home School","SchoolType":"Other","Rating":null,"NCESID":"10093000361","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Brewton","SchoolName":"Pollard Mc Call Junior High School","SchoolType":"High","Rating":6,"NCESID":"10135000489","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Holmes County","City":"Ponce De Leon","SchoolName":"Ponce De Leon Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120090002071","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Holmes County","City":"Ponce De Leon","SchoolName":"Ponce De Leon High School","SchoolType":"High","Rating":5,"NCESID":"120090001049","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Holmes County","City":"Graceville","SchoolName":"Poplar Springs High School","SchoolType":"High","Rating":5,"NCESID":"120090001046","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Gulf County","City":"Port St Joe","SchoolName":"Port St. Joe Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"120069000867","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Gulf County","City":"Port St Joe","SchoolName":"Port St. Joe High School","SchoolType":"High","Rating":4,"NCESID":"120069000868","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Gulf County","City":"Port St Joe","SchoolName":"Prek Ese","SchoolType":"Other","Rating":null,"NCESID":"120069008466","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"R. C. Lipscomb Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120051000439","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Atmore","SchoolName":"Rachel Patterson Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10135001661","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Radford M Locklin Technical College","SchoolType":"Other","Rating":null,"NCESID":"120165002257","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Cantonment","SchoolName":"Ransom Middle School","SchoolType":"Middle","Rating":6,"NCESID":"120051002600","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Houston County","City":"Rehobeth","SchoolName":"Rehobeth Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"10177002078","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Houston County","City":"Dothan","SchoolName":"Rehobeth High School","SchoolType":"High","Rating":6,"NCESID":"10177000615","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Houston County","City":"Rehobeth","SchoolName":"Rehobeth Middle School","SchoolType":"Middle","Rating":7,"NCESID":"10177002077","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Houston County","City":"Dothan","SchoolName":"Rehobeth Primary School","SchoolType":"Elementary","Rating":10,"NCESID":"10177002668","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Reinhardt Holm Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"120051000820","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Richbourg School","SchoolType":"Other","Rating":null,"NCESID":"120138007622","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"Rising Leaders Academy","SchoolType":"Other","Rating":null,"NCESID":"120009008094","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Riverside Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"120138001337","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Satsuma","SchoolName":"Robert E Lee Elementary","SchoolType":"Elementary","Rating":10,"NCESID":"10018902196","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Robertsdale","SchoolName":"Robertsdale Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"10027001716","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Robertsdale","SchoolName":"Robertsdale High School","SchoolType":"High","Rating":8,"NCESID":"10027000024","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Spanish Fort","SchoolName":"Rockwell Elementary School","SchoolType":"Elementary","Rating":10,"NCESID":"10027000550","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Rosenwald High School","SchoolType":"High","Rating":1,"NCESID":"120009007763","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Robertsdale","SchoolName":"Rosinton School","SchoolType":"Elementary","Rating":7,"NCESID":"10027000065","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Washington County","City":"Chipley","SchoolName":"Roulhac Middle School","SchoolType":"Middle","Rating":7,"NCESID":"120201002031","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"Rutherford High School","SchoolType":"High","Rating":2,"NCESID":"120009000064","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Pace","SchoolName":"S. S. Dixon Intermediate School","SchoolType":"Middle","Rating":7,"NCESID":"120165002959","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Pace","SchoolName":"S. S. Dixon Primary School","SchoolType":"Elementary","Rating":null,"NCESID":"120165001828","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Irvington","SchoolName":"Saint Elmo Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"10237001732","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Samson","SchoolName":"Samson Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"10166001771","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Samson","SchoolName":"Samson High School","SchoolType":"High","Rating":5,"NCESID":"10166000571","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Samson","SchoolName":"Samson Middle School","SchoolType":"Middle","Rating":8,"NCESID":"10166001772","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Santa Rosa High School","SchoolType":"High","Rating":null,"NCESID":"120165002408","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Santa Rosa Online Virtual Instruction Program","SchoolType":"Other","Rating":null,"NCESID":"120165007727","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Santa Rosa Virtual Franchise","SchoolType":"Other","Rating":null,"NCESID":"120165007684","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Saraland","SchoolName":"Saraland Early Education Center","SchoolType":"Other","Rating":null,"NCESID":"10018502427","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Saraland","SchoolName":"Saraland Elementary School","SchoolType":"Elementary","Rating":10,"NCESID":"10018500952","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Saraland","SchoolName":"Saraland High School","SchoolType":"High","Rating":7,"NCESID":"10018502137","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Saraland","SchoolName":"Saraland Middle School Adams Campus","SchoolType":"Middle","Rating":10,"NCESID":"10018500893","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Satsuma","SchoolName":"Satsuma High School","SchoolType":"High","Rating":10,"NCESID":"10018902195","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Scenic Heights Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120051000808","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Walton County","City":"Santa Rosa Beach","SchoolName":"Seaside Neighborhood School","SchoolType":"Other","Rating":null,"NCESID":"120198003138","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Semmes","SchoolName":"Semmes Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"10237001560","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Semmes","SchoolName":"Semmes Middle School","SchoolType":"Middle","Rating":5,"NCESID":"10237000955","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Shalimar","SchoolName":"Shalimar Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"120138001341","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Sherwood Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"120051000810","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Shoal River Middle School","SchoolType":"Middle","Rating":8,"NCESID":"120138001325","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Silver Sands-Excep. Children","SchoolType":"Other","Rating":null,"NCESID":"120138001336","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Baldwin County","City":"Silverhill","SchoolName":"Silverhill School","SchoolType":"Elementary","Rating":5,"NCESID":"10027000066","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Slocomb","SchoolName":"Slocomb Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"10166001793","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Slocomb","SchoolName":"Slocomb High School","SchoolType":"High","Rating":5,"NCESID":"10166001519","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Geneva County","City":"Slocomb","SchoolName":"Slocomb Middle School","SchoolType":"Middle","Rating":10,"NCESID":"10166001794","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Jackson County","City":"Sneads","SchoolName":"Sneads Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"120096001071","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Jackson County","City":"Sneads","SchoolName":"Sneads High School","SchoolType":"High","Rating":4,"NCESID":"120096001070","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Robertsdale","SchoolName":"South Baldwin Center For Technology","SchoolType":"Other","Rating":null,"NCESID":"10027000665","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Santa Rosa Beach","SchoolName":"South Walton High School","SchoolType":"High","Rating":8,"NCESID":"120198003941","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Southport","SchoolName":"Southport Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"120009000053","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Southside Primary School","SchoolType":"Elementary","Rating":7,"NCESID":"120138007669","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Spanish Fort","SchoolName":"Spanish Fort Elementary School","SchoolType":"Elementary","Rating":10,"NCESID":"10027000067","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Spanish Fort","SchoolName":"Spanish Fort High School","SchoolType":"High","Rating":10,"NCESID":"10027002073","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Spanish Fort","SchoolName":"Spanish Fort Middle School","SchoolType":"Middle","Rating":10,"NCESID":"10027001888","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Spencer Westlawn Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10237000966","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"St. Andrew School At Oakland Terrace","SchoolType":"Elementary","Rating":1,"NCESID":"120009000055","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Stapleton","SchoolName":"Stapleton School","SchoolType":"Elementary","Rating":8,"NCESID":"10027000068","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Loxley","SchoolName":"Stonebridge Elementary","SchoolType":"Elementary","Rating":10,"NCESID":"10027002544","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Success Academy","SchoolType":"Other","Rating":null,"NCESID":"120051002557","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Baldwin County","City":"Summerdale","SchoolName":"Summerdale School","SchoolType":"Elementary","Rating":8,"NCESID":"10027000069","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City Beach","SchoolName":"Surfside Middle School","SchoolType":"Middle","Rating":7,"NCESID":"120009002665","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Baldwin County","City":"Bon Secour","SchoolName":"Swift Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10027000070","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"T. R. Jackson Prek Center","SchoolType":"Other","Rating":null,"NCESID":"120165001822","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Wilmer","SchoolName":"Tanner Williams Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"10237000960","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Tap Pk Babies","SchoolType":"Other","Rating":null,"NCESID":"120051008573","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"Tapp Child Care","SchoolType":"Other","Rating":null,"NCESID":"120165008644","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Taylor White Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"10237002202","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City","SchoolName":"The Collegiate School At Fsu Pc","SchoolType":"Other","Rating":null,"NCESID":"120202010841","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Jackson County","City":"Graceville","SchoolName":"The Dove (Developing Opportunities Thru Voc. Ed.)","SchoolType":"Other","Rating":null,"NCESID":"120096007112","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"The Pathway","SchoolType":"Other","Rating":null,"NCESID":"10237001038","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Theodore","SchoolName":"Theodore High School","SchoolType":"High","Rating":2,"NCESID":"10237001688","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Pace","SchoolName":"Thomas L Sims Middle School","SchoolType":"Middle","Rating":8,"NCESID":"120165003504","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Prichard","SchoolName":"Tl Faulkner School","SchoolType":"Other","Rating":null,"NCESID":"10237001083","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"Tommy Smith Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"120009000059","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Brewton","SchoolName":"Tr Miller High School","SchoolType":"High","Rating":10,"NCESID":"10045000216","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Tyndall Afb","SchoolName":"Tyndall Academy","SchoolType":"Other","Rating":null,"NCESID":"120009000068","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Ucp Of Mobile Inc","SchoolType":"Other","Rating":null,"NCESID":"10237001624","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Panama City","SchoolName":"University Academy Sabl Inc","SchoolType":"Other","Rating":null,"NCESID":"120009008103","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Santa Rosa Beach","SchoolName":"Van R. Butler Elementary School","SchoolType":"Elementary","Rating":9,"NCESID":"120198002023","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Washington County","City":"Vernon","SchoolName":"Vernon Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120201002033","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Washington County","City":"Vernon","SchoolName":"Vernon High School","SchoolType":"High","Rating":3,"NCESID":"120201002029","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Washington County","City":"Vernon","SchoolName":"Vernon Middle School","SchoolType":"Middle","Rating":5,"NCESID":"120201002587","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"W H Council Traditional School","SchoolType":"Other","Rating":null,"NCESID":"10237000907","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Baldwin County","City":"Daphne","SchoolName":"W J Carroll Intermediate School","SchoolType":"Other","Rating":null,"NCESID":"10027000056","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"East Brewton","SchoolName":"W S Neal Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"10135001505","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"East Brewton","SchoolName":"W S Neal High School","SchoolType":"High","Rating":4,"NCESID":"10135000492","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"East Brewton","SchoolName":"W S Neal Middle School","SchoolType":"Middle","Rating":5,"NCESID":"10135001506","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"W. C. Pryor Middle School","SchoolType":"Middle","Rating":5,"NCESID":"120138001339","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Milton","SchoolName":"W. H. Rhodes Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120165002098","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Liberty County","City":"Bristol","SchoolName":"W. R. Tolar K-8 School","SchoolType":"Middle","Rating":7,"NCESID":"120117001206","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Crestview","SchoolName":"Walker Elementary School","SchoolType":"Elementary","Rating":8,"NCESID":"120138002682","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Pace","SchoolName":"Wallace Lake K-8","SchoolType":"Other","Rating":null,"NCESID":"120165009041","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Bay County","City":"Youngstown","SchoolName":"Waller Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120009000056","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"Walton Academy Inc.","SchoolType":"Other","Rating":null,"NCESID":"120198004458","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"Walton County Jail Program","SchoolType":"Other","Rating":null,"NCESID":"120198007918","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"Walton High School","SchoolType":"High","Rating":7,"NCESID":"120198002025","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"Walton Initiative For Success In Education (Wise)","SchoolType":"Other","Rating":null,"NCESID":"120198007690","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"Walton Learning Center","SchoolType":"Other","Rating":null,"NCESID":"120198003527","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"Walton Middle School","SchoolType":"Middle","Rating":7,"NCESID":"120198002024","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"Walton Virtual Franchise","SchoolType":"Other","Rating":null,"NCESID":"120198007734","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"Walton Virtual School Full Time","SchoolType":"Other","Rating":null,"NCESID":"120198007730","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"Walton Virtual School Wcsd","SchoolType":"Other","Rating":null,"NCESID":"120198008849","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Warrington Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120051000814","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Warrington Preparatory Academy","SchoolType":"Other","Rating":null,"NCESID":"120051000815","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Washington County","City":"Chipley","SchoolName":"Washington Academy Of Varying Exceptionalities (Wave)","SchoolType":"Other","Rating":null,"NCESID":"120201008668","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Washington County","City":"Chipley","SchoolName":"Washington Institute For Specialized Education","SchoolType":"Other","Rating":null,"NCESID":"120201007647","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"Washington Senior High School","SchoolType":"High","Rating":3,"NCESID":"120051002169","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Washington County","City":"Chipley","SchoolName":"Washington Virtual Franchise","SchoolType":"Other","Rating":null,"NCESID":"120201008010","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Washington County","City":"Chipley","SchoolName":"Washington Virtual Instruction Program","SchoolType":"Other","Rating":null,"NCESID":"120201007667","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Mobile County","City":"Mobile","SchoolName":"Wc Griggs Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"10237000965","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Prichard","SchoolName":"Wd Robbins Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"10237000949","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Bay County","City":"Panama City Beach","SchoolName":"West Bay Elementary School","SchoolType":"Elementary","Rating":6,"NCESID":"120009008453","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Walton County","City":"Defuniak Springs","SchoolName":"West Defuniak Elementary School","SchoolType":"Elementary","Rating":7,"NCESID":"120198002018","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Escambia County","City":"Pensacola","SchoolName":"West Florida High School/Technical","SchoolType":"High","Rating":7,"NCESID":"120051003703","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Gadsden County","City":"Quincy","SchoolName":"West Gadsden Middle School","SchoolType":"Middle","Rating":2,"NCESID":"120060008590","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Navarre","SchoolName":"West Navarre Intermediate School","SchoolType":"Middle","Rating":7,"NCESID":"120165003665","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Navarre","SchoolName":"West Navarre Primary School","SchoolType":"Elementary","Rating":null,"NCESID":"120165002960","State":"","Excluded":true,"ExcludedReason":"Thomas Verified Grade: Unranked"},
{"County":"Escambia County","City":"Pensacola","SchoolName":"West Pensacola Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120051000817","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Gulf County","City":"Wewahitchka","SchoolName":"Wewahitchka Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120069002176","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Gulf County","City":"Wewahitchka","SchoolName":"Wewahitchka High School","SchoolType":"High","Rating":4,"NCESID":"120069000870","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Prichard","SchoolName":"Whitley Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"10237000968","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Wilmer","SchoolName":"Wilmer Elementary School","SchoolType":"Elementary","Rating":5,"NCESID":"10237000970","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Santa Rosa County","City":"Gulf Breeze","SchoolName":"Woodlawn Beach Middle School","SchoolType":"Middle","Rating":6,"NCESID":"120165004446","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Mobile County","City":"Mobile","SchoolName":"Wp Davidson High School","SchoolType":"High","Rating":6,"NCESID":"10237000912","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Okaloosa County","City":"Fort Walton Beach","SchoolName":"Wright Elementary School","SchoolType":"Elementary","Rating":4,"NCESID":"120138001340","State":"","Excluded":false,"ExcludedReason":""},
{"County":"Covington County","City":"Lockhart","SchoolName":"Ws Harlan Elementary School","SchoolType":"Elementary","Rating":3,"NCESID":"10093000364","State":"","Excluded":false,"ExcludedReason":""}
];
state.mapTheme = 'hub';
state.returnTheme = 'hub';

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\./g, '')
    .replace(/\b(sch|school)\b/g, '')
    .replace(/\bsenior\b/g, '')
    .replace(/\bjunior\b/g, '')
    .replace(/\bjr\b/g, '')
    .replace(/\bsr\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanNces(value) {
  const raw = String(value || '').trim();
  if (!raw || raw.includes('E+')) return '';
  return raw.replace(/\.0$/, '');
}

function simpleNameKey(name) {
  return normalizeName(name)
    .replace(/\belementary\b/g, 'elem')
    .replace(/\bmiddle\b/g, 'mid')
    .replace(/\bhigh\b/g, 'high')
    .replace(/\s+/g, ' ')
    .trim();
}

const ratingByNces = new Map();
const ratingByNameCounty = new Map();
const ratingByNameCity = new Map();
const ratingByName = new Map();

schoolRatingRecords.forEach(rec => {
  const id = cleanNces(rec.NCESID);
  const nameKey = simpleNameKey(rec.SchoolName);
  const countyKey = normalizeName(rec.County).replace(/ county$/, '');
  const cityKey = normalizeName(rec.City);
  if (id) ratingByNces.set(id, rec);
  if (nameKey && countyKey) ratingByNameCounty.set(`${nameKey}|${countyKey}`, rec);
  if (nameKey && cityKey) ratingByNameCity.set(`${nameKey}|${cityKey}`, rec);
  if (nameKey && !ratingByName.has(nameKey)) ratingByName.set(nameKey, rec);
});

function tokenSet(str) {
  const stop = new Set(['school','elementary','elem','middle','mid','high','senior','junior','jr','sr','the','of','academy','public','charter','inc']);
  return simpleNameKey(str).split(' ').filter(t => t && !stop.has(t));
}

function ratingForSchoolName(input) {
  const props = typeof input === 'object' && input !== null ? input : { NAME: input };
  const name = props.NAME || '';
  const schoolKey = simpleNameKey(name);
  const city = normalizeName(props.CITY || '');
  const county = normalizeName(props.NMCNTY || '').replace(/ county$/, '');
  const nces = cleanNces(props.NCESSCH || '');

  if (nces && ratingByNces.has(nces)) return ratingByNces.get(nces);
  if (ratingByNameCounty.has(`${schoolKey}|${county}`)) return ratingByNameCounty.get(`${schoolKey}|${county}`);
  if (ratingByNameCity.has(`${schoolKey}|${city}`)) return ratingByNameCity.get(`${schoolKey}|${city}`);
  if (ratingByName.has(schoolKey)) return ratingByName.get(schoolKey);

  let best = null;
  let bestScore = 0;
  const nt = tokenSet(name);
  for (const rec of schoolRatingRecords) {
    const rt = tokenSet(rec.SchoolName);
    if (!rt.length || !nt.length) continue;
    const common = rt.filter(t => nt.includes(t)).length;
    let score = common / Math.max(rt.length, nt.length);
    if (rec.City && city && normalizeName(rec.City) === city) score += 0.12;
    if (rec.County && county && normalizeName(rec.County).replace(/ county$/,'') === county) score += 0.20;
    if (score > bestScore) { bestScore = score; best = rec; }
  }
  return bestScore >= 0.72 ? best : null;
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

function ratedSchoolsLocatedInSubmarket(name) {
  if (!state.schoolsLoaded) return [];
  return state.schools
    .filter(s => s.properties.SubmarketName === name)
    .filter(s => normalizeGreatSchoolsRating(s.properties.GreatSchoolsRating) !== null)
    .map(s => ({
      SchoolName: s.properties.NAME,
      SchoolType: s.properties.RatingSchoolType || s.properties.SchoolType,
      Rating: s.properties.GreatSchoolsRating,
      Submarket: s.properties.SubmarketName
    }));
}

function ratedSchoolsLocatedInFeatures(features) {
  if (!state.schoolsLoaded) return [];
  const ids = new Set(features.map(f => f.properties.SubmarketID));
  return state.schools
    .filter(s => ids.has(s.properties.SubmarketID))
    .filter(s => normalizeGreatSchoolsRating(s.properties.GreatSchoolsRating) !== null)
    .map(s => ({
      SchoolName: s.properties.NAME,
      SchoolType: s.properties.RatingSchoolType || s.properties.SchoolType,
      Rating: s.properties.GreatSchoolsRating,
      Submarket: s.properties.SubmarketName
    }));
}

function buildScoreSummary(rows) {
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

function scoreSummaryForSubmarket(name) {
  // Ratings are based on Option A: rated schools physically located inside the selected submarket polygon.
  // Unrated schools are ignored; they are never counted as zero.
  return buildScoreSummary(ratedSchoolsLocatedInSubmarket(name));
}

function scoreSummaryForFeatures(features) {
  return buildScoreSummary(ratedSchoolsLocatedInFeatures(features));
}

function fmtScore(v) {
  return v === null || v === undefined ? 'Pending' : v.toFixed(1);
}

function fmt(v, suffix = '') {
  if (v === null || v === undefined || v === '') return 'Coming Soon';
  if (typeof v === 'number') return `${v.toLocaleString()}${suffix}`;
  return `${v}${suffix}`;
}



function submarketDemoKey(name) {
  if (!name) return '';
  if (name === 'Eglin AFB') return 'Egland AFB';
  return name;
}

function demoForSubmarket(name) {
  if (!state.demographics || !state.demographics.submarkets) return null;
  return state.demographics.submarkets[submarketDemoKey(name)] || null;
}

function demosForFeatures(features) {
  return features.map(f => demoForSubmarket(f.properties.DisplayName)).filter(Boolean);
}

function snapshotWeightedRowsFromPointFeatures(features, centerLatLng, radiusMiles, getDemo) {
  return (features || [])
    .map(feature => {
      const demo = getDemo(feature);
      const latLng = marketSnapshotFeatureLatLng(feature);
      if (!demo || !latLng) return null;
      const distance = centerLatLng.distanceTo(latLng) / 1609.344;
      if (!Number.isFinite(distance) || distance > radiusMiles) return null;
      return {
        feature,
        distance,
        overlap: Math.max(0.15, 1 - (distance / Math.max(radiusMiles, 0.25))),
        demo
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.overlap - a.overlap || a.distance - b.distance);
}

function applyAcsMeanIncomeValues(valuesByGeoid) {
  if (!valuesByGeoid || typeof valuesByGeoid !== 'object') return 0;
  let applied = 0;
  (state.demographicsBlockGroups || []).forEach(feature => {
    const p = feature.properties || (feature.properties = {});
    const geoid = String(p.GEOID || '').trim();
    const aggregateIncome = Number(valuesByGeoid[geoid]);
    const households = Number(p.households || p.occupied_housing_units || 0);
    if (geoid && Number.isFinite(aggregateIncome) && aggregateIncome >= 0 && Number.isFinite(households) && households > 0) {
      p.aggregate_household_income = aggregateIncome;
      p.mean_household_income = aggregateIncome / households;
      applied += 1;
    }
  });
  state.acsMeanIncomeLoaded = applied > 0;
  return applied;
}

function parseAcsAggregateIncomeTable(text) {
  const lines = String(text || '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) throw new Error('ACS aggregate-income table was empty.');
  const clean = value => String(value ?? '').replace(/^\uFEFF/, '').replace(/^"|"$/g, '').trim();
  const headers = lines[0].split('|').map(clean);
  const geoIdx = headers.findIndex(h => h === 'GEO_ID' || h === 'GEOID');
  const estIdx = headers.findIndex(h => h === 'B19025_E001' || h === 'B19025_001E' || /^B19025_.*E.*001$/i.test(h));
  if (geoIdx < 0 || estIdx < 0) throw new Error('ACS B19025 columns were not found in the summary file.');
  const values = {};
  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].split('|');
    if (parts.length <= Math.max(geoIdx, estIdx)) continue;
    const geoId = clean(parts[geoIdx]);
    // Summary-level 150 = Census block group. Restrict to Alabama (01) and Florida (12),
    // matching the bundled Market Preview ACS geography file.
    const match = geoId.match(/^1500000US(01|12)(\d{10})$/);
    if (!match) continue;
    const estimate = Number(clean(parts[estIdx]));
    if (!Number.isFinite(estimate) || estimate < 0) continue;
    values[match[1] + match[2]] = estimate;
  }
  return values;
}

function readAcsMeanIncomeCache() {
  try {
    const raw = localStorage.getItem(ACS_MEAN_INCOME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.savedAt || !parsed.values) return null;
    if ((Date.now() - Number(parsed.savedAt)) > ACS_MEAN_INCOME_CACHE_MAX_AGE_MS) return null;
    return parsed.values;
  } catch (err) {
    return null;
  }
}

function writeAcsMeanIncomeCache(values) {
  try {
    localStorage.setItem(ACS_MEAN_INCOME_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), values }));
  } catch (err) {
    console.warn('ACS mean-income browser cache could not be written', err);
  }
}

async function ensureAcsMeanIncomeLoaded() {
  if (state.acsMeanIncomeLoaded) return true;
  if (state.acsMeanIncomeLoadPromise) return state.acsMeanIncomeLoadPromise;
  state.acsMeanIncomeLoadPromise = (async () => {
    const cached = readAcsMeanIncomeCache();
    if (cached && applyAcsMeanIncomeValues(cached) > 0) return true;

    const response = await fetch(ACS_MEAN_INCOME_SOURCE_URL, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`ACS B19025 request failed (${response.status}).`);
    const values = parseAcsAggregateIncomeTable(await response.text());
    const applied = applyAcsMeanIncomeValues(values);
    if (!applied) throw new Error('ACS B19025 did not match any bundled Alabama/Florida block groups.');
    writeAcsMeanIncomeCache(values);
    return true;
  })().catch(err => {
    console.warn('ACS Mean Income could not be loaded', err);
    state.acsMeanIncomeLoaded = false;
    return false;
  }).finally(() => {
    state.acsMeanIncomeAttempted = true;
    state.acsMeanIncomeLoadPromise = null;
  });
  return state.acsMeanIncomeLoadPromise;
}

function weightedRowsFromDemographicSource(centerLatLng, radiusMiles) {
  const loaded = state.demographicsBlockGroupsLoaded && Array.isArray(state.demographicsBlockGroups) && state.demographicsBlockGroups.length;
  if (!loaded) {
    return {
      rows: [],
      source: 'block_groups_unavailable',
      note: 'The bundled ACS 2020-2024 block-group radius dataset is not available.'
    };
  }
  const rows = snapshotWeightedRowsFromPointFeatures(
    state.demographicsBlockGroups,
    centerLatLng,
    radiusMiles,
    feature => ({ current: feature.properties || {}, forecast_5yr: null })
  );
  return {
    rows,
    source: rows.length ? 'block_group_centers' : 'block_group_centers_empty',
    note: rows.length
      ? 'Radius estimates use the bundled ACS 2020-2024 block-group population-center dataset with household-weighted demographic values.'
      : 'No ACS block-group population centers fall inside this radius.'
  };
}

function aggregateDemographicsWeighted(rows) {
  const valid = (rows || []).map(row => ({
    feature: row.feature,
    demo: row.demo,
    weight: Math.max(0, Math.min(1, Number(row.weight || row.overlap || 0)))
  })).filter(row => row.demo && row.demo.current && row.weight > 0);
  if (!valid.length) return null;

  const weightedAverage = (field, weightField) => {
    let totalWeight = 0;
    let totalValue = 0;
    valid.forEach(row => {
      const source = row.demo.current || {};
      const value = Number(source[field]);
      const baseWeight = Number(source[weightField] || 0) * row.weight;
      if (Number.isFinite(value) && Number.isFinite(baseWeight) && baseWeight > 0) {
        totalWeight += baseWeight;
        totalValue += value * baseWeight;
      }
    });
    return totalWeight ? totalValue / totalWeight : null;
  };

  const weightedMedianLocal = (field, weightField) => {
    const values = [];
    valid.forEach(row => {
      const source = row.demo.current || {};
      const value = Number(source[field]);
      const weight = Number(source[weightField] || 0) * row.weight;
      if (Number.isFinite(value) && Number.isFinite(weight) && weight > 0) values.push({ v: value, w: weight });
    });
    if (!values.length) return null;
    values.sort((a, b) => a.v - b.v);
    const totalWeight = values.reduce((acc, item) => acc + item.w, 0);
    let cumulative = 0;
    for (const item of values) {
      cumulative += item.w;
      if (cumulative >= totalWeight / 2) return item.v;
    }
    return values[values.length - 1].v;
  };

  return {
    current: {
      population: Math.round(valid.reduce((acc, row) => acc + Number(row.demo.current.population || 0) * row.weight, 0)),
      households: Math.round(valid.reduce((acc, row) => acc + Number(row.demo.current.households || 0) * row.weight, 0)),
      median_household_income: Math.round(weightedMedianLocal('median_household_income', 'households') || 0),
      mean_household_income: (() => {
        let allocatedIncome = 0;
        let allocatedHouseholds = 0;
        valid.forEach(row => {
          const source = row.demo.current || {};
          const aggregateIncome = Number(source.aggregate_household_income);
          const households = Number(source.households || 0);
          if (Number.isFinite(aggregateIncome) && aggregateIncome >= 0 && Number.isFinite(households) && households > 0) {
            allocatedIncome += aggregateIncome * row.weight;
            allocatedHouseholds += households * row.weight;
          }
        });
        return allocatedHouseholds > 0 ? Math.round(allocatedIncome / allocatedHouseholds) : null;
      })(),
      median_age: weightedAverage('median_age', 'population'),
      owner_occupancy_pct: weightedAverage('owner_occupancy_pct', 'occupied_housing_units'),
      bachelors_plus_pct: weightedAverage('bachelors_plus_pct', 'population_25_plus')
    },
    forecast_5yr: null,
    audit: { geographies_with_data: valid.length, geographies_total: rows.length }
  };
}

function weightedAvg(rows, field, weightField='population') {
  let totalWeight = 0;
  let totalValue = 0;
  rows.forEach(row => {
    const v = Number(row[field]);
    const w = Math.max(0, Number(row[weightField] || 0));
    if (Number.isFinite(v) && Number.isFinite(w) && w > 0) {
      totalValue += v * w;
      totalWeight += w;
    }
  });
  return totalWeight ? totalValue / totalWeight : null;
}

function aggregateDemographics(features) {
  const rows = demosForFeatures(features);
  if (!rows.length) return null;
  const cur = rows.map(d => d.current || {});
  const fc = rows.map(d => d.forecast_5yr || {});
  const sum = (arr, field) => Math.round(arr.reduce((a,r) => a + Number(r[field] || 0), 0));
  return {
    current: {
      population: sum(cur, 'population'),
      households: sum(cur, 'households'),
      median_household_income: Math.round(weightedAvg(cur, 'median_household_income') || 0),
      median_age: weightedAvg(cur, 'median_age'),
      owner_occupancy_pct: weightedAvg(cur, 'owner_occupancy_pct', 'occupied_housing_units'),
      bachelors_plus_pct: weightedAvg(cur, 'bachelors_plus_pct', 'population_25_plus'),
      population_growth_prior_5yr_pct: weightedAvg(cur, 'population_growth_prior_5yr_pct')
    },
    forecast_5yr: {
      population: sum(fc, 'population'),
      households: sum(fc, 'households'),
      median_household_income: Math.round(weightedAvg(fc, 'median_household_income') || 0),
      median_age: weightedAvg(fc, 'median_age'),
      owner_occupancy_pct: weightedAvg(fc, 'owner_occupancy_pct', 'occupied_housing_units'),
      bachelors_plus_pct: weightedAvg(fc, 'bachelors_plus_pct', 'population_25_plus'),
      population_growth_next_5yr_pct: weightedAvg(fc, 'population_growth_next_5yr_pct')
    },
    audit: { submarkets_with_data: rows.length, submarkets_total: features.length }
  };
}

function fmtMoney(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v)) || Number(v) <= 0) return 'N/A';
  return '$' + Math.round(Number(v)).toLocaleString();
}

function fmtPct(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 'N/A';
  return Number(v).toFixed(1) + '%';
}

function fmtOne(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 'N/A';
  return Number(v).toFixed(1);
}

function fmtDistanceMiles(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 'N/A';
  return `${Number(v).toFixed(1)} mi`;
}

function marketSnapshotRadiusLabel(radiusMiles) {
  return `${radiusMiles} mile${Number(radiusMiles) === 1 ? '' : 's'}`;
}

function incomeBandLowerBound(label) {
  const raw = String(label || '').toLowerCase().replace(/income/g, '').replace(/,/g, '').replace(/\$/g, '').trim();
  if (raw.includes('less than')) return 0;
  if (raw.includes('above') || raw.includes('or more')) {
    const m = raw.match(/(\d+(?:\.\d+)?)\s*k/);
    if (m) return Number(m[1]) * 1000;
    const n = raw.match(/\d+/);
    return n ? Number(n[0]) : 999999999;
  }
  const k = raw.match(/(\d+(?:\.\d+)?)\s*k/);
  if (k) return Number(k[1]) * 1000;
  const n = raw.match(/\d+/);
  return n ? Number(n[0]) : 999999999;
}

function marketSnapshotModeActive() {
  return !!(state.marketSnapshot && state.marketSnapshot.active);
}

function updateMarketSnapshotUI() {
  const panel = document.getElementById('marketSnapshotRadiusPanel');
  const button = document.getElementById('marketSnapshotToggle');
  const hint = document.getElementById('marketSnapshotHint');
  const active = marketSnapshotModeActive();
  if (panel) {
    panel.classList.toggle('active', active);
    panel.querySelectorAll('.market-snapshot-radius').forEach(btn => {
      btn.classList.toggle('active', active && Number(btn.dataset.radius) === Number(state.marketSnapshot.radiusMiles));
    });
  }
  if (button) button.textContent = active ? 'Cancel Market Preview' : 'Market Preview';
  if (hint) {
    hint.textContent = active
      ? (state.marketSnapshot.radiusMiles ? `Radius selected: ${marketSnapshotRadiusLabel(state.marketSnapshot.radiusMiles)}. Click a point on the map.` : 'Choose a radius, then click a point on the map.')
      : 'Click Market Preview to begin.';
  }
  document.body.classList.toggle('snapshot-mode', active && !!state.marketSnapshot.radiusMiles);
}

function setMarketSnapshotMode(active, radiusMiles = null) {
  state.marketSnapshot = state.marketSnapshot || { active: false, radiusMiles: null, awaitingPoint: false, busy: false, pendingCenter: null, radiusLayer: null, radiusCircle: null, promptMarker: null, promptEl: null };
  const previousRadius = state.marketSnapshot.radiusMiles;
  state.marketSnapshot.active = !!active;
  state.marketSnapshot.awaitingPoint = !!active;
  state.marketSnapshot.radiusMiles = active ? (radiusMiles == null ? state.marketSnapshot.radiusMiles : Number(radiusMiles)) : null;
  state.marketSnapshot.busy = false;
  if (!active || (previousRadius != null && state.marketSnapshot.radiusMiles !== previousRadius)) {
    clearRadiusPromptOverlay('snapshot');
  }
  updateMarketSnapshotUI();
}

function resetMarketSnapshotMode() {
  state.marketSnapshot = state.marketSnapshot || { active: false, radiusMiles: null, awaitingPoint: false, busy: false, pendingCenter: null, radiusLayer: null, radiusCircle: null, promptMarker: null, promptEl: null };
  clearRadiusPromptOverlay('snapshot');
  state.marketSnapshot.active = false;
  state.marketSnapshot.awaitingPoint = false;
  state.marketSnapshot.radiusMiles = null;
  state.marketSnapshot.busy = false;
  updateMarketSnapshotUI();
}

function marketSnapshotFeatureLatLng(feature) {
  if (!feature) return null;
  const p = feature.properties || {};
  const lat = Number(p.CentroidLat ?? p.CenterLat ?? p.Latitude ?? p.lat);
  const lon = Number(p.CentroidLon ?? p.CenterLon ?? p.Longitude ?? p.lng);
  if (Number.isFinite(lat) && Number.isFinite(lon)) return L.latLng(lat, lon);
  const geometry = feature.geometry || {};
  const coords = geometry.coordinates;
  if (!geometry.type || !Array.isArray(coords)) return null;
  if (geometry.type === 'Point') {
    if (coords.length < 2) return null;
    return L.latLng(Number(coords[1]), Number(coords[0]));
  }
  const pts = [];
  (function collect(value) {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      pts.push(value);
      return;
    }
    value.forEach(collect);
  })(coords);
  if (!pts.length) return null;
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  pts.forEach(([x, y]) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    minLon = Math.min(minLon, x); maxLon = Math.max(maxLon, x);
    minLat = Math.min(minLat, y); maxLat = Math.max(maxLat, y);
  });
  if (!Number.isFinite(minLon) || !Number.isFinite(minLat)) return null;
  return L.latLng((minLat + maxLat) / 2, (minLon + maxLon) / 2);
}

function marketSnapshotDistanceMiles(feature, centerLatLng) {
  const latLng = marketSnapshotFeatureLatLng(feature);
  if (!latLng || !centerLatLng) return null;
  return centerLatLng.distanceTo(latLng) / 1609.344;
}

function featuresWithinRadius(features, centerLatLng, radiusMiles) {
  return (features || [])
    .map(feature => ({ feature, distance: marketSnapshotDistanceMiles(feature, centerLatLng) }))
    .filter(entry => Number.isFinite(entry.distance) && entry.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance);
}

function renderSnapshotMetric(label, value, sublabel = '') {
  return `<div class="snapshot-metric"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b>${sublabel ? `<small>${escapeHtml(sublabel)}</small>` : ''}</div>`;
}

function renderSnapshotTable(headers, rows, emptyHtml) {
  const cols = `repeat(${Math.max(1, headers.length)}, minmax(0, 1fr))`;
  const head = `<div class="snapshot-table-row snapshot-table-head" style="--snapshot-cols:${cols}">${headers.map(h => `<div>${escapeHtml(h)}</div>`).join('')}</div>`;
  const body = Array.isArray(rows) ? rows.join('') : String(rows || '');
  if (!body) return emptyHtml;
  return `<div class="snapshot-table" style="--snapshot-cols:${cols}">${head}${body}</div>`;
}

function quickviewSignedValueHtml(value, kind = 'int') {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  if (!num) return `<span class="quickview-neutral">${escapeHtml(quickviewStatValue(num, kind))}</span>`;
  const abs = Math.min(Math.abs(num), kind === 'pct' ? 150 : 500);
  const intensity = kind === 'pct' ? Math.max(32, 58 - (abs / 150) * 22) : Math.max(30, 56 - (abs / 500) * 20);
  const color = num > 0 ? `hsl(142 68% ${intensity}%)` : `hsl(0 72% ${intensity}%)`;
  const cls = num > 0 ? 'quickview-positive' : 'quickview-negative';
  return `<span class="${cls}" style="color:${color};font-weight:900;">${escapeHtml(quickviewStatValue(num, kind))}</span>`;
}

function formatBuilderTierLabel(feature) {
  const tierKey = builderTierForFeature(feature);
  if (!tierKey) return '—';
  return (state.builderTierConfig[tierKey] || {}).label || tierKey;
}


function openMarketSnapshotModal(title, subtitle, bodyHtml) {
  const overlay = document.getElementById('marketSnapshotModal');
  const titleEl = document.getElementById('marketSnapshotModalTitle');
  const subtitleEl = document.getElementById('marketSnapshotModalSubtitle');
  const bodyEl = document.getElementById('marketSnapshotModalBody');
  if (!overlay || !titleEl || !subtitleEl || !bodyEl) return false;
  titleEl.textContent = title || 'Market Preview';
  subtitleEl.textContent = subtitle || '';
  bodyEl.innerHTML = bodyHtml || '<div class="snapshot-loading">Loading Market Preview...</div>';
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  return true;
}

function closeMarketSnapshotModal() {
  const overlay = document.getElementById('marketSnapshotModal');
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
}

function radiusModeState(mode) { return mode === 'quickview' ? state.marketQuickview : state.marketSnapshot; }
function radiusPromptLabel(mode) { return mode === 'quickview' ? 'See Market Quickview?' : 'Open Market Preview?'; }
function radiusPromptButtonClass(mode) { return mode === 'quickview' ? 'radius-prompt-yes quickview' : 'radius-prompt-yes snapshot'; }

function clearRadiusPromptOverlay(mode) {
  const s = radiusModeState(mode);
  if (!s) return;
  if (s.radiusLayer && typeof s.radiusLayer.remove === 'function') s.radiusLayer.remove();
  s.radiusLayer = null;
  s.radiusCircle = null;
  if (s.promptEl && s.promptEl.parentNode) s.promptEl.parentNode.removeChild(s.promptEl);
  s.promptEl = null;
  s.promptMarker = null;
  s.pendingCenter = null;
}

function buildRadiusPromptOverlay(mode) {
  const el = document.createElement('div');
  el.className = `market-preview-map-prompt ${mode}`;
  el.innerHTML = `
    <div class="radius-prompt-card ${mode === 'quickview' ? 'radius-prompt-card-quickview' : 'radius-prompt-card-snapshot'}">
      <div class="radius-prompt-title">${escapeHtml(radiusPromptLabel(mode))}</div>
      <div class="radius-prompt-actions">
        <button type="button" class="${radiusPromptButtonClass(mode)}">${escapeHtml(mode === 'quickview' ? 'Open Quickview' : 'Open Preview')}</button>
        <button type="button" class="radius-prompt-no">No</button>
      </div>
    </div>`;
  return el;
}

function positionMarketPreviewPrompt(s) {
  if (!s?.promptEl || !s.pendingCenter || !state.map) return;
  const mapEl = state.map.getContainer();
  const pt = state.map.latLngToContainerPoint(s.pendingCenter);
  const w = s.promptEl.offsetWidth || 280;
  const h = s.promptEl.offsetHeight || 105;
  let x = pt.x - w / 2;
  let y = pt.y - h - 18;
  x = Math.max(8, Math.min(x, mapEl.clientWidth - w - 8));
  y = Math.max(8, Math.min(y, mapEl.clientHeight - h - 8));
  s.promptEl.style.left = `${x}px`;
  s.promptEl.style.top = `${y}px`;
}

function showRadiusPrompt(mode, centerLatLng, radiusMiles) {
  const s = radiusModeState(mode);
  if (!s || !state.map) return;
  clearRadiusPromptOverlay(mode);
  s.pendingCenter = centerLatLng instanceof L.LatLng ? centerLatLng : L.latLng(centerLatLng.lat, centerLatLng.lng);
  s.radiusMiles = Number(radiusMiles);
  s.awaitingPoint = false;
  s.busy = false;
  const layer = L.layerGroup().addTo(state.map);
  s.radiusLayer = layer;
  const circleColor = mode === 'quickview' ? '#2563eb' : '#f59e0b';
  const fillColor = mode === 'quickview' ? '#93c5fd' : '#fde68a';
  s.radiusCircle = L.circle(s.pendingCenter, {
    radius: Number(radiusMiles) * 1609.344,
    color: circleColor,
    weight: 2.5,
    fillColor,
    fillOpacity: 0.08,
    dashArray: '6 6',
    interactive: false
  }).addTo(layer);

  const prompt = buildRadiusPromptOverlay(mode);
  s.promptEl = prompt;
  state.map.getContainer().appendChild(prompt);
  prompt.querySelector('.radius-prompt-yes')?.addEventListener('click', (event) => {
    event.preventDefault(); event.stopPropagation(); L.DomEvent.stop(event);
    openRadiusPromptReport(mode);
  });
  prompt.querySelector('.radius-prompt-no')?.addEventListener('click', (event) => {
    event.preventDefault(); event.stopPropagation(); L.DomEvent.stop(event);
    cancelRadiusPrompt(mode);
  });
  positionMarketPreviewPrompt(s);
  state.map.once('moveend', () => positionMarketPreviewPrompt(s));
  const bounds = s.radiusCircle.getBounds();
  if (bounds.isValid()) state.map.fitBounds(bounds, { padding: [50, 50], animate: true });
  requestAnimationFrame(() => positionMarketPreviewPrompt(s));
}

function openRadiusPromptReport(mode) {
  if (mode === 'quickview') openMarketQuickviewReportFromPrompt();
  else openMarketSnapshotReportFromPrompt();
}

function cancelRadiusPrompt(mode) {
  if (mode === 'quickview') resetMarketQuickviewMode();
  else resetMarketSnapshotMode();
}

function handleMarketSnapshotPoint(latlng) {
  if (!marketSnapshotModeActive() || !state.marketSnapshot.radiusMiles) return;
  const center = latlng instanceof L.LatLng ? latlng : L.latLng(latlng.lat, latlng.lng);
  showRadiusPrompt('snapshot', center, state.marketSnapshot.radiusMiles);
}

function quickviewSelectedSubmarket() {
  const select = document.getElementById('marketQuickviewSelect');
  const value = String(select?.value || state.marketQuickview?.submarket || MARKET_QUICKVIEW_DEFAULT_SUBMARKET);
  state.marketQuickview = state.marketQuickview || { active: false, loaded: false, data: null, submarket: MARKET_QUICKVIEW_DEFAULT_SUBMARKET };
  state.marketQuickview.submarket = value || MARKET_QUICKVIEW_DEFAULT_SUBMARKET;
  return state.marketQuickview.submarket;
}

function quickviewDataForSubmarket(submarketName) {
  const data = state.marketQuickview && state.marketQuickview.data;
  if (!data) return null;
  if (!submarketName) return data;
  if (data.submarket && normalizeSubmarketName(data.submarket) === normalizeSubmarketName(submarketName)) return data;
  if (data.metadata && data.metadata.submarket && normalizeSubmarketName(data.metadata.submarket) === normalizeSubmarketName(submarketName)) return data;
  return data.submarket ? data : data;
}

function openMarketQuickviewModal(title, subtitle, bodyHtml) {
  const overlay = document.getElementById('marketQuickviewModal');
  const titleEl = document.getElementById('marketQuickviewModalTitle');
  const subtitleEl = document.getElementById('marketQuickviewModalSubtitle');
  const bodyEl = document.getElementById('marketQuickviewModalBody');
  if (!overlay || !titleEl || !subtitleEl || !bodyEl) return;
  titleEl.textContent = title || 'Market Quickview';
  subtitleEl.textContent = subtitle || '';
  bodyEl.innerHTML = bodyHtml || '';
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeMarketQuickviewModal() {
  const overlay = document.getElementById('marketQuickviewModal');
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
}

function quickviewRowsFromBlocks(blocks, sortKey, limit = null) {
  return [...(blocks || [])]
    .sort((a, b) => Number(b?.[sortKey] || 0) - Number(a?.[sortKey] || 0))
    .slice(0, limit || blocks.length);
}

function quickviewStatValue(v, kind = 'number') {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 'N/A';
  if (kind === 'money') return fmtMoney(v);
  if (kind === 'pct') return fmtPct(v);
  if (kind === 'one') return fmtOne(v);
  if (kind === 'int') return Number(v).toLocaleString();
  return Number(v).toLocaleString();
}


function buildMarketQuickviewHtml(data) {
  const meta = data?.metadata || {};
  const blocks = Array.isArray(data?.blocks) ? data.blocks : [];
  const submarketName = meta.submarket || state.marketQuickview.submarket || MARKET_QUICKVIEW_DEFAULT_SUBMARKET;
  const demo = demoForSubmarket(submarketName) || null;
  const currentDemo = demo?.current || {};
  const priorDemo = demo?.prior || {};
  const forecastDemo = demo?.forecast_5yr || {};
  const incomeBands = meta.income_bands || {};
  const incomeBand2024 = Array.isArray(incomeBands['2024']) ? incomeBands['2024'] : [];
  const incomeBand2029 = Array.isArray(incomeBands['2029']) ? incomeBands['2029'] : [];
  const incomeBand2029Map = new Map(incomeBand2029.map(b => [String(b.label || ''), b]));
  const consumerSegments = Array.isArray(meta.consumer_segments) ? meta.consumer_segments : [];
  const totalBlocks = Number(meta.uploaded_blocks || blocks.length || 0);
  const usableBlocks = Number(meta.usable_blocks || blocks.length || 0);
  const anomalousBlocks = Number(meta.anomalous_blocks || 0);
  const coveragePct = totalBlocks ? (usableBlocks / totalBlocks) * 100 : 0;

  const popRows = quickviewRowsFromBlocks(blocks, 'population_2024', 10);
  const incomeRows = quickviewRowsFromBlocks(blocks, 'median_household_income', 10);

  const blockRows = [...blocks]
    .sort((a, b) => Number(b.population_2024 || 0) - Number(a.population_2024 || 0))
    .map(b => `<div class="snapshot-table-row"><div><b>${escapeHtml(String(b.block).padStart(3, '0'))}</b><small>${escapeHtml(String(b.data_status || 'usable'))}</small></div><div>${escapeHtml(quickviewStatValue(b.population_2024, 'int'))}</div><div>${escapeHtml(quickviewStatValue(b.households_2024, 'int'))}</div><div>${escapeHtml(quickviewStatValue(b.median_household_income, 'money'))}</div><div>${escapeHtml(quickviewStatValue(b.mean_household_income, 'money'))}</div><div>${escapeHtml(quickviewStatValue(b.median_age_2024, 'one'))}</div><div>${escapeHtml(quickviewStatValue(b.median_home_value_2024, 'money'))}</div><div>${escapeHtml(quickviewStatValue(b.average_household_size_2024, 'one'))}</div></div>`);

  const popTopRows = popRows.map(b => `<div class="snapshot-table-row"><div><b>${escapeHtml(String(b.block).padStart(3, '0'))}</b></div><div>${escapeHtml(quickviewStatValue(b.population_2024, 'int'))}</div><div>${escapeHtml(quickviewStatValue(b.households_2024, 'int'))}</div><div>${escapeHtml(quickviewStatValue(b.median_household_income, 'money'))}</div></div>`);
  const incomeTopRows = incomeRows.map(b => `<div class="snapshot-table-row"><div><b>${escapeHtml(String(b.block).padStart(3, '0'))}</b></div><div>${escapeHtml(quickviewStatValue(b.median_household_income, 'money'))}</div><div>${escapeHtml(quickviewStatValue(b.mean_household_income, 'money'))}</div><div>${escapeHtml(quickviewStatValue(b.households_2024, 'int'))}</div></div>`);

  const legacyIncomeBandRank = label => incomeBandLowerBound(label);
  const incomeBandRows = (yearBands, showChange = false) => [...(yearBands || [])].sort((a, b) => legacyIncomeBandRank(a.label) - legacyIncomeBandRank(b.label)).map(b => {
    const future = incomeBand2029Map.get(String(b.label || '')) || {};
    const total2024 = (yearBands || []).reduce((sum, row) => sum + Number(row.households || 0), 0) || null;
    const total2029 = Array.from(incomeBand2029Map.values()).reduce((sum, row) => sum + Number(row.households || 0), 0) || null;
    const pct2024 = total2024 ? (Number(b.households || 0) / total2024) * 100 : null;
    const pct2029 = total2029 ? (Number(future.households || 0) / total2029) * 100 : null;
    return `
    <div class="snapshot-table-row">
      <div><b>${escapeHtml(String(b.label || 'Band'))}</b></div>
      <div>${escapeHtml(quickviewStatValue(b.households, 'int'))}</div>
      <div>${escapeHtml(quickviewStatValue(pct2024, 'pct'))}</div>
      ${showChange ? `<div>${escapeHtml(quickviewStatValue(future.households, 'int'))}</div><div>${escapeHtml(quickviewStatValue(pct2029, 'pct'))}</div><div>${quickviewSignedValueHtml(b.change_from_2024, 'int')}</div><div>${quickviewSignedValueHtml(b.change_from_2024_pct, 'pct')}</div>` : ''}
    </div>`;
  }).join('');

  const segmentRows = consumerSegments.slice(0, 12).map(seg => `<div class="snapshot-table-row"><div><b>${escapeHtml(String(seg.name || 'Segment'))}</b></div><div>${escapeHtml(quickviewStatValue(seg.households, 'int'))}</div><div>${escapeHtml(quickviewStatValue(seg.pct_of_households, 'pct'))}</div></div>`).join('');

  const ageUnder19Pct = meta.population_2024 ? (Number(meta.population_under_19_2024 || 0) / Number(meta.population_2024 || 1)) * 100 : null;
  const age20_64Pct = meta.population_2024 ? (Number(meta.population_20_64_2024 || 0) / Number(meta.population_2024 || 1)) * 100 : null;
  const age65PlusPct = meta.population_2024 ? (Number(meta.population_65_plus_2024 || 0) / Number(meta.population_2024 || 1)) * 100 : null;

  const hh1Pct = meta.households_2024 ? (Number(meta.one_person_households_2024 || 0) / Number(meta.households_2024 || 1)) * 100 : null;
  const hh2Pct = meta.households_2024 ? (Number(meta.two_person_households_2024 || 0) / Number(meta.households_2024 || 1)) * 100 : null;
  const hh3Plus = Number(meta.three_person_households_2024 || 0) + Number(meta.four_person_households_2024 || 0) + Number(meta.five_plus_person_households_2024 || 0);
  const hh3PlusPct = meta.households_2024 ? (hh3Plus / Number(meta.households_2024 || 1)) * 100 : null;

  const growthNote = Number.isFinite(Number(meta.population_growth_2024_2029)) && Number(meta.population_growth_2024_2029) < 0
    ? 'Population is projected to decline slightly in the current pilot dataset.'
    : 'Population is projected to grow in the current pilot dataset.';

  const hasEmploymentData = false;
  const hasRaceEthnicityData = false;
  const pilotNotes = meta.pilot_data_notes || 'Pilot data is being expanded section by section.';

  return `
    <div class="snapshot-intro">
      <div class="snapshot-ribbon">Market Quickview</div>
      <div class="snapshot-center">${escapeHtml(submarketName)} Pilot</div>
      <div class="snapshot-note">Built from the pilot block datasets. This does not change the existing atlas demographics layer.</div>
    </div>

    <details class="quickview-details" open>
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Income</h4><span>Median and mean household income</span></div>
      </summary>
      <div class="quickview-body">
        <div class="snapshot-metric-grid">
          ${renderSnapshotMetric('Median Income', quickviewStatValue(meta.median_household_income, 'money'))}
          ${renderSnapshotMetric('Mean Income', quickviewStatValue(meta.mean_household_income, 'money'))}
          ${renderSnapshotMetric('Prior Median', quickviewStatValue(priorDemo.median_household_income, 'money'))}
          ${renderSnapshotMetric('Forecast Median', quickviewStatValue(forecastDemo.median_household_income, 'money'))}
          ${renderSnapshotMetric('Prior Mean', quickviewStatValue(priorDemo.mean_household_income, 'money'))}
          ${renderSnapshotMetric('Forecast HH Growth', quickviewStatValue(forecastDemo.household_growth_next_5yr_pct, 'pct'))}
        </div>
        <div class="snapshot-subnote">Household income bands below are aggregated from the block ZIP exports; 2029 is the current growth proxy in the pilot data.</div>
        <div style="margin-top:12px;">
          ${renderSnapshotTable(['Income Band', '2024 HH', '2024 %', '2029 HH', '2029 %', 'Change', 'Δ %'], incomeBandRows(incomeBand2024, true), '<div class="snapshot-empty">No income-band data is available for the selected blocks.</div>')}
        </div>
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Population Growth & Households</h4><span>${quickviewStatValue(meta.population_2024, 'int')} people</span></div>
      </summary>
      <div class="quickview-body">
        <div class="snapshot-metric-grid">
          ${renderSnapshotMetric('Population', quickviewStatValue(meta.population_2024, 'int'))}
          ${renderSnapshotMetric('Households', quickviewStatValue(meta.households_2024, 'int'))}
          ${renderSnapshotMetric('Population Growth', quickviewStatValue(meta.population_growth_2024_2029, 'pct'))}
          ${renderSnapshotMetric('Household Growth', quickviewStatValue(meta.households_growth_2024_2029, 'pct'))}
          ${renderSnapshotMetric('Median Age', quickviewStatValue(meta.median_age_2024, 'one'))}
          ${renderSnapshotMetric('Avg HH Size', quickviewStatValue(meta.average_household_size_2024, 'one'))}
        </div>
        <div class="snapshot-metric-grid four-up">
          ${renderSnapshotMetric('Under 19', quickviewStatValue(meta.population_under_19_2024, 'int'), quickviewStatValue(ageUnder19Pct, 'pct'))}
          ${renderSnapshotMetric('20 to 64', quickviewStatValue(meta.population_20_64_2024, 'int'), quickviewStatValue(age20_64Pct, 'pct'))}
          ${renderSnapshotMetric('65 Plus', quickviewStatValue(meta.population_65_plus_2024, 'int'), quickviewStatValue(age65PlusPct, 'pct'))}
          ${renderSnapshotMetric('Coverage', `${coveragePct.toFixed(1)}%`)}
        </div>
        <div class="snapshot-metric-grid four-up">
          ${renderSnapshotMetric('1 Person HH', quickviewStatValue(meta.one_person_households_2024, 'int'), quickviewStatValue(hh1Pct, 'pct'))}
          ${renderSnapshotMetric('2 Person HH', quickviewStatValue(meta.two_person_households_2024, 'int'), quickviewStatValue(hh2Pct, 'pct'))}
          ${renderSnapshotMetric('3+ Person HH', quickviewStatValue(hh3Plus, 'int'), quickviewStatValue(hh3PlusPct, 'pct'))}
          ${renderSnapshotMetric('Coverage Note', 'Pilot only')}
        </div>
        <div class="snapshot-subnote">${escapeHtml(growthNote)}</div>
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Consumer Segments</h4><span>Top household profiles</span></div>
      </summary>
      <div class="quickview-body">
        ${renderSnapshotTable(['Segment', 'Households', 'Share'], segmentRows, '<div class="snapshot-empty">No consumer-segment data is available for the selected blocks.</div>')}
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Education Level</h4><span>${fmtPct(currentDemo.bachelors_plus_pct)} bachelor&apos;s+</span></div>
      </summary>
      <div class="quickview-body">
        <div class="snapshot-metric-grid">
          ${renderSnapshotMetric('Bachelor\'s+', quickviewStatValue(currentDemo.bachelors_plus_pct, 'pct'), quickviewStatValue(currentDemo.bachelors_plus_count, 'int'))}
          ${renderSnapshotMetric('Owner Occupancy', quickviewStatValue(currentDemo.owner_occupancy_pct, 'pct'), quickviewStatValue(currentDemo.owner_occupied_units, 'int'))}
          ${renderSnapshotMetric('Renter Occupancy', quickviewStatValue(currentDemo.renter_occupancy_pct, 'pct'), quickviewStatValue(currentDemo.renter_occupied_units, 'int'))}
          ${renderSnapshotMetric('Population 25+', quickviewStatValue(currentDemo.population_25_plus, 'int'))}
          ${renderSnapshotMetric('Prior Bachelor\'s+', quickviewStatValue(priorDemo.bachelors_plus_pct, 'pct'))}
          ${renderSnapshotMetric('Forecast Bachelor\'s+', quickviewStatValue(forecastDemo.bachelors_plus_pct, 'pct'))}
        </div>
        <div class="snapshot-subnote">Education detail is drawn from the submarket-level model because the pilot block ZIP exports do not yet carry full education tables.</div>
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Employment / Occupation</h4><span>Awaiting source table</span></div>
      </summary>
      <div class="quickview-body">
        ${hasEmploymentData ? '<div class="snapshot-empty">Employment data available.</div>' : '<div class="snapshot-empty">Employment / occupation tables are not present in the current pilot ZIP exports yet. Add those source tables and this section will populate automatically.</div>'}
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Race / Ethnicity</h4><span>Awaiting source table</span></div>
      </summary>
      <div class="quickview-body">
        ${hasRaceEthnicityData ? '<div class="snapshot-empty">Race / ethnicity data available.</div>' : '<div class="snapshot-empty">Race / ethnicity tables are not present in the current pilot ZIP exports yet. Add those source tables and this section will populate automatically.</div>'}
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Top Blocks by Population</h4><span>${Math.min(10, blocks.length).toLocaleString()} blocks</span></div>
      </summary>
      <div class="quickview-body">
        ${renderSnapshotTable(['Block', 'Population', 'Households', 'Median Income'], popTopRows, '<div class="snapshot-empty">No block data available.</div>')}
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Top Blocks by Income</h4><span>${Math.min(10, blocks.length).toLocaleString()} blocks</span></div>
      </summary>
      <div class="quickview-body">
        ${renderSnapshotTable(['Block', 'Median Income', 'Mean Income', 'Households'], incomeTopRows, '<div class="snapshot-empty">No block data available.</div>')}
      </div>
    </details>

    <details class="quickview-details" open>
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>All Blocks</h4><span>${blocks.length.toLocaleString()} block rows</span></div>
      </summary>
      <div class="quickview-body">
        ${renderSnapshotTable(['Block', 'Population', 'Households', 'Median Income', 'Mean Income', 'Median Age', 'Home Value', 'Avg HH Size'], blockRows, '<div class="snapshot-empty">No block data available.</div>')}
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Data Quality</h4><span>${coveragePct.toFixed(1)}% coverage</span></div>
      </summary>
      <div class="quickview-body">
        <div class="snapshot-metric-grid four-up">
          ${renderSnapshotMetric('Uploaded', String(totalBlocks))}
          ${renderSnapshotMetric('Usable', String(usableBlocks))}
          ${renderSnapshotMetric('Anomalous', String(anomalousBlocks))}
          ${renderSnapshotMetric('Coverage', `${coveragePct.toFixed(1)}%`)}
        </div>
        <div class="snapshot-subnote">${escapeHtml(pilotNotes)}</div>
      </div>
    </details>
  `;
}

async function openMarketQuickview() {

  if (!state.marketQuickview?.loaded || !state.marketQuickview.data) {
    alert('Market Quickview data is not loaded yet.');
    return;
  }
  const submarket = quickviewSelectedSubmarket();
  const data = quickviewDataForSubmarket(submarket);
  const title = 'Market Quickview';
  const subtitle = `${submarket} pilot dataset`;
  openMarketQuickviewModal(title, subtitle, buildMarketQuickviewHtml(data));
}

function openMarketQuickviewReportFromPrompt() {
  const s = state.marketQuickview || {};
  if (!s.pendingCenter || !s.radiusMiles) return;
  void ensureQuickviewDataLoaded();
  const center = s.pendingCenter instanceof L.LatLng ? s.pendingCenter : L.latLng(s.pendingCenter.lat, s.pendingCenter.lng);
  const html = buildMarketQuickviewHtml(center, s.radiusMiles);
  openMarketQuickviewModal('Market Quickview', `${marketQuickviewRadiusLabel(s.radiusMiles)} centered at ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`, html);
}
function marketQuickviewRadiusLabel(radiusMiles) {
  return `${radiusMiles} mile${Number(radiusMiles) === 1 ? '' : 's'}`;
}

function marketQuickviewModeActive() {
  return !!(state.marketQuickview && state.marketQuickview.active);
}

function updateMarketQuickviewUI() {
  const panel = document.getElementById('marketQuickviewPanel');
  const button = document.getElementById('marketQuickviewToggle');
  const hint = document.getElementById('marketQuickviewHint');
  const active = marketQuickviewModeActive();
  if (panel) {
    panel.classList.toggle('active', active);
    panel.querySelectorAll('.market-quickview-radius').forEach(btn => {
      btn.classList.toggle('active', active && Number(btn.dataset.radius) === Number(state.marketQuickview.radiusMiles));
    });
  }
  if (button) button.textContent = active ? 'Cancel Market Quickview' : 'Market Quickview';
  if (hint) {
    hint.textContent = active
      ? (state.marketQuickview.radiusMiles ? `Radius selected: ${marketQuickviewRadiusLabel(state.marketQuickview.radiusMiles)}. Click a point on the map.` : 'Choose a radius, then click a point on the map.')
      : 'Click Market Quickview to begin.';
  }
  document.body.classList.toggle('quickview-mode', active && !!state.marketQuickview.radiusMiles);
}

function setMarketQuickviewMode(active, radiusMiles = null) {
  state.marketQuickview = state.marketQuickview || { active: false, loaded: false, data: null, submarket: MARKET_QUICKVIEW_DEFAULT_SUBMARKET, radiusMiles: null, awaitingPoint: false, busy: false, pendingCenter: null, radiusLayer: null, radiusCircle: null, promptMarker: null };
  const prevRadius = state.marketQuickview.radiusMiles;
  state.marketQuickview.active = !!active;
  state.marketQuickview.awaitingPoint = !!active;
  if (radiusMiles !== null && radiusMiles !== undefined) state.marketQuickview.radiusMiles = Number(radiusMiles);
  if (!active) {
    state.marketQuickview.radiusMiles = null;
    state.marketQuickview.awaitingPoint = false;
    state.marketQuickview.busy = false;
    clearRadiusPromptOverlay('quickview');
  } else if (prevRadius !== null && prevRadius !== undefined && state.marketQuickview.radiusMiles !== prevRadius) {
    clearRadiusPromptOverlay('quickview');
  }
  updateMarketQuickviewUI();
}

function resetMarketQuickviewMode() {
  state.marketQuickview = state.marketQuickview || { active: false, loaded: false, data: null, submarket: MARKET_QUICKVIEW_DEFAULT_SUBMARKET, radiusMiles: null, awaitingPoint: false, busy: false, pendingCenter: null, radiusLayer: null, radiusCircle: null, promptMarker: null };
  clearRadiusPromptOverlay('quickview');
  state.marketQuickview.active = false;
  state.marketQuickview.awaitingPoint = false;
  state.marketQuickview.radiusMiles = null;
  state.marketQuickview.busy = false;
  updateMarketQuickviewUI();
}

function quickviewNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function quickviewSumRowMap(target, source, valueKey = '2024') {
  if (!source) return target;
  Object.entries(source).forEach(([label, row]) => {
    const n = quickviewNum(row && row[valueKey]);
    if (!Number.isFinite(n)) return;
    target[label] = (target[label] || 0) + n;
  });
  return target;
}

function quickviewWeightedMedian(pairs) {
  const items = (pairs || [])
    .filter(p => Number.isFinite(Number(p?.value)) && Number.isFinite(Number(p?.weight)) && Number(p.weight) > 0)
    .map(p => ({ value: Number(p.value), weight: Number(p.weight) }))
    .sort((a, b) => a.value - b.value);
  if (!items.length) return null;
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let running = 0;
  for (const item of items) {
    running += item.weight;
    if (running >= totalWeight / 2) return item.value;
  }
  return items[items.length - 1].value;
}

function quickviewWeightedAverage(pairs) {
  const items = (pairs || []).filter(p => Number.isFinite(Number(p?.value)) && Number.isFinite(Number(p?.weight)) && Number(p.weight) > 0);
  if (!items.length) return null;
  const weighted = items.reduce((sum, item) => sum + Number(item.value) * Number(item.weight), 0);
  const weight = items.reduce((sum, item) => sum + Number(item.weight), 0);
  return weight ? weighted / weight : null;
}

function quickviewRoundPct(n) {
  return Number.isFinite(Number(n)) ? Number(n) : null;
}

function quickviewSortedRows(map, total, limit = null, labelMap = null) {
  return Object.entries(map || {})
    .map(([label, value]) => ({ label, value: Number(value) }))
    .filter(row => Number.isFinite(row.value) && row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit || undefined)
    .map(row => {
      const label = labelMap && labelMap[row.label] ? labelMap[row.label] : row.label;
      const share = total ? (row.value / total) * 100 : null;
      return { ...row, label, share };
    });
}

function quickviewAggregateBlocks(features) {
  const totals = {
    selectedBlocks: 0,
    usableBlocks: 0,
    anomalousBlocks: 0,
    population_2024: 0,
    population_2029: 0,
    households_2024: 0,
    households_2029: 0,
    owner_occupied_units_2024: 0,
    renter_occupied_units_2024: 0,
    median_home_value_2024: [],
    median_income_2024: [],
    mean_income_2024: [],
    median_age_2024: [],
    avg_hh_size_2024: [],
    under19_2024: 0,
    age20_64_2024: 0,
    age65_plus_2024: 0,
    hh1_2024: 0,
    hh2_2024: 0,
    hh3plus_2024: 0,
    family_2024: 0,
    married_family_2024: 0,
    married_family_with_children_2024: 0,
    married_family_without_children_2024: 0,
    other_family_2024: 0,
    consumerSegments: {},
    employment: {},
    occupation: {},
    education: {},
    raceMix: {},
    ethnicitySplit: {},
    incomeAge: { '2020': {}, '2024': {}, '2029': {} }
  };

  const raceMixLabels = new Set([
    'White alone',
    'Black alone',
    'Black or African American alone',
    'American Indian and Alaska Native alone',
    'Asian alone',
    'Native Hawaiian and OPI alone',
    'Native Hawaiian and Other Pacific Islander alone',
    'Some other race alone',
    'Some Other Race alone',
    'Two or more races alone',
    'Two or More Races Alone'
  ]);

  const ethnicityGroups = {
    Hispanic: {},
    'Not Hispanic': {}
  };

  const validFeatures = (features || []).filter(feature => {
    const p = feature.properties || {};
    return p.data_status !== 'no data' && !p.is_anomalous;
  });

  for (const feature of validFeatures) {
    const p = feature.properties || {};
    totals.selectedBlocks += 1;
    totals.usableBlocks += 1;

    const ds = p.demographic_snapshot || {};
    const pt = p.population_trends || {};
    const ht = p.household_trends || {};
    const inc = p.income_age || {};

    const pop24 = quickviewNum(p.population_2024 ?? ds['Total Population']?.['2024'] ?? pt['Total Population']?.['2024']);
    const pop29 = quickviewNum(p.population_2029 ?? ds['Total Population']?.['2029'] ?? pt['Total Population']?.['2029']);
    const hh24 = quickviewNum(p.households_2024 ?? ds['Households']?.['2024'] ?? ht['Households']?.['2024']);
    const hh29 = quickviewNum(p.households_2029 ?? ds['Households']?.['2029'] ?? ht['Households']?.['2029']);

    totals.population_2024 += pop24 || 0;
    totals.population_2029 += pop29 || 0;
    totals.households_2024 += hh24 || 0;
    totals.households_2029 += hh29 || 0;

    const owner2024 = quickviewNum(ds['Owner Occupied Housing Units']?.['2024'] ?? ht['Owner Occupied Housing Units']?.['2024'] ?? p.owner_occupied_units_2024);
    const renter2024 = quickviewNum(ds['Renter Occupied Housing Units']?.['2024'] ?? ht['Renter Occupied Housing Units']?.['2024'] ?? p.renter_occupied_units_2024);
    totals.owner_occupied_units_2024 += owner2024 || 0;
    totals.renter_occupied_units_2024 += renter2024 || 0;

    const totalAge2024 = quickviewNum(ds['Total Population: Under 19 years']?.['2024']);
    const total20_64_2024 = quickviewNum(ds['Total Population: 20 - 64 years']?.['2024']);
    const total65Plus_2024 = quickviewNum(ds['Total Population: 65 years and over']?.['2024']);
    totals.under19_2024 += totalAge2024 || 0;
    totals.age20_64_2024 += total20_64_2024 || 0;
    totals.age65_plus_2024 += total65Plus_2024 || 0;

    const hh1 = quickviewNum(ht['1 Person Households']?.['2024']);
    const hh2 = quickviewNum(ht['2 Person Households']?.['2024']);
    const hh3 = quickviewNum(ht['3 Person Households']?.['2024']);
    const hh4 = quickviewNum(ht['4 Person Households']?.['2024']);
    const hh5 = quickviewNum(ht['5 Person Households']?.['2024']);
    const hh6 = quickviewNum(ht['6 Person Households']?.['2024']);
    const hh7 = quickviewNum(ht['7+ Person Households']?.['2024']);
    totals.hh1_2024 += hh1 || 0;
    totals.hh2_2024 += hh2 || 0;
    totals.hh3plus_2024 += (hh3 || 0) + (hh4 || 0) + (hh5 || 0) + (hh6 || 0) + (hh7 || 0);
    totals.family_2024 += quickviewNum(ht['Household Type: Family']?.['2024']) || 0;
    totals.married_family_2024 += quickviewNum(ht['Household Type: Married Family']?.['2024']) || 0;
    totals.married_family_with_children_2024 += quickviewNum(ht['Household Type: Married Family With Children']?.['2024']) || 0;
    totals.married_family_without_children_2024 += quickviewNum(ht['Household Type: Married Family Without Children']?.['2024']) || 0;
    totals.other_family_2024 += quickviewNum(ht['Household Type: Other Family']?.['2024']) || 0;

    const medIncome = quickviewNum(p.median_household_income_2024 ?? ds['Household Income: Median']?.['2024'] ?? pt['Household Income: Median']?.['2024']);
    const meanIncome = quickviewNum(p.mean_household_income_2024 ?? ds['Household Income: Average']?.['2024'] ?? ht['Household Income: Average']?.['2024'] ?? pt['Household Income: Average']?.['2024'] ?? ds['Household Income: Mean']?.['2024'] ?? ht['Household Income: Mean']?.['2024'] ?? pt['Household Income: Mean']?.['2024']);
    const medianAge = quickviewNum(p.median_age_2024 ?? ds['Total population: Median age']?.['2024'] ?? pt['Total population: Median Age']?.['2024']);
    const avgHhSize = quickviewNum(p.average_household_size_2024 ?? ht['Average Household Size']?.['2024']);
    const homeValue = quickviewNum(p.median_home_value_2024 ?? ds['Home Value: Median']?.['2024']);
    if (medIncome !== null) totals.median_income_2024.push({ value: medIncome, weight: hh24 || 1 });
    if (meanIncome !== null) totals.mean_income_2024.push({ value: meanIncome, weight: hh24 || 1 });
    if (medianAge !== null) totals.median_age_2024.push({ value: medianAge, weight: pop24 || 1 });
    if (avgHhSize !== null) totals.avg_hh_size_2024.push({ value: avgHhSize, weight: hh24 || 1 });
    if (homeValue !== null) totals.median_home_value_2024.push({ value: homeValue, weight: hh24 || 1 });

    quickviewSumRowMap(totals.consumerSegments, p.consumer_segments || {}, 'households');

    Object.entries(ds).forEach(([label, row]) => {
      if (!label || !label.startsWith('Educational Attainment:')) return;
      totals.education[label.replace('Educational Attainment:', '').trim()] = (totals.education[label.replace('Educational Attainment:', '').trim()] || 0) + (quickviewNum(row?.['2024']) || 0);
    });

    Object.entries(pt).forEach(([label, row]) => {
      if (!label) return;
      if (label.startsWith('Employment Status:')) {
        totals.employment[label.replace('Employment Status:', '').trim()] = (totals.employment[label.replace('Employment Status:', '').trim()] || 0) + (quickviewNum(row?.['2024']) || 0);
      } else if (label.startsWith('Occupation:')) {
        totals.occupation[label.replace('Occupation:', '').trim()] = (totals.occupation[label.replace('Occupation:', '').trim()] || 0) + (quickviewNum(row?.['2024']) || 0);
      } else if (raceMixLabels.has(label)) {
        totals.raceMix[label] = (totals.raceMix[label] || 0) + (quickviewNum(row?.['2024']) || 0);
      } else if (label.startsWith('Hispanic:')) {
        const key = label.replace('Hispanic:', '').trim() || 'Hispanic';
        ethnicityGroups.Hispanic[key] = (ethnicityGroups.Hispanic[key] || 0) + (quickviewNum(row?.['2024']) || 0);
      } else if (label.startsWith('Not Hispanic:')) {
        const key = label.replace('Not Hispanic:', '').trim() || 'Not Hispanic';
        ethnicityGroups['Not Hispanic'][key] = (ethnicityGroups['Not Hispanic'][key] || 0) + (quickviewNum(row?.['2024']) || 0);
      }
    });

    const hasIncomeAgeBands = Object.values(inc || {}).some(bands => bands && typeof bands === 'object' && Object.keys(bands).length);
    if (hasIncomeAgeBands) {
      Object.entries(inc).forEach(([year, bands]) => {
        if (!totals.incomeAge[year]) totals.incomeAge[year] = {};
        Object.entries(bands || {}).forEach(([bandLabel, ages]) => {
          if (!totals.incomeAge[year][bandLabel]) totals.incomeAge[year][bandLabel] = {};
          Object.entries(ages || {}).forEach(([ageLabel, value]) => {
            totals.incomeAge[year][bandLabel][ageLabel] = (totals.incomeAge[year][bandLabel][ageLabel] || 0) + Number(value || 0);
          });
        });
      });
    } else {
      // Newer Quickview exports already carry household-income bands in the
      // demographic snapshot even when the income-by-age parser has no rows.
      // Use those in-memory values immediately rather than showing a false
      // "still loading" state or triggering any secondary request.
      Object.entries(ds).forEach(([label, row]) => {
        const match = String(label || '').match(/^Household income:\s*(.+)$/i);
        if (!match) return;
        const bandLabel = match[1].trim();
        if (!bandLabel || /^(median|average|mean)$/i.test(bandLabel)) return;
        ['2020', '2024', '2029'].forEach(year => {
          const value = quickviewNum(row?.[year]);
          if (value === null) return;
          if (!totals.incomeAge[year]) totals.incomeAge[year] = {};
          if (!totals.incomeAge[year][bandLabel]) totals.incomeAge[year][bandLabel] = {};
          totals.incomeAge[year][bandLabel]['All Ages'] = (totals.incomeAge[year][bandLabel]['All Ages'] || 0) + value;
        });
      });
    }
  }

  totals.anomalousBlocks = (features || []).filter(feature => (feature.properties || {}).is_anomalous).length;

  const educationTotal = Object.values(totals.education).reduce((sum, v) => sum + Number(v || 0), 0) || null;
  const raceTotal = Object.values(totals.raceMix).reduce((sum, v) => sum + Number(v || 0), 0) || null;
  const employmentTotal = Object.values(totals.employment).reduce((sum, v) => sum + Number(v || 0), 0) || null;
  const occupationTotal = Object.values(totals.occupation).reduce((sum, v) => sum + Number(v || 0), 0) || null;
  const consumerTotal = Object.values(totals.consumerSegments).reduce((sum, v) => sum + Number(v || 0), 0) || null;
  const ethnicityTotal = {
    Hispanic: Object.values(ethnicityGroups.Hispanic).reduce((sum, v) => sum + Number(v || 0), 0),
    'Not Hispanic': Object.values(ethnicityGroups['Not Hispanic']).reduce((sum, v) => sum + Number(v || 0), 0)
  };

  const incomeBandOrder = [
    'Less than 25k',
    '25k - 50k',
    '50k - 75k',
    '75k - 100k',
    '100k - 125k',
    '125k - 150k',
    '150k - 200k',
    'Above 200k'
  ];
  const normalizeIncomeBandLabel = label => String(label || '')
    .toLowerCase()
    .replace(/income/g, '')
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const incomeBandRank = label => incomeBandLowerBound(label);
  const incomeBandRows = year => Object.entries(totals.incomeAge[year] || {})
    .map(([label, ages]) => ({
      label,
      households: Object.values(ages || {}).reduce((sum, v) => sum + Number(v || 0), 0)
    }))
    .sort((a, b) => incomeBandRank(a.label) - incomeBandRank(b.label) || String(a.label).localeCompare(String(b.label)));

  const income2024 = incomeBandRows('2024');
  const income2029 = incomeBandRows('2029');
  const income2029Map = new Map(income2029.map(row => [row.label, row.households]));
  const incomeRows = income2024.map(row => {
    const future = income2029Map.get(row.label) || 0;
    const change = future - row.households;
    const pct = row.households ? (change / row.households) * 100 : null;
    return { ...row, future, change, pct };
  });

  return {
    totals,
    summary: {
      population_2024: totals.population_2024,
      population_2029: totals.population_2029,
      households_2024: totals.households_2024,
      households_2029: totals.households_2029,
      median_household_income: quickviewWeightedMedian(totals.median_income_2024),
      mean_household_income: quickviewWeightedAverage(totals.mean_income_2024),
      median_age: quickviewWeightedAverage(totals.median_age_2024),
      median_home_value: quickviewWeightedMedian(totals.median_home_value_2024),
      avg_household_size: quickviewWeightedAverage(totals.avg_hh_size_2024),
      owner_occupancy_pct: totals.owner_occupied_units_2024 + totals.renter_occupied_units_2024 ? (totals.owner_occupied_units_2024 / (totals.owner_occupied_units_2024 + totals.renter_occupied_units_2024)) * 100 : null,
      renter_occupancy_pct: totals.owner_occupied_units_2024 + totals.renter_occupied_units_2024 ? (totals.renter_occupied_units_2024 / (totals.owner_occupied_units_2024 + totals.renter_occupied_units_2024)) * 100 : null,
      population_growth_2024_2029_pct: totals.population_2024 ? ((totals.population_2029 - totals.population_2024) / totals.population_2024) * 100 : null,
      households_growth_2024_2029_pct: totals.households_2024 ? ((totals.households_2029 - totals.households_2024) / totals.households_2024) * 100 : null,
      under19_pct: totals.population_2024 ? (totals.under19_2024 / totals.population_2024) * 100 : null,
      age20_64_pct: totals.population_2024 ? (totals.age20_64_2024 / totals.population_2024) * 100 : null,
      age65_plus_pct: totals.population_2024 ? (totals.age65_plus_2024 / totals.population_2024) * 100 : null,
      hh1_pct: totals.households_2024 ? (totals.hh1_2024 / totals.households_2024) * 100 : null,
      hh2_pct: totals.households_2024 ? (totals.hh2_2024 / totals.households_2024) * 100 : null,
      hh3plus_pct: totals.households_2024 ? (totals.hh3plus_2024 / totals.households_2024) * 100 : null,
      family_pct: totals.households_2024 ? (totals.family_2024 / totals.households_2024) * 100 : null,
      married_family_pct: totals.households_2024 ? (totals.married_family_2024 / totals.households_2024) * 100 : null,
      married_family_with_children_pct: totals.households_2024 ? (totals.married_family_with_children_2024 / totals.households_2024) * 100 : null,
      married_family_without_children_pct: totals.households_2024 ? (totals.married_family_without_children_2024 / totals.households_2024) * 100 : null,
      other_family_pct: totals.households_2024 ? (totals.other_family_2024 / totals.households_2024) * 100 : null,
      education_total: educationTotal,
      race_total: raceTotal,
      employment_total: employmentTotal,
      occupation_total: occupationTotal,
      consumer_total: consumerTotal,
      ethnicity_total: ethnicityTotal
    },
    consumerSegments: quickviewSortedRows(totals.consumerSegments, consumerTotal, 12),
    educationRows: quickviewSortedRows(totals.education, educationTotal, 10),
    employmentRows: quickviewSortedRows(totals.employment, employmentTotal, 10),
    occupationRows: quickviewSortedRows(totals.occupation, occupationTotal, 12),
    raceRows: quickviewSortedRows(totals.raceMix, raceTotal, 8),
    ethnicityRows: [
      { label: 'Hispanic', value: ethnicityTotal.Hispanic, share: totals.population_2024 ? (ethnicityTotal.Hispanic / totals.population_2024) * 100 : null },
      { label: 'Not Hispanic', value: ethnicityTotal['Not Hispanic'], share: totals.population_2024 ? (ethnicityTotal['Not Hispanic'] / totals.population_2024) * 100 : null }
    ],
    incomeRows,
    blocksInRadius: (features || []).length,
    usableBlocksInRadius: validFeatures.length,
    anomalousBlocksInRadius: totals.anomalousBlocks
  };
}

function buildMarketQuickviewHtml(centerLatLng, radiusMiles, includeIntro = true) {
  const radiusLabel = marketQuickviewRadiusLabel(radiusMiles);
  const quickviewLoaded = !!state.quickviewBlocksLoaded;
  const selectedBlocks = featuresWithinRadius(state.quickviewBlocks || [], centerLatLng, radiusMiles);
  const summaryData = quickviewAggregateBlocks(selectedBlocks.map(entry => entry.feature));
  const s = summaryData.summary;
  const selectedCount = summaryData.blocksInRadius;
  const usableCount = summaryData.usableBlocksInRadius;
  const anomalousCount = summaryData.anomalousBlocksInRadius;
  const coveragePct = selectedCount ? (usableCount / selectedCount) * 100 : 0;
  const selectedNote = quickviewLoaded
    ? (selectedCount ? `${selectedCount.toLocaleString()} analysis blocks inside the radius` : 'No quickview blocks found in this radius.')
    : 'Quickview data is still loading.';

  const totalIncome2024 = Number(s.households_2024 || 0) || null;
  const totalIncome2029 = Number(s.households_2029 || 0) || null;
  const incomeRowsHtml = quickviewLoaded ? summaryData.incomeRows.map(row => {
    const pct2024 = totalIncome2024 ? (Number(row.households || 0) / totalIncome2024) * 100 : null;
    const pct2029 = totalIncome2029 ? (Number(row.future || 0) / totalIncome2029) * 100 : null;
    return `
    <div class="snapshot-table-row">
      <div><b>${escapeHtml(row.label)}</b></div>
      <div>${escapeHtml(quickviewStatValue(row.households, 'int'))}</div>
      <div>${escapeHtml(quickviewStatValue(pct2024, 'pct'))}</div>
      <div>${escapeHtml(quickviewStatValue(row.future, 'int'))}</div>
      <div>${escapeHtml(quickviewStatValue(pct2029, 'pct'))}</div>
      <div>${quickviewSignedValueHtml(row.change, 'int')}</div>
      <div>${quickviewSignedValueHtml(row.pct, 'pct')}</div>
    </div>`;
  }).join('') : '';

  const consumerRows = quickviewLoaded ? summaryData.consumerSegments.map(row => `<div class="snapshot-table-row"><div><b>${escapeHtml(row.label)}</b></div><div>${escapeHtml(quickviewStatValue(row.value, 'int'))}</div><div>${escapeHtml(quickviewStatValue(row.share, 'pct'))}</div></div>`).join('') : '';
  const educationRows = quickviewLoaded ? summaryData.educationRows.map(row => `<div class="snapshot-table-row"><div><b>${escapeHtml(row.label)}</b></div><div>${escapeHtml(quickviewStatValue(row.value, 'int'))}</div><div>${escapeHtml(quickviewStatValue(row.share, 'pct'))}</div></div>`).join('') : '';
  const employmentRows = quickviewLoaded ? summaryData.employmentRows.map(row => `<div class="snapshot-table-row"><div><b>${escapeHtml(row.label)}</b></div><div>${escapeHtml(quickviewStatValue(row.value, 'int'))}</div><div>${escapeHtml(quickviewStatValue(row.share, 'pct'))}</div></div>`).join('') : '';
  const occupationRows = quickviewLoaded ? summaryData.occupationRows.map(row => `<div class="snapshot-table-row"><div><b>${escapeHtml(row.label)}</b></div><div>${escapeHtml(quickviewStatValue(row.value, 'int'))}</div><div>${escapeHtml(quickviewStatValue(row.share, 'pct'))}</div></div>`).join('') : '';
  const raceRows = quickviewLoaded ? summaryData.raceRows.map(row => `<div class="snapshot-table-row"><div><b>${escapeHtml(row.label)}</b></div><div>${escapeHtml(quickviewStatValue(row.value, 'int'))}</div><div>${escapeHtml(quickviewStatValue(row.share, 'pct'))}</div></div>`).join('') : '';
  const ethnicityRows = quickviewLoaded ? summaryData.ethnicityRows.map(row => `<div class="snapshot-table-row"><div><b>${escapeHtml(row.label)}</b></div><div>${escapeHtml(quickviewStatValue(row.value, 'int'))}</div><div>${escapeHtml(quickviewStatValue(row.share, 'pct'))}</div></div>`).join('') : '';

  return `
    ${includeIntro ? `<div class="snapshot-intro">
      <div class="snapshot-ribbon">Zonda Demographics Data</div>
      <div class="snapshot-center">Radius center: ${escapeHtml(centerLatLng.lat.toFixed(5))}, ${escapeHtml(centerLatLng.lng.toFixed(5))}</div>
      <div class="snapshot-note">Zonda demographic sections summarize the Market Quickview block datasets intersecting the selected radius.</div>
    </div>` : ''}

    <details class="quickview-details" open>
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Overview</h4><span>${selectedNote}</span></div>
      </summary>
      <div class="quickview-body">
        <div class="snapshot-metric-grid">
          ${renderSnapshotMetric('Population', quickviewStatValue(s.population_2024, 'int'))}
          ${renderSnapshotMetric('Households', quickviewStatValue(s.households_2024, 'int'))}
          ${renderSnapshotMetric('Median Income', quickviewStatValue(s.median_household_income, 'money'))}
          ${renderSnapshotMetric('Mean Income', quickviewStatValue(s.mean_household_income, 'money'))}
          ${renderSnapshotMetric('Median Age', quickviewStatValue(s.median_age, 'one'))}
          ${renderSnapshotMetric('Avg HH Size', quickviewStatValue(s.avg_household_size, 'one'))}
        </div>
        <div class="snapshot-metric-grid four-up">
          ${renderSnapshotMetric('Owner Occupancy', quickviewStatValue(s.owner_occupancy_pct, 'pct'))}
          ${renderSnapshotMetric('Renter Occupancy', quickviewStatValue(s.renter_occupancy_pct, 'pct'))}
          ${renderSnapshotMetric('Population Growth', quickviewStatValue(s.population_growth_2024_2029_pct, 'pct'))}
          ${renderSnapshotMetric('Household Growth', quickviewStatValue(s.households_growth_2024_2029_pct, 'pct'))}
        </div>
        <div class="snapshot-metric-grid four-up">
          ${renderSnapshotMetric('Under 19', quickviewStatValue(s.under19_pct, 'pct'))}
          ${renderSnapshotMetric('20 to 64', quickviewStatValue(s.age20_64_pct, 'pct'))}
          ${renderSnapshotMetric('65 Plus', quickviewStatValue(s.age65_plus_pct, 'pct'))}
          ${renderSnapshotMetric('Coverage', `${coveragePct.toFixed(1)}%`)}
        </div>
        <div class="snapshot-metric-grid four-up">
          ${renderSnapshotMetric('1 Person HH', quickviewStatValue(s.hh1_pct, 'pct'))}
          ${renderSnapshotMetric('2 Person HH', quickviewStatValue(s.hh2_pct, 'pct'))}
          ${renderSnapshotMetric('3+ Person HH', quickviewStatValue(s.hh3plus_pct, 'pct'))}
          ${renderSnapshotMetric('Anomalous Blocks', String(anomalousCount))}
        </div>
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Income Bands</h4><span>${selectedCount.toLocaleString()} blocks • 2024 to 2029</span></div>
      </summary>
      <div class="quickview-body">
        <div class="snapshot-subnote">Pilot data currently provides 2024 and 2029 snapshots. The table below shows projected household counts by income band for the selected radius.</div>
        ${renderSnapshotTable(['Income Band', '2024 HH', '2024 %', '2029 HH', '2029 %', 'Change', 'Δ %'], incomeRowsHtml, '<div class="snapshot-empty">No income-band data is available for the selected blocks.</div>')}
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Consumer Segments</h4><span>${summaryData.consumerSegments.length.toLocaleString()} segments</span></div>
      </summary>
      <div class="quickview-body">
        ${renderSnapshotTable(['Segment', 'Households', 'Share'], consumerRows, '<div class="snapshot-empty">No consumer-segment data is available for the selected blocks.</div>')}
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Employment / Occupation</h4><span>${summaryData.employmentRows.length.toLocaleString()} employment rows</span></div>
      </summary>
      <div class="quickview-body">
        <div class="snapshot-subnote">Employment status and occupation are pulled from the underlying block export tables.</div>
        <div style="margin-top:12px;">${renderSnapshotTable(['Employment Status', 'Count', 'Share'], employmentRows, '<div class="snapshot-empty">No employment data is available for the selected blocks.</div>')}</div>
        <div style="margin-top:12px;">${renderSnapshotTable(['Occupation', 'Count', 'Share'], occupationRows, '<div class="snapshot-empty">No occupation data is available for the selected blocks.</div>')}</div>
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Education Level</h4><span>${quickviewStatValue(s.education_total, 'int')} observations</span></div>
      </summary>
      <div class="quickview-body">
        ${renderSnapshotTable(['Attainment', 'Count', 'Share'], educationRows, '<div class="snapshot-empty">No education data is available for the selected blocks.</div>')}
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Race / Ethnicity</h4><span>${quickviewStatValue(s.race_total, 'int')} race records</span></div>
      </summary>
      <div class="quickview-body">
        <div class="snapshot-subnote">Race mix uses the standard race categories; ethnicity is shown separately below.</div>
        <div style="margin-top:12px;">${renderSnapshotTable(['Race', 'Count', 'Share'], raceRows, '<div class="snapshot-empty">No race data is available for the selected blocks.</div>')}</div>
        <div style="margin-top:12px;">${renderSnapshotTable(['Ethnicity', 'Count', 'Share'], ethnicityRows, '<div class="snapshot-empty">No ethnicity data is available for the selected blocks.</div>')}</div>
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Household Structure</h4><span>${quickviewStatValue(s.family_pct, 'pct')} family households</span></div>
      </summary>
      <div class="quickview-body">
        <div class="snapshot-metric-grid four-up">
          ${renderSnapshotMetric('Family Households', quickviewStatValue(s.family_pct, 'pct'))}
          ${renderSnapshotMetric('Married Family', quickviewStatValue(s.married_family_pct, 'pct'))}
          ${renderSnapshotMetric('Married w/ Children', quickviewStatValue(s.married_family_with_children_pct, 'pct'))}
          ${renderSnapshotMetric('Married w/o Children', quickviewStatValue(s.married_family_without_children_pct, 'pct'))}
        </div>
        <div class="snapshot-metric-grid four-up">
          ${renderSnapshotMetric('Other Family', quickviewStatValue(s.other_family_pct, 'pct'))}
          ${renderSnapshotMetric('Population 2024', quickviewStatValue(s.population_2024, 'int'))}
          ${renderSnapshotMetric('Population 2029', quickviewStatValue(s.population_2029, 'int'))}
          ${renderSnapshotMetric('Households 2029', quickviewStatValue(s.households_2029, 'int'))}
        </div>
      </div>
    </details>

    <details class="quickview-details">
      <summary>
        <div class="snapshot-section-head quickview-head"><h4>Data Quality</h4><span>${coveragePct.toFixed(1)}% coverage</span></div>
      </summary>
      <div class="quickview-body">
        <div class="snapshot-metric-grid four-up">
          ${renderSnapshotMetric('Blocks in Radius', String(selectedCount))}
          ${renderSnapshotMetric('Usable Blocks', String(usableCount))}
          ${renderSnapshotMetric('Anomalous Blocks', String(anomalousCount))}
          ${renderSnapshotMetric('Coverage', `${coveragePct.toFixed(1)}%`)}
        </div>
        <div class="snapshot-subnote">Quickview uses your pilot block data and hides the underlying block IDs from the report.</div>
      </div>
    </details>
  `;
}

async function ensureQuickviewDataLoaded() {
  if (state.quickviewBlocksLoaded) return;
  try {
    const sources = [
      'data/market_quickview/central_mobile_quickview_blocks.geojson',
      'data/market_quickview/central_baldwin_quickview_blocks.geojson',
      'data/market_quickview/west_baldwin_quickview_blocks.geojson',
      'data/market_quickview/south_mobile_quickview_blocks.geojson',
      'data/market_quickview/north_mobile_quickview_blocks.geojson',
      'data/market_quickview/south_baldwin_quickview_blocks.geojson',
      'data/market_quickview/pensacola_quickview_blocks.geojson',
      'data/market_quickview/cantonment_quickview_blocks.geojson',
      'data/market_quickview/pace_quickview_blocks.geojson',
      'data/market_quickview/milton_quickview_blocks.geojson',
      'data/market_quickview/pensacola_beaches_quickview_blocks.geojson',
      'data/market_quickview/fort_walton_quickview_blocks.geojson',
      'data/market_quickview/crestview_quickview_blocks.geojson',
      'data/market_quickview/laurel_hill_quickview_blocks.geojson',
      'data/market_quickview/walton_bay_beaches_quickview_blocks.geojson',
      'data/market_quickview/freeport_quickview_blocks.geojson',
      'data/market_quickview/defuniak_springs_quickview_blocks.geojson',
      'data/market_quickview/panama_city_quickview_blocks.geojson',
      'data/market_quickview/marianna_quickview_blocks.geojson'
    ];
    const loaded = await Promise.all(sources.map(src => fetch(src).then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] }))));
    state.quickviewBlocks = loaded.flatMap(fc => fc.features || []);
    state.quickviewBlocksLoaded = state.quickviewBlocks.length > 0;
    state.marketQuickview.loaded = state.quickviewBlocksLoaded;
  } catch (err) {
    console.warn('Quickview blocks not available', err);
  }
}

async function handleMarketQuickviewPoint(latlng) {
  if (!marketQuickviewModeActive() || !state.marketQuickview.radiusMiles) return;
  const center = latlng instanceof L.LatLng ? latlng : L.latLng(latlng.lat, latlng.lng);
  showRadiusPrompt('quickview', center, state.marketQuickview.radiusMiles);
}

function toggleMarketQuickviewMode() {
  if (marketQuickviewModeActive()) {
    resetMarketQuickviewMode();
    return;
  }
  setMarketQuickviewMode(true);
}

function buildMarketSnapshotHtml(centerLatLng, radiusMiles) {
  const radiusLabel = marketSnapshotRadiusLabel(radiusMiles);
  const competition = featuresWithinRadius(state.buildersLoaded ? state.builders : [], centerLatLng, radiusMiles)
    .map(({ feature, distance }) => {
      const p = feature.properties || {};
      const builder = displayBuilderList(p.Builder || primaryBuilderForFeature(feature));
      const tier = formatBuilderTierLabel(feature);
      return {
        feature,
        distance,
        html: `<div class="snapshot-table-row"><div><b>${escapeHtml(p.Subdivision || 'Builder Community')}</b></div><div>${escapeHtml(builder)}</div><div>${escapeHtml(builderRangeText(p.UnitSizeMin, p.UnitSizeMax, 'number'))}</div><div>${escapeHtml(builderRangeText(p.PriceMin, p.PriceMax, 'money'))}</div><div>${escapeHtml(tier)}</div><div>${escapeHtml(fmtDistanceMiles(distance))}</div></div>`
      };
    });
  const competitionRows = competition.map(r => r.html);
  const compStatusCounts = competition.reduce((acc, row) => {
    const s = String(row.feature?.properties?.Status || '').toLowerCase();
    acc.total += 1;
    if (s.includes('active')) acc.active += 1;
    else if (s.includes('future')) acc.future += 1;
    else if (s.includes('built')) acc.builtOut += 1;
    acc.starts += Number(row.feature?.properties?.AnnualStarts || 0);
    acc.remaining += Number(row.feature?.properties?.UnitsRemaining || 0);
    return acc;
  }, { total: 0, active: 0, future: 0, builtOut: 0, starts: 0, remaining: 0 });

  const demographicSource = weightedRowsFromDemographicSource(centerLatLng, radiusMiles);
  const demographicRows = demographicSource.rows.map(row => ({
    feature: row.feature,
    distance: row.distance,
    demo: row.demo,
    weight: row.syntheticWeight || row.overlap || 0
  })).filter(row => row.demo);
  const demographics = demographicRows.length ? aggregateDemographicsWeighted(demographicRows) : null;

  const schools = featuresWithinRadius(state.schoolsLoaded ? state.schools : [], centerLatLng, radiusMiles)
    .map(({ feature, distance }) => ({ feature, distance }));
  const retail = featuresWithinRadius(state.poisLoaded ? state.pois : [], centerLatLng, radiusMiles)
    .map(({ feature, distance }) => ({ feature, distance }))
    .sort((a, b) => {
      const ab = !!a.feature.properties.NationalBrand;
      const bb = !!b.feature.properties.NationalBrand;
      if (ab !== bb) return ab ? -1 : 1;
      return a.distance - b.distance || String(a.feature.properties.Name || '').localeCompare(String(b.feature.properties.Name || ''));
    });
  const lifestyle = featuresWithinRadius(state.lifestyleLoaded ? state.lifestyle : [], centerLatLng, radiusMiles)
    .map(({ feature, distance }) => ({ feature, distance }));

  const schoolRows = schools.map(({ feature, distance }) => {
    const p = feature.properties || {};
    const rating = normalizeGreatSchoolsRating(p.GreatSchoolsRating);
    return `<div class="snapshot-table-row"><div><b>${escapeHtml(p.NAME || 'School')}</b><small>${escapeHtml(p.SubmarketName || '')}</small></div><div>${escapeHtml(p.SchoolType || 'School')}</div><div>${escapeHtml(rating === null ? 'NR' : `${rating}/10`)}</div><div>${escapeHtml(fmtDistanceMiles(distance))}</div></div>`;
  });

  const retailRows = retail.map(({ feature, distance }) => {
    const p = feature.properties || {};
    const brand = p.NationalBrand ? (p.Brand || p.Name || 'National Brand') : (p.Name || p.Brand || 'Retail');
    const label = p.NationalBrand ? 'National Brand' : (p.Category || 'Retail');
    return `<div class="snapshot-table-row"><div><b>${escapeHtml(brand)}</b><small>${escapeHtml(p.SubmarketName || '')}</small></div><div>${escapeHtml(label)}</div><div>${escapeHtml(fmtDistanceMiles(distance))}</div></div>`;
  });

  const lifestyleRows = lifestyle.map(({ feature, distance }) => {
    const p = feature.properties || {};
    return `<div class="snapshot-table-row"><div><b>${escapeHtml(p.Name || lifestyleCategoryLabel(p.LifestyleCategory))}</b><small>${escapeHtml(p.SubmarketName || '')}</small></div><div>${escapeHtml(lifestyleCategoryLabel(p.LifestyleCategory))}</div><div>${escapeHtml(fmtDistanceMiles(distance))}</div></div>`;
  });

  const buildersLoaded = !!state.buildersLoaded;
  const demographicsLoaded = !!state.demographicsBlockGroupsLoaded;
  const schoolsLoaded = !!state.schoolsLoaded;
  const retailLoaded = !!state.poisLoaded;
  const lifestyleLoaded = !!state.lifestyleLoaded;

  const competitionSectionHtml = buildersLoaded
    ? renderSnapshotTable(['Community', 'Builder', 'Sq Ft Range', 'Price Range', 'Tier', 'Distance'], competitionRows, '<div class="snapshot-empty">No builder communities fall inside this radius.</div>')
    : '<div class="snapshot-empty">Builder data is still loading.</div>';
  const demographicsSectionHtml = !demographicsLoaded
    ? '<div class="snapshot-empty">Demographic data is still loading.</div>'
    : (demographics
      ? `<div class="snapshot-metric-grid">
          ${renderSnapshotMetric('Population', fmt(demographics.current.population))}
          ${renderSnapshotMetric('Households', fmt(demographics.current.households))}
          ${renderSnapshotMetric('Median Income', fmtMoney(demographics.current.median_household_income))}
          ${renderSnapshotMetric('Mean Income', state.acsMeanIncomeLoaded ? fmtMoney(demographics.current.mean_household_income) : (state.acsMeanIncomeAttempted ? 'N/A' : 'Loading...'))}
          ${renderSnapshotMetric('Median Age', fmtOne(demographics.current.median_age))}
        </div>
        <div class="snapshot-subnote">${escapeHtml(demographicSource.note)}</div>`
      : `<div class="snapshot-empty">${escapeHtml(demographicSource.note || 'No demographic data is available for this radius.')}</div>`);
  const schoolsSectionHtml = !schoolsLoaded
    ? '<div class="snapshot-empty">Schools are still loading.</div>'
    : renderSnapshotTable(['School', 'Type', 'GreatSchools', 'Distance'], schoolRows, '<div class="snapshot-empty">No schools fall inside this radius.</div>');
  const retailSectionHtml = !retailLoaded
    ? '<div class="snapshot-empty">Retail & dining are still loading.</div>'
    : renderSnapshotTable(['Place', 'Category', 'Distance'], retailRows, '<div class="snapshot-empty">No retail or dining POIs fall inside this radius.</div>');
  const lifestyleSectionHtml = !lifestyleLoaded
    ? '<div class="snapshot-empty">Lifestyle & amenities are still loading.</div>'
    : renderSnapshotTable(['Amenity', 'Category', 'Distance'], lifestyleRows, '<div class="snapshot-empty">No lifestyle or amenity POIs fall inside this radius.</div>');

  return `
    <div class="snapshot-intro">
      <div class="snapshot-ribbon">${escapeHtml(radiusLabel)} Radius</div>
      <div class="snapshot-center">Center point: ${escapeHtml(centerLatLng.lat.toFixed(5))}, ${escapeHtml(centerLatLng.lng.toFixed(5))}</div>
      <div class="snapshot-note">Communities, schools, retail, and amenities are shown by straight-line distance from the clicked point.</div>
    </div>

    <section class="snapshot-section">
      <div class="snapshot-section-head"><h4>Competition</h4><span>${buildersLoaded ? competition.length.toLocaleString() : 'Still loading' } communities</span></div>
      <div class="snapshot-metric-grid">
        ${renderSnapshotMetric('Communities', String(compStatusCounts.total))}
        ${renderSnapshotMetric('Active', String(compStatusCounts.active))}
        ${renderSnapshotMetric('Future', String(compStatusCounts.future))}
        ${renderSnapshotMetric('Built Out', String(compStatusCounts.builtOut))}
        ${renderSnapshotMetric('Annual Starts', String(Math.round(compStatusCounts.starts).toLocaleString()))}
        ${renderSnapshotMetric('Units Remaining', String(Math.round(compStatusCounts.remaining).toLocaleString()))}
      </div>
      ${competitionSectionHtml}
    </section>

    <section class="snapshot-section">
      <div class="snapshot-section-head"><h4>Demographics</h4><span>${demographicsLoaded ? (demographics ? demographicRows.length.toLocaleString() + ' geographies' : 'No data') : 'Still loading'}</span></div>
      ${demographicsSectionHtml}
    </section>

    <section class="snapshot-section">
      <div class="snapshot-section-head"><h4>Schools</h4><span>${schoolsLoaded ? schools.length.toLocaleString() : 'Still loading'} schools</span></div>
      ${schoolsSectionHtml}
    </section>

    <section class="snapshot-section">
      <div class="snapshot-section-head"><h4>Retail & Dining</h4><span>${retailLoaded ? retail.length.toLocaleString() : 'Still loading'} places</span></div>
      ${retailSectionHtml}
    </section>

    <section class="snapshot-section">
      <div class="snapshot-section-head"><h4>Lifestyle & Amenities</h4><span>${lifestyleLoaded ? lifestyle.length.toLocaleString() : 'Still loading'} places</span></div>
      ${lifestyleSectionHtml}
    </section>
  `;
}

function buildMarketPreviewHtml(centerLatLng, radiusMiles) {
  const radiusLabel = marketSnapshotRadiusLabel(radiusMiles);

  // 1) Zonda demographics: preserve the current Quickview block aggregation exactly.
  const zondaHtml = buildMarketQuickviewHtml(centerLatLng, radiusMiles, false);
  const zondaLoaded = !!state.quickviewBlocksLoaded;
  const zondaSelected = featuresWithinRadius(state.quickviewBlocks || [], centerLatLng, radiusMiles);
  const zondaSummary = quickviewAggregateBlocks(zondaSelected.map(entry => entry.feature));

  // 2) ACS demographics: preserve the restored local 17,313-record radius workflow.
  const demographicSource = weightedRowsFromDemographicSource(centerLatLng, radiusMiles);
  const demographicRows = demographicSource.rows.map(row => ({
    feature: row.feature,
    distance: row.distance,
    demo: row.demo,
    weight: row.syntheticWeight || row.overlap || 0
  })).filter(row => row.demo);
  const demographics = demographicRows.length ? aggregateDemographicsWeighted(demographicRows) : null;
  const demographicsLoaded = !!state.demographicsBlockGroupsLoaded;
  const demographicsSectionHtml = !demographicsLoaded
    ? '<div class="snapshot-empty">ACS demographic data is still loading.</div>'
    : (demographics
      ? `<div class="snapshot-metric-grid">
          ${renderSnapshotMetric('Population', fmt(demographics.current.population))}
          ${renderSnapshotMetric('Households', fmt(demographics.current.households))}
          ${renderSnapshotMetric('Median Income', fmtMoney(demographics.current.median_household_income))}
          ${renderSnapshotMetric('Median Age', fmtOne(demographics.current.median_age))}
        </div>
        <div class="snapshot-subnote">${escapeHtml(demographicSource.note)}</div>`
      : `<div class="snapshot-empty">${escapeHtml(demographicSource.note || 'No ACS demographic data is available for this radius.')}</div>`);

  // 3) Schools: preserve Snapshot straight-line radius mechanics.
  const schools = featuresWithinRadius(state.schoolsLoaded ? state.schools : [], centerLatLng, radiusMiles)
    .map(({ feature, distance }) => ({ feature, distance }));
  const schoolRows = schools.map(({ feature, distance }) => {
    const p = feature.properties || {};
    const rating = normalizeGreatSchoolsRating(p.GreatSchoolsRating);
    return `<div class="snapshot-table-row"><div><b>${escapeHtml(p.NAME || 'School')}</b><small>${escapeHtml(p.SubmarketName || '')}</small></div><div>${escapeHtml(p.SchoolType || 'School')}</div><div>${escapeHtml(rating === null ? 'NR' : `${rating}/10`)}</div><div>${escapeHtml(fmtDistanceMiles(distance))}</div></div>`;
  });
  const schoolsLoaded = !!state.schoolsLoaded;
  const schoolsSectionHtml = !schoolsLoaded
    ? '<div class="snapshot-empty">Schools are still loading.</div>'
    : renderSnapshotTable(['School', 'Type', 'GreatSchools', 'Distance'], schoolRows, '<div class="snapshot-empty">No schools fall inside this radius.</div>');

  // 4) Competition: preserve Snapshot builder-radius mechanics and metrics.
  const competition = featuresWithinRadius(state.buildersLoaded ? state.builders : [], centerLatLng, radiusMiles)
    .map(({ feature, distance }) => {
      const p = feature.properties || {};
      const builder = displayBuilderList(p.Builder || primaryBuilderForFeature(feature));
      const tier = formatBuilderTierLabel(feature);
      return {
        feature,
        distance,
        html: `<div class="snapshot-table-row"><div><b>${escapeHtml(p.Subdivision || 'Builder Community')}</b></div><div>${escapeHtml(builder)}</div><div>${escapeHtml(builderRangeText(p.UnitSizeMin, p.UnitSizeMax, 'number'))}</div><div>${escapeHtml(builderRangeText(p.PriceMin, p.PriceMax, 'money'))}</div><div>${escapeHtml(tier)}</div><div>${escapeHtml(fmtDistanceMiles(distance))}</div></div>`
      };
    });
  const competitionRows = competition.map(r => r.html);
  const compStatusCounts = competition.reduce((acc, row) => {
    const s = String(row.feature?.properties?.Status || '').toLowerCase();
    acc.total += 1;
    if (s.includes('active')) acc.active += 1;
    else if (s.includes('future')) acc.future += 1;
    else if (s.includes('built')) acc.builtOut += 1;
    acc.starts += Number(row.feature?.properties?.AnnualStarts || 0);
    acc.remaining += Number(row.feature?.properties?.UnitsRemaining || 0);
    return acc;
  }, { total: 0, active: 0, future: 0, builtOut: 0, starts: 0, remaining: 0 });
  const buildersLoaded = !!state.buildersLoaded;
  const competitionSectionHtml = buildersLoaded
    ? renderSnapshotTable(['Community', 'Builder', 'Sq Ft Range', 'Price Range', 'Tier', 'Distance'], competitionRows, '<div class="snapshot-empty">No builder communities fall inside this radius.</div>')
    : '<div class="snapshot-empty">Builder data is still loading.</div>';

  // 5) Retail & Dining: preserve Snapshot POI radius mechanics and ordering.
  const retail = featuresWithinRadius(state.poisLoaded ? state.pois : [], centerLatLng, radiusMiles)
    .map(({ feature, distance }) => ({ feature, distance }))
    .sort((a, b) => {
      const ab = !!a.feature.properties.NationalBrand;
      const bb = !!b.feature.properties.NationalBrand;
      if (ab !== bb) return ab ? -1 : 1;
      return a.distance - b.distance || String(a.feature.properties.Name || '').localeCompare(String(b.feature.properties.Name || ''));
    });
  const retailRows = retail.map(({ feature, distance }) => {
    const p = feature.properties || {};
    const brand = p.NationalBrand ? (p.Brand || p.Name || 'National Brand') : (p.Name || p.Brand || 'Retail');
    const label = p.NationalBrand ? 'National Brand' : (p.Category || 'Retail');
    return `<div class="snapshot-table-row"><div><b>${escapeHtml(brand)}</b><small>${escapeHtml(p.SubmarketName || '')}</small></div><div>${escapeHtml(label)}</div><div>${escapeHtml(fmtDistanceMiles(distance))}</div></div>`;
  });
  const retailLoaded = !!state.poisLoaded;
  const retailSectionHtml = !retailLoaded
    ? '<div class="snapshot-empty">Retail & dining are still loading.</div>'
    : renderSnapshotTable(['Place', 'Category', 'Distance'], retailRows, '<div class="snapshot-empty">No retail or dining POIs fall inside this radius.</div>');

  // 6) Lifestyle & Amenities: preserve Snapshot amenity-radius mechanics.
  const lifestyle = featuresWithinRadius(state.lifestyleLoaded ? state.lifestyle : [], centerLatLng, radiusMiles)
    .map(({ feature, distance }) => ({ feature, distance }));
  const lifestyleRows = lifestyle.map(({ feature, distance }) => {
    const p = feature.properties || {};
    return `<div class="snapshot-table-row"><div><b>${escapeHtml(p.Name || lifestyleCategoryLabel(p.LifestyleCategory))}</b><small>${escapeHtml(p.SubmarketName || '')}</small></div><div>${escapeHtml(lifestyleCategoryLabel(p.LifestyleCategory))}</div><div>${escapeHtml(fmtDistanceMiles(distance))}</div></div>`;
  });
  const lifestyleLoaded = !!state.lifestyleLoaded;
  const lifestyleSectionHtml = !lifestyleLoaded
    ? '<div class="snapshot-empty">Lifestyle & amenities are still loading.</div>'
    : renderSnapshotTable(['Amenity', 'Category', 'Distance'], lifestyleRows, '<div class="snapshot-empty">No lifestyle or amenity POIs fall inside this radius.</div>');

  return `
    <div class="snapshot-intro">
      <div class="snapshot-ribbon">Market Preview • ${escapeHtml(radiusLabel)} Radius</div>
      <div class="snapshot-center">Center point: ${escapeHtml(centerLatLng.lat.toFixed(5))}, ${escapeHtml(centerLatLng.lng.toFixed(5))}</div>
      <div class="snapshot-note">One radius, two independent demographic sources, plus schools and market context. Zonda and ACS calculations remain separate.</div>
    </div>

    <section class="snapshot-section market-preview-source">
      <div class="snapshot-section-head quickview-head"><h4>Zonda Demographics Data</h4><span>${zondaLoaded ? `${zondaSummary.usableBlocksInRadius.toLocaleString()} usable / ${zondaSummary.blocksInRadius.toLocaleString()} blocks` : 'Still loading'}</span></div>
      <div class="snapshot-subnote">Zonda data uses the existing Market Quickview block aggregation. The detailed demographic sections below are unchanged.</div>
      ${zondaHtml}
    </section>

    <section class="snapshot-section market-preview-source">
      <div class="snapshot-section-head"><h4>ACS Demographics Data</h4><span>${demographicsLoaded ? (demographics ? demographicRows.length.toLocaleString() + ' block groups' : 'No data') : 'Still loading'}</span></div>
      ${demographicsSectionHtml}
    </section>

    <section class="snapshot-section">
      <div class="snapshot-section-head"><h4>Schools</h4><span>${schoolsLoaded ? schools.length.toLocaleString() : 'Still loading'} schools</span></div>
      ${schoolsSectionHtml}
    </section>

    <section class="snapshot-section">
      <div class="snapshot-section-head"><h4>Competition</h4><span>${buildersLoaded ? competition.length.toLocaleString() : 'Still loading'} communities</span></div>
      <div class="snapshot-metric-grid">
        ${renderSnapshotMetric('Communities', String(compStatusCounts.total))}
        ${renderSnapshotMetric('Active', String(compStatusCounts.active))}
        ${renderSnapshotMetric('Future', String(compStatusCounts.future))}
        ${renderSnapshotMetric('Built Out', String(compStatusCounts.builtOut))}
        ${renderSnapshotMetric('Annual Starts', String(Math.round(compStatusCounts.starts).toLocaleString()))}
        ${renderSnapshotMetric('Units Remaining', String(Math.round(compStatusCounts.remaining).toLocaleString()))}
      </div>
      ${competitionSectionHtml}
    </section>

    <section class="snapshot-section">
      <div class="snapshot-section-head"><h4>Retail & Dining</h4><span>${retailLoaded ? retail.length.toLocaleString() : 'Still loading'} places</span></div>
      ${retailSectionHtml}
    </section>

    <section class="snapshot-section">
      <div class="snapshot-section-head"><h4>Lifestyle & Amenities</h4><span>${lifestyleLoaded ? lifestyle.length.toLocaleString() : 'Still loading'} places</span></div>
      ${lifestyleSectionHtml}
    </section>
  `;
}

async function ensureSnapshotDataLoaded() {
  const tasks = [];
  if (!state.buildersLoaded) tasks.push(ensureBuildersLoaded().catch(err => console.warn('Builders not available for snapshot', err)));
  if (!state.schoolsLoaded) tasks.push(loadSchools(false).catch(err => console.warn('Schools not available for snapshot', err)));
  if (!state.poisLoaded) tasks.push(loadPOIs(false).catch(err => console.warn('Retail not available for snapshot', err)));
  if (!state.lifestyleLoaded) tasks.push(loadLifestyle(false).catch(err => console.warn('Lifestyle not available for snapshot', err)));
  if (!state.acsMeanIncomeLoaded) tasks.push(ensureAcsMeanIncomeLoaded().catch(err => console.warn('ACS Mean Income not available for preview', err)));
  await Promise.allSettled(tasks);
}

async function handleMarketSnapshotPoint(latlng) {
  if (!marketSnapshotModeActive() || !state.marketSnapshot.radiusMiles) return;
  const center = latlng instanceof L.LatLng ? latlng : L.latLng(latlng.lat, latlng.lng);
  showRadiusPrompt('snapshot', center, state.marketSnapshot.radiusMiles);
}

function openMarketSnapshotReportFromPrompt() {
  const s = state.marketSnapshot || {};
  if (!s.pendingCenter || !s.radiusMiles) return false;
  const center = s.pendingCenter instanceof L.LatLng ? s.pendingCenter : L.latLng(s.pendingCenter.lat, s.pendingCenter.lng);
  const radius = Number(s.radiusMiles);
  if (![1, 3, 5, 10].includes(radius)) return false;
  const subtitle = `${marketSnapshotRadiusLabel(radius)} centered at ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`;

  resetMarketSnapshotMode();
  openMarketSnapshotModal('Market Preview', subtitle, '<div class="snapshot-loading"><b>Market Preview</b><br>Loading market data...</div>');

  const render = () => {
    const overlay = document.getElementById('marketSnapshotModal');
    const body = document.getElementById('marketSnapshotModalBody');
    if (!overlay?.classList.contains('active') || !body) return;
    try {
      body.innerHTML = buildMarketPreviewHtml(center, radius);
    } catch (err) {
      console.error('Market Preview rendering failed', err);
      body.innerHTML = `<div class="snapshot-error"><b>Market Preview could not be rendered.</b><br>${escapeHtml(err?.message || String(err))}</div>`;
    }
  };
  render();
  Promise.allSettled([ensureQuickviewDataLoaded(), ensureSnapshotDataLoaded(), ensureAcsMeanIncomeLoaded()]).then(render);
  return true;
}

function openNewDealMarketPreview(deal, radiusMiles) {
  const lat = Number(deal?.lat);
  const lng = Number(deal?.lng);
  const radius = Number(radiusMiles);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || ![3, 5].includes(radius)) return false;
  const center = L.latLng(lat, lng);
  state.marketSnapshot = state.marketSnapshot || { active: false, radiusMiles: null, awaitingPoint: false, busy: false, pendingCenter: null, radiusLayer: null, radiusCircle: null, promptMarker: null, promptEl: null };
  clearRadiusPromptOverlay('snapshot');
  state.marketSnapshot.pendingCenter = center;
  state.marketSnapshot.radiusMiles = radius;
  state.marketSnapshot.active = false;
  state.marketSnapshot.awaitingPoint = false;
  return openMarketSnapshotReportFromPrompt();
}


const NEW_DEALS_STORAGE_KEY = 'gcsa.newDeals.v1';
const NEW_DEALS_COLLECTION = 'newDeals';

function firebaseNewDealsConfigured() {
  const cfg = globalThis.GCSA_FIREBASE_CONFIG || {};
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  return required.every(k => cfg[k] && !String(cfg[k]).includes('REPLACE_'));
}

function newDealEditorEmail() {
  return String(globalThis.GCSA_FIREBASE_EDITOR_EMAIL || 'newdeals.shared@lennar.com').trim().toLowerCase();
}

function newDealAuthorizedUser(user) {
  return !!user?.email && String(user.email).trim().toLowerCase() === newDealEditorEmail();
}

async function authorizeNewDealEditing() {
  if (newDealAuthorizedUser(state.newDealsUser)) return true;
  if (!state.newDealsFirebaseReady) await initializeFirebaseNewDeals();
  if (!state.newDealsFirebaseReady) {
    alert('Firebase is not configured yet. See FIREBASE_SETUP.md in the patch.');
    return false;
  }
  const password = prompt('Enter the New Deals team password:');
  if (password === null) return false;
  if (!password) {
    alert('A password is required to access New Deals.');
    return false;
  }
  try {
    const auth = firebase.auth();
    await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
    const result = await auth.signInWithEmailAndPassword(newDealEditorEmail(), password);
    if (!newDealAuthorizedUser(result.user)) {
      await auth.signOut();
      alert('This account is not authorized to access New Deals.');
      return false;
    }
    await waitForPrivateNewDealsSubscription(2500);
    return true;
  } catch (err) {
    console.error(err);
    const code = String(err?.code || '');
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
      alert('Incorrect New Deals password.');
    } else {
      alert(`New Deals could not be unlocked: ${err.message || err}`);
    }
    return false;
  }
}

function stopNewDealsCloudListener() {
  if (state.newDealsUnsubscribe) {
    try { state.newDealsUnsubscribe(); } catch (_) {}
    state.newDealsUnsubscribe = null;
  }
}

function clearPrivateNewDealsData() {
  stopNewDealsCloudListener();
  state.newDeals = [];
  state.newDealsCloudLoaded = false;
  state.newDealsListExpanded = false;
  state.newDealsAddMode = false;
  const toggle = document.getElementById('toggleNewDeals');
  if (toggle) toggle.checked = false;
  if (state.map && state.newDealsLayer) {
    try { if (state.map.hasLayer(state.newDealsLayer)) state.map.removeLayer(state.newDealsLayer); } catch (_) {}
    try { state.newDealsLayer.clearLayers(); } catch (_) {}
  }
  renderNewDealsSidebarList();
  updateNewDealsUI();
}

function waitForPrivateNewDealsSubscription(timeoutMs = 2500) {
  if (state.newDealsCloudLoaded && state.newDealsUnsubscribe) return Promise.resolve();
  return new Promise(resolve => {
    const started = Date.now();
    const poll = () => {
      if (state.newDealsCloudLoaded && state.newDealsUnsubscribe) return resolve();
      if (Date.now() - started >= timeoutMs) return resolve();
      setTimeout(poll, 50);
    };
    poll();
  });
}

function subscribeToPrivateNewDeals() {
  stopNewDealsCloudListener();
  if (!state.newDealsFirebaseReady || !newDealAuthorizedUser(state.newDealsUser)) return;
  const db = firebase.firestore();
  state.newDealsUnsubscribe = db.collection(NEW_DEALS_COLLECTION).onSnapshot(snapshot => {
    state.newDeals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(d => Number.isFinite(Number(d.lat)) && Number.isFinite(Number(d.lng)));
    state.newDeals.sort((a,b) => String(a.name||'').localeCompare(String(b.name||'')));
    state.newDealsCloudLoaded = true;
    saveLocalNewDealsBackup();
    rebuildNewDealsLayer();
    updateNewDealsUI();
  }, err => {
    console.error('Private New Deals Firestore listener failed', err);
    clearPrivateNewDealsData();
    updateNewDealsAuthUI('Private New Deals could not be loaded. Check Firebase permissions.');
  });
}



function newDealIcon(deal) {
  const rawName = String(deal?.name || '').trim();
  const initial = escapeHtml((rawName ? rawName.charAt(0) : '?').toUpperCase());
  return L.divIcon({
    className: '',
    html: `<div class="new-deal-marker">${initial}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}

function dealsFromGeoJson(collection) {
  return (collection?.features || []).map((feature, index) => {
    const coords = feature?.geometry?.coordinates || [];
    const p = feature?.properties || {};
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      id: p.id || `shared-deal-${index}-${lat.toFixed(6)}-${lng.toFixed(6)}`,
      name: String(p.name || 'New Deal'), lat, lng,
      city: String(p.city || ''), submarket: String(p.submarket || ''), createdAt: p.createdAt || ''
    };
  }).filter(Boolean);
}

function readLocalNewDeals() {
  try {
    const raw = localStorage.getItem(NEW_DEALS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(d => Number.isFinite(Number(d.lat)) && Number.isFinite(Number(d.lng))) : [];
  } catch (_) { return []; }
}

function saveLocalNewDealsBackup() {
  try { localStorage.setItem(NEW_DEALS_STORAGE_KEY, JSON.stringify(state.newDeals || [])); } catch (_) {}
}

function updateNewDealsAuthUI(message = '') {
  const status = document.getElementById('newDealsAuthStatus');
  const configured = firebaseNewDealsConfigured();
  const authorized = newDealAuthorizedUser(state.newDealsUser);
  const badge = document.getElementById('newDealsCountBadge');
  const addBtn = document.getElementById('addNewDealPin');
  const listBtn = document.getElementById('toggleNewDealsList');
  if (status) {
    if (message) status.textContent = message;
    else if (!configured) status.textContent = 'Firebase setup required — see FIREBASE_SETUP.md.';
    else if (authorized) status.textContent = 'Private • New Deals unlocked for this session';
    else status.textContent = 'Private • enter the team password to view New Deals';
  }
  if (badge) badge.textContent = authorized ? `${(state.newDeals || []).length} deals` : 'Private';
  if (addBtn) addBtn.disabled = !configured || !authorized;
  if (listBtn) {
    listBtn.disabled = !authorized;
    listBtn.hidden = !authorized;
  }
  if (!authorized) {
    state.newDealsListExpanded = false;
    const list = document.getElementById('newDealsSidebarList');
    if (list) list.hidden = true;
  }
}


function findNewDealMarker(dealId) {
  let found = null;
  if (!state.newDealsLayer) return found;
  state.newDealsLayer.eachLayer(layer => {
    if (!found && layer?.options?.newDealId === dealId) found = layer;
  });
  return found;
}

async function focusNewDealFromSidebar(deal) {
  if (!deal || !state.map) return;
  if (!newDealAuthorizedUser(state.newDealsUser) && !(await authorizeNewDealEditing())) return;
  const toggle = document.getElementById('toggleNewDeals');
  if (toggle) toggle.checked = true;
  ensureNewDealsLayerVisible(true);
  const lat = Number(deal.lat), lng = Number(deal.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  // Cancel any in-progress fitBounds/flyTo animation before forcing the deal view.
  state.map.stop();
  state.map.setView([lat, lng], 12, { animate: false });

  // Open only after the forced view is committed. New Deal popups have autoPan
  // disabled so opening the summary cannot change the requested map extent.
  requestAnimationFrame(() => {
    const marker = findNewDealMarker(deal.id);
    if (marker) marker.openPopup();
  });
}

function submarketNumberForName(name) {
  const key = normalizeSubmarketName(name);
  return Object.prototype.hasOwnProperty.call(submarketNumberLookup, key) ? submarketNumberLookup[key] : null;
}

function renderNewDealsSidebarList() {
  const list = document.getElementById('newDealsSidebarList');
  const btn = document.getElementById('toggleNewDealsList');
  if (!list || !btn) return;
  const expanded = !!state.newDealsListExpanded;
  btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  btn.textContent = expanded ? `Hide Deals (${(state.newDeals || []).length})` : `Show Deals (${(state.newDeals || []).length})`;
  list.hidden = !expanded;
  list.replaceChildren();
  if (!expanded) return;

  const deals = [...(state.newDeals || [])];
  if (!deals.length) {
    const empty = document.createElement('div');
    empty.className = 'new-deals-list-empty';
    empty.textContent = 'No New Deals yet.';
    list.appendChild(empty);
    return;
  }

  const groups = new Map();
  deals.forEach(deal => {
    const submarketName = String(deal.submarket || '').trim();
    const number = submarketNumberForName(submarketName);
    const key = number != null ? `number:${number}` : `outside:${normalizeSubmarketName(submarketName) || 'outside'}`;
    if (!groups.has(key)) {
      groups.set(key, {
        number,
        name: submarketName || 'Outside Submarket Boundary',
        deals: []
      });
    }
    groups.get(key).deals.push(deal);
  });

  const orderedGroups = [...groups.values()].sort((a, b) => {
    const aNum = Number.isFinite(a.number) ? a.number : Number.POSITIVE_INFINITY;
    const bNum = Number.isFinite(b.number) ? b.number : Number.POSITIVE_INFINITY;
    if (aNum !== bNum) return aNum - bNum;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  orderedGroups.forEach(group => {
    group.deals.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

    const section = document.createElement('div');
    section.className = 'new-deal-submarket-group';

    const heading = document.createElement('div');
    heading.className = 'new-deal-submarket-heading';
    heading.textContent = Number.isFinite(group.number)
      ? `${group.number}. ${group.name}`
      : group.name;
    section.appendChild(heading);

    group.deals.forEach(deal => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'new-deal-list-item';
      item.textContent = deal.name || 'New Deal';
      item.title = deal.city ? `${deal.name || 'New Deal'} — ${deal.city}` : (deal.name || 'New Deal');
      item.addEventListener('click', () => { focusNewDealFromSidebar(deal).catch(err => console.error(err)); });
      section.appendChild(item);
    });

    list.appendChild(section);
  });
}

function updateNewDealsUI() {
  const count = (state.newDeals || []).length;
  const badge = document.getElementById('newDealsCountBadge');
  if (badge) badge.textContent = `${count} deals`;
  const addBtn = document.getElementById('addNewDealPin');
  if (addBtn) {
    addBtn.classList.toggle('active', !!state.newDealsAddMode);
    addBtn.textContent = state.newDealsAddMode ? 'Click Map to Place Pin' : 'Add Pin to Map';
  }
  const hint = document.getElementById('newDealsHint');
  if (hint) hint.textContent = state.newDealsAddMode ? 'Click anywhere on the map to place the new deal.' : (newDealAuthorizedUser(state.newDealsUser) ? 'Private New Deals unlocked for this session. Add, move, and delete are enabled.' : 'New Deals are private. Enter the team password to view the pins.');
  if (state.map) state.map.getContainer().classList.toggle('new-deal-add-mode', !!state.newDealsAddMode);
  renderNewDealsSidebarList();
  updateNewDealsAuthUI();
}

async function initializeFirebaseNewDeals() {
  if (!firebaseNewDealsConfigured() || !globalThis.firebase) {
    updateNewDealsAuthUI();
    return false;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(globalThis.GCSA_FIREBASE_CONFIG);
    state.newDealsFirebaseReady = true;
    const auth = firebase.auth();
    await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
    if (!state.newDealsAuthListenerInstalled) {
      state.newDealsAuthListenerInstalled = true;
      auth.onAuthStateChanged(user => {
        state.newDealsUser = user || null;
        if (newDealAuthorizedUser(state.newDealsUser)) {
          subscribeToPrivateNewDeals();
        } else {
          clearPrivateNewDealsData();
        }
        updateNewDealsAuthUI();
      });
    }
    const currentUser = auth.currentUser;
    state.newDealsUser = currentUser || null;
    if (newDealAuthorizedUser(currentUser)) subscribeToPrivateNewDeals();
    else clearPrivateNewDealsData();
    updateNewDealsAuthUI();
    return true;
  } catch (err) {
    console.error('Firebase initialization failed', err);
    updateNewDealsAuthUI('Firebase could not initialize. Check js/firebase-config.js.');
    return false;
  }
}


async function setNewDealAddMode(active) {
  if (active && !await authorizeNewDealEditing()) return;
  state.newDealsAddMode = !!active;
  if (state.newDealsAddMode) {
    const toggle = document.getElementById('toggleNewDeals');
    if (toggle) toggle.checked = true;
    ensureNewDealsLayerVisible(true);
    if (!state.buildersLoaded) loadBuilders(false).catch(() => {});
  }
  updateNewDealsUI();
}

function newDealLocationContext(latlng) {
  const point = [Number(latlng.lng), Number(latlng.lat)];
  const match = (state.features || []).find(f => pointInFeature(point, f));
  const submarket = match?.properties?.DisplayName || '';
  let nearestCity = '', nearestDistance = Infinity;
  const consider = (lat, lng, city) => {
    if (!city || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return;
    const d = latlng.distanceTo(L.latLng(Number(lat), Number(lng))) / 1609.344;
    if (d < nearestDistance) { nearestDistance = d; nearestCity = String(city).trim(); }
  };
  (state.builders || []).forEach(f => { const c=f?.geometry?.coordinates||[]; consider(c[1],c[0],f?.properties?.City); });
  (state.healthcare || []).forEach(f => { const c=f?.geometry?.coordinates||[]; consider(c[1],c[0],f?.properties?.City); });
  (state.schools || []).forEach(f => { const c=f?.geometry?.coordinates||[]; consider(c[1],c[0],f?.properties?.CITY); });
  return { city: nearestDistance <= 12 ? nearestCity : '', submarket };
}

async function deleteNewDeal(deal) {
  if (!await authorizeNewDealEditing()) return;
  try { await firebase.firestore().collection(NEW_DEALS_COLLECTION).doc(deal.id).delete(); }
  catch (err) { console.error(err); alert(`New Deal could not be deleted: ${err.message || err}`); }
}

async function moveNewDeal(deal) {
  if (!await authorizeNewDealEditing()) return;
  if (!state.map || !state.newDealsLayer) return;

  let marker = null;
  state.newDealsLayer.eachLayer(layer => {
    if (!marker && layer?.options?.newDealId === deal.id) marker = layer;
  });
  if (!marker || !marker.dragging) {
    alert('This New Deal pin could not be put into move mode. Refresh the Atlas and try again.');
    return;
  }

  const original = marker.getLatLng();
  state.map.closePopup();
  marker.dragging.enable();
  marker.getElement()?.classList.add('new-deal-move-active');
  marker.bindTooltip('Drag this pin to its new location, then release.', {
    direction: 'top', offset: [0, -14], className: 'new-deal-move-tooltip'
  }).openTooltip();

  marker.once('dragend', async () => {
    marker.dragging.disable();
    marker.getElement()?.classList.remove('new-deal-move-active');
    marker.closeTooltip();
    marker.unbindTooltip();

    const moved = marker.getLatLng();
    const name = deal.name || 'this New Deal';
    if (!confirm(`Move ${name} to ${moved.lat.toFixed(5)}, ${moved.lng.toFixed(5)}?`)) {
      marker.setLatLng(original);
      return;
    }

    try {
      const context = newDealLocationContext(moved);
      await firebase.firestore().collection(NEW_DEALS_COLLECTION).doc(deal.id).update({
        lat: Number(moved.lat),
        lng: Number(moved.lng),
        city: context.city || '',
        submarket: context.submarket || '',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      marker.setLatLng(original);
      alert(`New Deal could not be moved: ${err.message || err}`);
    }
  });
}

function newDealPopupContent(deal) {
  const wrap = document.createElement('div');
  wrap.className = 'builder-popup new-deal-popup';
  if (typeof L !== 'undefined' && L.DomEvent) {
    L.DomEvent.disableClickPropagation(wrap);
    L.DomEvent.disableScrollPropagation(wrap);
  }
  const cityText = deal.city ? escapeHtml(deal.city) : '-';
  const submarketText = deal.submarket ? escapeHtml(deal.submarket) : 'Outside submarket boundary';
  wrap.innerHTML = `<h3>${escapeHtml(deal.name || 'New Deal')}</h3>
    <p><b>Coordinates:</b> ${Number(deal.lat).toFixed(5)}, ${Number(deal.lng).toFixed(5)}</p>
    <p><b>City:</b> ${cityText}</p><p><b>Submarket:</b> ${submarketText}</p>
    <div class="new-deal-popup-actions">
      <button type="button" class="new-deal-preview-btn" data-radius="3">3 Mile Preview</button>
      <button type="button" class="new-deal-preview-btn" data-radius="5">5 Mile Preview</button>
      <button type="button" class="new-deal-move-btn">Move Pin</button>
      <button type="button" class="new-deal-delete-btn">Delete Pin</button>
    </div>`;
  wrap.querySelectorAll('.new-deal-preview-btn').forEach(btn => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openNewDealMarketPreview(deal, Number(btn.dataset.radius));
    });
  });
  const move = wrap.querySelector('.new-deal-move-btn');
  if (move) move.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    moveNewDeal(deal);
  });
  const del = wrap.querySelector('.new-deal-delete-btn');
  if (del) {
    del.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!confirm(`Delete ${deal.name || 'this New Deal'} for everyone?`)) return;
      await deleteNewDeal(deal); state.map?.closePopup();
    });
  }
  return wrap;
}

function rebuildNewDealsLayer() {
  if (!state.map) return;
  const authorized = newDealAuthorizedUser(state.newDealsUser);
  const wasVisible = authorized && document.getElementById('toggleNewDeals')?.checked;
  if (state.newDealsLayer && state.map.hasLayer(state.newDealsLayer)) state.map.removeLayer(state.newDealsLayer);
  state.newDealsLayer = L.layerGroup((authorized ? (state.newDeals || []) : []).map(deal => {
    const marker = L.marker([Number(deal.lat), Number(deal.lng)], { icon: newDealIcon(deal), zIndexOffset: 1200, newDealId: deal.id });
    marker.bindPopup(() => newDealPopupContent(deal), { minWidth: 220, autoPan: false });
    enableMarkerHoverPopup(marker);
    return marker;
  }));
  if (wasVisible) state.newDealsLayer.addTo(state.map);
  updateNewDealsUI();
}


function ensureNewDealsLayerVisible(visible) {
  const authorized = newDealAuthorizedUser(state.newDealsUser);
  if (visible && !authorized) return;
  if (!state.newDealsLayer) rebuildNewDealsLayer();
  if (!state.newDealsLayer || !state.map) return;
  if (visible) { if (!state.map.hasLayer(state.newDealsLayer)) state.newDealsLayer.addTo(state.map); }
  else if (state.map.hasLayer(state.newDealsLayer)) state.map.removeLayer(state.newDealsLayer);
}


async function openNewDealEditor(latlng) {
  if (!await authorizeNewDealEditing()) { setNewDealAddMode(false); return; }
  const wrap = document.createElement('div');
  wrap.className = 'new-deal-editor';
  wrap.innerHTML = `<h3>Add New Deal</h3><label>Deal Name</label>
    <input type="text" class="new-deal-name-input" maxlength="120" placeholder="Enter deal name">
    <div class="new-deal-editor-coords">${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}</div>
    <div class="new-deal-editor-actions"><button type="button" class="new-deal-cancel-btn">Cancel</button><button type="button" class="new-deal-save-btn">Save Pin</button></div>`;
  const popup = L.popup({ closeButton:true, autoClose:true, closeOnClick:false, minWidth:240 }).setLatLng(latlng).setContent(wrap).openOn(state.map);
  const input=wrap.querySelector('.new-deal-name-input'); setTimeout(()=>input?.focus(),50);
  const cancel=()=>{ state.map.closePopup(popup); setNewDealAddMode(false); };
  wrap.querySelector('.new-deal-cancel-btn')?.addEventListener('click',cancel);
  const save=async()=>{
    const name=String(input?.value||'').trim(); if(!name){input?.focus();return;}
    if(!state.buildersLoaded){try{await loadBuilders(false);}catch(_){}}
    const ctx=newDealLocationContext(latlng);
    const id=(globalThis.crypto?.randomUUID?.() || `deal-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
    const deal={name,lat:latlng.lat,lng:latlng.lng,city:ctx.city,submarket:ctx.submarket,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    try {
      await firebase.firestore().collection(NEW_DEALS_COLLECTION).doc(id).set(deal);
      state.map.closePopup(popup); setNewDealAddMode(false);
    } catch(err) { console.error(err); alert(`New Deal could not be saved: ${err.message||err}`); }
  };
  wrap.querySelector('.new-deal-save-btn')?.addEventListener('click',save);
  input?.addEventListener('keydown',e=>{if(e.key==='Enter')save();});
}

function handleNewDealMapClick(latlng) { if (state.newDealsAddMode && latlng) openNewDealEditor(latlng); }

const NEW_DEAL_PLACE_SEARCH_URL = 'https://photon.komoot.io/api/';
const NEW_DEAL_ADDRESS_SUGGEST_URL = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest';
const NEW_DEAL_ADDRESS_FIND_URL = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';
let newDealPlaceSearchTimer = null;
let newDealPlaceSearchAbort = null;
let newDealPlaceSuggestions = [];
let newDealPlaceActiveIndex = -1;
let newDealPlaceResultMarker = null;

function newDealPlaceLabel(feature) {
  if (feature?.provider === 'arcgis' || feature?.provider === 'arcgis-candidate') {
    const text = String(feature.text || 'Address');
    const comma = text.indexOf(',');
    return comma > 0
      ? { main: text.slice(0, comma).trim(), detail: text.slice(comma + 1).trim() }
      : { main: text, detail: 'Address' };
  }
  const p = feature?.properties || {};
  const main = p.name || p.street || p.city || p.locality || p.county || 'Location';
  const parts = [];
  const houseStreet = [p.housenumber, p.street].filter(Boolean).join(' ');
  if (houseStreet && houseStreet.toLowerCase() !== String(main).toLowerCase()) parts.push(houseStreet);
  [p.city || p.locality, p.state, p.postcode].filter(Boolean).forEach(v => {
    if (!parts.some(x => String(x).toLowerCase() === String(v).toLowerCase()) && String(v).toLowerCase() !== String(main).toLowerCase()) parts.push(v);
  });
  return { main: String(main), detail: parts.join(', ') };
}

function clearNewDealPlaceSuggestions() {
  newDealPlaceSuggestions = [];
  newDealPlaceActiveIndex = -1;
  const box = document.getElementById('newDealPlaceSuggestions');
  if (box) { box.innerHTML = ''; box.classList.remove('open'); }
}

function isNewDealAddressQuery(q) {
  return /^\s*\d/.test(String(q || ''));
}

function newDealPlaceIsAddress(feature) {
  if (feature?.provider === 'arcgis' || feature?.provider === 'arcgis-candidate') return true;
  const p = feature?.properties || {};
  const t = String(p.type || '').toLowerCase();
  const osmValue = String(p.osm_value || '').toLowerCase();
  return Boolean(p.housenumber && p.street) || t === 'house' || osmValue === 'house' || osmValue === 'residential';
}

function clearNewDealPlaceResultMarker() {
  if (newDealPlaceResultMarker && state.map) {
    try { state.map.removeLayer(newDealPlaceResultMarker); } catch (_) {}
  }
  newDealPlaceResultMarker = null;
}

function showNewDealPlaceResultMarker(lat, lng, label) {
  clearNewDealPlaceResultMarker();
  if (!state.map || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
  // Use a DivIcon instead of Leaflet's default image icon. This avoids the
  // intermittent missing-marker issue that can occur when default icon assets
  // are not yet resolved by the browser/CDN.
  const icon = L.divIcon({
    className: '',
    html: '<div style="width:20px;height:20px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 1px 5px rgba(0,0,0,.45);box-sizing:border-box;"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
  newDealPlaceResultMarker = L.marker([lat, lng], {
    icon,
    keyboard: false,
    title: label || 'Search result',
    zIndexOffset: 1600
  }).addTo(state.map);
  if (label) newDealPlaceResultMarker.bindTooltip(label, { direction: 'top', offset: [0, -12] });
}

function renderNewDealPlaceSuggestions(features) {
  const box = document.getElementById('newDealPlaceSuggestions');
  if (!box) return;
  newDealPlaceSuggestions = Array.isArray(features) ? features.slice(0, 8) : [];
  newDealPlaceActiveIndex = -1;
  box.innerHTML = '';
  newDealPlaceSuggestions.forEach((feature, index) => {
    const label = newDealPlaceLabel(feature);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'new-deal-place-suggestion';
    btn.setAttribute('role', 'option');
    btn.innerHTML = `<span class="new-deal-place-suggestion-main"></span><span class="new-deal-place-suggestion-detail"></span>`;
    btn.querySelector('.new-deal-place-suggestion-main').textContent = label.main;
    btn.querySelector('.new-deal-place-suggestion-detail').textContent = label.detail;
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => selectNewDealPlaceSuggestion(index));
    box.appendChild(btn);
  });
  box.classList.toggle('open', newDealPlaceSuggestions.length > 0);
}

function setNewDealPlaceActiveIndex(index) {
  const box = document.getElementById('newDealPlaceSuggestions');
  if (!box || !newDealPlaceSuggestions.length) return;
  newDealPlaceActiveIndex = Math.max(0, Math.min(index, newDealPlaceSuggestions.length - 1));
  [...box.querySelectorAll('.new-deal-place-suggestion')].forEach((el, i) => el.classList.toggle('active', i === newDealPlaceActiveIndex));
  box.querySelectorAll('.new-deal-place-suggestion')[newDealPlaceActiveIndex]?.scrollIntoView({ block: 'nearest' });
}

function newDealSearchLocationParams(params) {
  const center = state.map?.getCenter?.();
  if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
    // ArcGIS uses x,y order for location; Photon uses separate lon/lat params.
    params.center = center;
  }
  return params;
}

async function fetchArcGisAddressCandidates(q, signal) {
  // Numeric-leading input is treated as an address search, not a POI/name search.
  // Use findAddressCandidates directly so a typed house number can surface the
  // complete address instead of only a street-name autocomplete collection.
  const params = new URLSearchParams({
    f: 'json',
    SingleLine: q,
    maxLocations: '8',
    countryCode: 'USA',
    outFields: 'Match_addr,Addr_type,City,Region,Postal,StAddr',
    forStorage: 'false',
    locationType: 'rooftop'
  });
  const center = state.map?.getCenter?.();
  const zoom = Number(state.map?.getZoom?.());
  // Strong local bias when the user has intentionally zoomed into a market.
  // At a very broad zoom, do not bias so an exact typed address is not suppressed.
  if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng) && Number.isFinite(zoom) && zoom >= 8) {
    params.set('location', `${center.lng},${center.lat}`);
  }
  const response = await fetch(`${NEW_DEAL_ADDRESS_FIND_URL}?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`Address service returned ${response.status}`);
  const data = await response.json();
  if (data?.error) throw new Error(data.error.message || 'Address lookup failed');
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
  return candidates
    .filter(c => Number.isFinite(Number(c?.location?.y)) && Number.isFinite(Number(c?.location?.x)))
    .map(c => ({
      provider: 'arcgis-candidate',
      text: String(c.address || c?.attributes?.Match_addr || q),
      query: q,
      score: Number(c.score || 0),
      lat: Number(c.location.y),
      lng: Number(c.location.x),
      addrType: String(c?.attributes?.Addr_type || ''),
      city: String(c?.attributes?.City || ''),
      region: String(c?.attributes?.Region || ''),
      postal: String(c?.attributes?.Postal || '')
    }))
    .sort((a, b) => b.score - a.score);
}

async function fetchPhotonPlaceSuggestions(q, signal) {
  const params = new URLSearchParams({ q, limit: '8', lang: 'en' });
  const center = state.map?.getCenter?.();
  if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
    params.set('lat', String(center.lat));
    params.set('lon', String(center.lng));
    params.set('zoom', String(Math.max(7, Math.min(16, state.map.getZoom?.() || 9))));
    params.set('location_bias_scale', '0.25');
  }
  const response = await fetch(`${NEW_DEAL_PLACE_SEARCH_URL}?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`Place service returned ${response.status}`);
  const data = await response.json();
  return (data?.features || []).filter(f => Array.isArray(f?.geometry?.coordinates)
    && Number.isFinite(Number(f.geometry.coordinates[0]))
    && Number.isFinite(Number(f.geometry.coordinates[1])));
}

async function fetchNewDealPlaceSuggestions() {
  const input = document.getElementById('newDealPlaceSearch');
  const status = document.getElementById('newDealPlaceSearchStatus');
  const q = String(input?.value || '').trim();
  if (q.length < 3) {
    clearNewDealPlaceSuggestions();
    if (status) status.textContent = q ? 'Type at least 3 characters.' : '';
    return;
  }
  if (newDealPlaceSearchAbort) newDealPlaceSearchAbort.abort();
  newDealPlaceSearchAbort = new AbortController();
  if (status) { status.textContent = isNewDealAddressQuery(q) ? 'Searching addresses…' : 'Searching nearby places…'; status.classList.remove('error'); }
  try {
    let suggestions;
    if (isNewDealAddressQuery(q)) {
      // Numeric-leading queries use ArcGIS World Geocoding, which has much
      // broader US street-address coverage than the OSM/Photon place index.
      suggestions = await fetchArcGisAddressCandidates(q, newDealPlaceSearchAbort.signal);
      // Fall back to Photon only if ArcGIS returns no usable address candidates.
      if (!suggestions.length) suggestions = await fetchPhotonPlaceSuggestions(q, newDealPlaceSearchAbort.signal);
    } else {
      suggestions = await fetchPhotonPlaceSuggestions(q, newDealPlaceSearchAbort.signal);
    }
    renderNewDealPlaceSuggestions(suggestions);
    if (status) status.textContent = suggestions.length
      ? `${suggestions.length} ${isNewDealAddressQuery(q) ? 'address' : 'nearby place'} suggestion${suggestions.length === 1 ? '' : 's'}`
      : 'No matching locations found.';
  } catch (err) {
    if (err?.name === 'AbortError') return;
    console.error('New Deal place search failed', err);
    clearNewDealPlaceSuggestions();
    if (status) { status.textContent = 'Place search is temporarily unavailable.'; status.classList.add('error'); }
  }
}

async function resolveArcGisAddressSuggestion(feature) {
  const params = new URLSearchParams({
    f: 'json',
    SingleLine: feature.text || feature.query || '',
    magicKey: feature.magicKey || '',
    maxLocations: '1',
    outFields: 'Match_addr,Addr_type,City,Region,Postal',
    countryCode: 'USA',
    forStorage: 'false'
  });
  const center = state.map?.getCenter?.();
  if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) params.set('location', `${center.lng},${center.lat}`);
  const response = await fetch(`${NEW_DEAL_ADDRESS_FIND_URL}?${params.toString()}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Address service returned ${response.status}`);
  const data = await response.json();
  if (data?.error) throw new Error(data.error.message || 'Address lookup failed');
  const c = data?.candidates?.[0];
  const lat = Number(c?.location?.y), lng = Number(c?.location?.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('No coordinates returned for this address');
  return { lat, lng, label: String(c.address || feature.text || 'Address') };
}

async function selectNewDealPlaceSuggestion(index) {
  const feature = newDealPlaceSuggestions[index];
  if (!feature) return;
  const input = document.getElementById('newDealPlaceSearch');
  const status = document.getElementById('newDealPlaceSearchStatus');
  if (state.newDealsAddMode) setNewDealAddMode(false);

  try {
    let lat, lng, markerLabel, inputLabel;
    if (feature.provider === 'arcgis-candidate') {
      lat = Number(feature.lat); lng = Number(feature.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('No coordinates returned for this address');
      markerLabel = String(feature.text || feature.query || 'Address');
      inputLabel = markerLabel;
    } else if (feature.provider === 'arcgis') {
      if (status) { status.textContent = 'Locating address…'; status.classList.remove('error'); }
      const resolved = await resolveArcGisAddressSuggestion(feature);
      lat = resolved.lat; lng = resolved.lng; markerLabel = resolved.label; inputLabel = resolved.label;
    } else {
      const coords = feature.geometry?.coordinates || [];
      lng = Number(coords[0]); lat = Number(coords[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const label = newDealPlaceLabel(feature);
      markerLabel = label.detail ? `${label.main}, ${label.detail}` : label.main;
      inputLabel = markerLabel;
    }
    if (input) input.value = inputLabel;
    clearNewDealPlaceSuggestions();
    showNewDealPlaceResultMarker(lat, lng, markerLabel);
    state.map?.flyTo([lat, lng], (feature.provider === 'arcgis' || feature.provider === 'arcgis-candidate') ? 18 : (newDealPlaceIsAddress(feature) ? 18 : 17), { animate: true, duration: 0.9 });
    if (status) { status.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`; status.classList.remove('error'); }
  } catch (err) {
    console.error('New Deal selected location could not be resolved', err);
    if (status) { status.textContent = 'That location could not be resolved. Try adding the city or ZIP code.'; status.classList.add('error'); }
  }
}

function scheduleNewDealPlaceSuggestions() {
  clearTimeout(newDealPlaceSearchTimer);
  newDealPlaceSearchTimer = setTimeout(fetchNewDealPlaceSuggestions, 350);
}

function parseNewDealCoordinateSearch(rawValue) {
  const raw=String(rawValue||'').trim(); if(!raw)return null;
  const decimal=raw.match(/^\s*([+-]?\d{1,2}(?:\.\d+)?)\s*[,; ]+\s*([+-]?\d{1,3}(?:\.\d+)?)\s*$/);
  if(decimal){const lat=Number(decimal[1]),lng=Number(decimal[2]);if(Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180)return{lat,lng};}
  const normalized=raw.replace(/[º˚]/g,'°').replace(/[′’]/g,"'").replace(/[″”]/g,'"').toUpperCase();
  const re=/(\d{1,3}(?:\.\d+)?)\s*(?:°|D)?\s*(\d{1,2}(?:\.\d+)?)?\s*(?:'|M)?\s*(\d{1,2}(?:\.\d+)?)?\s*(?:"|S)?\s*([NSEW])/g;
  const parts=[];let m;while((m=re.exec(normalized))!==null){const deg=Number(m[1]),min=Number(m[2]||0),sec=Number(m[3]||0),hemi=m[4];if(![deg,min,sec].every(Number.isFinite)||min>=60||sec>=60)return null;let value=deg+min/60+sec/3600;if(hemi==='S'||hemi==='W')value*=-1;parts.push({value,hemi});}
  if(parts.length!==2)return null;const latPart=parts.find(p=>p.hemi==='N'||p.hemi==='S'),lngPart=parts.find(p=>p.hemi==='E'||p.hemi==='W');if(!latPart||!lngPart||Math.abs(latPart.value)>90||Math.abs(lngPart.value)>180)return null;return{lat:latPart.value,lng:lngPart.value};
}

function navigateToNewDealCoordinates() {
  const input=document.getElementById('newDealCoordinateSearch'),status=document.getElementById('newDealCoordinateSearchStatus'),parsed=parseNewDealCoordinateSearch(input?.value);
  if(!parsed){if(status){status.textContent='Enter latitude / longitude in DMS or decimal format.';status.classList.add('error');}input?.focus();return;}
  if(status){status.textContent=`${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}`;status.classList.remove('error');}
  if(state.newDealsAddMode)setNewDealAddMode(false);state.map?.flyTo([parsed.lat,parsed.lng],17,{animate:true,duration:0.9});
}

function exportNewDealsKml() {
  const features = (state.newDeals || []).map(deal => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [Number(deal.lng), Number(deal.lat)] },
    properties: deal
  }));
  const styleBlocks = `<Style id="newDealStyle"><IconStyle><scale>1.0</scale><Icon><href>https://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href></Icon></IconStyle></Style>`;
  const kml = buildKmlDocument({
    documentName: 'Gulf Coast New Deals',
    folderName: 'New Deals',
    features,
    styleBlocks,
    placemarkOptions: feature => {
      const p = feature.properties || {};
      const description = [
        `<div><b>Coordinates:</b> ${Number(p.lat).toFixed(5)}, ${Number(p.lng).toFixed(5)}</div>`,
        `<div><b>City:</b> ${escapeHtml(p.city || '-')}</div>`,
        `<div><b>Submarket:</b> ${escapeHtml(p.submarket || 'Outside submarket boundary')}</div>`
      ].join('');
      return { name: p.name || 'New Deal', description, styleUrl: '#newDealStyle' };
    }
  });
  downloadKml('New_Deals.kml', kml);
}

function downloadBlob(filename, blob) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsv(rows) {
  return (rows || []).map(row => (row || []).map(csvEscape).join(',')).join('\n');
}

function escapeXml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeKmlCdata(text) {
  return String(text ?? '').replace(/\]\]>/g, ']]]]><![CDATA[>');
}

function hexToKmlColor(hex, alpha = 'ff') {
  const clean = String(hex || '').replace('#', '').trim();
  if (clean.length !== 6) return `${alpha}ffffff`;
  return `${alpha}${clean.slice(4, 6)}${clean.slice(2, 4)}${clean.slice(0, 2)}`.toLowerCase();
}

function ringToKmlCoordinates(ring) {
  if (!Array.isArray(ring) || !ring.length) return '';
  const coords = ring.map(pt => `${Number(pt[0])},${Number(pt[1])},0`);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!last || first[0] !== last[0] || first[1] !== last[1]) coords.push(`${Number(first[0])},${Number(first[1])},0`);
  return coords.join(' ');
}

function geometryToKml(geometry) {
  if (!geometry) return '';
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates || [];
    if (!rings.length) return '';
    const outer = `<outerBoundaryIs><LinearRing><coordinates>${ringToKmlCoordinates(rings[0])}</coordinates></LinearRing></outerBoundaryIs>`;
    const holes = rings.slice(1).map(ring => `<innerBoundaryIs><LinearRing><coordinates>${ringToKmlCoordinates(ring)}</coordinates></LinearRing></innerBoundaryIs>`).join('');
    return `<Polygon><altitudeMode>clampToGround</altitudeMode>${outer}${holes}</Polygon>`;
  }
  if (geometry.type === 'MultiPolygon') {
    return `<MultiGeometry>${(geometry.coordinates || []).map(poly => geometryToKml({ type: 'Polygon', coordinates: poly })).join('')}</MultiGeometry>`;
  }
  if (geometry.type === 'Point') {
    const c = geometry.coordinates || [];
    if (c.length < 2) return '';
    return `<Point><coordinates>${Number(c[0])},${Number(c[1])},0</coordinates></Point>`;
  }
  if (geometry.type === 'LineString') {
    const c = geometry.coordinates || [];
    if (!c.length) return '';
    return `<LineString><tessellate>1</tessellate><coordinates>${c.map(pt => `${Number(pt[0])},${Number(pt[1])},0`).join(' ')}</coordinates></LineString>`;
  }
  return '';
}

function featureToPlacemark(feature, opts = {}) {
  const p = feature.properties || {};
  const name = opts.name || p.DisplayName || p.Subdivision || p.Builder || p.Name || 'Unnamed';
  const description = opts.description || '';
  const styleUrl = opts.styleUrl || '#atlasStyle';
  const geometry = geometryToKml(feature.geometry);
  if (!geometry) return '';
  return `
    <Placemark>
      <name>${escapeXml(name)}</name>
      <description><![CDATA[${escapeKmlCdata(description)}]]></description>
      <styleUrl>${styleUrl}</styleUrl>
      ${geometry}
    </Placemark>`;
}

function buildKmlDocument({ documentName, folderName, features, placemarkOptions, styleBlocks, folderXml }) {
  const placemarks = (features || []).map(feature => featureToPlacemark(feature, typeof placemarkOptions === 'function' ? placemarkOptions(feature) : placemarkOptions)).filter(Boolean).join('');
  const body = folderXml || `
    <Folder>
      <name>${escapeXml(folderName)}</name>
      ${placemarks}
    </Folder>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(documentName)}</name>
    <open>1</open>
    ${styleBlocks || ''}
    ${body}
  </Document>
</kml>`;
}

function downloadKml(filename, kmlText) {
  downloadBlob(filename, new Blob([kmlText], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8' }));
}

const KML_ICON_BASE = 'https://maps.google.com/mapfiles/kml/paddle';

const BUILDER_KML_STYLES = {
  'builder-lennar': { color: '#2563eb', label: 'Lennar Homes', icon: 'blue-circle.png' },
  'builder-drhorton': { color: '#dc2626', label: 'D.R. Horton', icon: 'red-circle.png' },
  'builder-adams': { color: '#16a34a', label: 'Adams Homes', icon: 'grn-circle.png' },
  'builder-dsld': { color: '#7c3aed', label: 'DSLD Homes', icon: 'purple-circle.png' },
  'builder-holiday': { color: '#111827', label: 'Holiday Builders', icon: 'wht-circle.png' },
  'builder-meritage': { color: '#facc15', label: 'Meritage Homes', icon: 'ylw-circle.png' },
  'builder-maronda': { color: '#92400e', label: 'Maronda Homes', icon: 'orange-circle.png' },
  'builder-century': { color: '#7f1d1d', label: 'Century Complete', icon: 'pink-circle.png' },
  'builder-valor': { color: '#ec4899', label: 'Valor Homes', icon: 'ltblu-circle.png' },
  'builder-other': { color: '#f97316', label: 'Other', icon: 'orange-circle.png' }
};

const BUILDER_COLOR_CLASSES = [
  'builder-lennar',
  'builder-drhorton',
  'builder-adams',
  'builder-dsld',
  'builder-holiday',
  'builder-meritage',
  'builder-maronda',
  'builder-century',
  'builder-valor'
];

function hashStringToInt(value) {
  let hash = 0;
  const text = String(value || '');
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function builderKmlStyleClass(builder) {
  const cls = builderColorClass(builder);
  return BUILDER_KML_STYLES[cls] ? cls : 'builder-other';
}

function builderKmlStyleId(builder) {
  return `#${builderKmlStyleClass(builder)}`;
}

function builderKmlStyleBlocks() {
  return Object.entries(BUILDER_KML_STYLES).map(([styleId, cfg]) => `
    <Style id="${styleId}">
      <IconStyle>
        <scale>1.10</scale>
        <Icon><href>${KML_ICON_BASE}/${cfg.icon}</href></Icon>
      </IconStyle>
      <LabelStyle><scale>0.0</scale></LabelStyle>
    </Style>`).join('');
}

async function exportSubmarketOutlinesKml() {
  if (!state.features.length) {
    alert('Submarket data is still loading. Please try again in a moment.');
    return;
  }
  const styleBlocks = Object.entries(hubBaseColors).map(([hub, hex], index) => {
    const styleId = `hubStyle${index}`;
    return `
    <Style id="${styleId}">
      <LineStyle><color>${hexToKmlColor(hex)}</color><width>2</width></LineStyle>
      <PolyStyle><fill>0</fill><outline>1</outline></PolyStyle>
    </Style>`;
  }).join('') + `
    <Style id="hubStyleDefault">
      <LineStyle><color>${hexToKmlColor('#a7a7a7')}</color><width>2</width></LineStyle>
      <PolyStyle><fill>0</fill><outline>1</outline></PolyStyle>
    </Style>`;
  const hubStyleId = hub => {
    const idx = Object.keys(hubBaseColors).indexOf(hub);
    return idx >= 0 ? `#hubStyle${idx}` : '#hubStyleDefault';
  };
  const kml = buildKmlDocument({
    documentName: 'Gulf Coast Submarket Outlines',
    folderName: 'Submarket Outlines',
    features: state.features,
    styleBlocks,
    placemarkOptions: feature => {
      const p = feature.properties || {};
      const lines = [
        `<div><b>Submarket:</b> ${escapeXml(p.DisplayName || '')}</div>`,
        `<div><b>Submarket ID:</b> ${escapeXml(p.SubmarketID || '')}</div>`,
        `<div><b>Hub:</b> ${escapeXml(p.Hub || '')}</div>`,
        `<div><b>Acres:</b> ${escapeXml(fmt(Math.round(Number(p.Acres || 0))))}</div>`,
        `<div><b>Area Sq Mi:</b> ${escapeXml(fmtOne(p.AreaSqMi))}</div>`
      ].join('');
      return { name: p.DisplayName, description: `<div>${lines}</div>`, styleUrl: hubStyleId(p.Hub) };
    }
  });
  downloadKml('gulf_coast_submarket_outlines.kml', kml);
}

async function exportSubmarketNumbersKml() {
  if (!state.features.length) {
    alert('Submarket data is still loading. Please try again in a moment.');
    return;
  }
  const numberedFeatures = state.features
    .map(feature => {
      const number = submarketNumberForFeature(feature);
      const anchor = submarketNumberAnchorForFeature(feature, null);
      const p = feature.properties || {};
      if (number === null || number === undefined || !anchor) return null;
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [anchor.lng, anchor.lat] },
        properties: { ...p, Number: number }
      };
    })
    .filter(Boolean);

  const styleBlocks = `
    <Style id="numberStyle">
      <IconStyle><scale>0.9</scale><Icon><href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon></IconStyle>
      <LabelStyle><scale>1.25</scale></LabelStyle>
    </Style>`;

  const kml = buildKmlDocument({
    documentName: 'Gulf Coast Submarket Numbers',
    folderName: 'Submarket Numbers',
    features: numberedFeatures,
    styleBlocks,
    placemarkOptions: feature => {
      const p = feature.properties || {};
      const lines = [
        `<div><b>Submarket:</b> ${escapeXml(p.DisplayName || '')}</div>`,
        `<div><b>Submarket ID:</b> ${escapeXml(p.SubmarketID || '')}</div>`,
        `<div><b>Hub:</b> ${escapeXml(p.Hub || '')}</div>`,
        `<div><b>Number:</b> ${escapeXml(p.Number || '')}</div>`
      ].join('');
      return { name: String(p.Number || ''), description: `<div>${lines}</div>`, styleUrl: '#numberStyle' };
    }
  });
  downloadKml('gulf_coast_submarket_numbers.kml', kml);
}




function builderFolderSortKey(builderName) {
  const name = displayBuilderName(builderName || '?');
  if (/^lennar/i.test(name)) return `0_${name}`;
  return `1_${name.toLowerCase()}`;
}

function buildBuilderSubdivisionsKml(features) {
  const styleBlocks = builderKmlStyleBlocks();
  const placemarks = (features || []).map(feature => {
    const p = feature.properties || {};
    const primaryBuilder = primaryBuilderForFeature(feature);
    const builderClass = builderColorClass(primaryBuilder);
    const styleInfo = BUILDER_KML_STYLES[builderClass] || BUILDER_KML_STYLES['builder-other'];
    const priceText = builderRangeText(p.PriceMin, p.PriceMax, 'money');
    const sizeText = builderRangeText(p.UnitSizeMin, p.UnitSizeMax, 'number');
    const schoolElementary = formatSchoolRatingLabel(p.SchoolElementary);
    const schoolMiddle = formatSchoolRatingLabel(p.SchoolMiddle);
    const schoolHigh = formatSchoolRatingLabel(p.SchoolHigh);
    const lines = [
      `<div><b>Builder:</b> ${escapeXml(displayBuilderList(p.Builder || primaryBuilder) || primaryBuilder)}</div>`,
      `<div><b>Style Class:</b> ${escapeXml(builderClass)}</div>`,
      `<div><b>Color:</b> ${escapeXml(styleInfo.color)}</div>`,
      `<div><b>Status:</b> ${escapeXml(p.Status || '')}</div>`,
      `<div><b>Product:</b> ${escapeXml(p.ProductStyle || '')}</div>`,
      `<div><b>Price:</b> ${escapeXml(priceText)}</div>`,
      `<div><b>Square Foot:</b> ${escapeXml(sizeText)}</div>`,
      `<div><b>Elementary:</b> ${escapeXml(schoolElementary)}</div>`,
      `<div><b>Middle:</b> ${escapeXml(schoolMiddle)}</div>`,
      `<div><b>High:</b> ${escapeXml(schoolHigh)}</div>`,
      `<div><b>Submarket:</b> ${escapeXml(p.SubmarketName || '')}</div>`,
      `<div><b>Hub:</b> ${escapeXml(p.Hub || '')}</div>`,
      `<div><b>City:</b> ${escapeXml(p.City || '')}</div>`,
      `<div><b>Source:</b> ${escapeXml(p.Source || '')}</div>`
    ].join('');
    return featureToPlacemark(feature, { name: p.Subdivision || p.Builder || 'Builder Subdivision', description: `<div>${lines}</div>`, styleUrl: builderKmlStyleId(primaryBuilder) });
  }).filter(Boolean).join('');

  return buildKmlDocument({
    documentName: 'Gulf Coast Builder Subdivisions',
    folderName: 'Builder Subdivisions',
    features: [],
    styleBlocks,
    folderXml: `
    <Folder>
      <name>Builder Subdivisions</name>
      ${placemarks}
    </Folder>`
  });
}

async function ensureBuildersLoaded() {
  if (state.buildersLoaded) return true;
  if (!state.buildersLoadPromise) {
    state.buildersLoadPromise = loadBuilders(false).finally(() => {
      state.buildersLoadPromise = null;
    });
  }
  await state.buildersLoadPromise;
  return state.buildersLoaded;
}


async function getBuilderSubdivisionExportFeatures() {
  try {
    const response = await fetch('data/builder_subdivisions.geojson', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.features) && data.features.length) {
        return data.features;
      }
    }
  } catch (err) {
    console.warn('Builder export source fetch failed, falling back to in-memory layer if available.', err);
  }
  return Array.isArray(state.builders) ? state.builders : [];
}

async function exportBuilderSubdivisionsKml() {
  const filename = 'gulf_coast_builder_subdivisions_styled.kml';
  const staticKmlPath = 'data/gulf_coast_builder_subdivisions_styled.kml';
  try {
    const directLink = document.createElement('a');
    directLink.href = staticKmlPath;
    directLink.download = filename;
    directLink.rel = 'noopener';
    directLink.style.display = 'none';
    document.body.appendChild(directLink);
    directLink.click();
    directLink.remove();
    return;
  } catch (directErr) {
    console.warn('Direct builder KML download failed, falling back to fetched content.', directErr);
  }

  try {
    const response = await fetch(staticKmlPath, { cache: 'no-store' });
    if (response.ok) {
      const kml = await response.text();
      if (kml && kml.trim()) {
        downloadKml(filename, kml);
        return;
      }
    }
    throw new Error(`Static KML unavailable at ${staticKmlPath}`);
  } catch (staticErr) {
    console.warn('Static builder KML fetch failed, rebuilding from source features.', staticErr);
  }

  try {
    let features = [];
    if (Array.isArray(state.builders) && state.builders.length) {
      features = state.builders;
    } else {
      features = await getBuilderSubdivisionExportFeatures();
    }
    if (!features.length) {
      await ensureBuildersLoaded();
      features = Array.isArray(state.builders) ? state.builders : [];
    }
    if (!features.length) {
      throw new Error('No builder subdivision features available');
    }
    const kml = buildBuilderSubdivisionsKml(features);
    if (!kml || !kml.trim()) {
      throw new Error('Builder KML generation returned empty output');
    }
    downloadKml(filename, kml);
  } catch (err) {
    console.error('Builder subdivision export failed.', err);
    alert('Builder subdivision export failed. Please refresh the page and try again.');
  }
}

function colorForIncome(v) {

  if (!v || Number.isNaN(Number(v))) return '#e5e7eb';
  if (v >= 100000) return '#064e3b';
  if (v >= 85000) return '#047857';
  if (v >= 70000) return '#10b981';
  if (v >= 55000) return '#a7f3d0';
  return '#d1fae5';
}

function colorForPopGrowth(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '#e5e7eb';
  if (v >= 40) return '#7c2d12';
  if (v >= 20) return '#ea580c';
  if (v >= 10) return '#fb923c';
  if (v >= 0) return '#fed7aa';
  return '#cbd5e1';
}

function colorForPopulation(v) {
  if (!v || Number.isNaN(Number(v))) return '#e5e7eb';
  if (v >= 100000) return '#1e3a8a';
  if (v >= 60000) return '#2563eb';
  if (v >= 30000) return '#60a5fa';
  if (v >= 10000) return '#bfdbfe';
  return '#dbeafe';
}

function renderDemographicsCard(demo) {
  if (!demo) return `<div class="demo-card"><b>Demographics</b><br>No Census overlap record found for this submarket.</div>`;
  const c = demo.current || {};
  return `<div class="demo-card">
    <div class="demo-head"><b>Demographics</b><span>ACS 2020-2024 Current Estimate</span></div>
    <div class="demo-grid">
      <div><span>Population</span><b>${fmt(c.population)}</b><small>current estimate</small></div>
      <div><span>Households</span><b>${fmt(c.households)}</b><small>current estimate</small></div>
      <div><span>Median Income</span><b>${fmtMoney(c.median_household_income)}</b><small>current estimate</small></div>
      <div><span>Median Age</span><b>${fmtOne(c.median_age)}</b><small>current estimate</small></div>
      <div><span>Owner Occupancy</span><b>${fmtPct(c.owner_occupancy_pct)}</b><small>current estimate</small></div>
      <div><span>Bachelor's+</span><b>${fmtPct(c.bachelors_plus_pct)}</b><small>current estimate</small></div>
    </div>
    <div class="demo-note">Current values use ACS 2020-2024 5-Year block-group estimates area-weighted to custom KML boundaries. Forecast values are temporarily hidden pending a separate calibrated forecast model.</div>
  </div>`;
}

function colorForRetailDensity(density) {
  if (density === null || density === undefined || Number.isNaN(density) || density <= 0) return '#e5e7eb';
  if (density >= 4) return '#0f766e';
  if (density >= 2) return '#14b8a6';
  if (density >= 1) return '#5eead4';
  return '#ccfbf1';
}

function colorForLifestyleDensity(density) {
  if (density === null || density === undefined || Number.isNaN(density) || density <= 0) return '#e5e7eb';
  if (density >= 4) return '#9a3412';
  if (density >= 2) return '#ea580c';
  if (density >= 1) return '#fb923c';
  return '#fed7aa';
}

function normBrand(value) {
  return String(value || '').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}

function poiCategory(tags) {
  const amenity = tags.amenity || '';
  const shop = tags.shop || '';
  if (['restaurant','fast_food','cafe','food_court','ice_cream','bar','pub'].includes(amenity)) return 'Restaurant';
  if (['supermarket','grocery','wholesale','warehouse'].includes(shop)) return 'Grocery';
  if (shop === 'convenience') return 'Convenience';
  if (amenity === 'pharmacy' || shop === 'chemist' || shop === 'pharmacy') return 'Retail';
  if (shop === 'mall') return 'Shopping Center';
  if (shop) return 'Retail';
  return 'Other';
}

function poiSubcategory(tags) {
  return tags.amenity || tags.shop || 'poi';
}

function isNationalBrand(tags) {
  const brand = normBrand(tags.brand || tags.name || '');
  return tierOneBrands.some(b => brand === normBrand(b) || brand.includes(normBrand(b)));
}

function poiIcon(category) {
  const klass = category === 'Restaurant' ? 'poi-restaurant' : category === 'Grocery' ? 'poi-grocery' : category === 'Convenience' ? 'poi-convenience' : category === 'Shopping Center' ? 'poi-shopping' : 'poi-retail';
  const label = category === 'Restaurant' ? 'D' : category === 'Grocery' ? 'G' : category === 'Convenience' ? 'C' : category === 'Shopping Center' ? 'S' : 'R';
  return L.divIcon({ className: '', html: `<div class="poi-marker ${klass}">${label}</div>`, iconSize: [20,20], iconAnchor: [10,10], popupAnchor: [0,-10] });
}

function assignPoiToSubmarket(poi) {
  const coords = poi.geometry.coordinates;
  const match = state.features.find(f => pointInFeature(coords, f));
  if (match) {
    poi.properties.SubmarketID = match.properties.SubmarketID;
    poi.properties.SubmarketName = match.properties.DisplayName;
    poi.properties.Hub = match.properties.Hub;
  } else {
    poi.properties.SubmarketID = '';
    poi.properties.SubmarketName = '';
    poi.properties.Hub = '';
  }
}

function activeRetailPOIs() {
  return state.pois.filter(passesRetailFilter);
}

function normalizeRetailSearchText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function retailSearchText(feature) {
  const p = feature.properties || {};
  return [p.Name, p.Brand, p.Category, p.Subcategory, p.City, p.State]
    .filter(Boolean)
    .map(normalizeRetailSearchText)
    .join(' ');
}

function passesRetailFilter(feature) {
  const p = feature.properties || {};
  const c = p.Category || '';
  const filters = state.retailFilters || {};
  const categoryMatch =
    (c === 'Restaurant' && filters.Restaurant) ||
    (c === 'Grocery' && filters.Grocery) ||
    (c === 'Retail' && filters.Retail) ||
    (c === 'Shopping Center' && filters.Retail) ||
    (c === 'Convenience' && filters.Convenience);
  if (!categoryMatch) return false;
  if (filters.NationalBrandsOnly && !p.NationalBrand) return false;
  const query = normalizeRetailSearchText(state.retailSearchQuery);
  if (query && !retailSearchText(feature).includes(query)) return false;
  return true;
}

function retailSearchMatches() {
  const query = normalizeRetailSearchText(state.retailSearchQuery);
  if (!query || !state.poisLoaded) return [];
  return state.pois.filter(feature => {
    const p = feature.properties || {};
    const haystack = retailSearchText(feature);
    return haystack.includes(query) && (p.Category || '') !== 'Other';
  });
}


function retailSuggestionLabel(feature) {
  const p = feature.properties || {};
  return String(p.Brand || p.Name || '').trim() || 'Unnamed';
}

function retailSuggestionMatches(query) {
  const normalized = normalizeRetailSearchText(query);
  if (!normalized || normalized.length < 3 || !state.poisLoaded) return [];
  const seen = new Map();
  state.pois.forEach(feature => {
    const p = feature.properties || {};
    if ((p.Category || '') === 'Other') return;
    const label = retailSuggestionLabel(feature);
    const labelNorm = normalizeRetailSearchText(label);
    const nameNorm = normalizeRetailSearchText(p.Name || '');
    const brandNorm = normalizeRetailSearchText(p.Brand || '');
    const haystack = `${labelNorm} ${nameNorm} ${brandNorm}`.trim();
    if (!haystack.includes(normalized)) return;
    const key = labelNorm || nameNorm || brandNorm;
    if (!key || seen.has(key)) return;
    const count = state.pois.reduce((total, item) => {
      const ip = item.properties || {};
      if ((ip.Category || '') === 'Other') return total;
      const ilabel = normalizeRetailSearchText(retailSuggestionLabel(item));
      const iname = normalizeRetailSearchText(ip.Name || '');
      const ibrand = normalizeRetailSearchText(ip.Brand || '');
      return total + ((ilabel === key || iname === key || ibrand === key) ? 1 : 0);
    }, 0);
    seen.set(key, { label, count, feature });
  });
  return [...seen.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8);
}

function renderRetailSearchSuggestions(query) {
  const box = document.getElementById('retailSearchSuggestions');
  if (!box) return;
  const normalized = normalizeRetailSearchText(query);
  if (!normalized || normalized.length < 3 || !state.poisLoaded) {
    box.innerHTML = '';
    box.classList.remove('active');
    return;
  }
  const suggestions = retailSuggestionMatches(query);
  if (!suggestions.length) {
    box.innerHTML = '<div class="retail-search-suggestion-empty">No matching stores or restaurants found.</div>';
    box.classList.add('active');
    return;
  }
  box.innerHTML = suggestions.map((item, index) => `
    <button type="button" class="retail-search-suggestion" data-retail-suggestion-index="${index}" role="option">
      <span class="retail-search-suggestion-name">${escapeHtml(item.label)}</span>
      <span class="retail-search-suggestion-meta">${item.count.toLocaleString()} location${item.count === 1 ? '' : 's'}</span>
    </button>`).join('');
  box.classList.add('active');
  box.querySelectorAll('.retail-search-suggestion').forEach(button => {
    button.addEventListener('click', () => {
      const idx = Number(button.dataset.retailSuggestionIndex);
      const chosen = suggestions[idx];
      if (!chosen) return;
      const input = document.getElementById('retailSearchInput');
      if (input) input.value = chosen.label;
      box.classList.remove('active');
      applyRetailSearch(chosen.label, true);
      if (input) input.focus();
    });
  });
}

function applyRetailSearch(query, fitMap = true) {
  if (!state.poisLoaded) return;
  const normalized = String(query || '').trim();
  state.retailSearchQuery = normalized;
  const input = document.getElementById('retailSearchInput');
  if (input && input.value !== normalized) input.value = normalized;
  const suggestions = document.getElementById('retailSearchSuggestions');
  if (suggestions) { suggestions.classList.remove('active'); suggestions.innerHTML = ''; }
  buildPOILayer();
  const toggle = document.getElementById('toggleRetail');
  if (toggle?.checked && state.poiLayer && !state.map.hasLayer(state.poiLayer)) state.poiLayer.addTo(state.map);
  const matches = retailSearchMatches().filter(passesRetailFilter);
  const status = document.getElementById('retailSearchStatus');
  const clearBtn = document.getElementById('retailSearchClear');
  if (clearBtn) clearBtn.disabled = !normalized;
  if (status) {
    if (!normalized) status.textContent = '';
    else if (!matches.length) status.textContent = `No matches for \"${normalized}\"`;
    else status.textContent = `${matches.length.toLocaleString()} match${matches.length === 1 ? '' : 'es'} for \"${normalized}\"`;
  }
  if (fitMap && normalized && matches.length && state.map) {
    const bounds = L.latLngBounds(matches.map(feature => [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]));
    if (bounds.isValid()) state.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }
  updateRetailFilterPanel();
  if (state.submarketLayer) state.submarketLayer.setStyle(styleFeature);
}

function clearRetailSearch() {
  state.retailSearchQuery = '';
  const input = document.getElementById('retailSearchInput');
  if (input) input.value = '';
  const status = document.getElementById('retailSearchStatus');
  if (status) status.textContent = '';
  const clearBtn = document.getElementById('retailSearchClear');
  if (clearBtn) clearBtn.disabled = true;
  const suggestions = document.getElementById('retailSearchSuggestions');
  if (suggestions) { suggestions.classList.remove('active'); suggestions.innerHTML = ''; }
  applyRetailFilters();
}

function retailSummaryForSubmarket(submarketID, areaSqMi) {
  const pois = activeRetailPOIs().filter(p => p.properties.SubmarketID === submarketID);
  return retailSummary(pois, areaSqMi);
}

function retailSummaryForFeatures(features) {
  const ids = new Set(features.map(f => f.properties.SubmarketID));
  const area = features.reduce((sum, f) => sum + Number(f.properties.AreaSqMi || 0), 0);
  return retailSummary(activeRetailPOIs().filter(p => ids.has(p.properties.SubmarketID)), area);
}

function retailSummary(pois, areaSqMi = 0) {
  const out = { total: pois.length, Restaurant: 0, Grocery: 0, Convenience: 0, Retail: 0, ShoppingCenter: 0, NationalBrands: 0, density: 0 };
  pois.forEach(p => {
    const c = p.properties.Category;
    if (c === 'Shopping Center') out.ShoppingCenter += 1;
    else if (out[c] !== undefined) out[c] += 1;
    if (p.properties.NationalBrand) out.NationalBrands += 1;
  });
  out.density = areaSqMi ? out.total / Number(areaSqMi) : 0;
  return out;
}

function renderRetailCard(summary) {
  if (!state.poisLoaded) return `<div class="retail-card"><b>Retail & Dining</b><br>Turn on Retail & Dining to load POIs.</div>`;
  const filtered = activeRetailPOIs().length !== state.pois.length;
  return `<div class="retail-card">
    <div class="retail-head"><b>Retail & Dining</b><span>${summary.total.toLocaleString()} visible POIs</span></div>
    ${filtered ? `<div class="retail-filter-note">Filtered from ${state.pois.length.toLocaleString()} total POIs</div>` : ''}
    <div class="retail-grid">
      <div><span>Restaurants</span><b>${summary.Restaurant.toLocaleString()}</b></div>
      <div><span>Grocery</span><b>${summary.Grocery.toLocaleString()}</b></div>
      <div><span>Retail</span><b>${summary.Retail.toLocaleString()}</b></div>
      <div><span>Convenience</span><b>${summary.Convenience.toLocaleString()}</b></div>
      <div><span>National Brands</span><b>${summary.NationalBrands.toLocaleString()}</b></div>
      <div><span>Shopping Centers</span><b>${summary.ShoppingCenter.toLocaleString()}</b></div>
    </div>
  </div>`;
}


function lifestyleCategory(tags = {}) {
  const amenity = String(tags.amenity || '').toLowerCase();
  const leisure = String(tags.leisure || '').toLowerCase();
  const sport = String(tags.sport || '').toLowerCase();
  const name = String(tags.name || tags.brand || '').toLowerCase();
  if (leisure === 'golf_course' || sport === 'golf' || name.includes('golf')) return 'Golf';
  if (sport === 'pickleball' || leisure === 'pickleball_court' || name.includes('pickleball')) return 'Pickleball';
  if (sport === 'tennis' || leisure === 'tennis_court' || (leisure === 'pitch' && sport === 'tennis') || name.includes('tennis')) return 'Tennis';
  if (amenity === 'fitness_centre' || amenity === 'gym' || name.includes('gym') || name.includes('fitness')) return 'Fitness';
  if (amenity === 'community_centre' || leisure === 'sports_centre' || name.includes('community center') || name.includes('sports center') || name.includes('recreation center')) return 'Center';
  return 'Other';
}

function lifestyleCategoryLabel(key) {
  return ({ Golf: 'Golf Courses', Tennis: 'Tennis Courts', Pickleball: 'Pickleball Courts', Fitness: 'Gyms / Fitness', Center: 'Sports / Community Centers', Other: 'Others / Unknown' })[key] || 'Others / Unknown';
}

function lifestyleIcon(category) {
  const cls = category === 'Golf' ? 'lifestyle-golf' : category === 'Tennis' ? 'lifestyle-tennis' : category === 'Pickleball' ? 'lifestyle-pickleball' : category === 'Fitness' ? 'lifestyle-fitness' : category === 'Center' ? 'lifestyle-center' : 'lifestyle-other';
  const label = category === 'Golf' ? 'G' : category === 'Tennis' ? 'T' : category === 'Pickleball' ? 'P' : category === 'Fitness' ? 'F' : category === 'Center' ? 'C' : 'O';
  return L.divIcon({ className: '', html: `<div class="lifestyle-marker ${cls}">${label}</div>`, iconSize: [20,20], iconAnchor: [10,10], popupAnchor: [0,-10] });
}

function lifestylePopupHtml(p) {
  return `<div class="lifestyle-popup"><h3>${escapeHtml(p.Name || 'Lifestyle Amenity')}</h3><p><b>Type:</b> ${escapeHtml(lifestyleCategoryLabel(p.LifestyleCategory))}</p><p><b>Subcategory:</b> ${escapeHtml(p.Subcategory || '—')}</p><p><b>Location:</b> ${escapeHtml([p.City, p.State].filter(Boolean).join(', ') || '—')}</p><p><b>Submarket:</b> ${escapeHtml(p.SubmarketName || 'Outside submarket boundary')}</p><p><b>Source:</b> ${escapeHtml(p.Source || 'OpenStreetMap')}</p></div>`;
}

function assignLifestyleToSubmarket(feature) {
  const coords = feature.geometry.coordinates;
  const match = state.features.find(f => pointInFeature(coords, f));
  if (match) {
    feature.properties.SubmarketID = match.properties.SubmarketID;
    feature.properties.SubmarketName = match.properties.DisplayName;
    feature.properties.Hub = match.properties.Hub;
  } else {
    feature.properties.SubmarketID = '';
    feature.properties.SubmarketName = '';
    feature.properties.Hub = '';
  }
}

function passesLifestyleFilter(feature) {
  const p = feature.properties || {};
  const filters = state.lifestyleFilters || {};
  return !!filters[p.LifestyleCategory || 'Other'];
}

function activeLifestyleAmenities() {
  return state.lifestyle.filter(passesLifestyleFilter);
}

function lifestyleSummary(pois, areaSqMi = 0) {
  const out = { total: pois.length, Golf: 0, Tennis: 0, Pickleball: 0, Fitness: 0, Center: 0, Other: 0, density: 0 };
  pois.forEach(p => {
    const key = p.properties.LifestyleCategory || 'Other';
    if (out[key] !== undefined) out[key] += 1;
  });
  out.density = areaSqMi ? out.total / Number(areaSqMi) : 0;
  return out;
}

function lifestyleSummaryForSubmarket(submarketID, areaSqMi) {
  return lifestyleSummary(activeLifestyleAmenities().filter(p => p.properties.SubmarketID === submarketID), areaSqMi);
}

function lifestyleSummaryForFeatures(features) {
  const ids = new Set(features.map(f => f.properties.SubmarketID));
  const area = features.reduce((sum, f) => sum + Number(f.properties.AreaSqMi || 0), 0);
  return lifestyleSummary(activeLifestyleAmenities().filter(p => ids.has(p.properties.SubmarketID)), area);
}

function renderLifestyleCard(summary) {
  if (!state.lifestyleLoaded) return `<div class="lifestyle-card"><b>Lifestyle & Amenities</b><br>Turn on the layer to load golf, tennis, pickleball, and fitness amenities.</div>`;
  const filtered = activeLifestyleAmenities().length !== state.lifestyle.length;
  return `<div class="lifestyle-card">
    <div class="lifestyle-head"><b>Lifestyle & Amenities</b><span>${summary.total.toLocaleString()} visible POIs</span></div>
    ${filtered ? `<div class="retail-filter-note">Filtered from ${state.lifestyle.length.toLocaleString()} total amenities</div>` : ''}
    <div class="lifestyle-grid">
      <div><span>Golf</span><b>${summary.Golf.toLocaleString()}</b></div>
      <div><span>Tennis</span><b>${summary.Tennis.toLocaleString()}</b></div>
      <div><span>Pickleball</span><b>${summary.Pickleball.toLocaleString()}</b></div>
      <div><span>Gyms / Fitness</span><b>${summary.Fitness.toLocaleString()}</b></div>
      <div><span>Sports / Community</span><b>${summary.Center.toLocaleString()}</b></div>
      <div><span>Others</span><b>${summary.Other.toLocaleString()}</b></div>
    </div>
    <div class="lifestyle-nearest"><span>Density</span><b>${summary.density ? summary.density.toFixed(2) : '0.00'} per sq mi</b></div>
  </div>`;
}

function lifestyleOverpassQuery() {
  const [west, south, east, north] = bboxForSubmarkets();
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:90];(
    node["leisure"="golf_course"](${bbox});
    way["leisure"="golf_course"](${bbox});
    relation["leisure"="golf_course"](${bbox});

    node["amenity"~"^(fitness_centre|gym|community_centre)$"](${bbox});
    way["amenity"~"^(fitness_centre|gym|community_centre)$"](${bbox});
    relation["amenity"~"^(fitness_centre|gym|community_centre)$"](${bbox});

    node["leisure"="sports_centre"](${bbox});
    way["leisure"="sports_centre"](${bbox});
    relation["leisure"="sports_centre"](${bbox});

    node["sport"~"^(tennis|pickleball)$"](${bbox});
    way["sport"~"^(tennis|pickleball)$"](${bbox});
    relation["sport"~"^(tennis|pickleball)$"](${bbox});

    node["leisure"="pitch"]["sport"~"^(tennis|pickleball)$"](${bbox});
    way["leisure"="pitch"]["sport"~"^(tennis|pickleball)$"](${bbox});
    relation["leisure"="pitch"]["sport"~"^(tennis|pickleball)$"](${bbox});
  );out center tags;`;
}

function lifestyleOverpassElementToFeature(el) {
  const lon = el.lon !== undefined ? el.lon : el.center && el.center.lon;
  const lat = el.lat !== undefined ? el.lat : el.center && el.center.lat;
  if (lon === undefined || lat === undefined) return null;
  const tags = el.tags || {};
  const category = lifestyleCategory(tags);
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: {
      OSMID: `${el.type}/${el.id}`,
      Name: tags.name || tags.brand || lifestyleCategoryLabel(category),
      Brand: tags.brand || '',
      LifestyleCategory: category,
      Subcategory: tags.amenity || tags.leisure || tags.sport || '',
      City: tags['addr:city'] || '',
      State: tags['addr:state'] || '',
      Source: 'OpenStreetMap'
    }
  };
}

function buildLifestyleLayer() {
  const wasVisible = state.lifestyleLayer && state.map && state.map.hasLayer(state.lifestyleLayer);
  if (state.lifestyleLayer && state.map && state.map.hasLayer(state.lifestyleLayer)) state.map.removeLayer(state.lifestyleLayer);
  state.lifestyleMarkerIndex = new Map();
  state.lifestyleLayer = L.markerClusterGroup({
    chunkedLoading: true,
    chunkInterval: 120,
    chunkDelay: 30,
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: 14,
    maxClusterRadius: 55
  });
  activeLifestyleAmenities().forEach(feature => {
    const coords = feature.geometry && feature.geometry.coordinates;
    if (!coords || coords.length < 2) return;
    const p = feature.properties;
    const marker = L.marker([coords[1], coords[0]], { icon: lifestyleIcon(p.LifestyleCategory) });
    marker.feature = feature;
    marker.bindPopup(lifestylePopupHtml(p));
    enableMarkerHoverPopup(marker);
    marker.on('click', () => selectLifestyleAmenity(feature));
    state.lifestyleMarkerIndex.set(p.OSMID, marker);
    state.lifestyleLayer.addLayer(marker);
  });
  if (wasVisible) state.lifestyleLayer.addTo(state.map);
}

async function loadLifestyle(showLayer = false) {
  if (state.lifestyleLoaded) {
    if (showLayer && !state.lifestyleLayer) buildLifestyleLayer();
    if (showLayer && state.lifestyleLayer && !state.map.hasLayer(state.lifestyleLayer)) state.lifestyleLayer.addTo(state.map);
    return;
  }
  if (state.lifestyleLoadPromise) {
    await state.lifestyleLoadPromise;
    if (showLayer && !state.lifestyleLayer) buildLifestyleLayer();
    if (showLayer && state.lifestyleLayer && !state.map.hasLayer(state.lifestyleLayer)) state.lifestyleLayer.addTo(state.map);
    return;
  }
  state.lifestyleLoadPromise = (async () => {
    const badge = document.getElementById('lifestyleCountBadge');
    if (badge) badge.textContent = 'Preloading...';
    let features = readLocalPoiCache('lifestyle');
    if (!features) {
      const data = await fetchOverpass(lifestyleOverpassQuery());
      const seen = new Set();
      features = (data.elements || []).map(lifestyleOverpassElementToFeature).filter(Boolean).filter(f => {
        if (seen.has(f.properties.OSMID)) return false;
        seen.add(f.properties.OSMID);
        assignLifestyleToSubmarket(f);
        return !!f.properties.SubmarketID;
      });
      writeLocalPoiCache('lifestyle', features);
    }
    state.lifestyle = features;
    state.lifestyleLoaded = true;
    if (badge) badge.textContent = `${state.lifestyle.length.toLocaleString()} loaded`;
    updateLifestyleFilterPanel();
    buildSearchIndex();
    { const input = document.getElementById('searchInput'); if (input) renderSearchResults(input.value || ''); }
    if (state.selected) renderSelected(state.selected.properties); else renderHomeSummary();
  })();
  try {
    await state.lifestyleLoadPromise;
  } finally {
    state.lifestyleLoadPromise = null;
  }
  if (showLayer && !state.lifestyleLayer) buildLifestyleLayer();
  if (showLayer && state.lifestyleLayer && !state.map.hasLayer(state.lifestyleLayer)) state.lifestyleLayer.addTo(state.map);
}

function applyLifestyleFilters() {
  if (!state.lifestyleLoaded) return;
  buildLifestyleLayer();
  if (document.getElementById('toggleLifestyle')?.checked && !state.map.hasLayer(state.lifestyleLayer)) state.lifestyleLayer.addTo(state.map);
  const visibleCount = activeLifestyleAmenities().length;
  const badge = document.getElementById('lifestyleCountBadge');
  if (badge) badge.textContent = `${visibleCount.toLocaleString()} shown`;
  updateLifestyleFilterPanel();
  if (state.submarketLayer) state.submarketLayer.setStyle(styleFeature);
  if (state.selected) renderSelected(state.selected.properties); else renderHomeSummary();
}

function updateLifestyleFilterPanel() {
  const panel = document.getElementById('lifestyleFilterPanel');
  if (!panel) return;
  const visibleCount = state.lifestyleLoaded ? activeLifestyleAmenities().length : 0;
  panel.classList.toggle('active', !!document.getElementById('toggleLifestyle')?.checked);
  const count = document.getElementById('lifestyleFilterCount');
  if (count) count.textContent = state.lifestyleLoaded ? `${visibleCount.toLocaleString()} of ${state.lifestyle.length.toLocaleString()} visible` : 'Load Lifestyle & Amenities';
}

function selectLifestyleAmenity(feature) {
  if (state.lifestyleLayer && !state.map.hasLayer(state.lifestyleLayer)) state.lifestyleLayer.addTo(state.map);
  const toggle = document.getElementById('toggleLifestyle');
  if (toggle) toggle.checked = true;
  const target = state.lifestyleMarkerIndex ? state.lifestyleMarkerIndex.get(feature.properties.OSMID) : null;
  if (target) {
    state.map.setView(target.getLatLng(), Math.max(state.map.getZoom(), 14));
    if (state.lifestyleLayer.zoomToShowLayer) {
      state.lifestyleLayer.zoomToShowLayer(target, () => target.openPopup());
    } else {
      target.openPopup();
    }
  }
}


function defaultBuilderTierState() {
  return BUILDER_TIER_ORDER.reduce((acc, key) => {
    const cfg = state.builderTierConfig[key];
    acc[key] = { min: cfg.min, max: cfg.max };
    return acc;
  }, {});
}

function hydrateBuilderTierState() {
  state.builderFilters.TierNames = state.builderFilters.TierNames || {};
  const defaults = defaultBuilderTierState();
  const applyDefaults = () => {
    BUILDER_TIER_ORDER.forEach(key => {
      state.builderFilters.TierNames[key] = true;
      state.builderTierConfig[key] = { ...state.builderTierConfig[key], ...(defaults[key] || {}) };
    });
  };
  if (typeof window === 'undefined' || !window.localStorage) {
    applyDefaults();
    return;
  }
  try {
    const raw = localStorage.getItem(BUILDER_TIER_STORAGE_KEY);
    if (!raw) {
      applyDefaults();
      return;
    }
    const parsed = JSON.parse(raw);
    const savedSelected = (parsed && parsed.selected) || {};
    const savedConfig = (parsed && parsed.config) || {};
    BUILDER_TIER_ORDER.forEach(key => {
      state.builderFilters.TierNames[key] = savedSelected[key] !== undefined ? !!savedSelected[key] : true;
      const cfg = state.builderTierConfig[key] || {};
      const saved = savedConfig[key] || {};
      const min = saved.min === '' || saved.min === null || saved.min === undefined ? cfg.min : Number(saved.min);
      const max = saved.max === '' || saved.max === null || saved.max === undefined ? cfg.max : Number(saved.max);
      state.builderTierConfig[key] = { ...cfg, min: Number.isFinite(min) ? min : cfg.min, max: saved.max === '' ? null : (max === null || max === undefined || Number.isNaN(max) ? cfg.max : max) };
    });
  } catch (err) {
    console.warn('Unable to load builder tier preferences', err);
    applyDefaults();
  }
}

function persistBuilderTierState() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(BUILDER_TIER_STORAGE_KEY, JSON.stringify({
      selected: state.builderFilters.TierNames || {},
      config: BUILDER_TIER_ORDER.reduce((acc, key) => {
        const cfg = state.builderTierConfig[key] || {};
        acc[key] = { min: cfg.min ?? '', max: cfg.max ?? '' };
        return acc;
      }, {})
    }));
  } catch (err) {
    console.warn('Unable to save builder tier preferences', err);
  }
}

function parseCurrencyNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function builderPriceMax(feature) {
  const p = feature.properties || {};
  return parseCurrencyNumber(p.PriceMax);
}

function builderTierForFeature(feature) {
  const priceMax = builderPriceMax(feature);
  if (priceMax === null) return null;
  for (const key of BUILDER_TIER_ORDER) {
    const cfg = state.builderTierConfig[key] || {};
    const min = parseCurrencyNumber(cfg.min);
    const max = parseCurrencyNumber(cfg.max);
    const minOk = min === null || priceMax >= min;
    const maxOk = max === null || priceMax <= max;
    if (minOk && maxOk) return key;
  }
  return null;
}

function passesBuilderTierFilter(feature) {
  const selected = (state.builderFilters || {}).TierNames || {};
  const values = BUILDER_TIER_ORDER.map(key => selected[key] !== false);
  const anySelected = values.some(Boolean);
  if (!anySelected) return true;
  const allSelected = values.every(Boolean);
  const tierKey = builderTierForFeature(feature);
  if (!tierKey) return allSelected;
  return !!selected[tierKey];
}

function builderMatchesScopeFilters(feature, ignoreBuilderNames = false) {
  if (!builderProductStatusMatch(feature)) return false;
  if (!passesBuilderTierFilter(feature)) return false;
  if (ignoreBuilderNames) return true;
  const selectedBuilderKeys = Object.entries((state.builderFilters || {}).BuilderNames || {}).filter(([, checked]) => checked).map(([key]) => key);
  if (!selectedBuilderKeys.length) return true;
  const selected = new Set(selectedBuilderKeys);
  return builderNamesForFeature(feature).some(builder => selected.has(canonicalBuilderKey(builder)));
}

function activeBuilderSubdivisions() {
  return state.builders.filter(feature => builderMatchesScopeFilters(feature));
}

function normalizeSingleBuilderName(builder) {
  const raw = String(builder || '').trim();
  if (!raw || raw === '—' || /^unknown$/i.test(raw)) return '?';
  if (raw.toLowerCase().startsWith('lennar')) return 'Lennar Homes';
  return raw
    .replace(/\bInc\.?$/i, '')
    .replace(/\bLLC$/i, '')
    .replace(/\bHomes?$/i, 'Homes')
    .trim() || '?';
}

function builderNamesForFeature(feature) {
  const p = feature.properties || {};
  const raw = String(p.Builder || '').trim();
  const parts = raw ? raw.split('|').map(b => normalizeSingleBuilderName(b)).filter(Boolean) : [];
  const seen = new Set();
  const names = [];
  parts.forEach(name => {
    const key = canonicalBuilderKey(name);
    if (!seen.has(key)) { seen.add(key); names.push(name); }
  });
  return names.length ? names : ['?'];
}

function primaryBuilderForFeature(featureOrBuilder) {
  if (featureOrBuilder && featureOrBuilder.properties) {
    const names = builderNamesForFeature(featureOrBuilder);
    const lennar = names.find(name => canonicalBuilderKey(name) === 'lennar homes');
    return lennar || names[0] || '?';
  }
  const raw = String(featureOrBuilder || '').trim();
  const names = raw ? raw.split('|').map(b => normalizeSingleBuilderName(b)).filter(Boolean) : [];
  const lennar = names.find(name => canonicalBuilderKey(name) === 'lennar homes');
  return lennar || names[0] || '?';
}

function canonicalBuilderKey(builder) {
  const b = normalizeSingleBuilderName(builder);
  if (!b || b === '?' || b === '—' || /^unknown$/i.test(b)) return '?';
  if (b.toLowerCase().startsWith('lennar')) return 'lennar homes';
  return b.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function displayBuilderName(builder) {
  const b = normalizeSingleBuilderName(builder);
  if (!b || b === '?' || b === '—' || /^unknown$/i.test(b)) return '?';
  if (b.toLowerCase().startsWith('lennar')) return 'Lennar Homes';
  return b;
}

function displayBuilderList(builder) {
  const raw = String(builder || '').trim();
  const names = raw ? raw.split('|').map(b => displayBuilderName(b)).filter(Boolean) : ['?'];
  const seen = new Set();
  const out = [];
  names.forEach(name => {
    const key = canonicalBuilderKey(name);
    if (!seen.has(key)) { seen.add(key); out.push(name); }
  });
  return out.join(' | ') || '?';
}

function builderProductStatusMatch(feature) {
  const p = feature.properties || {};
  const f = state.builderFilters || {};
  const product = p.ProductStyle || '';
  const status = p.Status || '';
  const productMatch =
    (product === 'Single-Family Detached' && f.SingleFamily) ||
    (product === 'Townhomes' && f.Townhomes) ||
    (!['Single-Family Detached','Townhomes'].includes(product));
  const statusMatch =
    (status === 'Active' && f.Active) ||
    (status === 'Future' && f.Future) ||
    (status === 'Built Out' && f.BuiltOut) ||
    (!['Active','Future','Built Out'].includes(status));
  return productMatch && statusMatch;
}

function builderSummaryForSubmarket(submarketID, areaSqMi) {
  const rows = activeBuilderSubdivisions().filter(b => b.properties.SubmarketID === submarketID);
  return builderSummary(rows, areaSqMi);
}

function builderSummaryForFeatures(features) {
  const ids = new Set(features.map(f => f.properties.SubmarketID));
  const area = features.reduce((sum, f) => sum + Number(f.properties.AreaSqMi || 0), 0);
  return builderSummary(activeBuilderSubdivisions().filter(b => ids.has(b.properties.SubmarketID)), area);
}

function builderSummary(rows, areaSqMi = 0) {
  const out = { total: rows.length, active: 0, future: 0, built_out: 0, single_family: 0, townhomes: 0, builders_count: 0, builders: [], starts_by_builder: [], units_planned: 0, units_remaining: 0, annual_starts: 0, annual_closings: 0, vacant_developed_lots: 0, under_construction: 0, density: 0, communities: [] };
  const builders = new Set();
  const startsByBuilder = new Map();
  rows.forEach(f => {
    const p = f.properties || {};
    if (p.Status === 'Active') out.active += 1;
    else if (p.Status === 'Future') out.future += 1;
    else if (p.Status === 'Built Out') out.built_out += 1;
    if (p.ProductStyle === 'Townhomes') out.townhomes += 1;
    else if (p.ProductStyle === 'Single-Family Detached') out.single_family += 1;
    const builderNames = builderNamesForFeature(f);
    builderNames.forEach(b => builders.add(displayBuilderName(b)));
    const annualStarts = Number(p.AnnualStarts || 0);
    const allocatedStarts = builderNames.length ? annualStarts / builderNames.length : annualStarts;
    if (builderNames.length) {
      builderNames.forEach(b => { const name = displayBuilderName(b); startsByBuilder.set(name, (startsByBuilder.get(name) || 0) + allocatedStarts); });
    }
    out.units_planned += Number(p.UnitsPlanned || 0);
    out.units_remaining += Number(p.UnitsRemaining || 0);
    out.annual_starts += annualStarts;
    out.annual_closings += Number(p.AnnualClosings || 0);
    out.vacant_developed_lots += Number(p.VacantDevelopedLots || 0);
    out.under_construction += Number(p.UnderConstruction || 0);
    out.communities.push({ name: p.Subdivision || p.CommunityName || '', builder: displayBuilderList(p.Builder), status: p.Status || '', product: p.ProductStyle || '', units_remaining: p.UnitsRemaining, annual_starts: p.AnnualStarts });
  });
  out.builders = Array.from(builders).sort();
  out.builders_count = out.builders.length;
  out.starts_by_builder = Array.from(startsByBuilder.entries())
    .map(([builder, starts]) => ({ builder, starts, pct: out.annual_starts ? (starts / out.annual_starts) * 100 : 0 }))
    .sort((a, b) => b.starts - a.starts || a.builder.localeCompare(b.builder));
  out.density = areaSqMi ? out.total / Number(areaSqMi) : 0;
  return out;
}

function colorForBuilderDensity(density) {
  if (density === null || density === undefined || Number.isNaN(Number(density)) || density <= 0) return '#e5e7eb';
  if (density >= 1.2) return '#581c87';
  if (density >= 0.6) return '#7e22ce';
  if (density >= 0.25) return '#a855f7';
  return '#e9d5ff';
}


function detailKey(label) {
  return String(label || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function detailOpenAttr(label) {
  return state.detailOpen[detailKey(label)] ? ' open' : '';
}

function bindPersistentDetails() {
  const panel = document.getElementById('selectedPanel');
  if (!panel) return;
  panel.addEventListener('toggle', event => {
    const details = event.target;
    if (!details || String(details.tagName).toLowerCase() !== 'details') return;
    const summary = details.querySelector('summary');
    if (!summary) return;
    state.detailOpen[detailKey(summary.textContent)] = details.open;
  }, true);
}

function normalizeBuilderName(builder) {
  return primaryBuilderForFeature(builder);
}

function builderDisplayLetter(builder) {
  const b = normalizeBuilderName(builder);
  if (!b || b === '—' || /^unknown$/i.test(b)) return '?';
  if (/^d\.?\s*r\.?\s*horton/i.test(b)) return 'D';
  if (b.toLowerCase().startsWith('lennar')) return 'L';
  if (/^adams/i.test(b)) return 'A';
  if (/^dsld/i.test(b)) return 'D';
  if (/^holiday/i.test(b)) return 'H';
  if (/^meritage/i.test(b)) return 'M';
  if (/^maronda/i.test(b)) return 'M';
  if (/^century/i.test(b)) return 'C';
  if (/^valor/i.test(b)) return 'V';
  const m = b.match(/[A-Za-z]/);
  return m ? m[0].toUpperCase() : '?';
}

function builderColorClass(builder) {
  const normalized = normalizeBuilderName(builder);
  const b = normalized.toLowerCase();
  if (!b || b === '?' || b === '—' || /^unknown$/i.test(b)) return 'builder-other';
  if (b.startsWith('lennar')) return 'builder-lennar';
  if (/^d\.?\s*r\.?\s*horton/.test(b)) return 'builder-drhorton';
  if (/^adams/.test(b)) return 'builder-adams';
  if (/^dsld/.test(b)) return 'builder-dsld';
  if (/^holiday/.test(b)) return 'builder-holiday';
  if (/^meritage/.test(b)) return 'builder-meritage';
  if (/^maronda/.test(b)) return 'builder-maronda';
  if (/^century/.test(b)) return 'builder-century';
  if (/^valor/.test(b)) return 'builder-valor';
  const idx = hashStringToInt(canonicalBuilderKey(normalized)) % BUILDER_COLOR_CLASSES.length;
  return BUILDER_COLOR_CLASSES[idx];
}

function builderIcon(builder, status) {
  const s = String(status || '').toLowerCase();
  const statusCls = s.includes('future') ? 'builder-future' : s.includes('built') ? 'builder-built' : 'builder-active';
  const colorCls = builderColorClass(builder);
  const label = builderDisplayLetter(builder);
  return L.divIcon({ className: '', html: `<div class="builder-marker ${statusCls} ${colorCls}">${label}</div>`, iconSize: [24,24], iconAnchor: [12,12], popupAnchor: [0,-12] });
}

function builderRangeText(minVal, maxVal, kind = 'number') {
  const fmtValue = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    const rounded = Math.round(n);
    if (kind === 'money') return '$' + rounded.toLocaleString();
    return rounded.toLocaleString();
  };
  const minText = fmtValue(minVal);
  const maxText = fmtValue(maxVal);
  if (minText && maxText) return `${minText} - ${maxText}`;
  return minText || maxText || 'N/A';
}

function builderHomesiteSizeText(widthMinVal, widthMaxVal, areaMinVal, areaMaxVal) {
  const validPositive = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const widthMin = validPositive(widthMinVal);
  const widthMax = validPositive(widthMaxVal);
  const areaMin = validPositive(areaMinVal);
  const areaMax = validPositive(areaMaxVal);

  const dimensionPair = (width, area) => {
    if (!width || !area) return null;
    const depth = area / width;
    if (!Number.isFinite(depth) || depth <= 0) return null;
    return `${Math.round(width)}' x ${Math.round(depth)}'`;
  };

  const minPair = dimensionPair(widthMin || widthMax, areaMin || areaMax);
  const maxPair = dimensionPair(widthMax || widthMin, areaMax || areaMin);
  if (minPair && maxPair) return minPair === maxPair ? minPair : `${minPair} - ${maxPair}`;
  return minPair || maxPair || '-';
}


function enableMarkerHoverPopup(marker) {
  if (!marker || marker._atlasHoverPopupEnabled) return marker;
  marker._atlasHoverPopupEnabled = true;
  marker._atlasPopupPinned = false;

  marker.on('mouseover', () => {
    if (!marker._atlasPopupPinned && marker.getPopup && marker.getPopup()) marker.openPopup();
  });
  marker.on('mouseout', () => {
    if (!marker._atlasPopupPinned && marker.getPopup && marker.getPopup()) marker.closePopup();
  });
  marker.on('click', () => {
    if (marker.getPopup && marker.getPopup()) {
      marker._atlasPopupPinned = true;
      marker.openPopup();
    }
  });
  marker.on('popupclose', () => {
    marker._atlasPopupPinned = false;
  });
  return marker;
}

function positionBuilderHoverPopup(marker) {
  if (!marker || !state.map || !marker.getPopup || !marker.getPopup()) return;
  const popup = marker.getPopup();
  const el = popup.getElement && popup.getElement();
  const mapEl = state.map.getContainer && state.map.getContainer();
  if (!el || !mapEl) return;

  // Let Leaflet establish its normal popup position first, then offset the
  // popup inside the existing map viewport. This avoids auto-panning the map.
  el.style.marginLeft = '0px';
  el.style.marginTop = '0px';
  el.classList.remove('builder-popup-side');

  const mapRect = mapEl.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const point = state.map.latLngToContainerPoint(marker.getLatLng());
  const pad = 8;
  const gap = 12;
  const mapW = state.map.getSize().x;
  const mapH = state.map.getSize().y;
  const popupW = rect.width;
  const popupH = rect.height;
  const markerX = point.x;
  const markerY = point.y;

  let placement = 'top';
  let left = markerX - (popupW / 2);
  let top = markerY - popupH - gap;

  const fitsTop = top >= pad;
  const fitsRight = markerX + gap + popupW <= mapW - pad;
  const fitsLeft = markerX - gap - popupW >= pad;
  const fitsBottom = markerY + gap + popupH <= mapH - pad;

  if (fitsTop) {
    placement = 'top';
  } else if (fitsRight) {
    placement = 'right';
    left = markerX + gap;
    top = markerY - (popupH / 2);
  } else if (fitsLeft) {
    placement = 'left';
    left = markerX - popupW - gap;
    top = markerY - (popupH / 2);
  } else if (fitsBottom) {
    placement = 'bottom';
    left = markerX - (popupW / 2);
    top = markerY + gap;
  } else {
    // Nothing fits perfectly; clamp the preferred top position into view.
    placement = 'top';
  }

  left = Math.max(pad, Math.min(left, mapW - popupW - pad));
  top = Math.max(pad, Math.min(top, mapH - popupH - pad));

  const currentLeft = rect.left - mapRect.left;
  const currentTop = rect.top - mapRect.top;
  el.style.marginLeft = `${left - currentLeft}px`;
  el.style.marginTop = `${top - currentTop}px`;
  if (placement !== 'top') el.classList.add('builder-popup-side');
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeGreatSchoolsRating(value) {
  const rating = Number(value);
  return Number.isFinite(rating) && rating > 0 ? Math.max(0, Math.min(10, Math.round(rating))) : null;
}

function builderSchoolLevelLabel(level) {
  return String(level || '').replace(/\s*School\s*$/i, '').trim() || 'School';
}

function builderSchoolEntries(v) {
  return String(v || '')
    .split(/[;\n]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function builderSchoolRating(name, feature) {
  const p = feature && feature.properties ? feature.properties : {};
  const record = ratingForSchoolName({
    NAME: name,
    CITY: p.City || p.CITY || '',
    NMCNTY: p.County || p.NMCNTY || '',
    NCESSCH: p.NCESID || p.NCESSCH || ''
  });
  const rating = record && Number.isFinite(Number(record.Rating)) ? Number(record.Rating) : null;
  return rating !== null && rating > 0 ? rating : null;
}

function builderSchoolText(v, feature) {
  const names = builderSchoolEntries(v);
  if (!names.length) return 'N/A';
  const seen = new Set();
  const rendered = [];
  for (const rawName of names) {
    const name = String(rawName || '').trim();
    if (!name) continue;
    const key = simpleNameKey(name);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    const rating = builderSchoolRating(name, feature);
    rendered.push(`${escapeHtml(name)}${rating !== null ? ` (${rating})` : ' (Not Rated)'}`);
  }
  return rendered.length ? rendered.join('<br>') : 'N/A';
}


function builderSubdivisionPopupContent(feature) {
  const wrap = document.createElement('div');
  wrap.className = 'builder-popup builder-subdivision-popup';
  if (typeof L !== 'undefined' && L.DomEvent) {
    L.DomEvent.disableClickPropagation(wrap);
    L.DomEvent.disableScrollPropagation(wrap);
  }
  const p = feature && feature.properties ? feature.properties : {};
  const coords = feature && feature.geometry && feature.geometry.coordinates;
  const lat = Number(coords && coords[1]);
  const lng = Number(coords && coords[0]);
  const previewReady = Number.isFinite(lat) && Number.isFinite(lng);
  const displayBuilder = displayBuilderList(p.Builder);
  const tier = builderTierForFeature(feature);
  const tierLabel = tier ? ((state.builderTierConfig[tier] || {}).label || tier) : '—';

  wrap.innerHTML = `
    <h3>${escapeHtml(p.Subdivision || 'Builder Community')}</h3>
    <p><b>Builder:</b> ${escapeHtml(displayBuilder || '—')}</p>
    <p><b>Status:</b> ${escapeHtml(p.Status || '—')}</p>
    <p><b>Product:</b> ${escapeHtml(p.ProductStyle || '—')}</p>
    <p><b>Price:</b> ${builderRangeText(p.PriceMin, p.PriceMax, 'money')}</p>
    <p><b>Square Foot:</b> ${builderRangeText(p.UnitSizeMin, p.UnitSizeMax)}</p>
    <p><b>Homesite Size:</b> ${builderHomesiteSizeText(p.LotWidthMin, p.LotWidthMax, p.LotSizeMin, p.LotSizeMax)}</p>
    <p><b>${builderSchoolLevelLabel('Elementary')}:</b> ${builderSchoolText(p.SchoolElementary, feature)}</p>
    <p><b>${builderSchoolLevelLabel('Middle')}:</b> ${builderSchoolText(p.SchoolMiddle, feature)}</p>
    <p><b>${builderSchoolLevelLabel('High')}:</b> ${builderSchoolText(p.SchoolHigh, feature)}</p>
    <p><b>Combined School Rating:</b> ${builderCombinedSchoolRating(feature)}</p>
    <p><b>Units Remaining:</b> ${fmt(p.UnitsRemaining)}</p>
    <p><b>Annual Starts:</b> ${fmt(p.AnnualStarts)}</p>
    <p><b>City:</b> ${escapeHtml((p.City || '') + (p.State ? ', ' + p.State : ''))}</p>
    <p><b>Submarket:</b> ${escapeHtml(p.SubmarketName || 'Outside submarket boundary')}</p>
    <p><b>Tier:</b> ${escapeHtml(tierLabel)}</p>
    <p><b>Source:</b> ${escapeHtml(p.Source || 'Zonda export')}</p>
    ${previewReady ? `
      <div class="builder-preview-actions">
        <button type="button" class="builder-preview-btn" data-radius="3">3 mile</button>
        <button type="button" class="builder-preview-btn" data-radius="5">5 mile</button>
      </div>` : ''}`;

  wrap.querySelectorAll('.builder-preview-btn').forEach(btn => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!previewReady) return;
      openNewDealMarketPreview({ lat, lng }, Number(btn.dataset.radius));
    });
  });
  return wrap;
}

function builderCombinedSchoolRating(feature) {
  const p = feature && feature.properties ? feature.properties : {};
  const combined = [p.SchoolElementary, p.SchoolMiddle, p.SchoolHigh]
    .flatMap(builderSchoolEntries)
    .map(name => String(name || '').trim())
    .filter(Boolean);
  const unique = [];
  const seen = new Set();
  for (const name of combined) {
    const key = simpleNameKey(name);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    unique.push(name);
  }
  const ratings = unique
    .map(name => builderSchoolRating(name, feature))
    .filter(v => Number.isFinite(v) && v > 0);
  if (!ratings.length) return 'Not Rated';
  return Math.round(avg(ratings));
}

function renderBuilderCard(summary) {
  if (!state.buildersLoaded) return `<div class="builder-card"><b>Builder Subdivisions</b><br>Builder subdivision data is ready. Turn on the Builders layer to load communities.</div>`;
  summary = summary || builderSummary([]);
  const filtered = activeBuilderSubdivisions().length !== state.builders.length;
  const list = summary.communities && summary.communities.length ? `
    <details class="builder-used"${detailOpenAttr('Communities in boundary')}>
      <summary>Communities in boundary</summary>
      ${summary.communities.slice(0, 30).sort((a,b)=>a.name.localeCompare(b.name)).map(c => `<div class="builder-used-row"><span>${c.name}</span><b>${c.builder || '—'}</b></div>`).join('')}
      ${summary.communities.length > 30 ? `<div class="builder-used-note">Showing first 30 of ${summary.communities.length.toLocaleString()} communities.</div>` : ''}
    </details>` : `<div class="builder-used-note">No visible builder subdivisions are physically located inside this boundary.</div>`;
  const startsRows = summary.starts_by_builder && summary.starts_by_builder.length ? `
    <details class="builder-used"${detailOpenAttr('Starts by Builder')}>
      <summary>Starts by Builder</summary>
      ${summary.starts_by_builder.map(b => `<div class="builder-used-row"><span>${b.builder}</span><b>${fmt(Math.round(b.starts))} starts (${Number(b.pct || 0).toFixed(1)}%)</b></div>`).join('')}
    </details>` : `<details class="builder-used"${detailOpenAttr('Starts by Builder')}><summary>Starts by Builder</summary><div class="builder-used-note">No annual starts recorded for visible communities in this boundary.</div></details>`;
  return `<div class="builder-card">
    <div class="builder-head"><b>Builder Subdivisions</b><span>${summary.total.toLocaleString()} visible communities</span></div>
    ${filtered ? `<div class="builder-filter-note">Filtered from ${state.builders.length.toLocaleString()} total communities</div>` : ''}
    <div class="builder-grid">
      <div><span>Active</span><b>${summary.active.toLocaleString()}</b></div>
      <div><span>Future</span><b>${summary.future.toLocaleString()}</b></div>
      <div><span>Builders</span><b>${summary.builders_count.toLocaleString()}</b></div>
      <div><span>Units Remaining</span><b>${fmt(Math.round(summary.units_remaining || 0))}</b></div>
      <div><span>Annual Starts</span><b>${fmt(Math.round(summary.annual_starts || 0))}</b></div>
      <div><span>VDLs</span><b>${fmt(Math.round(summary.vacant_developed_lots || 0))}</b></div>
    </div>
    ${startsRows}
    ${list}
  </div>`;
}

function buildBuilderLayer() {
  const wasVisible = state.builderLayer && state.map && state.map.hasLayer(state.builderLayer);
  if (state.builderLayer && state.map && state.map.hasLayer(state.builderLayer)) state.map.removeLayer(state.builderLayer);
  state.builderMarkerIndex = new Map();
  state.builderLayer = L.layerGroup();
  activeBuilderSubdivisions().forEach(feature => {
    const coords = feature.geometry && feature.geometry.coordinates;
    if (!coords || coords.length < 2) return;
    const p = feature.properties || {};
    const displayBuilder = displayBuilderList(p.Builder);
    const primaryBuilder = primaryBuilderForFeature(feature);
    const marker = L.marker([coords[1], coords[0]], { icon: builderIcon(primaryBuilder, p.Status) });
    marker.feature = feature;
    marker.bindPopup(builderSubdivisionPopupContent(feature), {
      autoPan: false,
      autoPanPadding: [8, 8],
      closeButton: true,
      className: 'builder-subdivision-popup-shell',
      offset: [0, -12]
    });
    enableMarkerHoverPopup(marker);
    marker.on('popupopen', () => {
      requestAnimationFrame(() => requestAnimationFrame(() => positionBuilderHoverPopup(marker)));
    });
    marker.on('click', () => selectBuilderSubdivision(feature, false));
    marker.on('dblclick', () => selectBuilderSubdivision(feature, true));
    state.builderMarkerIndex.set(p.BuilderSubdivisionID, marker);
    state.builderLayer.addLayer(marker);
  });
  if (wasVisible) state.builderLayer.addTo(state.map);
}

function builderNameSort(a, b) {
  const an = displayBuilderName(a.name || a.builder || a);
  const bn = displayBuilderName(b.name || b.builder || b);
  const au = an === '?';
  const bu = bn === '?';
  if (au && !bu) return 1;
  if (!au && bu) return -1;
  const al = /^lennar/i.test(an);
  const bl = /^lennar/i.test(bn);
  if (al && !bl) return -1;
  if (!al && bl) return 1;
  return an.localeCompare(bn);
}

function builderNameOptionsForPanel() {
  if (!state.buildersLoaded) return [];
  const selectedID = state.selected && state.selected.properties ? state.selected.properties.SubmarketID : null;
  const counts = new Map();
  state.builders.forEach(feature => {
    const p = feature.properties || {};
    if (selectedID && p.SubmarketID !== selectedID) return;
    if (!builderMatchesScopeFilters(feature, true)) return;
    builderNamesForFeature(feature).forEach(builder => {
      const key = canonicalBuilderKey(builder);
      const name = displayBuilderName(builder);
      const prior = counts.get(key) || { key, name, count: 0 };
      if (prior.name === '?' && name !== '?') prior.name = name;
      prior.count += 1;
      counts.set(key, prior);
    });
  });
  const selected = (state.builderFilters || {}).BuilderNames || {};
  Object.entries(selected).forEach(([key, checked]) => {
    if (checked && !counts.has(key)) counts.set(key, { key, name: key === '?' ? '?' : (key === 'lennar homes' ? 'Lennar Homes' : key), count: 0 });
  });
  return Array.from(counts.values()).sort(builderNameSort);
}

function renderBuilderNameFilterList() {
  const list = document.getElementById('builderNameFilterList');
  if (!list) return;
  if (!state.buildersLoaded) {
    list.innerHTML = '<div class="builder-name-empty">Load Builder Subdivisions to filter by builder.</div>';
    return;
  }
  const options = builderNameOptionsForPanel();
  const selected = (state.builderFilters || {}).BuilderNames || {};
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const scope = state.selected && state.selected.properties ? `Available in ${state.selected.properties.DisplayName}` : 'All builders in atlas';
  if (!options.length) {
    list.innerHTML = `<div class="builder-name-empty">No builders match the current product/status filters. ${scope}.</div>`;
    return;
  }
  list.innerHTML = `
    <div class="builder-name-scope">${scope}</div>
    <div class="builder-name-actions"><button type="button" id="builderNamesClear">Show All</button><button type="button" id="builderNamesOnlyLennar">Lennar Only</button></div>
    ${options.map(opt => `<label class="builder-name-option"><input type="checkbox" class="builder-name-filter" data-builder-name-key="${opt.key}" ${selected[opt.key] ? 'checked' : ''}> <span>${opt.name}</span><b>${opt.count.toLocaleString()}</b></label>`).join('')}
    <div class="builder-name-empty">${selectedCount ? `${selectedCount} builder filter${selectedCount === 1 ? '' : 's'} active.` : 'No builder-specific filter active; showing all builders.'}</div>
  `;
  list.querySelectorAll('.builder-name-filter').forEach(input => {
    input.addEventListener('change', e => {
      const key = e.target.dataset.builderNameKey;
      if (!key) return;
      state.builderFilters.BuilderNames = state.builderFilters.BuilderNames || {};
      state.builderFilters.BuilderNames[key] = e.target.checked;
      applyBuilderFilters();
    });
  });
  const clearBtn = document.getElementById('builderNamesClear');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    state.builderFilters.BuilderNames = {};
    applyBuilderFilters();
  });
  const lennarBtn = document.getElementById('builderNamesOnlyLennar');
  if (lennarBtn) lennarBtn.addEventListener('click', () => {
    const lennar = options.find(opt => /^lennar/i.test(opt.name));
    state.builderFilters.BuilderNames = {};
    if (lennar) state.builderFilters.BuilderNames[lennar.key] = true;
    applyBuilderFilters();
  });
}

function formatPriceLabel(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function renderBuilderTierFilterList() {
  const list = document.getElementById('builderTierFilterList');
  if (!list) return;
  if (!state.buildersLoaded) {
    list.innerHTML = '<div class="builder-name-empty">Load Builder Subdivisions to filter by tier.</div>';
    return;
  }
  const selected = (state.builderFilters || {}).TierNames || {};
  const rows = BUILDER_TIER_ORDER.map(key => {
    const cfg = state.builderTierConfig[key] || {};
    const label = cfg.label || key;
    const min = cfg.min === null || cfg.min === undefined ? '' : cfg.min;
    const max = cfg.max === null || cfg.max === undefined ? '' : cfg.max;
    const minLabel = min === '' ? '$0' : `$${formatPriceLabel(min)}`;
    const maxLabel = max === '' ? 'and up' : `to $${formatPriceLabel(max)}`;
    return `<div class="builder-tier-row">
      <label class="builder-tier-toggle"><input type="checkbox" class="builder-tier-filter" data-builder-tier="${key}" ${selected[key] === false ? '' : 'checked'}> <span>${label}</span></label>
      <div class="builder-tier-range">
        <input type="number" min="0" step="1000" class="builder-tier-min" data-builder-tier="${key}" value="${min}">
        <span>to</span>
        <input type="number" min="0" step="1000" class="builder-tier-max" data-builder-tier="${key}" value="${max}" placeholder="∞">
      </div>
      <div class="builder-tier-hint">Price Max ${minLabel} ${maxLabel}</div>
    </div>`;
  }).join('');
  list.innerHTML = `
    <div class="builder-tier-scope">Range is based on community Price Max.</div>
    ${rows}
    <div class="builder-name-empty">Leave all tiers unchecked to show all communities.</div>
  `;
  list.querySelectorAll('.builder-tier-filter').forEach(input => {
    input.addEventListener('change', e => {
      const key = e.target.dataset.builderTier;
      if (!key) return;
      state.builderFilters.TierNames = state.builderFilters.TierNames || {};
      state.builderFilters.TierNames[key] = e.target.checked;
      persistBuilderTierState();
      applyBuilderFilters();
    });
  });
  list.querySelectorAll('.builder-tier-min, .builder-tier-max').forEach(input => {
    input.addEventListener('change', e => {
      const key = e.target.dataset.builderTier;
      if (!key) return;
      state.builderTierConfig[key] = state.builderTierConfig[key] || {};
      const cfg = state.builderTierConfig[key];
      const raw = e.target.value;
      if (e.target.classList.contains('builder-tier-min')) {
        cfg.min = raw === '' ? null : parseCurrencyNumber(raw);
      } else {
        cfg.max = raw === '' ? null : parseCurrencyNumber(raw);
      }
      persistBuilderTierState();
      applyBuilderFilters();
    });
  });
}

function updateBuilderFilterPanel() {
  const panel = document.getElementById('builderFilterPanel');
  if (!panel) return;
  const visibleCount = state.buildersLoaded ? activeBuilderSubdivisions().length : 0;
  panel.classList.toggle('active', !!document.getElementById('toggleBuilders')?.checked);
  renderBuilderNameFilterList();
  renderBuilderTierFilterList();
  const selectedBuilderCount = Object.values((state.builderFilters.BuilderNames || {})).filter(Boolean).length;
  const selectedTierCount = Object.values((state.builderFilters.TierNames || {})).filter(Boolean).length;
  const count = document.getElementById('builderFilterCount');
  if (count) count.textContent = state.buildersLoaded ? `${visibleCount.toLocaleString()} of ${state.builders.length.toLocaleString()} visible${selectedBuilderCount ? ` • ${selectedBuilderCount} builder filter${selectedBuilderCount === 1 ? '' : 's'}` : ''}${selectedTierCount !== BUILDER_TIER_ORDER.length ? ` • ${selectedTierCount} tier${selectedTierCount === 1 ? '' : 's'}` : ''}` : 'Load Builders';
}

function applyBuilderFilters() {
  if (!state.buildersLoaded) return;
  persistBuilderTierState();
  buildBuilderLayer();
  if (document.getElementById('toggleBuilders') && document.getElementById('toggleBuilders').checked && !state.map.hasLayer(state.builderLayer)) state.builderLayer.addTo(state.map);
  const visibleCount = activeBuilderSubdivisions().length;
  const badge = document.getElementById('builderCountBadge');
  if (badge) badge.textContent = `${visibleCount.toLocaleString()} shown`;
  updateBuilderFilterPanel();
  if (state.submarketLayer) state.submarketLayer.setStyle(styleFeature);
  if (state.selected) renderSelected(state.selected.properties); else renderHomeSummary();
}

async function loadBuilders(showLayer = false) {
  if (!state.buildersLoaded) {
    hydrateBuilderTierState();
    const badge = document.getElementById('builderCountBadge');
    if (badge) badge.textContent = 'Loading...';
    try {
      const [communities, summary] = await Promise.all([
        fetch('data/builder_subdivisions.geojson').then(r => r.json()),
        fetch('data/submarket_builder_summary.json').then(r => r.json())
      ]);
      state.builders = communities.features || [];
      state.builderSummary = summary;
      state.builderExportKml = null;
      state.builderExportKmlCount = 0;
    } catch (err) {
      console.warn('Builder subdivision data not available', err);
      state.builders = [];
      state.builderSummary = { metadata: { status: 'not_built' }, submarkets: {} };
    }
    buildBuilderLayer();
    state.builderExportKml = null;
    state.builderExportKmlCount = 0;
    state.buildersLoaded = true;
    if (badge) badge.textContent = state.builders.length ? `${state.builders.length.toLocaleString()} loaded` : 'No data';
    updateBuilderFilterPanel();
    buildSearchIndex();
    { const input = document.getElementById('searchInput'); if (input) renderSearchResults(input.value || ''); }
    renderRelease(state.metadata);
  }
  if (showLayer && state.builderLayer && !state.map.hasLayer(state.builderLayer)) state.builderLayer.addTo(state.map);
  if (state.selected) renderSelected(state.selected.properties); else renderHomeSummary();
}

function selectBuilderSubdivision(builder, zoomTo = false) {
  if (state.builderLayer && !state.map.hasLayer(state.builderLayer)) state.builderLayer.addTo(state.map);
  const toggle = document.getElementById('toggleBuilders');
  if (toggle) toggle.checked = true;
  const target = state.builderMarkerIndex ? state.builderMarkerIndex.get(builder.properties.BuilderSubdivisionID) : null;
  if (target) {
    if (zoomTo) state.map.setView(target.getLatLng(), Math.max(state.map.getZoom(), 13));
    target.openPopup();
  }
}

function overpassQuery() {
  const [west, south, east, north] = bboxForSubmarkets();
  const bbox = `${south},${west},${north},${east}`;
  const amenity = 'restaurant|fast_food|cafe|food_court|ice_cream|bar|pub|pharmacy';
  const shop = 'supermarket|grocery|wholesale|warehouse|convenience|department_store|mall|clothes|shoes|hardware|doityourself|furniture|electronics|sports|variety_store|discount|general|beauty|bakery|chemist|pharmacy|car|car_parts|mobile_phone|jewelry|florist|gift|optician|pet|toys|books';
  return `[out:json][timeout:90];(
    node["amenity"~"^(${amenity})$"](${bbox});
    way["amenity"~"^(${amenity})$"](${bbox});
    relation["amenity"~"^(${amenity})$"](${bbox});
    node["shop"~"^(${shop})$"](${bbox});
    way["shop"~"^(${shop})$"](${bbox});
    relation["shop"~"^(${shop})$"](${bbox});
  );out center tags;`;
}

function overpassElementToFeature(el) {
  const lon = el.lon !== undefined ? el.lon : el.center && el.center.lon;
  const lat = el.lat !== undefined ? el.lat : el.center && el.center.lat;
  if (lon === undefined || lat === undefined) return null;
  const tags = el.tags || {};
  const category = poiCategory(tags);
  if (category === 'Other') return null;
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: {
      OSMID: `${el.type}/${el.id}`,
      Name: tags.name || tags.brand || 'Unnamed',
      Brand: tags.brand || '',
      Category: category,
      Subcategory: poiSubcategory(tags),
      City: tags['addr:city'] || '',
      State: tags['addr:state'] || '',
      NationalBrand: isNationalBrand(tags),
      Source: 'OpenStreetMap'
    }
  };
}

const LOCAL_POI_CACHE_SCHEMA = 'gulf-coast-atlas-poi-cache-v1';
const LOCAL_POI_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function readLocalPoiCache(layerKey) {
  try {
    const raw = localStorage.getItem(`${LOCAL_POI_CACHE_SCHEMA}:${layerKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.features)) return null;
    if (parsed.cachedAt && (Date.now() - Number(parsed.cachedAt)) > LOCAL_POI_CACHE_TTL_MS) {
      localStorage.removeItem(`${LOCAL_POI_CACHE_SCHEMA}:${layerKey}`);
      return null;
    }
    return parsed.features;
  } catch (err) {
    console.warn(`Could not read ${layerKey} local POI cache`, err);
    return null;
  }
}

function writeLocalPoiCache(layerKey, features) {
  try {
    localStorage.setItem(`${LOCAL_POI_CACHE_SCHEMA}:${layerKey}`, JSON.stringify({ cachedAt: Date.now(), features }));
  } catch (err) {
    // Storage quotas/private browsing should never prevent the live layer from working.
    console.warn(`Could not persist ${layerKey} local POI cache`, err);
  }
}

async function fetchOverpass(query) {
  let lastError = null;
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, { method: 'POST', body: query, headers: { 'Content-Type': 'text/plain;charset=UTF-8' } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Overpass request failed');
}

async function loadPOIs(showLayer = false) {
  if (state.poisLoaded) {
    if (showLayer && !state.poiLayer) buildPOILayer();
    if (showLayer && state.poiLayer && !state.map.hasLayer(state.poiLayer)) state.poiLayer.addTo(state.map);
    return;
  }
  if (state.poisLoadPromise) {
    await state.poisLoadPromise;
    if (showLayer && !state.poiLayer) buildPOILayer();
    if (showLayer && state.poiLayer && !state.map.hasLayer(state.poiLayer)) state.poiLayer.addTo(state.map);
    return;
  }
  state.poisLoadPromise = (async () => {
    const badge = document.getElementById('retailCountBadge');
    if (badge) badge.textContent = 'Preloading...';
    let features = readLocalPoiCache('retail');
    if (!features) {
      const data = await fetchOverpass(overpassQuery());
      const seen = new Set();
      features = (data.elements || []).map(overpassElementToFeature).filter(Boolean).filter(f => {
        if (seen.has(f.properties.OSMID)) return false;
        seen.add(f.properties.OSMID);
        assignPoiToSubmarket(f);
        return !!f.properties.SubmarketID;
      });
      writeLocalPoiCache('retail', features);
    }
    state.pois = features;
    state.poisLoaded = true;
    if (badge) badge.textContent = `${state.pois.length.toLocaleString()} loaded`;
    updateRetailFilterPanel();
    buildSearchIndex();
    { const input = document.getElementById('searchInput'); if (input) renderSearchResults(input.value || ''); }
    if (state.selected) renderSelected(state.selected.properties); else renderHomeSummary();
  })();
  try {
    await state.poisLoadPromise;
  } finally {
    state.poisLoadPromise = null;
  }
  if (showLayer && !state.poiLayer) buildPOILayer();
  if (showLayer && state.poiLayer && !state.map.hasLayer(state.poiLayer)) state.poiLayer.addTo(state.map);
}

function buildPOILayer() {
  const wasVisible = state.poiLayer && state.map && state.map.hasLayer(state.poiLayer);
  if (state.poiLayer && state.map && state.map.hasLayer(state.poiLayer)) state.map.removeLayer(state.poiLayer);
  state.poiMarkerIndex = new Map();
  const searchActive = String(state.retailSearchQuery || '').trim().length > 0;
  state.poiLayer = searchActive
    ? L.layerGroup()
    : L.markerClusterGroup({
        chunkedLoading: true,
        chunkInterval: 120,
        chunkDelay: 30,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 14,
        maxClusterRadius: 55
      });
  activeRetailPOIs().forEach(feature => {
    const coords = feature.geometry && feature.geometry.coordinates;
    if (!coords || coords.length < 2) return;
    const p = feature.properties;
    const marker = L.marker([coords[1], coords[0]], { icon: poiIcon(p.Category) });
    marker.feature = feature;
    marker.bindPopup(`<div class="poi-popup"><h3>${p.Name}</h3><p><b>Category:</b> ${p.Category}</p><p><b>Subcategory:</b> ${p.Subcategory}</p><p><b>Brand:</b> ${p.Brand || '—'}</p><p><b>Submarket:</b> ${p.SubmarketName || 'Outside submarket boundary'}</p><p><b>Source:</b> OpenStreetMap</p></div>`);
    enableMarkerHoverPopup(marker);
    marker.on('click', () => selectPOI(feature));
    state.poiMarkerIndex.set(p.OSMID, marker);
    state.poiLayer.addLayer(marker);
  });
  if (wasVisible) state.poiLayer.addTo(state.map);
}

function applyRetailFilters() {
  if (!state.poisLoaded) return;
  buildPOILayer();
  if (document.getElementById('toggleRetail').checked && !state.map.hasLayer(state.poiLayer)) state.poiLayer.addTo(state.map);
  const visibleCount = activeRetailPOIs().length;
  document.getElementById('retailCountBadge').textContent = `${visibleCount.toLocaleString()} shown`;
  updateRetailFilterPanel();
  if (state.submarketLayer) state.submarketLayer.setStyle(styleFeature);
  if (state.selected) renderSelected(state.selected.properties); else renderHomeSummary();
}

function updateRetailFilterPanel() {
  const panel = document.getElementById('retailFilterPanel');
  if (!panel) return;
  const visibleCount = state.poisLoaded ? activeRetailPOIs().length : 0;
  panel.classList.toggle('active', !!document.getElementById('toggleRetail')?.checked);
  const count = document.getElementById('retailFilterCount');
  const query = String(state.retailSearchQuery || '').trim();
  if (count) {
    if (!state.poisLoaded) count.textContent = 'Load Retail & Dining';
    else if (query) count.textContent = `${visibleCount.toLocaleString()} match${visibleCount === 1 ? '' : 'es'} shown`;
    else count.textContent = `${visibleCount.toLocaleString()} of ${state.pois.length.toLocaleString()} visible`;
  }
  const input = document.getElementById('retailSearchInput');
  const clearBtn = document.getElementById('retailSearchClear');
  if (input && input.value !== query) input.value = query;
  if (clearBtn) clearBtn.disabled = !query;
}

function selectPOI(poi) {
  if (state.poiLayer && !state.map.hasLayer(state.poiLayer)) state.poiLayer.addTo(state.map);
  document.getElementById('toggleRetail').checked = true;
  const target = state.poiMarkerIndex ? state.poiMarkerIndex.get(poi.properties.OSMID) : null;
  if (target) {
    state.map.setView(target.getLatLng(), Math.max(state.map.getZoom(), 14));
    if (state.poiLayer.zoomToShowLayer) {
      state.poiLayer.zoomToShowLayer(target, () => target.openPopup());
    } else {
      target.openPopup();
    }
  }
}


function healthcareIcon(type) {
  const t = String(type || '').toLowerCase();
  const cls = t.includes('hospital') ? 'health-hospital' : t.includes('urgent') ? 'health-urgent' : t.includes('pharmacy') ? 'health-pharmacy' : 'health-clinic';
  const label = t.includes('hospital') ? 'H' : t.includes('urgent') ? 'U' : t.includes('pharmacy') ? 'P' : 'C';
  return L.divIcon({ className: '', html: `<div class="health-marker ${cls}">${label}</div>`, iconSize: [20,20], iconAnchor: [10,10], popupAnchor: [0,-10] });
}

function emptyHealthcareSummary() {
  return { total: 0, hospitals: 0, urgent_care: 0, clinics: 0, pharmacies: 0, other: 0, density: 0, nearest_hospital_name: '', nearest_hospital_mi: null, facilities: [] };
}

function healthcareSummaryForSubmarket(submarketID, areaSqMi) {
  const byId = (state.healthcareSummary && state.healthcareSummary.submarkets) || {};
  const summary = byId[submarketID] || emptyHealthcareSummary();
  if (summary.density === undefined) summary.density = areaSqMi ? summary.total / Number(areaSqMi) : 0;
  return summary;
}

function healthcareSummaryForFeatures(features) {
  const ids = new Set(features.map(f => f.properties.SubmarketID));
  const area = features.reduce((sum, f) => sum + Number(f.properties.AreaSqMi || 0), 0);
  const out = emptyHealthcareSummary();
  const hospitalDistances = [];
  features.forEach(f => {
    const s = healthcareSummaryForSubmarket(f.properties.SubmarketID, f.properties.AreaSqMi);
    out.total += Number(s.total || 0);
    out.hospitals += Number(s.hospitals || 0);
    out.urgent_care += Number(s.urgent_care || 0);
    out.clinics += Number(s.clinics || 0);
    out.pharmacies += Number(s.pharmacies || 0);
    out.other += Number(s.other || 0);
    if (s.nearest_hospital_mi !== null && s.nearest_hospital_mi !== undefined) hospitalDistances.push({ name: s.nearest_hospital_name, mi: Number(s.nearest_hospital_mi) });
    if (Array.isArray(s.facilities)) out.facilities.push(...s.facilities);
  });
  out.density = area ? out.total / area : 0;
  hospitalDistances.sort((a,b) => a.mi - b.mi);
  if (hospitalDistances.length) {
    out.nearest_hospital_name = hospitalDistances[0].name;
    out.nearest_hospital_mi = hospitalDistances[0].mi;
  }
  return out;
}

function colorForHealthcareDensity(density) {
  if (density === null || density === undefined || Number.isNaN(Number(density)) || density <= 0) return '#e5e7eb';
  if (density >= 1.2) return '#7f1d1d';
  if (density >= 0.6) return '#dc2626';
  if (density >= 0.25) return '#f87171';
  return '#fecaca';
}

function healthcareDatasetBuilt() {
  return !!(state.healthcareSummary && state.healthcareSummary.metadata && state.healthcareSummary.metadata.status === 'built');
}

function renderHealthcareCard(summary) {
  if (!healthcareDatasetBuilt()) return `<div class="healthcare-card"><b>Healthcare Facilities</b><br>Healthcare data has not been built yet. Run the Healthcare builder action to generate the facility dataset.</div>`;
  summary = summary || emptyHealthcareSummary();
  const nearest = summary.nearest_hospital_name ? `${summary.nearest_hospital_name}${summary.nearest_hospital_mi !== null && summary.nearest_hospital_mi !== undefined ? ' • ' + Number(summary.nearest_hospital_mi).toFixed(1) + ' mi' : ''}` : 'N/A';
  const list = summary.facilities && summary.facilities.length ? `
    <details class="healthcare-used"${detailOpenAttr('Facilities in boundary')}>
      <summary>Facilities in boundary</summary>
      ${summary.facilities.slice(0, 30).map(f => `<div class="healthcare-used-row"><span>${f.name}</span><b>${f.type}</b></div>`).join('')}
      ${summary.facilities.length > 30 ? `<div class="healthcare-used-note">Showing first 30 of ${summary.facilities.length.toLocaleString()} facilities.</div>` : ''}
    </details>` : `<div class="healthcare-used-note">No healthcare facilities are physically located inside this boundary.</div>`;
  return `<div class="healthcare-card">
    <div class="healthcare-head"><b>Healthcare Facilities</b><span>${summary.total.toLocaleString()} facilities</span></div>
    <div class="healthcare-grid">
      <div><span>Hospitals</span><b>${summary.hospitals.toLocaleString()}</b></div>
      <div><span>Urgent Care</span><b>${summary.urgent_care.toLocaleString()}</b></div>
      <div><span>Clinics / Offices</span><b>${summary.clinics.toLocaleString()}</b></div>
      <div><span>Pharmacies</span><b>${summary.pharmacies.toLocaleString()}</b></div>
    </div>
    <div class="healthcare-nearest"><span>Nearest Hospital</span><b>${nearest}</b></div>
    ${list}
  </div>`;
}

async function loadHealthcare(showLayer = false) {
  if (!state.healthcareLoaded) {
    const badge = document.getElementById('healthcareCountBadge');
    if (badge) badge.textContent = 'Loading...';
    // Healthcare must always be a point layer. This validation prevents any
    // Quickview polygon FeatureCollection from being mistaken for healthcare
    // if a future Promise loader is edited out of positional alignment.
    const healthcareLooksValid = Array.isArray(state.healthcare)
      && state.healthcare.every(feature => feature?.geometry?.type === 'Point')
      && !!(state.healthcareSummary && state.healthcareSummary.submarkets);
    if (!healthcareLooksValid) {
      try {
        const [facilities, summary] = await Promise.all([
          fetch('data/healthcare_facilities.geojson').then(r => r.json()),
          fetch('data/submarket_healthcare_summary.json').then(r => r.json())
        ]);
        const features = facilities.features || [];
        if (!features.every(feature => feature?.geometry?.type === 'Point')) {
          throw new Error('Healthcare facility dataset contains non-point geometry.');
        }
        state.healthcare = features;
        state.healthcareSummary = summary;
      } catch (err) {
        console.warn('Healthcare files not available yet', err);
        state.healthcare = [];
        state.healthcareSummary = { metadata: { status: 'not_built' }, submarkets: {} };
      }
    }
    state.healthcareLayer = L.geoJSON({ type: 'FeatureCollection', features: state.healthcare }, {
      pointToLayer: (feature, latlng) => L.marker(latlng, { icon: healthcareIcon(feature.properties.FacilityType) }),
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        layer.bindPopup(`<div class="healthcare-popup"><h3>${p.Name || 'Healthcare Facility'}</h3><p><b>Type:</b> ${p.FacilityType || ''}</p><p><b>Address:</b> ${p.Address || '—'}</p><p><b>City:</b> ${p.City || ''} ${p.State || ''}</p><p><b>Submarket:</b> ${p.SubmarketName || 'Outside submarket boundary'}</p><p><b>Source:</b> ${p.Source || ''}</p></div>`);
        enableMarkerHoverPopup(layer);
        layer.on('click', () => selectHealthcare(feature));
      }
    });
    state.healthcareLoaded = true;
    if (badge) badge.textContent = state.healthcare.length ? `${state.healthcare.length.toLocaleString()} loaded` : 'No data';
    buildSearchIndex();
    { const input = document.getElementById('searchInput'); if (input) renderSearchResults(input.value || ''); }
    renderRelease(state.metadata);
  }
  if (showLayer && state.healthcareLayer && !state.map.hasLayer(state.healthcareLayer)) state.healthcareLayer.addTo(state.map);
  if (state.selected) renderSelected(state.selected.properties); else renderHomeSummary();
}

function selectHealthcare(facility) {
  if (state.healthcareLayer && !state.map.hasLayer(state.healthcareLayer)) state.healthcareLayer.addTo(state.map);
  const toggle = document.getElementById('toggleHealthcare');
  if (toggle) toggle.checked = true;
  let target = null;
  state.healthcareLayer.eachLayer(layer => {
    if (layer.feature && layer.feature.properties.HealthcareID === facility.properties.HealthcareID) target = layer;
  });
  if (target) target.openPopup();
}

function styleFeature(feature) {
  const p = feature.properties;
  const selected = state.selected && state.selected.properties.SubmarketID === p.SubmarketID;
  const isOutline = state.mapTheme === 'outline';
  let lineColor = p.HubColor || p.HubBaseColor || '#8ea0ad';
  if (state.mapTheme === 'schools') lineColor = colorForSchoolScore(scoreSummaryForSubmarket(p.DisplayName).overall);
  else if (state.mapTheme === 'retail') lineColor = colorForRetailDensity(retailSummaryForSubmarket(p.SubmarketID, p.AreaSqMi).density);
  else if (state.mapTheme === 'healthcare') lineColor = colorForHealthcareDensity(healthcareSummaryForSubmarket(p.SubmarketID, p.AreaSqMi).density);
  else if (state.mapTheme === 'builders') lineColor = colorForBuilderDensity(builderSummaryForSubmarket(p.SubmarketID, p.AreaSqMi).density);
  else if (state.mapTheme === 'lifestyle') lineColor = colorForLifestyleDensity(lifestyleSummaryForSubmarket(p.SubmarketID, p.AreaSqMi).density);
  else if (state.mapTheme === 'income') lineColor = colorForIncome((demoForSubmarket(p.DisplayName)?.current || {}).median_household_income);
  else if (state.mapTheme === 'popgrowth') lineColor = colorForPopGrowth((demoForSubmarket(p.DisplayName)?.current || {}).population_growth_prior_5yr_pct);
  else if (state.mapTheme === 'population') lineColor = colorForPopulation((demoForSubmarket(p.DisplayName)?.current || {}).population);
  return {
    color: isOutline ? lineColor : (selected ? '#061827' : lineColor),
    fillColor: lineColor,
    weight: isOutline ? 1.8 : (selected ? 3.5 : 1.4),
    fillOpacity: isOutline ? 0 : (selected ? 0.28 : 0.18),
    fill: !isOutline,
    opacity: 1
  };
}

function legendHtml() {
  if (state.mapTheme === 'outline') {
    return `<b>Outline View</b><div class="legend-subtitle">Submarket boundaries only</div>` + hubOrder.map(hub => {
      const count = state.features.filter(f => f.properties.Hub === hub).length;
      return `<div class="legend-row"><i class="legend-swatch" style="background:transparent;border:2px solid #000000;box-sizing:border-box"></i><span>${hub.replace(' Hub','')}</span><small>${count}</small></div>`;
    }).join('');
  }
  if (state.mapTheme === 'schools') {
    return `<b>School Rating</b><div class="legend-subtitle">GreatSchools Average</div>` + [
      ['#1f8f4d','A','9.0-10.0'], ['#74b816','B','8.0-8.9'], ['#f2c94c','C','7.0-7.9'], ['#f2994a','D','6.0-6.9'], ['#d64545','F','Below 6.0'], ['#d0d5dd','Not Rated','Excluded / no rating']
    ].map(r => `<div class="legend-row"><i class="legend-swatch" style="background:${r[0]}"></i><span>${r[1]}</span><small>${r[2]}</small></div>`).join('');
  }
  if (state.mapTheme === 'retail') {
    return `<b>Retail Density</b><div class="legend-subtitle">POIs per sq mi</div>` + [
      ['#0f766e','Very High','4.0+'], ['#14b8a6','High','2.0-3.9'], ['#5eead4','Moderate','1.0-1.9'], ['#ccfbf1','Low','0.1-0.9'], ['#e5e7eb','None','0']
    ].map(r => `<div class="legend-row"><i class="legend-swatch" style="background:${r[0]}"></i><span>${r[1]}</span><small>${r[2]}</small></div>`).join('');
  }
  if (state.mapTheme === 'lifestyle') {
    return `<b>Lifestyle & Amenities</b><div class="legend-subtitle">POIs per sq mi</div>` + [
      ['#7c3aed','Very High','3.0+'], ['#8b5cf6','High','1.5-2.9'], ['#a78bfa','Moderate','0.5-1.4'], ['#ddd6fe','Low','0.1-0.4'], ['#e5e7eb','None','0']
    ].map(r => `<div class="legend-row"><i class="legend-swatch" style="background:${r[0]}"></i><span>${r[1]}</span><small>${r[2]}</small></div>`).join('');
  }
  if (state.mapTheme === 'healthcare') {
    return `<b>Healthcare Access</b><div class="legend-subtitle">Facilities per sq mi</div>` + [
      ['#be123c','Very High','2.0+'], ['#ef4444','High','1.0-1.9'], ['#fca5a5','Moderate','0.5-0.9'], ['#fecaca','Low','0.1-0.4'], ['#e5e7eb','None','0']
    ].map(r => `<div class="legend-row"><i class="legend-swatch" style="background:${r[0]}"></i><span>${r[1]}</span><small>${r[2]}</small></div>`).join('');
  }
  if (state.mapTheme === 'builders') {
    return `<b>Builder Activity</b><div class="legend-subtitle">Starts per sq mi</div>` + [
      ['#6d28d9','Very High','5.0+'], ['#7c3aed','High','2.5-4.9'], ['#a855f7','Moderate','1.0-2.4'], ['#d8b4fe','Low','0.1-0.9'], ['#e5e7eb','None','0']
    ].map(r => `<div class="legend-row"><i class="legend-swatch" style="background:${r[0]}"></i><span>${r[1]}</span><small>${r[2]}</small></div>`).join('');
  }
  if (state.mapTheme === 'income') {
    return `<b>Median Income</b><div class="legend-subtitle">ACS 2020-2024 Current Estimate</div>` + [
      ['#7c3aed','Very High','$90k+'], ['#8b5cf6','High','$75k-$89k'], ['#a78bfa','Moderate','$60k-$74k'], ['#c4b5fd','Low','$45k-$59k'], ['#e5e7eb','Very Low','Under $45k']
    ].map(r => `<div class="legend-row"><i class="legend-swatch" style="background:${r[0]}"></i><span>${r[1]}</span><small>${r[2]}</small></div>`).join('');
  }
  if (state.mapTheme === 'population') {
    return `<b>Population</b><div class="legend-subtitle">ACS 2020-2024 Current Estimate</div>` + [
      ['#1e3a8a','100k+','Very High'], ['#2563eb','60k-99k','High'], ['#60a5fa','30k-59k','Moderate'], ['#bfdbfe','10k-29k','Low'], ['#dbeafe','<10k','Very Low'], ['#e5e7eb','N/A','No data']
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
  if (!overlayThemes.has(theme)) state.returnTheme = theme;
  if (state.submarketLayer) state.submarketLayer.setStyle(styleFeature);
  if (state.submarketNumberLayer) {
    if (theme === 'hub') {
      if (!state.map.hasLayer(state.submarketNumberLayer)) state.submarketNumberLayer.addTo(state.map);
    } else if (state.map.hasLayer(state.submarketNumberLayer)) {
      state.map.removeLayer(state.submarketNumberLayer);
    }
  }
  updateLegend();
  if (state.selected) renderSelected(state.selected.properties); else renderHomeSummary();
}


function createArcGisExportGridLayer(serviceUrl, options = {}) {
  const ExportGridLayer = L.GridLayer.extend({
    createTile(coords, done) {
      const tile = document.createElement('img');
      tile.alt = '';
      tile.setAttribute('role', 'presentation');
      tile.crossOrigin = 'anonymous';
      const tileSize = this.getTileSize();
      const nwPoint = coords.scaleBy(tileSize);
      const sePoint = nwPoint.add(tileSize);
      const nwLatLng = this._map.unproject(nwPoint, coords.z);
      const seLatLng = this._map.unproject(sePoint, coords.z);
      const nw = L.CRS.EPSG3857.project(nwLatLng);
      const se = L.CRS.EPSG3857.project(seLatLng);
      const params = new URLSearchParams({
        bbox: `${nw.x},${se.y},${se.x},${nw.y}`,
        bboxSR: '3857',
        imageSR: '3857',
        size: `${tileSize.x},${tileSize.y}`,
        format: 'png32',
        transparent: 'true',
        dpi: '96',
        f: 'image'
      });
      if (options.layers) params.set('layers', options.layers);
      tile.onload = () => done(null, tile);
      tile.onerror = () => done(null, tile);
      tile.src = `${serviceUrl.replace(/\/$/, '')}/export?${params.toString()}`;
      return tile;
    }
  });
  return new ExportGridLayer({
    pane: options.pane || 'tilePane',
    minZoom: options.minZoom ?? 0,
    maxZoom: options.maxZoom ?? 20,
    opacity: options.opacity ?? 1,
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 1,
    attribution: options.attribution || ''
  });
}

function updateReferenceOverlayToggleStyle(id, active) {
  const input = document.getElementById(id);
  const label = input?.closest('.map-overlay-toggle');
  if (label) label.classList.toggle('is-active', !!active);
}

function setReferenceOverlay(name, enabled) {
  const layer = state.referenceOverlays[name];
  if (!layer || !state.map) return;
  if (enabled) {
    if (!state.map.hasLayer(layer)) layer.addTo(state.map);
    layer.bringToFront?.();
  } else if (state.map.hasLayer(layer)) {
    state.map.removeLayer(layer);
  }
  updateReferenceOverlayToggleStyle(name === 'floodZones' ? 'toggleFloodZones' : 'toggleContours', enabled);
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
  state.basemaps.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19
  });

  // Reference GIS overlays live above basemap tiles but beneath Atlas vectors/markers.
  state.map.createPane('floodReferencePane');
  state.map.getPane('floodReferencePane').style.zIndex = 260;
  state.map.getPane('floodReferencePane').style.pointerEvents = 'none';
  state.map.createPane('contourReferencePane');
  state.map.getPane('contourReferencePane').style.zIndex = 270;
  state.map.getPane('contourReferencePane').style.pointerEvents = 'none';

  state.referenceOverlays.floodZones = createArcGisExportGridLayer(
    'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer',
    {
      layers: 'show:28',
      pane: 'floodReferencePane',
      minZoom: 9,
      maxZoom: 20,
      opacity: 0.58,
      attribution: 'Flood hazard data: FEMA NFHL'
    }
  );
  state.referenceOverlays.contours = createArcGisExportGridLayer(
    'https://carto.nationalmap.gov/arcgis/rest/services/contours/MapServer',
    {
      pane: 'contourReferencePane',
      minZoom: 7,
      maxZoom: 20,
      opacity: 0.72,
      attribution: 'Elevation contours: USGS The National Map / 3DEP'
    }
  );

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
  const [geojson, meta, demographics, demographicsBlockGroups, quickviewLegacy, centralQuickviewBlocks, centralBaldwinQuickviewBlocks, westQuickviewBlocks, southQuickviewBlocks, northBaldwinQuickviewBlocks, southBaldwinQuickviewBlocks, pensacolaQuickviewBlocks, cantonmentQuickviewBlocks, paceQuickviewBlocks, miltonQuickviewBlocks, pensacolaBeachesQuickviewBlocks, fortWaltonQuickviewBlocks, crestviewQuickviewBlocks, laurelHillQuickviewBlocks, waltonBayBeachesQuickviewBlocks, freeportQuickviewBlocks, defuniakSpringsQuickviewBlocks, panamaCityQuickviewBlocks, mariannaQuickviewBlocks, healthcareFacilities, healthcareSummary] = await Promise.all([
    fetch('data/submarkets.geojson').then(r => r.json()),
    fetch('data/metadata.json').then(r => r.json()),
    fetch('data/submarket_demographics_combined.json').then(r => r.json()),
    fetch('data/demographics_block_groups.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/central_mobile_quickview.json').then(r => r.json()).catch(() => null),
    fetch('data/market_quickview/central_mobile_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/central_baldwin_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/west_baldwin_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/south_mobile_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/north_baldwin_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/south_baldwin_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/pensacola_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/cantonment_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/pace_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/milton_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/pensacola_beaches_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/fort_walton_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/crestview_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/laurel_hill_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/walton_bay_beaches_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/freeport_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/defuniak_springs_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/panama_city_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/market_quickview/marianna_quickview_blocks.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/healthcare_facilities.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/submarket_healthcare_summary.json').then(r => r.json()).catch(() => ({ metadata: { status: 'not_built' }, submarkets: {} }))
  ]);

  state.features = geojson.features;
  state.metadata = meta;
  state.demographics = demographics;
  state.demographicsLoaded = true;
  state.demographicsBlockGroups = demographicsBlockGroups.features || [];
  state.demographicsBlockGroupsLoaded = state.demographicsBlockGroups.length > 0;
  state.marketQuickview = state.marketQuickview || { active: false, loaded: false, data: null, submarket: MARKET_QUICKVIEW_DEFAULT_SUBMARKET, radiusMiles: null, awaitingPoint: false, busy: false };
  state.marketQuickview.data = quickviewLegacy;
  const quickviewCombinedFeatures = [
    ...(centralQuickviewBlocks?.features || []),
    ...(centralBaldwinQuickviewBlocks?.features || []),
    ...(westQuickviewBlocks?.features || []),
    ...(southQuickviewBlocks?.features || []),
    ...(northBaldwinQuickviewBlocks?.features || []),
    ...(southBaldwinQuickviewBlocks?.features || []),
    ...(pensacolaQuickviewBlocks?.features || []),
    ...(cantonmentQuickviewBlocks?.features || []),
    ...(paceQuickviewBlocks?.features || []),
    ...(miltonQuickviewBlocks?.features || []),
    ...(pensacolaBeachesQuickviewBlocks?.features || []),
    ...(fortWaltonQuickviewBlocks?.features || []),
    ...(crestviewQuickviewBlocks?.features || []),
    ...(laurelHillQuickviewBlocks?.features || []),
    ...(waltonBayBeachesQuickviewBlocks?.features || []),
    ...(freeportQuickviewBlocks?.features || []),
    ...(defuniakSpringsQuickviewBlocks?.features || []),
    ...(panamaCityQuickviewBlocks?.features || []),
    ...(mariannaQuickviewBlocks?.features || [])
  ];
  state.marketQuickview.loaded = quickviewCombinedFeatures.length > 0;
  state.quickviewBlocks = quickviewCombinedFeatures;
  state.quickviewBlocksLoaded = state.quickviewBlocks.length > 0;
  if (quickviewLegacy?.metadata?.submarket) state.marketQuickview.submarket = quickviewLegacy.metadata.submarket;
  state.healthcare = healthcareFacilities.features || [];
  state.healthcareSummary = healthcareSummary;
  // healthcareLoaded tracks whether the Leaflet marker layer has been constructed.
  // healthcareDatasetBuilt() tracks whether the static data files have real records.
  state.healthcareLoaded = false;
  buildSearchIndex();
  renderRelease(meta);
  renderHubList(meta);
  renderSearchResults('');
  renderHomeSummary();

  const submarketNumberMarkers = [];
  state.submarketLayer = L.geoJSON(geojson, {
    style: styleFeature,
    onEachFeature: (feature, layer) => {
      layer.on({
        mouseover: () => layer.setStyle({ weight: 2.8, fillOpacity: 0.24 }),
        mouseout: () => state.submarketLayer.resetStyle(layer),
        click: (e) => { if (state.newDealsAddMode) { if (e && e.originalEvent) L.DomEvent.stop(e.originalEvent); handleNewDealMapClick(e.latlng || layer.getCenter?.() || null); return; } if (marketSnapshotModeActive()) { if (e && e.originalEvent) L.DomEvent.stop(e.originalEvent); handleMarketSnapshotPoint(e.latlng || layer.getCenter?.() || null); return; } selectFeature(feature, layer, false); },
        dblclick: (e) => { if (state.newDealsAddMode) { if (e && e.originalEvent) L.DomEvent.stop(e.originalEvent); return; } if (marketSnapshotModeActive()) { if (e && e.originalEvent) L.DomEvent.stop(e.originalEvent); return; } selectFeature(feature, layer, true); }
      });
      const p = feature.properties;
      layer.bindTooltip(`${p.DisplayName}`, { sticky: true, className: 'submarket-label' });

      const submarketNumber = submarketNumberForFeature(feature);
      if (submarketNumber !== null && submarketNumber !== undefined) {
        const anchor = submarketNumberAnchorForFeature(feature, layer);
        if (!anchor) return;
        submarketNumberMarkers.push(L.marker(anchor, {
          interactive: false,
          keyboard: false,
          zIndexOffset: 900,
          icon: L.divIcon({
            className: 'submarket-number-icon',
            html: `<div class="submarket-number-label">${submarketNumber}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }));
      }
    }
  }).addTo(state.map);
  state.submarketNumberLayer = L.layerGroup(submarketNumberMarkers);
  if (state.mapTheme === 'hub') state.submarketNumberLayer.addTo(state.map);

  state.map.fitBounds(state.submarketLayer.getBounds(), { padding: [24, 24] });
  state.legend.addTo(state.map);
  state.newDeals = readLocalNewDeals();
  rebuildNewDealsLayer();
  await initializeFirebaseNewDeals();
  state.map.on('click', e => {
    clearNewDealPlaceResultMarker();
    if (state.newDealsAddMode) { handleNewDealMapClick(e.latlng); return; }
    if (marketSnapshotModeActive() && state.marketSnapshot.radiusMiles) handleMarketSnapshotPoint(e.latlng);
    if (marketQuickviewModeActive() && state.marketQuickview.radiusMiles) handleMarketQuickviewPoint(e.latlng);
  });
}

function renderRelease(meta) {
  document.getElementById('releasePanel').innerHTML = `
    Version: <b>${meta.version}</b><br>
    Submarkets loaded: <b>${meta.uniqueSubmarketsLoaded}</b><br>
    Health score: <b>${meta.healthScore}/100</b><br>
    Schools: <b>${state.schoolsLoaded ? state.schools.length + ' loaded' : 'Layer ready'}</b><br>
    Demographics: <b>${state.demographicsLoaded ? 'ACS 2020-2024 loaded' : 'Pending'}</b><br>
    Quickview: <b>${state.marketQuickview?.loaded ? 'Block demographics loaded' : 'Pending'}</b><br>
    Healthcare: <b>${healthcareDatasetBuilt() ? state.healthcare.length + ' loaded' : 'Builder ready'}</b><br>
    Lifestyle: <b>${state.lifestyleLoaded ? state.lifestyle.length + ' loaded' : 'Layer ready'}</b><br>
    Updated: <b>${meta.releaseDate}</b>
  `;
  document.getElementById('statusText').textContent = `${meta.uniqueSubmarketsLoaded} submarkets • School, demographics, healthcare, builder, retail, lifestyle, and quickview framework ready`;
}

function renderHubList(meta) {
  const box = document.getElementById('hubList');
  if (!box) return;
  const hubCounts = hubOrder.map(hub => ({
    name: hub,
    color: hubBaseColors[hub],
    count: state.features.filter(f => f.properties.Hub === hub).length
  }));
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
    if (!state.schoolsLoaded) return `<div class="school-count-card"><b>Schools</b><br>School data is loading in the background. Map pins remain off until the Schools layer is turned on.</div>`;
    return `<div class="school-count-card"><b>Public Schools</b><br>${counts.total} total • ${counts.Elementary} elem • ${counts.Middle} middle • ${counts.High} high</div>`;
  }
  const usedList = scoreSummary.rows && scoreSummary.rows.length ? `
    <details class="school-used"${detailOpenAttr('Schools used in calculation')}>
      <summary>Schools used in calculation</summary>
      ${scoreSummary.rows.slice().sort((a,b)=>a.SchoolName.localeCompare(b.SchoolName)).map(r => `<div class="school-used-row"><span>${r.SchoolName}</span><b>${r.Rating}/10</b></div>`).join('')}
    </details>` : `
    <div class="school-used-note">No rated schools are physically located inside this boundary. Unrated schools are ignored.</div>`;
  return `<div class="school-score-card">
    <div class="score-head"><b>School Rating</b><span class="score-grade grade-${gradeForScore(scoreSummary.overall)}">${gradeForScore(scoreSummary.overall)}</span></div>
    <div class="overall-score"><span>${fmtScore(scoreSummary.overall)}</span><small>/10 Overall • ${scoreSummary.count} rated schools</small></div>
    <div class="score-breakdown">
      <div><span>Elementary</span><b>${fmtScore(scoreSummary.elementary)}</b><small>${scoreSummary.elementaryCount}</small></div>
      <div><span>Middle</span><b>${fmtScore(scoreSummary.middle)}</b><small>${scoreSummary.middleCount}</small></div>
      <div><span>High</span><b>${fmtScore(scoreSummary.high)}</b><small>${scoreSummary.highCount}</small></div>
    </div>
    ${usedList}
  </div>`;
}

function renderHubSummary(hub) {
  const items = state.features.filter(f => f.properties.Hub === hub);
  const acres = items.reduce((sum, f) => sum + Number(f.properties.Acres || 0), 0);
  const sqmi = items.reduce((sum, f) => sum + Number(f.properties.AreaSqMi || 0), 0);
  const counts = schoolCountsFor(items);
  const scoreSummary = scoreSummaryForFeatures(items);
  const retail = retailSummaryForFeatures(items);
  const healthcare = healthcareSummaryForFeatures(items);
  const demo = aggregateDemographics(items);
  document.getElementById('selectedPanel').classList.remove('empty');
  document.getElementById('selectedPanel').innerHTML = `
    <h3 class="selected-title">${hub}</h3>
    <p class="selected-meta">${items.length} submarkets</p>
    <div class="metric-grid">
      <div class="metric"><div class="label">Area</div><div class="value">${fmt(Math.round(sqmi), ' sq mi')}</div></div>
      <div class="metric"><div class="label">Acres</div><div class="value">${fmt(Math.round(acres))}</div></div>
      <div class="metric"><div class="label">School Rating</div><div class="value">${fmtScore(scoreSummary.overall)}</div></div>
      <div class="metric"><div class="label">Median Income</div><div class="value">${fmtMoney(demo?.current?.median_household_income)}</div></div>
    </div>
    ${renderDemographicsCard(demo)}
    ${renderSchoolCountCard(counts, scoreSummary)}
    ${renderHealthcareCard(healthcare)}
    ${renderRetailCard(retail)}
    ${renderLifestyleCard(lifestyleSummaryForFeatures(items))}
    ${renderBuilderCard(builderSummaryForFeatures(items))}
    <div class="focus-list">
      ${items.map(f => `<div class="focus-row"><span>${f.properties.DisplayName}</span><b>${f.properties.SubmarketID}</b></div>`).join('')}
    </div>
  `;
  updateBuilderFilterPanel();
}

function renderHomeSummary() {
  const total = state.features.length;
  const counts = schoolCountsFor(state.features);
  const scoreSummary = scoreSummaryForFeatures(state.features);
  const retail = retailSummaryForFeatures(state.features);
  const healthcare = healthcareSummaryForFeatures(state.features);
  const builder = builderSummaryForFeatures(state.features);
  const demo = aggregateDemographics(state.features);
  document.getElementById('selectedPanel').classList.remove('empty');
  document.getElementById('selectedPanel').innerHTML = `
    <h3 class="selected-title">Gulf Coast Snapshot</h3>
    <p class="selected-meta">Market intelligence foundation</p>
    <div class="metric-grid">
      <div class="metric"><div class="label">Submarkets</div><div class="value">${total}</div></div>
      <div class="metric"><div class="label">Hubs</div><div class="value">${hubOrder.filter(h => h !== 'Growth Markets').length}</div></div>
      <div class="metric"><div class="label">School Rating</div><div class="value">${fmtScore(scoreSummary.overall)}</div></div>
      <div class="metric"><div class="label">Population</div><div class="value">${fmt(demo?.current?.population)}</div></div>
    </div>
    ${renderDemographicsCard(demo)}
    ${renderSchoolCountCard(counts, scoreSummary)}
    ${renderHealthcareCard(healthcare)}
    ${renderRetailCard(retail)}
    ${renderLifestyleCard(lifestyleSummaryForFeatures(state.features))}
    ${renderBuilderCard(builder)}
    <div class="focus-list">
      <div class="focus-row"><span>Boundaries</span><b>Verified</b></div>
      <div class="focus-row"><span>Hub color model</span><b>Active</b></div>
      <div class="focus-row"><span>School layer</span><b>${state.schoolsLoaded ? 'Loaded' : 'Ready'}</b></div>
      <div class="focus-row"><span>Lifestyle & Amenities</span><b>${state.lifestyleLoaded ? 'Loaded' : 'Ready'}</b></div>
    </div>
  `;
  updateBuilderFilterPanel();
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
  const healthcare = state.healthcare.map(facility => {
    const p = facility.properties || {};
    return {
      type: 'Healthcare',
      icon: (p.FacilityType || '').includes('Hospital') ? 'H' : ((p.FacilityType || '').includes('Urgent') ? 'U' : 'C'),
      id: p.HealthcareID,
      title: p.Name || 'Healthcare Facility',
      subtitle: `${p.FacilityType || 'Healthcare'} • ${p.SubmarketName || ''}`,
      keywords: `${p.Name || ''} ${p.FacilityType || ''} ${p.Address || ''} ${p.City || ''} ${p.SubmarketName || ''}`.toLowerCase(),
      facility
    };
  });

  const builders = state.builders.map(builder => {
    const p = builder.properties || {};
    return {
      type: 'Builder',
      icon: p.ProductStyle === 'Townhomes' ? 'TH' : 'BD',
      id: p.BuilderSubdivisionID,
      title: p.Subdivision || 'Builder Community',
      subtitle: `${p.Builder || 'Builder'} • ${p.SubmarketName || ''}`,
      keywords: `${p.Subdivision || ''} ${p.Builder || ''} ${p.City || ''} ${p.County || ''} ${p.Status || ''} ${p.ProductStyle || ''} ${p.SubmarketName || ''}`.toLowerCase(),
      builder
    };
  });
  const pois = state.pois.map(poi => {
    const p = poi.properties;
    return {
      type: 'POI',
      icon: p.Category === 'Restaurant' ? 'D' : p.Category === 'Grocery' ? 'G' : 'R',
      id: p.OSMID,
      title: p.Name,
      subtitle: `${p.Category} • ${p.SubmarketName || ''}`,
      keywords: `${p.Name} ${p.Brand} ${p.Category} ${p.Subcategory} ${p.City} ${p.SubmarketName}`.toLowerCase(),
      poi
    };
  });
  const lifestyle = state.lifestyle.map(item => {
    const p = item.properties || {};
    return {
      type: 'Lifestyle',
      icon: p.LifestyleCategory === 'Golf' ? 'G' : p.LifestyleCategory === 'Tennis' ? 'T' : p.LifestyleCategory === 'Pickleball' ? 'P' : p.LifestyleCategory === 'Fitness' ? 'F' : p.LifestyleCategory === 'Center' ? 'C' : 'O',
      id: p.OSMID,
      title: p.Name || lifestyleCategoryLabel(p.LifestyleCategory),
      subtitle: `${lifestyleCategoryLabel(p.LifestyleCategory)} • ${p.SubmarketName || ''}`,
      keywords: `${p.Name || ''} ${p.Brand || ''} ${p.LifestyleCategory || ''} ${p.Subcategory || ''} ${p.City || ''} ${p.SubmarketName || ''}`.toLowerCase(),
      lifestyle: item
    };
  });
  state.searchIndex = submarkets.concat(schools).concat(healthcare).concat(builders).concat(pois).concat(lifestyle);
}

function selectFeature(feature, layer, shouldZoom = false) {
  state.selected = feature;
  state.submarketLayer.setStyle(styleFeature);
  const targetLayer = layer || findLayerForFeature(feature);
  if (targetLayer) {
    targetLayer.setStyle(styleFeature(feature));
    if (shouldZoom) state.map.fitBounds(targetLayer.getBounds(), { padding: [50, 50], maxZoom: 10 });
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
  const retail = retailSummaryForSubmarket(p.SubmarketID, p.AreaSqMi);
  const healthcare = healthcareSummaryForSubmarket(p.SubmarketID, p.AreaSqMi);
  const builder = builderSummaryForSubmarket(p.SubmarketID, p.AreaSqMi);
  const demo = demoForSubmarket(p.DisplayName);
  document.getElementById('selectedPanel').classList.remove('empty');
  document.getElementById('selectedPanel').innerHTML = `
    <h3 class="selected-title">${p.DisplayName}</h3>
    <p class="selected-meta">${p.Hub}<span class="sep">•</span>${p.SubmarketID}</p>
    <div class="metric-grid">
      <div class="metric"><div class="label">Area</div><div class="value">${fmt(p.AreaSqMi, ' sq mi')}</div></div>
      <div class="metric"><div class="label">Acres</div><div class="value">${fmt(Math.round(Number(p.Acres || 0)))}</div></div>
      <div class="metric"><div class="label">School Rating</div><div class="value">${fmtScore(scoreSummary.overall)}</div></div>
      <div class="metric"><div class="label">Median Income</div><div class="value">${fmtMoney(demo?.current?.median_household_income)}</div></div>
    </div>
    ${renderDemographicsCard(demo)}
    ${renderSchoolCountCard(counts, scoreSummary)}
    ${renderHealthcareCard(healthcare)}
    ${renderRetailCard(retail)}
    ${renderLifestyleCard(lifestyleSummaryForFeatures(state.features))}
    ${renderBuilderCard(builder)}
    <div class="focus-list">
      <div class="focus-row"><span>Boundaries</span><b>Verified</b></div>
      <div class="focus-row"><span>School Rating</span><b>${state.schoolsLoaded ? 'Loaded' : 'Ready'}</b></div>
      <div class="focus-row"><span>Healthcare</span><b>${healthcareDatasetBuilt() ? 'Loaded' : 'Layer Ready'}</b></div>
      <div class="focus-row"><span>Retail & Dining</span><b>${state.poisLoaded ? 'Loaded' : 'Ready'}</b></div>
      <div class="focus-row"><span>Lifestyle & Amenities</span><b>${state.lifestyleLoaded ? 'Loaded' : 'Ready'}</b></div>
      <div class="focus-row"><span>Demographics</span><b>${demo ? 'Loaded' : 'No Data'}</b></div>
      <div class="focus-row"><span>Builder Subdivisions</span><b>${state.buildersLoaded ? 'Loaded' : 'Ready'}</b></div>
    </div>
    <button class="profile-btn" type="button">View Market Profile <span>›</span></button>
  `;
  updateBuilderFilterPanel();
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
  if (!box) return;
  const q = (query || '').trim().toLowerCase();
  const results = getSearchResults(q);
  const title = q ? 'Results' : 'Quick search';
  box.innerHTML = `<div class="results-title">${title}</div>` + results.map(item => `
    <button class="result-item" data-type="${item.type}" data-id="${item.id}">
      <span class="result-icon">${item.icon}</span>
      <span><b>${item.title}</b><small>${item.subtitle}</small></span>
    </button>
  `).join('') + `
    <div class="future-search-note">Search now includes submarkets${state.schoolsLoaded ? ' and schools' : ''}. Additional city, builder, retail, and lifestyle search will be added as those layers are loaded.</div>
  `;

  box.querySelectorAll('.result-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = state.searchIndex.find(x => x.type === btn.dataset.type && String(x.id) === btn.dataset.id);
      if (!item) return;
      if (item.type === 'School') selectSchool(item.school);
      else if (item.type === 'POI') selectPOI(item.poi);
      else if (item.type === 'Healthcare') selectHealthcare(item.facility);
      else if (item.type === 'Lifestyle') selectLifestyleAmenity(item.lifestyle);
      else if (item.type === 'Builder') selectBuilderSubdivision(item.builder);
      else selectFeature(item.feature, findLayerForFeature(item.feature), true);
    });
  });
}

function performSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  const q = input.value.trim().toLowerCase();
  if (!q) return;
  const results = getSearchResults(q);
  if (!results.length) return alert('No matching result found.');
  const first = results[0];
  if (first.type === 'School') selectSchool(first.school);
  else if (first.type === 'POI') selectPOI(first.poi);
  else if (first.type === 'Healthcare') selectHealthcare(first.facility);
  else if (first.type === 'Lifestyle') selectLifestyleAmenity(first.lifestyle);
  else if (first.type === 'Builder') selectBuilderSubdivision(first.builder);
  else selectFeature(first.feature, findLayerForFeature(first.feature), true);
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

function schoolTypeLabel(type) {
  return type === 'Other' ? 'Others/Unknown' : type;
}

function schoolRatingBucket(feature) {
  const p = feature?.properties || {};
  const rating = normalizeGreatSchoolsRating(p.GreatSchoolsRating);
  if (rating !== null) return String(rating);
  return 'Not Rated';
}

function schoolPopupHtml(p) {
  const rating = normalizeGreatSchoolsRating(p.GreatSchoolsRating);
  const ratingText = rating !== null ? `${rating}/10` : ((p.SchoolType === 'Other' || p.RatingExcluded) ? 'Not Rated (Excluded)' : 'Not Rated');
  return `<div class="school-popup"><h3>${p.NAME}</h3><p><b>Type:</b> ${schoolTypeLabel(p.SchoolType || 'Other')}</p><p><b>GreatSchools:</b> ${ratingText}</p><p><b>Location:</b> ${p.CITY}, ${p.STATE}</p><p><b>County:</b> ${p.NMCNTY || ''}</p><p><b>Submarket:</b> ${p.SubmarketName || 'Outside submarket boundary'}</p><p><b>NCES ID:</b> ${p.NCESSCH || ''}</p></div>`;
}

function passesSchoolFilters(feature) {
  const p = feature?.properties || {};
  const type = p.SchoolType || 'Other';
  const typeKey = ['Elementary', 'Middle', 'High'].includes(type) ? type : 'Other';
  if (!state.schoolFilters.types[typeKey]) return false;
  const bucket = schoolRatingBucket(feature);
  return !!state.schoolFilters.ratings[bucket];
}

function schoolFilterCounts() {
  const total = state.schools.length;
  const visible = state.schools.filter(passesSchoolFilters).length;
  return { total, visible };
}

function refreshSchoolFilterSummary() {
  const panel = document.getElementById('schoolFilterPanel');
  const countEl = document.getElementById('schoolFilterCount');
  if (panel) panel.classList.toggle('active', !!document.getElementById('toggleSchools')?.checked);
  if (countEl) {
    const { total, visible } = schoolFilterCounts();
    if (!state.schoolsLoaded) countEl.textContent = 'Load Schools';
    else countEl.textContent = `${visible} visible • ${total} loaded`;
  }
  document.querySelectorAll('.school-rating-btn').forEach(btn => {
    const key = btn.dataset.ratingKey;
    btn.classList.toggle('active', !!state.schoolFilters.ratings[key]);
  });
  document.querySelectorAll('.school-type-filter').forEach(input => {
    const key = input.dataset.schoolType;
    if (key) input.checked = !!state.schoolFilters.types[key];
  });
}

function setAllSchoolRatings(value) {
  Object.keys(state.schoolFilters.ratings).forEach(key => {
    state.schoolFilters.ratings[key] = !!value;
  });
  refreshSchoolLayer();
  refreshSchoolFilterSummary();
}

function renderSchoolRatingButtons() {
  const container = document.getElementById('schoolRatingFilterList');
  if (!container) return;
  const keys = ['0','1','2','3','4','5','6','7','8','9','10','Not Rated'];
  container.innerHTML = keys.map(key => `<button type="button" class="school-rating-btn ${state.schoolFilters.ratings[key] ? 'active' : ''}" data-rating-key="${key}">${key}</button>`).join('');
  container.querySelectorAll('.school-rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.ratingKey;
      state.schoolFilters.ratings[key] = !state.schoolFilters.ratings[key];
      refreshSchoolLayer();
      refreshSchoolFilterSummary();
    });
  });
}

function refreshSchoolLayer() {
  if (!state.schoolsLoaded) return;
  const wasVisible = !!(state.schoolLayer && state.map && state.map.hasLayer(state.schoolLayer));
  if (state.schoolLayer && state.map && state.map.hasLayer(state.schoolLayer)) state.map.removeLayer(state.schoolLayer);
  const visibleSchools = state.schools.filter(passesSchoolFilters);
  state.schoolLayer = L.geoJSON({ type: 'FeatureCollection', features: visibleSchools }, {
    pointToLayer: (feature, latlng) => L.marker(latlng, { icon: schoolIcon(feature.properties.SchoolType) }),
    onEachFeature: (feature, layer) => {
      const p = feature.properties;
      layer.bindPopup(schoolPopupHtml(p));
      enableMarkerHoverPopup(layer);
      layer.on('click', () => selectSchool(feature, false));
      layer.on('dblclick', () => selectSchool(feature, true));
    }
  });
  if (wasVisible || document.getElementById('toggleSchools')?.checked) state.schoolLayer.addTo(state.map);
  refreshSchoolFilterSummary();
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

async function loadSchools(showLayer = false) {
  if (state.schoolsLoaded) {
    if (showLayer && state.schoolLayer && !state.map.hasLayer(state.schoolLayer)) state.schoolLayer.addTo(state.map);
    return;
  }
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
    const inferredType = schoolType(f.properties);
    const ratingRec = ratingForSchoolName(f.properties);
    f.properties.SchoolType = (ratingRec && ratingRec.SchoolType) ? ratingRec.SchoolType : inferredType;
    if (ratingRec) {
      f.properties.GreatSchoolsRating = ratingRec.Rating;
      f.properties.RatingSubmarket = ratingRec.Submarket;
      f.properties.RatingSchoolType = ratingRec.SchoolType;
      f.properties.RatingExcluded = !!ratingRec.Excluded;
      f.properties.RatingExcludedReason = ratingRec.ExcludedReason || '';
    }
    assignSchoolToSubmarket(f);
    return f;
  });

  refreshSchoolLayer();
  if (showLayer && state.schoolLayer && !state.map.hasLayer(state.schoolLayer)) state.schoolLayer.addTo(state.map);
  state.schoolsLoaded = true;
  buildSearchIndex();
  { const input = document.getElementById('searchInput'); if (input) renderSearchResults(input.value || ''); }
  document.getElementById('schoolCountBadge').textContent = `${state.schools.length} loaded`;
  refreshSchoolFilterSummary();
  renderRelease(state.metadata);
  if (state.mapTheme === 'schools' && state.submarketLayer) state.submarketLayer.setStyle(styleFeature);
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
  if (target) {
    target.openPopup();
    return;
  }
  const p = school.properties || {};
  L.popup({ closeButton: true, autoPan: true })
    .setLatLng([coords[1], coords[0]])
    .setContent(schoolPopupHtml(p))
    .openOn(state.map);
}

function bindUI() {
  bindPersistentDetails();
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('appShell').classList.toggle('collapsed');
    setTimeout(() => state.map && state.map.invalidateSize(), 260);
  });
  const topSearchBtn = document.getElementById('topSearchBtn');
  if (topSearchBtn) {
    topSearchBtn.addEventListener('click', () => {
      document.getElementById('appShell').classList.remove('collapsed');
      setTimeout(() => {
        state.map && state.map.invalidateSize();
        const input = document.getElementById('searchInput');
        if (input) input.focus();
      }, 250);
    });
  }
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) searchBtn.addEventListener('click', performSearch);
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performSearch(); });
    searchInput.addEventListener('input', e => renderSearchResults(e.target.value));
  }
  document.getElementById('resetBtn').addEventListener('click', resetView);
  document.getElementById('toggleSubmarkets').addEventListener('change', e => {
    if (e.target.checked) state.submarketLayer.addTo(state.map);
    else state.map.removeLayer(state.submarketLayer);
  });
  document.getElementById('toggleSchools').addEventListener('change', async e => {
    try {
      if (e.target.checked) {
        // When the school layer is turned on, start with all school ratings visible.
        setAllSchoolRatings(true);
        await loadSchools(true);
        if (state.schoolLayer && !state.map.hasLayer(state.schoolLayer)) state.schoolLayer.addTo(state.map);
        document.getElementById('mapThemeSelect').value = 'schools';
        setMapTheme('schools');
      } else if (state.schoolLayer) {
        state.map.removeLayer(state.schoolLayer);
        // When the school layer is turned off, return the map to the standard Hub View.
        document.getElementById('mapThemeSelect').value = state.returnTheme || 'hub';
        setMapTheme(state.returnTheme || 'hub');
      }
      refreshSchoolFilterSummary();
    } catch (err) {
      console.error(err);
      e.target.checked = false;
      document.getElementById('schoolCountBadge').textContent = 'Error';
      alert('The school layer could not be loaded from NCES. Try again later.');
    }
  });
  document.querySelectorAll('.school-type-filter').forEach(input => {
    input.addEventListener('change', e => {
      const key = e.target.dataset.schoolType;
      if (!key) return;
      state.schoolFilters.types[key] = e.target.checked;
      refreshSchoolLayer();
      refreshSchoolFilterSummary();
    });
  });
  renderSchoolRatingButtons();
  refreshSchoolFilterSummary();
  document.getElementById('schoolRatingsSelectAll')?.addEventListener('click', () => setAllSchoolRatings(true));
  document.getElementById('schoolRatingsClearAll')?.addEventListener('click', () => setAllSchoolRatings(false));
  document.getElementById('toggleRetail').addEventListener('change', async e => {
    try {
      if (e.target.checked) {
        await loadPOIs(true);
        if (state.poiLayer && !state.map.hasLayer(state.poiLayer)) state.poiLayer.addTo(state.map);
        document.getElementById('mapThemeSelect').value = 'retail';
        setMapTheme('retail');
      } else if (state.poiLayer) {
        state.map.removeLayer(state.poiLayer);
        if (document.getElementById('mapThemeSelect').value === 'retail') {
          document.getElementById('mapThemeSelect').value = state.returnTheme || 'hub';
          setMapTheme(state.returnTheme || 'hub');
        }
      }
      updateRetailFilterPanel();
    } catch (err) {
      console.error(err);
      e.target.checked = false;
      document.getElementById('retailCountBadge').textContent = 'Error';
      alert('Retail & Dining could not be loaded from OpenStreetMap right now. Try again later.');
    }
  });
  document.querySelectorAll('.retail-filter').forEach(input => {
    input.addEventListener('change', e => {
      const key = e.target.dataset.retailFilter;
      if (!key) return;
      state.retailFilters[key] = e.target.checked;
      applyRetailFilters();
    });
  });
  const retailSearchInput = document.getElementById('retailSearchInput');
  retailSearchInput?.addEventListener('input', e => {
    renderRetailSearchSuggestions(e.currentTarget.value);
  });
  retailSearchInput?.addEventListener('focus', e => {
    renderRetailSearchSuggestions(e.currentTarget.value);
  });
  retailSearchInput?.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const box = document.getElementById('retailSearchSuggestions');
      if (box) box.classList.remove('active');
      return;
    }
    if (e.key !== 'Enter') return;
    e.preventDefault();
    applyRetailSearch(e.currentTarget.value, true);
  });
  retailSearchInput?.addEventListener('search', e => {
    if (!e.currentTarget.value) clearRetailSearch();
  });
  document.getElementById('retailSearchBtn')?.addEventListener('click', () => {
    const value = document.getElementById('retailSearchInput')?.value || '';
    applyRetailSearch(value, true);
  });
  document.getElementById('retailSearchClear')?.addEventListener('click', clearRetailSearch);
  document.addEventListener('click', e => {
    const box = document.getElementById('retailSearchSuggestions');
    const input = document.getElementById('retailSearchInput');
    if (!box || !box.classList.contains('active')) return;
    if (box.contains(e.target) || input?.contains(e.target)) return;
    box.classList.remove('active');
  });
  document.getElementById('toggleLifestyle').addEventListener('change', async e => {
    try {
      if (e.target.checked) {
        await loadLifestyle(true);
        if (state.lifestyleLayer && !state.map.hasLayer(state.lifestyleLayer)) state.lifestyleLayer.addTo(state.map);
        document.getElementById('mapThemeSelect').value = 'lifestyle';
        setMapTheme('lifestyle');
      } else if (state.lifestyleLayer) {
        state.map.removeLayer(state.lifestyleLayer);
        if (document.getElementById('mapThemeSelect').value === 'lifestyle') {
          document.getElementById('mapThemeSelect').value = state.returnTheme || 'hub';
          setMapTheme(state.returnTheme || 'hub');
        }
      }
      updateLifestyleFilterPanel();
    } catch (err) {
      console.error(err);
      e.target.checked = false;
      document.getElementById('lifestyleCountBadge').textContent = 'Error';
      alert('Lifestyle & Amenities could not be loaded from OpenStreetMap right now. Try again later.');
    }
  });
  document.querySelectorAll('.lifestyle-filter').forEach(input => {
    input.addEventListener('change', e => {
      const key = e.target.dataset.lifestyleFilter;
      if (!key) return;
      state.lifestyleFilters[key] = e.target.checked;
      applyLifestyleFilters();
    });
  });


  document.getElementById('toggleBuilders').addEventListener('change', async e => {
    try {
      if (e.target.checked) {
        state.builderFilters.SingleFamily = true;
        state.builderFilters.Townhomes = false;
        state.builderFilters.Active = true;
        state.builderFilters.Future = true;
        state.builderFilters.BuiltOut = false;
        state.builderFilters.BuilderNames = {};
        document.querySelectorAll('.builder-filter').forEach(input => {
          const key = input.dataset.builderFilter;
          if (key && Object.prototype.hasOwnProperty.call(state.builderFilters, key)) input.checked = !!state.builderFilters[key];
        });
        await loadBuilders(true);
        if (state.builderLayer && !state.map.hasLayer(state.builderLayer)) state.builderLayer.addTo(state.map);
        document.getElementById('mapThemeSelect').value = 'builders';
        setMapTheme('builders');
      } else if (state.builderLayer) {
        state.map.removeLayer(state.builderLayer);
        document.getElementById('mapThemeSelect').value = state.returnTheme || 'hub';
        setMapTheme(state.returnTheme || 'hub');
      }
    } catch (err) {
      console.error(err);
      e.target.checked = false;
      document.getElementById('builderCountBadge').textContent = 'Error';
      alert('Builder subdivisions could not be loaded.');
    }
  });
  document.querySelectorAll('.builder-filter').forEach(input => {
    input.addEventListener('change', e => {
      const key = e.target.dataset.builderFilter;
      if (!key) return;
      state.builderFilters[key] = e.target.checked;
      applyBuilderFilters();
    });
  });

  document.getElementById('toggleNewDeals')?.addEventListener('change', async e => {
    if (e.target.checked) {
      const ok = await authorizeNewDealEditing();
      if (!ok) {
        e.target.checked = false;
        ensureNewDealsLayerVisible(false);
        updateNewDealsUI();
        return;
      }
      subscribeToPrivateNewDeals();
      ensureNewDealsLayerVisible(true);
      renderNewDealsSidebarList();
    } else {
      ensureNewDealsLayerVisible(false);
      if (state.newDealsAddMode) setNewDealAddMode(false);
      state.newDealsListExpanded = false;
      renderNewDealsSidebarList();
    }
    updateNewDealsUI();
  });
  document.getElementById('toggleNewDealsList')?.addEventListener('click', async () => {
    if (!newDealAuthorizedUser(state.newDealsUser)) {
      if (!(await authorizeNewDealEditing())) return;
      subscribeToPrivateNewDeals();
      const toggle = document.getElementById('toggleNewDeals');
      if (toggle) toggle.checked = true;
      ensureNewDealsLayerVisible(true);
    }
    state.newDealsListExpanded = !state.newDealsListExpanded;
    renderNewDealsSidebarList();
    updateNewDealsUI();
  });
  document.getElementById('addNewDealPin')?.addEventListener('click', () => {
    setNewDealAddMode(!state.newDealsAddMode);
  });
  const newDealPlaceInput = document.getElementById('newDealPlaceSearch');
  newDealPlaceInput?.addEventListener('input', scheduleNewDealPlaceSuggestions);
  newDealPlaceInput?.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' && newDealPlaceSuggestions.length) { e.preventDefault(); setNewDealPlaceActiveIndex(newDealPlaceActiveIndex < 0 ? 0 : newDealPlaceActiveIndex + 1); }
    else if (e.key === 'ArrowUp' && newDealPlaceSuggestions.length) { e.preventDefault(); setNewDealPlaceActiveIndex(newDealPlaceActiveIndex <= 0 ? newDealPlaceSuggestions.length - 1 : newDealPlaceActiveIndex - 1); }
    else if (e.key === 'Enter' && newDealPlaceSuggestions.length) { e.preventDefault(); selectNewDealPlaceSuggestion(newDealPlaceActiveIndex >= 0 ? newDealPlaceActiveIndex : 0); }
    else if (e.key === 'Escape') { clearNewDealPlaceSuggestions(); }
  });
  newDealPlaceInput?.addEventListener('blur', () => setTimeout(clearNewDealPlaceSuggestions, 120));
  document.addEventListener('click', e => { if (!e.target?.closest?.('.new-deal-place-search')) { clearNewDealPlaceSuggestions(); } });

  document.getElementById('newDealCoordinateSearchBtn')?.addEventListener('click', navigateToNewDealCoordinates);
  document.getElementById('newDealCoordinateSearch')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      navigateToNewDealCoordinates();
    }
  });

  document.getElementById('toggleHealthcare').addEventListener('change', async e => {
    try {
      if (e.target.checked) {
        await loadHealthcare(true);
        if (state.healthcareLayer && !state.map.hasLayer(state.healthcareLayer)) state.healthcareLayer.addTo(state.map);
        document.getElementById('mapThemeSelect').value = 'healthcare';
        setMapTheme('healthcare');
      } else if (state.healthcareLayer) {
        state.map.removeLayer(state.healthcareLayer);
        document.getElementById('mapThemeSelect').value = state.returnTheme || 'hub';
        setMapTheme(state.returnTheme || 'hub');
      }
    } catch (err) {
      console.error(err);
      e.target.checked = false;
      document.getElementById('healthcareCountBadge').textContent = 'Error';
      alert('Healthcare facilities could not be loaded. Run the Healthcare builder or try again later.');
    }
  });
  const demoToggle = document.getElementById('toggleDemographics');
  if (demoToggle) {
    demoToggle.addEventListener('change', e => {
      // Demographics intentionally opens in Median Income, but turning the
      // layer back off should always restore the standard Hub View.
      const nextTheme = e.target.checked ? 'income' : 'hub';
      document.getElementById('mapThemeSelect').value = nextTheme;
      setMapTheme(nextTheme);
    });
  }

  const snapshotButton = document.getElementById('marketSnapshotToggle');
  const snapshotPanel = document.getElementById('marketSnapshotRadiusPanel');
  if (snapshotButton) {
    snapshotButton.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      if (marketSnapshotModeActive()) resetMarketSnapshotMode();
      else setMarketSnapshotMode(true, null);
    });
  }
  document.querySelectorAll('.market-snapshot-radius').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const radius = Number(e.currentTarget.dataset.radius);
      if (!Number.isFinite(radius)) return;
      setMarketSnapshotMode(true, radius);
      snapshotPanel?.querySelectorAll('.market-snapshot-radius').forEach(b => b.classList.toggle('active', Number(b.dataset.radius) === radius));
    });
  });
  document.getElementById('marketSnapshotClose')?.addEventListener('click', closeMarketSnapshotModal);
  document.getElementById('marketSnapshotModal')?.addEventListener('click', e => {
    if (e.target && e.target.id === 'marketSnapshotModal') closeMarketSnapshotModal();
  });

  document.getElementById('marketQuickviewToggle')?.addEventListener('click', toggleMarketQuickviewMode);
  document.querySelectorAll('.market-quickview-radius').forEach(btn => {
    btn.addEventListener('click', () => {
      const radius = Number(btn.dataset.radius);
      setMarketQuickviewMode(true, radius);
    });
  });
  document.getElementById('marketQuickviewClose')?.addEventListener('click', closeMarketQuickviewModal);
  document.getElementById('marketQuickviewModal')?.addEventListener('click', e => {
    if (e.target && e.target.id === 'marketQuickviewModal') closeMarketQuickviewModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      clearNewDealPlaceResultMarker();
      clearNewDealPlaceSuggestions();
      if (marketSnapshotModeActive()) resetMarketSnapshotMode();
      closeMarketSnapshotModal();
    }
  });
  updateMarketSnapshotUI();
  document.getElementById('downloadSubmarketsKml')?.addEventListener('click', exportSubmarketOutlinesKml);
  document.getElementById('downloadSubmarketNumbersKml')?.addEventListener('click', exportSubmarketNumbersKml);
  document.getElementById('downloadBuildersKml')?.addEventListener('click', async () => { await exportBuilderSubdivisionsKml(); });
  document.getElementById('downloadNewDealsKml')?.addEventListener('click', exportNewDealsKml);
  document.getElementById('mapThemeSelect').addEventListener('change', e => {
    if (document.getElementById('toggleDemographics')) document.getElementById('toggleDemographics').checked = ['income','population'].includes(e.target.value);
    state.returnTheme = e.target.value;
    setMapTheme(e.target.value);
  });
  document.getElementById('basemapSelect').addEventListener('change', e => {
    Object.values(state.basemaps).forEach(l => state.map.removeLayer(l));
    state.basemaps[e.target.value].addTo(state.map);
    state.basemaps[e.target.value].bringToBack();
  });
  document.getElementById('toggleFloodZones')?.addEventListener('change', e => {
    setReferenceOverlay('floodZones', e.target.checked);
  });
  document.getElementById('toggleContours')?.addEventListener('change', e => {
    setReferenceOverlay('contours', e.target.checked);
  });
}

initMap();
bindUI();
loadData()
  .then(() => {
    // Load school data in the background so sidebar ratings are available
    // without turning on the Schools map layer or School Rating map theme.
    loadSchools(false).catch(err => {
      console.error('Background school data load failed', err);
      document.getElementById('schoolCountBadge').textContent = 'Unavailable';
    });
    loadBuilders(false).catch(err => {
      console.error('Background builder data load failed', err);
      const badge = document.getElementById('builderCountBadge');
      if (badge) badge.textContent = 'Unavailable';
    });
    // Warm ACS aggregate household income in the background. The official B19025 table is
    // processed once for Alabama/Florida block groups, then cached locally for 30 days.
    setTimeout(() => {
      ensureAcsMeanIncomeLoaded().catch(err => console.warn('Background ACS Mean Income preload failed', err));
    }, 500);

    // Warm the two large OSM layers after the core Atlas is interactive. Processed features
    // are persisted for 30 days, so later visits normally avoid the Overpass round-trip entirely.
    setTimeout(() => {
      loadPOIs(false).catch(err => {
        console.warn('Background Retail & Dining preload failed', err);
        const badge = document.getElementById('retailCountBadge');
        if (badge) badge.textContent = 'Load Layer';
      });
      loadLifestyle(false).catch(err => {
        console.warn('Background Lifestyle & Amenities preload failed', err);
        const badge = document.getElementById('lifestyleCountBadge');
        if (badge) badge.textContent = 'Load Layer';
      });
    }, 1200);
  })
  .catch(err => {
    console.error(err);
    document.getElementById('statusText').textContent = 'Error loading atlas data: ' + (err && err.message ? err.message : err);
  });
