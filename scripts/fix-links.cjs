const fs = require('fs');
const db = JSON.parse(fs.readFileSync('./server/data/zawadi-db.json', 'utf8'));

// Map of scholarship name (lowercase substring) -> direct application link
const linkMap = {
  'amberscholar': 'https://www.amberscholar.com/scholarship',
  'atlantic dialogues emerging leaders': 'https://www.policycenter.ma/events/pcns-youth-community-call-applications-atlantic-dialogues-emerging-leaders-program-2026',
  'fulbright south african research scholar': 'https://www.iie.org/Programs/Foreign-Student-Exchange/Foreign-Students/Foreign-Graduate-Students/',
  'rhodes west africa': 'https://www.rhodeshouse.ox.ac.uk/scholarships/applications/west-africa/',
  'one young world pernod ricard': 'https://www.oneyoungworld.com/scholarships',
  'icmm young leaders': 'https://apply.oneyoungworld.com/scholarship/form/icmm-young-leaders-scholarship-2',
  'mo Ibrahim foundation soas': 'https://www.soas.ac.uk/study/student-life/finance/scholarships/mo-ibrahim-foundation-scholarships/',
  'mo ibrahim foundation scholarship at soas': 'https://www.soas.ac.uk/study/student-life/finance/scholarships/mo-ibrahim-foundation-scholarships/',
  'queen elizabeth commonwealth': 'https://www.acu.ac.uk/funding-opportunities/for-students/scholarships/queen-elizabeth-commonwealth-scholarships/',
  'erasmus mundus joint master': 'https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters',
  'daad': 'https://www.daad.de/en/studying-in-germany/scholarships/daad-scholarships/',
  'swedish institute scholarships for global professionals': 'https://si.se/en/apply/scholarships/swedish-institute-scholarships-for-global-professionals/',
  'vlir-uos': 'https://www.vliruos.be/en/scholarships',
  'chevening': 'https://www.chevening.org/apply/',
  'mastercard foundation scholars program': 'https://mastercardfdn.org/programs/scholars/',
  'mandela rhodes': 'https://www.mandelarhodes.org/scholarship/apply/',
  'aga khan foundation': 'https://www.akdn.org/our-agencies/aga-khan-foundation/international-scholarship-programme',
  'konrad-adenauer-stiftung': 'https://www.kas.de/en/web/begabtenfoerderung-und-kultur/international-talent-development',
  'aims master of science in mathematical sciences': 'https://ai.aims.ac.za/apply',
  'mastercard foundation scholars program at pan-atlantic': 'https://www.pau.edu.ng/mastercard-foundation-scholars-program/',
  'rhodes scholarships for africa': 'https://www.rhodeshouse.ox.ac.uk/scholarships/applications/',
  'ashesi-eth': 'https://www.ashesi.edu.gh/admissions/graduate.html',
  'david oyedepo foundation': 'https://www.davidoyedepofoundation.org/scholarship/',
  'africa climate collaborative': 'https://news.mak.ac.ug/2026/04/africa-climate-collaborative-masters-phd-scholarship-announcement-academic-year-2026-2027/',
  'mest ai startup': 'https://mest.africa/apply',
  'apni young african phosphorus': 'https://www.apni.net/fellowship/',
  'audi environmental foundation': 'https://www.oneyoungworld.com/scholarship/audi-environmental-foundation-scholarship-2026',
  'mccall macbain': 'https://mccallmacbainscholars.org/apply/',
  'mastercard foundation scholars program at arizona': 'https://www.asu.edu/mastercard-foundation-scholars',
  'obama foundation leaders': 'https://www.obama.org/programs/leaders/',
  'university of new south wales': 'https://www.unsw.edu.au/study/scholarships',
  'hyundai motor group scholarship': 'https://www.soas.ac.uk/study/student-life/finance/scholarships/hyundai-motor-group-scholarship',
};

let updated = 0;
let alreadyHad = 0;
let noLink = 0;

db.scholarships.forEach(s => {
  const nameLower = s.name.toLowerCase();
  
  // Skip if already has a valid link
  if (s.link && s.link.startsWith('http') && !s.link.includes('afterschoolafrica.com') && !s.link.includes('opportunitydesk.org') && !s.link.includes('scholarshipset.com')) {
    alreadyHad++;
    return;
  }
  
  // Find matching link
  let found = false;
  for (const [key, url] of Object.entries(linkMap)) {
    if (nameLower.includes(key)) {
      s.link = url;
      s.updatedAt = new Date().toISOString();
      updated++;
      found = true;
      break;
    }
  }
  
  if (!found) {
    noLink++;
    console.log('NO LINK FOUND:', s.name);
  }
});

fs.writeFileSync('./server/data/zawadi-db.json', JSON.stringify(db, null, 2));

console.log('\n=== LINK UPDATE SUMMARY ===');
console.log('Total scholarships:', db.scholarships.length);
console.log('Updated with direct links:', updated);
console.log('Already had good links:', alreadyHad);
console.log('No link found:', noLink);

// Verify all have links
console.log('\n=== ALL SCHOLARSHIPS WITH LINKS ===');
db.scholarships.forEach((s, i) => {
  const linkStatus = s.link ? '✓' : '✗';
  console.log((i + 1) + '. [' + linkStatus + '] ' + s.name.substring(0, 60));
  if (s.link) {
    console.log('   → ' + s.link);
  }
});
