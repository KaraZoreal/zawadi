const fs = require('fs');
const db = JSON.parse(fs.readFileSync('./server/data/zawadi-db.json', 'utf8'));

const now = Date.now();
let counter = 0;

function makeId() {
  return 'sch-' + (now + (++counter));
}

const newScholarships = [
  {
    id: makeId(),
    name: "Ashesi-ETH Master's Scholarship in Mechatronic Engineering 2027",
    host: 'Ashesi University & ETH Zurich',
    location: 'Ghana / Switzerland',
    level: 'Masters',
    field: 'Engineering - Mechatronics',
    deadline: '30 June 2026',
    deadlineRaw: '2026-06-30',
    amount: "Full tuition + living expenses (two Master's degrees)",
    eligibility: 'African citizens with engineering background. Must apply to Ashesi University first.',
    description: "Joint Master's programme in Mechatronic Engineering between Ashesi University (Ghana) and ETH Zurich (Switzerland). Students earn two Master's degrees. 40 students from 7 African countries currently enrolled. Fully funded with job offer after graduation.",
    link: 'https://www.afterschoolafrica.com/97048/fully-funded-2026-ashesi-eth-masters-scholarship-for-young-african-engineers-apply/',
    source: 'After School Africa',
    sourceUrl: 'https://www.afterschoolafrica.com',
    verified: true,
    featured: true,
    tags: ['Engineering', 'Mechatronics', 'Dual Degree', 'Ghana', 'Switzerland', 'Fully Funded'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: makeId(),
    name: 'David Oyedepo Foundation Scholarship (DOF) 2026/2027',
    host: 'Covenant University & Landmark University',
    location: 'Nigeria',
    level: 'Masters',
    field: 'All fields',
    deadline: '27 June 2026',
    deadlineRaw: '2026-06-27',
    amount: 'Full tuition + accommodation + stipend',
    eligibility: 'African citizens. Must be admitted to Covenant University or Landmark University in Nigeria.',
    description: 'The David Oyedepo Foundation Scholarship grants African students the opportunity to study at Covenant and Landmark University, Nigeria. Covers full tuition, accommodation, and living stipend. Open to all fields of study.',
    link: 'https://www.scholarshipset.com/scholarships/david-oyedepo-foundation-scholarship-2026',
    source: 'ScholarshipSet',
    sourceUrl: 'https://www.scholarshipset.com',
    verified: true,
    featured: true,
    tags: ['Nigeria', 'Fully Funded', 'Masters', 'All Fields'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: makeId(),
    name: 'Africa Climate Collaborative Masters & PhD Scholarships 2026/2027',
    host: 'Makerere University',
    location: 'Uganda',
    level: 'Masters & PhD',
    field: 'Climate Science / Environmental Science / Sustainability',
    deadline: '5 June 2026',
    deadlineRaw: '2026-06-05',
    amount: 'Full tuition + research funding + stipend',
    eligibility: 'African citizens passionate about climate change. 50 Masters & 12 PhD positions available.',
    description: 'Makerere University announces 50 Masters and 12 PhD scholarships under the Africa Climate Collaborative (ACC) for Academic Year 2026/2027. Fully funded for African students committed to climate research and sustainability solutions.',
    link: 'https://news.mak.ac.ug/2026/04/africa-climate-collaborative-masters-phd-scholarship-announcement-academic-year-2026-2027/',
    source: 'Makerere University News',
    sourceUrl: 'https://news.mak.ac.ug',
    verified: true,
    featured: true,
    tags: ['Climate Science', 'PhD', 'Masters', 'Uganda', 'Fully Funded', 'Research'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: makeId(),
    name: 'MEST AI Startup Program (Class of 2027)',
    host: 'MEST Africa',
    location: 'Accra, Ghana',
    level: 'Fellowship / Entrepreneurship',
    field: 'AI / Software Entrepreneurship',
    deadline: '20 July 2026',
    deadlineRaw: '2026-07-20',
    amount: 'Fully funded 12-month program + seed funding up to $100,000',
    eligibility: 'African founders from Ghana, Nigeria, Senegal, and Kenya aged 21-35 with software development experience.',
    description: 'The MEST AI Startup Program is a fully-funded 12-month residential fellowship in Accra, Ghana for ambitious African founders building AI startups. Includes 7 months of AI startup training, mentorship, and access to seed funding.',
    link: 'https://opportunitydesk.org/2026/05/20/mest-ai-startup-program-2027/',
    source: 'Opportunity Desk',
    sourceUrl: 'https://opportunitydesk.org',
    verified: true,
    featured: true,
    tags: ['AI', 'Entrepreneurship', 'Ghana', 'Fellowship', 'Startup', 'Fully Funded'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: makeId(),
    name: 'APNI Young African Phosphorus Fellowship Award 2026',
    host: 'African Plant Nutrition Institute (APNI)',
    location: 'Africa (various institutions)',
    level: 'Research Fellowship',
    field: 'Agricultural Science / Plant Nutrition',
    deadline: '7 July 2026',
    deadlineRaw: '2026-07-07',
    amount: 'USD $5,000 per fellow (up to 5 fellows)',
    eligibility: "Early-career scientists at African NARES institutions or universities. Research focused on phosphorus management in Africa's agroecosystems.",
    description: "The APNI Young African Phosphorus Fellowship encourages scientific programs focused on understanding and improving phosphorus management in Africa's field and tree crop agroecosystems. Up to five early-career scientists will receive USD $5,000 each.",
    link: 'https://www.opportunitiesforafricans.com/apni-young-african-phosphorus-fellowship-2026/',
    source: 'Opportunities for Africans',
    sourceUrl: 'https://www.opportunitiesforafricans.com',
    verified: true,
    featured: false,
    tags: ['Agriculture', 'Research', 'Fellowship', 'Africa', 'Science'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: makeId(),
    name: 'Audi Environmental Foundation Scholarship 2026 (One Young World Summit)',
    host: 'Audi Environmental Foundation / One Young World',
    location: 'Cape Town, South Africa',
    level: 'Leadership / Non-degree',
    field: 'Environmental Sustainability / Leadership',
    deadline: '1 June 2026',
    deadlineRaw: '2026-06-01',
    amount: 'Fully funded to attend One Young World Summit 2026',
    eligibility: 'Age 18-30. African citizens committed to environmental sustainability and youth leadership.',
    description: 'The Audi Environmental Foundation Scholarship funds young African leaders to attend the One Young World Summit 2026 in Cape Town, South Africa. Full funding includes travel, accommodation, and summit access.',
    link: 'https://opportunitydesk.org/2026/04/13/audi-environmental-foundation-scholarship-2026/',
    source: 'Opportunity Desk',
    sourceUrl: 'https://opportunitydesk.org',
    verified: true,
    featured: false,
    tags: ['Environment', 'Leadership', 'Summit', 'South Africa', 'Youth', 'Fully Funded'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: makeId(),
    name: 'McCall MacBain Scholarship at McGill University 2027',
    host: 'McGill University',
    location: 'Canada',
    level: 'Masters & PhD',
    field: 'All fields',
    deadline: 'September 2026 (TBD)',
    deadlineRaw: '2026-09-01',
    amount: 'Full tuition + living expenses + mentorship',
    eligibility: 'Global citizens including Africans. Applications open June 2026 for Summer/Fall 2027 entry.',
    description: "The McCall MacBain Scholarship is one of Canada's most prestigious fully funded graduate scholarships at McGill University. Covers full tuition, living expenses, and provides mentorship. Applications open June 2026 for 2027 entry.",
    link: 'https://mccallmacbainscholars.org/',
    source: 'McCall MacBain Scholars',
    sourceUrl: 'https://mccallmacbainscholars.org',
    verified: true,
    featured: true,
    tags: ['Canada', 'McGill', 'Fully Funded', 'Masters', 'PhD', 'All Fields', 'Prestigious'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: makeId(),
    name: 'Mastercard Foundation Scholars Program at Arizona State University 2026',
    host: 'Arizona State University (ASU)',
    location: 'Rwanda / USA',
    level: 'Graduate Certificate / Masters',
    field: 'Various fields',
    deadline: 'Check portal',
    deadlineRaw: '2026-12-31',
    amount: 'Fully funded',
    eligibility: 'Citizens of African countries aged 18-33. Must be able to live in Kigali, Rwanda for program duration.',
    description: 'The Mastercard Foundation Scholars Program at ASU offers fully funded graduate certificates and masters programs for African students. Program based in Kigali, Rwanda with ethical leadership focus.',
    link: 'https://opportunitydesk.org/2025/10/10/mastercard-foundation-scholars-program-at-arizona-state-university-2026/',
    source: 'Opportunity Desk',
    sourceUrl: 'https://opportunitydesk.org',
    verified: true,
    featured: true,
    tags: ['Mastercard Foundation', 'ASU', 'Rwanda', 'USA', 'Fully Funded', 'Graduate'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: makeId(),
    name: 'Obama Foundation Leaders Program 2026-2027',
    host: 'Obama Foundation',
    location: 'Various (Africa track)',
    level: 'Leadership Fellowship',
    field: 'Public Service / Leadership / Social Change',
    deadline: 'Check portal',
    deadlineRaw: '2026-12-31',
    amount: 'Fully funded fellowship + stipend',
    eligibility: 'Emerging African leaders committed to public service and social change.',
    description: 'The Obama Foundation Leaders Program is a prestigious leadership development fellowship for emerging leaders across Africa. Provides training, mentorship, and a network of changemakers.',
    link: 'https://opportunitydesk.org/2025/11/10/obama-foundation-leaders-program-2026-2027/',
    source: 'Opportunity Desk',
    sourceUrl: 'https://opportunitydesk.org',
    verified: true,
    featured: true,
    tags: ['Obama Foundation', 'Leadership', 'Fellowship', 'Africa', 'Public Service', 'Fully Funded'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: makeId(),
    name: 'University of New South Wales International Scholarships 2026',
    host: 'University of New South Wales (UNSW)',
    location: 'Australia',
    level: 'Bachelors & Masters',
    field: 'All fields',
    deadline: '18 June 2026',
    deadlineRaw: '2026-06-18',
    amount: 'Partial to full tuition (varies by program)',
    eligibility: 'International students including African citizens. Merit-based.',
    description: 'UNSW offers a wide range of merit-based scholarships for international students pursuing undergraduate or postgraduate studies. Open to students from African countries across all fields of study.',
    link: 'https://www.scholars4dev.com/category/target-group/africans-scholarships/',
    source: 'Scholars4Dev',
    sourceUrl: 'https://www.scholars4dev.com',
    verified: true,
    featured: false,
    tags: ['Australia', 'UNSW', 'Bachelors', 'Masters', 'Merit-based'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Dedup check
const existing = new Set(db.scholarships.map(s => s.name.toLowerCase().trim()));
const added = [];
const skipped = [];

newScholarships.forEach(s => {
  if (existing.has(s.name.toLowerCase().trim())) {
    skipped.push(s.name);
  } else {
    db.scholarships.push(s);
    added.push(s.name);
    existing.add(s.name.toLowerCase().trim());
  }
});

fs.writeFileSync('./server/data/zawadi-db.json', JSON.stringify(db, null, 2));

console.log('Added ' + added.length + ' new scholarships:');
added.forEach((n, i) => console.log('  ' + (i + 1) + '. ' + n));
if (skipped.length) {
  console.log('\nSkipped (duplicates):');
  skipped.forEach(n => console.log('  - ' + n));
}
console.log('\nTotal scholarships in DB: ' + db.scholarships.length);
