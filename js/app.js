const state = {
  map: null,
  submarketLayer: null,
  schoolLayer: null,
  poiLayer: null,
  poiMarkerIndex: new Map(),
  retailFilters: { Restaurant: true, Grocery: true, Retail: true, Convenience: true, NationalBrandsOnly: false },
  builderFilters: { SingleFamily: true, Townhomes: true, Active: true, Future: true, BuiltOut: false, BuilderNames: {} },
  builderLayer: null,
  builderMarkerIndex: new Map(),
  healthcareLayer: null,
  selected: null,
  features: [],
  schools: [],
  schoolsLoaded: false,
  pois: [],
  poisLoaded: false,
  healthcare: [],
  healthcareLoaded: false,
  healthcareSummary: null,
  builders: [],
  buildersLoaded: false,
  builderSummary: null,
  demographics: null,
  demographicsLoaded: false,
  basemaps: {},
  searchIndex: [],
  metadata: null,
  detailOpen: {}
};

const hubOrder = ['Alabama Hub', 'Pensacola Hub', 'Panama City Hub', 'Growth Markets'];
const hubBaseColors = {
  'Alabama Hub': '#F4A261',
  'Pensacola Hub': '#4EA3D8',
  'Panama City Hub': '#8CCB6E',
  'Growth Markets': '#A7A7A7'
};

const NCES_URL = 'https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_GEOCODE_PUBLICSCH_2425/MapServer/0/query';
const OVERPASS_URLS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const tierOneBrands = ['publix','walmart','walmart supercenter','aldi','costco',"sam's club",'sams club','bj wholesale','bjs wholesale',"bj\'s wholesale club",'target','winn-dixie','rouses','piggly wiggly','whole foods','the fresh market',"trader joe's",'chick-fil-a','starbucks','chipotle','panera','panera bread','texas roadhouse','cracker barrel','home depot','the home depot',"lowe's",'academy sports','academy sports + outdoors','bass pro shops',"kohl's",'tj maxx','marshalls','hobby lobby'];

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
    .filter(s => typeof s.properties.GreatSchoolsRating === 'number' && !Number.isNaN(s.properties.GreatSchoolsRating))
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
    .filter(s => typeof s.properties.GreatSchoolsRating === 'number' && !Number.isNaN(s.properties.GreatSchoolsRating))
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
  if (filters.NationalBrandsOnly) {
    const name = String(p.Name || '').trim().toLowerCase();
    if (!p.NationalBrand || name === 'unnamed') return false;
  }
  return true;
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


function activeBuilderSubdivisions() {
  return state.builders.filter(passesBuilderFilter);
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

function passesBuilderFilter(feature) {
  if (!builderProductStatusMatch(feature)) return false;
  const selectedBuilderKeys = Object.entries((state.builderFilters || {}).BuilderNames || {}).filter(([, checked]) => checked).map(([key]) => key);
  if (!selectedBuilderKeys.length) return true;
  const selected = new Set(selectedBuilderKeys);
  return builderNamesForFeature(feature).some(builder => selected.has(canonicalBuilderKey(builder)));
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
  const b = normalizeBuilderName(builder).toLowerCase();
  if (b.toLowerCase().startsWith('lennar')) return 'builder-lennar';
  if (/^d\.?\s*r\.?\s*horton/.test(b)) return 'builder-drhorton';
  if (/^adams/.test(b)) return 'builder-adams';
  if (/^dsld/.test(b)) return 'builder-dsld';
  if (/^holiday/.test(b)) return 'builder-holiday';
  if (/^meritage/.test(b)) return 'builder-meritage';
  if (/^maronda/.test(b)) return 'builder-maronda';
  if (/^century/.test(b)) return 'builder-century';
  if (/^valor/.test(b)) return 'builder-valor';
  return 'builder-other';
}

function builderIcon(builder, status) {
  const s = String(status || '').toLowerCase();
  const statusCls = s.includes('future') ? 'builder-future' : s.includes('built') ? 'builder-built' : 'builder-active';
  const colorCls = builderColorClass(builder);
  const label = builderDisplayLetter(builder);
  return L.divIcon({ className: '', html: `<div class="builder-marker ${statusCls} ${colorCls}">${label}</div>`, iconSize: [24,24], iconAnchor: [12,12], popupAnchor: [0,-12] });
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
    marker.bindPopup(`<div class="builder-popup"><h3>${p.Subdivision || 'Builder Community'}</h3><p><b>Builder:</b> ${displayBuilder || '—'}</p><p><b>Status:</b> ${p.Status || '—'}</p><p><b>Product:</b> ${p.ProductStyle || '—'}</p><p><b>Units Remaining:</b> ${fmt(p.UnitsRemaining)}</p><p><b>Annual Starts:</b> ${fmt(p.AnnualStarts)}</p><p><b>City:</b> ${p.City || ''}, ${p.State || ''}</p><p><b>Submarket:</b> ${p.SubmarketName || 'Outside submarket boundary'}</p><p><b>Source:</b> ${p.Source || 'Zonda export'}</p></div>`);
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
    if (!builderProductStatusMatch(feature)) return;
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

function updateBuilderFilterPanel() {
  const panel = document.getElementById('builderFilterPanel');
  if (!panel) return;
  const visibleCount = state.buildersLoaded ? activeBuilderSubdivisions().length : 0;
  panel.classList.toggle('active', !!state.buildersLoaded);
  renderBuilderNameFilterList();
  const selectedBuilderCount = Object.values((state.builderFilters.BuilderNames || {})).filter(Boolean).length;
  const count = document.getElementById('builderFilterCount');
  if (count) count.textContent = state.buildersLoaded ? `${visibleCount.toLocaleString()} of ${state.builders.length.toLocaleString()} visible${selectedBuilderCount ? ` • ${selectedBuilderCount} builder filter${selectedBuilderCount === 1 ? '' : 's'}` : ''}` : 'Load Builders';
}

function applyBuilderFilters() {
  if (!state.buildersLoaded) return;
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
    const badge = document.getElementById('builderCountBadge');
    if (badge) badge.textContent = 'Loading...';
    try {
      const [communities, summary] = await Promise.all([
        fetch('data/builder_subdivisions.geojson').then(r => r.json()),
        fetch('data/submarket_builder_summary.json').then(r => r.json())
      ]);
      state.builders = communities.features || [];
      state.builderSummary = summary;
    } catch (err) {
      console.warn('Builder subdivision data not available', err);
      state.builders = [];
      state.builderSummary = { metadata: { status: 'not_built' }, submarkets: {} };
    }
    buildBuilderLayer();
    state.buildersLoaded = true;
    if (badge) badge.textContent = state.builders.length ? `${state.builders.length.toLocaleString()} loaded` : 'No data';
    updateBuilderFilterPanel();
    buildSearchIndex();
    renderSearchResults(document.getElementById('searchInput').value || '');
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

async function loadPOIs() {
  if (state.poisLoaded) return;
  const badge = document.getElementById('retailCountBadge');
  badge.textContent = 'Loading...';
  const data = await fetchOverpass(overpassQuery());
  const seen = new Set();
  state.pois = (data.elements || []).map(overpassElementToFeature).filter(Boolean).filter(f => {
    if (seen.has(f.properties.OSMID)) return false;
    seen.add(f.properties.OSMID);
    assignPoiToSubmarket(f);
    return !!f.properties.SubmarketID;
  });
  buildPOILayer();
  state.poiLayer.addTo(state.map);
  state.poisLoaded = true;
  badge.textContent = `${state.pois.length.toLocaleString()} loaded`;
  updateRetailFilterPanel();
  buildSearchIndex();
  renderSearchResults(document.getElementById('searchInput').value || '');
  if (state.selected) renderSelected(state.selected.properties); else renderHomeSummary();
}

function buildPOILayer() {
  const wasVisible = state.poiLayer && state.map && state.map.hasLayer(state.poiLayer);
  if (state.poiLayer && state.map && state.map.hasLayer(state.poiLayer)) state.map.removeLayer(state.poiLayer);
  state.poiMarkerIndex = new Map();
  state.poiLayer = L.markerClusterGroup({
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
  panel.classList.toggle('active', !!state.poisLoaded);
  const count = document.getElementById('retailFilterCount');
  if (count) count.textContent = state.poisLoaded ? `${visibleCount.toLocaleString()} of ${state.pois.length.toLocaleString()} visible` : 'Load Retail & Dining';
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
    if (!state.healthcareSummary || !Array.isArray(state.healthcare)) {
      try {
        const [facilities, summary] = await Promise.all([
          fetch('data/healthcare_facilities.geojson').then(r => r.json()),
          fetch('data/submarket_healthcare_summary.json').then(r => r.json())
        ]);
        state.healthcare = facilities.features || [];
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
        layer.on('click', () => selectHealthcare(feature));
      }
    });
    state.healthcareLoaded = true;
    if (badge) badge.textContent = state.healthcare.length ? `${state.healthcare.length.toLocaleString()} loaded` : 'No data';
    buildSearchIndex();
    renderSearchResults(document.getElementById('searchInput').value || '');
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
  return {
    color: selected ? '#061827' : '#26384f',
    weight: selected ? 3.5 : 1.4,
    fillColor: state.mapTheme === 'schools' ? colorForSchoolScore(scoreSummaryForSubmarket(p.DisplayName).overall) : (state.mapTheme === 'retail' ? colorForRetailDensity(retailSummaryForSubmarket(p.SubmarketID, p.AreaSqMi).density) : (state.mapTheme === 'healthcare' ? colorForHealthcareDensity(healthcareSummaryForSubmarket(p.SubmarketID, p.AreaSqMi).density) : (state.mapTheme === 'builders' ? colorForBuilderDensity(builderSummaryForSubmarket(p.SubmarketID, p.AreaSqMi).density) : (state.mapTheme === 'income' ? colorForIncome((demoForSubmarket(p.DisplayName)?.current || {}).median_household_income) : (state.mapTheme === 'popgrowth' ? colorForPopGrowth((demoForSubmarket(p.DisplayName)?.current || {}).population_growth_prior_5yr_pct) : (state.mapTheme === 'population' ? colorForPopulation((demoForSubmarket(p.DisplayName)?.current || {}).population) : (p.HubColor || p.HubBaseColor || '#8ea0ad'))))))),
    fillOpacity: selected ? 0.72 : 0.48
  };
}


function legendHtml() {
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
  if (state.mapTheme === 'healthcare') {
    return `<b>Healthcare Access</b><div class="legend-subtitle">Facilities per sq mi</div>` + [
      ['#7f1d1d','Very High','1.2+'], ['#dc2626','High','0.6-1.19'], ['#f87171','Moderate','0.25-0.59'], ['#fecaca','Low','0.01-0.24'], ['#e5e7eb','None','0']
    ].map(r => `<div class="legend-row"><i class="legend-swatch" style="background:${r[0]}"></i><span>${r[1]}</span><small>${r[2]}</small></div>`).join('');
  }

  if (state.mapTheme === 'builders') {
    return `<b>Builder Activity</b><div class="legend-subtitle">Visible communities per sq mi</div>` + [
      ['#581c87','Very High','1.2+'], ['#7e22ce','High','0.6-1.19'], ['#a855f7','Moderate','0.25-0.59'], ['#e9d5ff','Low','0.01-0.24'], ['#e5e7eb','None','0']
    ].map(r => `<div class="legend-row"><i class="legend-swatch" style="background:${r[0]}"></i><span>${r[1]}</span><small>${r[2]}</small></div>`).join('');
  }
  if (state.mapTheme === 'income') {
    return `<b>Median Income</b><div class="legend-subtitle">ACS 2020-2024 Current Estimate</div>` + [
      ['#064e3b','$100k+','Very High'], ['#047857','$85k-$99k','High'], ['#10b981','$70k-$84k','Strong'], ['#a7f3d0','$55k-$69k','Moderate'], ['#d1fae5','<$55k','Lower'], ['#e5e7eb','N/A','No data']
    ].map(r => `<div class="legend-row"><i class="legend-swatch" style="background:${r[0]}"></i><span>${r[1]}</span><small>${r[2]}</small></div>`).join('');
  }
  if (state.mapTheme === 'popgrowth') {
    return `<b>Population Growth</b><div class="legend-subtitle">Prior 5-Year ACS trend</div>` + [
      ['#7c2d12','40%+','Very High'], ['#ea580c','20%-39%','High'], ['#fb923c','10%-19%','Growth'], ['#fed7aa','0%-9%','Stable'], ['#cbd5e1','Negative','Decline'], ['#e5e7eb','N/A','No data']
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
  const [geojson, meta, demographics, healthcareFacilities, healthcareSummary] = await Promise.all([
    fetch('data/submarkets.geojson').then(r => r.json()),
    fetch('data/metadata.json').then(r => r.json()),
    fetch('data/submarket_demographics_combined.json').then(r => r.json()),
    fetch('data/healthcare_facilities.geojson').then(r => r.json()).catch(() => ({ type: 'FeatureCollection', features: [] })),
    fetch('data/submarket_healthcare_summary.json').then(r => r.json()).catch(() => ({ metadata: { status: 'not_built' }, submarkets: {} }))
  ]);

  state.features = geojson.features;
  state.metadata = meta;
  state.demographics = demographics;
  state.demographicsLoaded = true;
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

  state.submarketLayer = L.geoJSON(geojson, {
    style: styleFeature,
    onEachFeature: (feature, layer) => {
      layer.on({
        mouseover: () => layer.setStyle({ weight: 2.8, fillOpacity: 0.64 }),
        mouseout: () => state.submarketLayer.resetStyle(layer),
        click: () => selectFeature(feature, layer, false),
        dblclick: () => selectFeature(feature, layer, true)
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
    Demographics: <b>${state.demographicsLoaded ? 'ACS 2020-2024 loaded' : 'Pending'}</b><br>
    Healthcare: <b>${healthcareDatasetBuilt() ? state.healthcare.length + ' loaded' : 'Builder ready'}</b><br>
    Updated: <b>${meta.releaseDate}</b>
  `;
  document.getElementById('statusText').textContent = `${meta.uniqueSubmarketsLoaded} submarkets • School, demographics, and healthcare framework ready`;
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
    <h3 class="selected-title">Enterprise Snapshot</h3>
    <p class="selected-meta">Market intelligence foundation</p>
    <div class="metric-grid">
      <div class="metric"><div class="label">Submarkets</div><div class="value">${total}</div></div>
      <div class="metric"><div class="label">Hubs</div><div class="value">4</div></div>
      <div class="metric"><div class="label">School Rating</div><div class="value">${fmtScore(scoreSummary.overall)}</div></div>
      <div class="metric"><div class="label">Population</div><div class="value">${fmt(demo?.current?.population)}</div></div>
    </div>
    ${renderDemographicsCard(demo)}
    ${renderSchoolCountCard(counts, scoreSummary)}
    ${renderHealthcareCard(healthcare)}
    ${renderRetailCard(retail)}
    ${renderBuilderCard(builder)}
    <div class="focus-list">
      <div class="focus-row"><span>Boundaries</span><b>Verified</b></div>
      <div class="focus-row"><span>Hub color model</span><b>Active</b></div>
      <div class="focus-row"><span>School layer</span><b>${state.schoolsLoaded ? 'Loaded' : 'Ready'}</b></div>
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
  state.searchIndex = submarkets.concat(schools).concat(healthcare).concat(builders).concat(pois);
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
    ${renderBuilderCard(builder)}
    <div class="focus-list">
      <div class="focus-row"><span>Boundaries</span><b>Verified</b></div>
      <div class="focus-row"><span>School Rating</span><b>${state.schoolsLoaded ? 'Loaded' : 'Ready'}</b></div>
      <div class="focus-row"><span>Healthcare</span><b>${healthcareDatasetBuilt() ? 'Loaded' : 'Layer Ready'}</b></div>
      <div class="focus-row"><span>Retail & Dining</span><b>${state.poisLoaded ? 'Loaded' : 'Ready'}</b></div>
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
      else if (item.type === 'POI') selectPOI(item.poi);
      else if (item.type === 'Healthcare') selectHealthcare(item.facility);
      else if (item.type === 'Builder') selectBuilderSubdivision(item.builder);
      else selectFeature(item.feature, findLayerForFeature(item.feature), true);
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
  else if (first.type === 'POI') selectPOI(first.poi);
  else if (first.type === 'Healthcare') selectHealthcare(first.facility);
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

  state.schoolLayer = L.geoJSON({ type: 'FeatureCollection', features: state.schools }, {
    pointToLayer: (feature, latlng) => L.marker(latlng, { icon: schoolIcon(feature.properties.SchoolType) }),
    onEachFeature: (feature, layer) => {
      const p = feature.properties;
      layer.bindPopup(`<div class="school-popup"><h3>${p.NAME}</h3><p><b>Type:</b> ${p.SchoolType}</p><p><b>GreatSchools:</b> ${p.GreatSchoolsRating ? p.GreatSchoolsRating + '/10' : ((p.SchoolType === 'Other' || p.RatingExcluded) ? 'Not Rated (Excluded)' : 'Not Rated')}</p><p><b>Location:</b> ${p.CITY}, ${p.STATE}</p><p><b>County:</b> ${p.NMCNTY || ''}</p><p><b>Submarket:</b> ${p.SubmarketName || 'Outside submarket boundary'}</p><p><b>NCES ID:</b> ${p.NCESSCH || ''}</p></div>`);
      layer.on('click', () => selectSchool(feature, false));
      layer.on('dblclick', () => selectSchool(feature, true));
    }
  });
  if (showLayer) state.schoolLayer.addTo(state.map);
  state.schoolsLoaded = true;
  buildSearchIndex();
  renderSearchResults(document.getElementById('searchInput').value || '');
  document.getElementById('schoolCountBadge').textContent = `${state.schools.length} loaded`;
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
  if (target) target.openPopup();
}

function bindUI() {
  bindPersistentDetails();
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
        await loadSchools(true);
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
  document.getElementById('toggleRetail').addEventListener('change', async e => {
    try {
      if (e.target.checked) {
        await loadPOIs();
        if (state.poiLayer && !state.map.hasLayer(state.poiLayer)) state.poiLayer.addTo(state.map);
        document.getElementById('mapThemeSelect').value = 'retail';
        setMapTheme('retail');
      } else if (state.poiLayer) {
        state.map.removeLayer(state.poiLayer);
        document.getElementById('mapThemeSelect').value = 'hub';
        setMapTheme('hub');
      }
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


  document.getElementById('toggleBuilders').addEventListener('change', async e => {
    try {
      if (e.target.checked) {
        await loadBuilders(true);
        if (state.builderLayer && !state.map.hasLayer(state.builderLayer)) state.builderLayer.addTo(state.map);
        document.getElementById('mapThemeSelect').value = 'builders';
        setMapTheme('builders');
      } else if (state.builderLayer) {
        state.map.removeLayer(state.builderLayer);
        document.getElementById('mapThemeSelect').value = 'hub';
        setMapTheme('hub');
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

  document.getElementById('toggleHealthcare').addEventListener('change', async e => {
    try {
      if (e.target.checked) {
        await loadHealthcare(true);
        if (state.healthcareLayer && !state.map.hasLayer(state.healthcareLayer)) state.healthcareLayer.addTo(state.map);
        document.getElementById('mapThemeSelect').value = 'healthcare';
        setMapTheme('healthcare');
      } else if (state.healthcareLayer) {
        state.map.removeLayer(state.healthcareLayer);
        document.getElementById('mapThemeSelect').value = 'hub';
        setMapTheme('hub');
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
      document.getElementById('mapThemeSelect').value = e.target.checked ? 'income' : 'hub';
      setMapTheme(e.target.checked ? 'income' : 'hub');
    });
  }
  document.getElementById('mapThemeSelect').addEventListener('change', e => {
    if (document.getElementById('toggleDemographics')) document.getElementById('toggleDemographics').checked = ['income','population'].includes(e.target.value);
    setMapTheme(e.target.value);
  });
  document.getElementById('basemapSelect').addEventListener('change', e => {
    Object.values(state.basemaps).forEach(l => state.map.removeLayer(l));
    state.basemaps[e.target.value].addTo(state.map);
    state.basemaps[e.target.value].bringToBack();
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
  })
  .catch(err => {
    console.error(err);
    document.getElementById('statusText').textContent = 'Error loading atlas data: ' + (err && err.message ? err.message : err);
  });
