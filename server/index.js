import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createClient } from "@supabase/supabase-js";

// --- Zawadi AI Modules ---
import { aiConfigured } from "./modules/ai-client.js";
import { detectDocumentType, analyzeDocumentSet, checkDocumentGap } from "./modules/document-intelligence.js";
import { autoApply, batchAutoApply, AUTO_APPLY_STATUSES, SEVERITY } from "./modules/auto-apply-engine.js";
import { generateEssay, ESSAY_TYPES } from "./modules/essay-generator.js";
import { recordEvent, analyzeLearningData, generateRecommendations, EVENT_TYPES } from "./modules/learning-system.js";
import { recordEdit, getUserPreferences, buildPreferenceGuidance, getEditHistorySummary } from "./modules/essay-learner.js";
import {
  PLANS, UPGRADE_PLANS, SUBSCRIPTION_STATUS, isTrialActive, trialsDaysLeft, startTrial, endTrial,
  getUserUsage, trackUsage, checkLimitWithUsage,
  subscribe, cancelSubscription, changePlan, getPaymentHistory, generateInvoice, getBillingSummary,
  initiatePayment, verifyPayment, verifyWebhookSignature, processWebhookEvent
} from "./modules/payment-manager.js";
import scholarshipIngestionRouter from "./modules/scholarship-ingestion.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = process.env.VERCEL
  ? "/tmp"
  : path.join(__dirname, "data");
const dbPath = path.join(dataDir, "zawadi-db.json");
const sessionCookie = "zawadi_session";
const sessionMs = 1000 * 60 * 60 * 24 * 30;
const port = Number(process.env.PORT) || 5173;
const isProduction =
  process.argv.includes("--production") || process.env.NODE_ENV === "production";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      })
    : null;

const app = express();

app.post(
  "/api/paystack/webhook",
  express.raw({ type: "application/json" }),
  async (req, res, next) => {
    try {
      const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
      if (!secret) {
        res.status(204).send();
        return;
      }

      const signature = req.headers["x-paystack-signature"] || "";
      if (!verifyWebhookSignature(req.body, signature, secret)) {
        res.status(401).json({ error: "Invalid Paystack signature" });
        return;
      }

      const event = JSON.parse(req.body.toString("utf8"));
      const db = await loadDb();
      const result = processWebhookEvent(event, db);

      if (result.success) {
        await saveDb(db);
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

app.use(express.json({ limit: "4mb" }));

const nowIso = () => new Date().toISOString();

const africanCountries = [
  "Algeria",
  "Angola",
  "Benin",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Cameroon",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Comoros",
  "Congo",
  "Cote d'Ivoire",
  "Democratic Republic of the Congo",
  "Djibouti",
  "Egypt",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Ethiopia",
  "Gabon",
  "Gambia",
  "Ghana",
  "Guinea",
  "Guinea-Bissau",
  "Kenya",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Morocco",
  "Mozambique",
  "Namibia",
  "Niger",
  "Nigeria",
  "Rwanda",
  "Sao Tome and Principe",
  "Senegal",
  "Seychelles",
  "Sierra Leone",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Sudan",
  "Tanzania",
  "Togo",
  "Tunisia",
  "Uganda",
  "Zambia",
  "Zimbabwe"
];

const pricingPlans = [
  {
    id: "free",
    name: "Explorer",
    monthlyKes: 0,
    annualKes: 0,
    badge: "Free",
    description: "Scholarship discovery and basic application tracking.",
    features: [
      "Open scholarship database",
      "Basic country, level and field filters",
      "10 tracked applications",
      "3 document records",
      "3 AI essay generations per day",
      "3 scholarship applications per day",
      "Weekly in-app updates"
    ]
  },
  {
    id: "plus",
    name: "Scholar Plus",
    monthlyKes: 399,
    annualKes: 3990,
    badge: "Best value",
    description: "Premium matching and deadline control for active applicants.",
    features: [
      "Unlimited application tracking",
      "Premium accessibility and amount filters",
      "Smart match score from your profile",
      "Document gap analysis",
      "Browser notifications for new matches"
    ]
  },
  {
    id: "pro",
    name: "Application Pro",
    monthlyKes: 999,
    annualKes: 9990,
    badge: "Power user",
    description: "For applicants managing many countries, schools and deadlines.",
    features: [
      "Everything in Scholar Plus",
      "Unlimited document vault metadata",
      "Priority urgency feed",
      "Advanced school and scholarship type filters",
      "CSV exports and intake tools"
    ]
  },
  {
    id: "mentor",
    name: "Mentor Review",
    monthlyKes: 2999,
    annualKes: 29990,
    badge: "Concierge",
    description: "A higher tier for hands-on review workflows.",
    features: [
      "Everything in Application Pro",
      "Review queue for CV, SOP and essays",
      "Interview preparation tracker",
      "Application readiness checklist",
      "Designed for later human mentor operations"
    ]
  }
];

function createPasswordHash(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash = "") {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const testHash = crypto.scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(hash, "hex");
  return (
    storedBuffer.length === testHash.length &&
    crypto.timingSafeEqual(storedBuffer, testHash)
  );
}

function seedScholarships() {
  const createdAt = nowIso();
  const source = "Seed data - verify before publishing";

  return [
    {
      id: "sch-erasmus-mundus",
      name: "Erasmus Mundus Joint Masters Scholarships",
      provider: "European Education and Culture Executive Agency",
      host: "European Union - university consortiums",
      countries: ["Europe", "France", "Germany", "Italy", "Spain", "Sweden"],
      eligibleCountries: africanCountries,
      eligibleRegions: ["Africa", "Global South"],
      degreeLevels: ["Masters"],
      fields: ["Artificial Intelligence", "Data Science", "Engineering", "Computer Science"],
      schools: ["Participating Erasmus Mundus consortium universities"],
      scholarshipType: "Government",
      fundingType: "Fully funded",
      amountLabel: "Full tuition + monthly stipend + travel + insurance",
      amountMin: 0,
      amountMax: 0,
      currency: "EUR",
      deadline: "Varies by consortium",
      deadlineDate: "",
      accessibility: ["Africa eligible", "No separate scholarship application", "Official portal"],
      requiredDocuments: ["CV", "Transcript", "Motivation Letter", "References", "Passport"],
      description:
        "Joint master's scholarships across European universities. Applicants must verify the exact consortium, degree track and annual deadline.",
      officialUrl: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
      source,
      tags: ["masters", "global", "fully funded"],
      createdAt,
      updatedAt: createdAt,
      verifiedAt: createdAt,
      createdBy: "system"
    },
    {
      id: "sch-daad-epos",
      name: "DAAD Development-Related Postgraduate Courses",
      provider: "DAAD",
      host: "Germany - partner universities",
      countries: ["Germany"],
      eligibleCountries: africanCountries,
      eligibleRegions: ["Africa", "Developing countries"],
      degreeLevels: ["Masters", "PhD"],
      fields: ["Development", "Engineering", "Public Policy", "STEM", "Data"],
      schools: ["DAAD EPOS partner universities"],
      scholarshipType: "Government",
      fundingType: "Fully funded",
      amountLabel: "Tuition support + monthly stipend + travel + insurance",
      amountMin: 0,
      amountMax: 0,
      currency: "EUR",
      deadline: "Varies by course",
      deadlineDate: "",
      accessibility: ["Africa eligible", "Work experience may be required"],
      requiredDocuments: ["CV", "Transcript", "Motivation Letter", "References", "Work Experience"],
      description:
        "German postgraduate scholarships for development-related programmes. Each course has its own school, requirements and deadline.",
      officialUrl: "https://www.daad.de/en/studying-in-germany/scholarships/daad-scholarships/",
      source,
      tags: ["germany", "masters", "development"],
      createdAt,
      updatedAt: createdAt,
      verifiedAt: createdAt,
      createdBy: "system"
    },
    {
      id: "sch-mastercard-foundation",
      name: "Mastercard Foundation Scholars Program",
      provider: "Mastercard Foundation",
      host: "Partner universities",
      countries: ["Africa", "Canada", "United Kingdom", "United States"],
      eligibleCountries: africanCountries,
      eligibleRegions: ["Africa"],
      degreeLevels: ["Undergraduate", "Masters"],
      fields: ["All fields", "STEM", "Business", "Public Health", "Education"],
      schools: ["Partner universities only"],
      scholarshipType: "Foundation",
      fundingType: "Fully funded",
      amountLabel: "Full cost of attendance at partner institutions",
      amountMin: 0,
      amountMax: 0,
      currency: "USD",
      deadline: "Depends on partner university",
      deadlineDate: "",
      accessibility: ["Africa focused", "Leadership focused", "Partner school only"],
      requiredDocuments: ["CV", "Transcript", "Essays", "References", "Financial Need Evidence"],
      description:
        "Scholarship and leadership programme for talented African students at selected partner universities.",
      officialUrl: "https://mastercardfdn.org/all/scholars/becoming-a-scholar/",
      source,
      tags: ["africa", "undergraduate", "masters"],
      createdAt,
      updatedAt: createdAt,
      verifiedAt: createdAt,
      createdBy: "system"
    },
    {
      id: "sch-chevening",
      name: "Chevening Scholarships",
      provider: "UK Foreign, Commonwealth and Development Office",
      host: "United Kingdom - eligible universities",
      countries: ["United Kingdom"],
      eligibleCountries: africanCountries,
      eligibleRegions: ["Africa", "Chevening eligible countries"],
      degreeLevels: ["Masters"],
      fields: ["All fields", "Public Policy", "STEM", "Law", "Business"],
      schools: ["UK universities"],
      scholarshipType: "Government",
      fundingType: "Fully funded",
      amountLabel: "Tuition + monthly stipend + travel + allowances",
      amountMin: 0,
      amountMax: 0,
      currency: "GBP",
      deadline: "Annual cycle",
      deadlineDate: "",
      accessibility: ["Leadership focused", "Work experience required"],
      requiredDocuments: ["CV", "Transcript", "Essays", "References", "Passport"],
      description:
        "One-year master's scholarship for future leaders. Applicants choose eligible UK master's courses.",
      officialUrl: "https://www.chevening.org/scholarships/",
      source,
      tags: ["uk", "masters", "leadership"],
      createdAt,
      updatedAt: createdAt,
      verifiedAt: createdAt,
      createdBy: "system"
    },
    {
      id: "sch-mandela-rhodes",
      name: "Mandela Rhodes Scholarship",
      provider: "Mandela Rhodes Foundation",
      host: "South Africa - recognised universities",
      countries: ["South Africa"],
      eligibleCountries: africanCountries,
      eligibleRegions: ["Africa"],
      degreeLevels: ["Honours", "Masters"],
      fields: ["All fields"],
      schools: ["South African universities"],
      scholarshipType: "Foundation",
      fundingType: "Fully funded",
      amountLabel: "Tuition, accommodation, meals, book allowance and travel support",
      amountMin: 0,
      amountMax: 0,
      currency: "ZAR",
      deadline: "Annual cycle",
      deadlineDate: "",
      accessibility: ["Africa focused", "Leadership development", "South Africa study only"],
      requiredDocuments: ["CV", "Transcript", "Essays", "References", "ID or Passport"],
      description:
        "Leadership scholarship for African citizens to study postgraduate qualifications in South Africa.",
      officialUrl: "https://www.mandelarhodes.org/scholarship/",
      source,
      tags: ["africa", "south africa", "leadership"],
      createdAt,
      updatedAt: createdAt,
      verifiedAt: createdAt,
      createdBy: "system"
    },
    {
      id: "sch-agakhan-foundation",
      name: "Aga Khan Foundation International Scholarship Programme",
      provider: "Aga Khan Foundation",
      host: "Approved universities globally",
      countries: ["Global"],
      eligibleCountries: [
        "Egypt",
        "Kenya",
        "Madagascar",
        "Mozambique",
        "Tanzania",
        "Uganda"
      ],
      eligibleRegions: ["Selected African countries"],
      degreeLevels: ["Masters", "PhD"],
      fields: ["All fields"],
      schools: ["Approved universities"],
      scholarshipType: "Foundation",
      fundingType: "Mixed funding",
      amountLabel: "Need-based support, often grant plus loan structure",
      amountMin: 0,
      amountMax: 0,
      currency: "USD",
      deadline: "Annual cycle",
      deadlineDate: "",
      accessibility: ["Need based", "Selected countries only", "May include loan component"],
      requiredDocuments: ["CV", "Transcript", "Admission Letter", "Financial Need Evidence", "References"],
      description:
        "Postgraduate funding programme for selected countries. Funding terms and eligibility require careful verification.",
      officialUrl: "https://the.akdn/en/what-we-do/developing-human-capacity/education/international-scholarships",
      source,
      tags: ["postgraduate", "need based", "selected countries"],
      createdAt,
      updatedAt: createdAt,
      verifiedAt: createdAt,
      createdBy: "system"
    }
  ];
}

function defaultProfile(country = "Kenya") {
  return {
    country,
    region: "Africa",
    targetLevel: "Masters",
    fieldInterests: ["Data Science", "Artificial Intelligence"],
    studyCountries: ["Germany", "United Kingdom", "South Africa", "Europe"],
    accessibilityNeeds: ["Fully funded", "No GRE", "Low document burden"]
  };
}

async function createSeedDb() {
  const createdAt = nowIso();
  return {
    users: [],
    sessions: [],
    scholarships: seedScholarships(),
    applications: [],
    documents: [],
    learningLog: [],
    alerts: [],
    essaySamples: [],
    essayEditHistory: [],
    essayPreferences: {},
    usageTracking: {},
    passwordResets: [],
    notifications: [],
    payments: []
  };
}

async function loadDb() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    const raw = await fs.readFile(dbPath, "utf8");
    const db = JSON.parse(raw);
    db.users ||= [];
    db.sessions ||= [];
    db.scholarships ||= [];
    db.applications ||= [];
    db.documents ||= [];
    db.learningLog ||= [];
    db.alerts ||= [];
    db.essaySamples ||= [];
    db.essayEditHistory ||= [];
    db.essayPreferences ||= {};
    db.usageTracking ||= {};
    db.notifications ||= [];
    db.payments ||= [];
    db.users = db.users.map(normalizeUser);
    db.scholarships = db.scholarships.map(normalizeScholarship);
    const existingScholarshipIds = new Set(db.scholarships.map((row) => row.id));
    let addedSeeds = false;
    seedScholarships().forEach((row) => {
      const existing = db.scholarships.find((s) => s.id === row.id);
      if (!existing) {
        db.scholarships.push(row);
        addedSeeds = true;
      } else if (!existing.verifiedAt) {
        // Backfill verifiedAt on existing seed scholarships that predate this release
        existing.verifiedAt = row.verifiedAt || nowIso();
        addedSeeds = true;
      }
    });
    if (addedSeeds) await saveDb(db);
    return db;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const db = await createSeedDb();
    await saveDb(db);
    return db;
  }
}

async function saveDb(db) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

function parseCookies(header = "") {
  return header.split(";").reduce((cookies, item) => {
    const [key, ...valueParts] = item.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});
}

function setSession(res, token) {
  res.cookie(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: sessionMs,
    path: "/"
  });
}

function clearSession(res) {
  res.clearCookie(sessionCookie, { path: "/" });
}

function text(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function list(value) {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean);
  return text(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeUrl(value) {
  const candidate = text(value);
  if (!candidate) return "";
  try {
    return new URL(candidate).toString();
  } catch {
    return candidate.startsWith("www.") ? `https://${candidate}` : "";
  }
}

function inferDegreeLevels(value) {
  const normalized = text(value).toLowerCase();
  if (!normalized) return ["Masters"];
  const levels = [];
  if (normalized.includes("undergraduate") || normalized.includes("bachelor")) {
    levels.push("Undergraduate");
  }
  if (normalized.includes("honours") || normalized.includes("honors")) {
    levels.push("Honours");
  }
  if (
    normalized.includes("master") ||
    normalized.includes("msc") ||
    normalized.includes("ma ") ||
    normalized.includes("mba")
  ) {
    levels.push("Masters");
  }
  if (normalized.includes("phd") || normalized.includes("doctor")) {
    levels.push("PhD");
  }
  if (normalized.includes("fellowship")) {
    levels.push("Fellowship");
  }
  return levels.length ? levels : list(value);
}

function cleanDegreeLevels(value) {
  const values = list(value);
  const allowed = ["Undergraduate", "Honours", "Masters", "PhD", "Fellowship"];
  const clean = values.filter((item) => allowed.includes(item));
  if (clean.length === values.length && clean.length) return clean;
  return inferDegreeLevels(values.join(", "));
}

function inferFundingType(value) {
  const normalized = text(value).toLowerCase();
  if (normalized.includes("full")) return "Fully funded";
  if (normalized.includes("partial")) return "Partial funding";
  if (normalized.includes("loan")) return "Mixed funding";
  if (normalized.includes("tuition")) return "Tuition support";
  return text(value, "Verify funding");
}

function isCleanFundingType(value) {
  return [
    "Fully funded",
    "Partial funding",
    "Mixed funding",
    "Tuition support",
    "Living stipend",
    "Research grant",
    "Fellowship",
    "Verify funding"
  ].includes(value);
}

function cleanAccessibility(value) {
  return list(value).filter(
    (item) => !["Easy", "Moderate", "Competitive"].includes(item)
  );
}

function normalizeUser(user) {
  const plan = user.plan || "free";
  const planData = pricingPlans.find((item) => item.id === plan) || pricingPlans[0];
  return {
    ...user,
    country: user.country || user.profile?.country || "Kenya",
    plan,
    planName: user.planName || planData.name,
    planStatus: user.planStatus || (plan === "free" ? "free" : "active"),
    is_paid: Boolean(user.is_paid),
    paid_at: user.paid_at || null,
    profile: {
      ...defaultProfile(user.country || user.profile?.country || "Kenya"),
      ...(user.profile || {})
    }
  };
}

function normalizeScholarship(input) {
  const createdAt = input.createdAt || nowIso();
  const funding = text(input.funding || input.fundingType || "Verify funding");
  const amountLabel =
    input.amountLabel ||
    input.amount ||
    (funding.toLowerCase().includes("full") ? funding : "Amount not stated");
  const countries = list(input.countries || input.country || input.hostCountry);
  const fields = list(input.fields || input.field || input.aiTrack || input.tags);
  const schools = list(input.schools || input.school || input.host);
  const requiredDocuments = list(input.requiredDocuments || input.documentsRequired);
  const degreeLevels = cleanDegreeLevels(
    input.degreeLevels || input.degree || input.level || input.program || input.programme
  );
  const providedFundingType = text(input.fundingType);
  const fundingType = isCleanFundingType(providedFundingType)
    ? providedFundingType
    : inferFundingType(funding);
  const eligibleCountries = list(
    input.eligibleCountries || input.eligibilityCountries || input.eligibleCountry
  );
  const eligibility = text(input.eligibility || input.kenyaEligible || "");

  return {
    id: input.id || crypto.randomUUID(),
    name: text(input.name || input.scholarship || input.title, "Untitled scholarship"),
    provider: text(input.provider || input.host || input.institution, "Verify provider"),
    host: text(input.host || input.institution || input.university, "Verify host"),
    countries: countries.length ? countries : ["Global"],
    eligibleCountries: eligibleCountries.length
      ? eligibleCountries
      : eligibility.toLowerCase().includes("kenya")
        ? ["Kenya"]
        : africanCountries,
    eligibleRegions: list(input.eligibleRegions || input.region || "Africa"),
    degreeLevels: degreeLevels.length ? degreeLevels : ["Masters"],
    fields: fields.length ? fields : ["All fields"],
    schools: schools.length ? schools : ["Verify school"],
    scholarshipType: text(input.scholarshipType || input.type, "Scholarship"),
    fundingType,
    amountLabel,
    amountMin: Number(input.amountMin || 0),
    amountMax: Number(input.amountMax || 0),
    currency: text(input.currency, "USD"),
    deadline: text(input.deadline, "Check portal"),
    deadlineDate: text(input.deadlineDate || input.deadline_date, ""),
    accessibility: cleanAccessibility(input.accessibility || input.accessibilityTags),
    requiredDocuments: requiredDocuments.length
      ? requiredDocuments
      : ["CV", "Transcript", "Motivation Letter", "References"],
    description: text(input.description, ""),
    officialUrl: normalizeUrl(input.officialUrl || input.apply || input.url),
    source: text(input.source, "Manual upload"),
    tags: list(input.tags),
    createdAt,
    updatedAt: input.updatedAt || createdAt,
    verifiedAt: text(input.verifiedAt, ""),
    createdBy: text(input.createdBy, "system")
  };
}

function sanitizeScholarship(input, userId) {
  return {
    ...normalizeScholarship({
      ...input,
      id: input.id ? text(input.id) : crypto.randomUUID(),
      createdBy: userId,
      createdAt: input.createdAt || nowIso(),
      updatedAt: nowIso(),
      source: input.source || "Manual upload"
    })
  };
}

function defaultApplication(userId, scholarshipId) {
  return {
    id: `${userId}:${scholarshipId}`,
    userId,
    scholarshipId,
    applied: false,
    status: "Not started",
    priority: "Normal",
    notes: "",
    updatedAt: nowIso()
  };
}

function userDocuments(db, userId) {
  return db.documents.filter((item) => item.userId === userId);
}

function calculateMatch(user, scholarship, docs) {
  const profile = user.profile || defaultProfile(user.country);
  const uploadedDocTypes = docs.map((doc) => doc.type.toLowerCase());
  const missingDocuments = scholarship.requiredDocuments.filter(
    (doc) => !uploadedDocTypes.includes(doc.toLowerCase())
  );
  const reasons = [];
  let score = 35;

  if (
    scholarship.eligibleCountries.includes(profile.country) ||
    scholarship.eligibleCountries.includes("All African countries") ||
    scholarship.eligibleRegions.some((region) =>
      ["Africa", profile.region].includes(region)
    )
  ) {
    score += 20;
    reasons.push(`${profile.country} eligible`);
  }

  if (
    scholarship.degreeLevels.some((level) =>
      level.toLowerCase().includes(profile.targetLevel.toLowerCase())
    )
  ) {
    score += 15;
    reasons.push(`${profile.targetLevel} level`);
  }

  const fieldMatch = scholarship.fields.some((field) =>
    profile.fieldInterests.some(
      (interest) =>
        field.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(field.toLowerCase())
    )
  );
  if (fieldMatch || scholarship.fields.includes("All fields")) {
    score += 15;
    reasons.push(fieldMatch ? "Field match" : "Open field");
  }

  if (
    scholarship.countries.some((country) =>
      profile.studyCountries.some(
        (target) =>
          country.toLowerCase().includes(target.toLowerCase()) ||
          target.toLowerCase().includes(country.toLowerCase())
      )
    )
  ) {
    score += 8;
    reasons.push("Study country match");
  }

  if (missingDocuments.length === 0) {
    score += 7;
    reasons.push("Documents ready");
  } else if (missingDocuments.length <= 2) {
    score += 3;
  }

  const deadline = deadlineMeta(scholarship);
  if (deadline.tone === "urgent") score += 2;
  if (deadline.tone === "expired") score -= 25;

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons,
    missingDocuments,
    urgency: deadline
  };
}

function deadlineMeta(scholarship) {
  const raw = scholarship.deadlineDate || scholarship.deadline;
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) {
    return {
      tone: "unknown",
      label: scholarship.deadline || "Check portal",
      days: null
    };
  }

  const days = Math.ceil((parsed - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { tone: "expired", label: "Expired", days };
  if (days <= 21) return { tone: "urgent", label: `${days} days left`, days };
  if (days <= 60) return { tone: "soon", label: `${days} days left`, days };
  return { tone: "calm", label: `${days} days left`, days };
}

function scholarshipWithApplication(db, user, scholarship) {
  const application =
    db.applications.find(
      (item) => item.userId === user.id && item.scholarshipId === scholarship.id
    ) || defaultApplication(user.id, scholarship.id);

  return {
    ...scholarship,
    match: calculateMatch(user, scholarship, userDocuments(db, user.id)),
    application: {
      applied: Boolean(application.applied),
      status: application.status || "Not started",
      priority: application.priority || "Normal",
      notes: application.notes || "",
      updatedAt: application.updatedAt
    }
  };
}

function buildStats(rows) {
  const applied = rows.filter((row) => row.application.applied).length;
  const drafting = rows.filter((row) => row.application.status === "Drafting").length;
  const urgent = rows.filter((row) => row.match.urgency.tone === "urgent").length;
  const strongMatches = rows.filter((row) => row.match.score >= 75).length;

  return {
    total: rows.length,
    applied,
    drafting,
    notApplied: rows.length - applied,
    urgent,
    strongMatches
  };
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    country: user.country,
    plan: user.plan,
    planName: user.planName,
    planStatus: user.planStatus,
    is_paid: Boolean(user.is_paid),
    paid_at: user.paid_at || null,
    profile: user.profile,
    createdAt: user.createdAt
  };
}

async function createSessionForUser(db, userId, res) {
  const token = crypto.randomBytes(48).toString("hex");
  db.sessions.push({
    token,
    userId,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + sessionMs).toISOString()
  });
  setSession(res, token);
  await saveDb(db);
}

async function ensureSupabaseUser(db, authUser) {
  let user = db.users.find((item) => item.id === authUser.id);
  if (!user) {
    user = normalizeUser({
      id: authUser.id,
      name:
        authUser.user_metadata?.name ||
        authUser.email?.split("@")[0] ||
        "Scholar",
      email: authUser.email,
      country: authUser.user_metadata?.country || "Kenya",
      plan: "free",
      planName: "Explorer",
      planStatus: "free",
      profile: defaultProfile(authUser.user_metadata?.country || "Kenya"),
      createdAt: nowIso()
    });
    db.users.push(user);
    await saveDb(db);
  }
  return normalizeUser(user);
}

async function getAuthContext(req) {
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const db = await loadDb();

  if (bearer && supabase) {
    const { data, error } = await supabase.auth.getUser(bearer);
    if (!error && data.user) {
      const user = await ensureSupabaseUser(db, data.user);
      return { db, user, session: { provider: "supabase" } };
    }
  }

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[sessionCookie];
  if (!token) return null;

  const session = db.sessions.find((item) => item.token === token);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    db.sessions = db.sessions.filter((item) => item.token !== token);
    await saveDb(db);
    return null;
  }

  const user = db.users.find((item) => item.id === session.userId);
  if (!user) return null;

  return { db, session, user: normalizeUser(user) };
}

async function requireAuth(req, res, next) {
  try {
    const context = await getAuthContext(req);
    if (!context) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    req.db = context.db;
    req.user = context.user;
    req.session = context.session;
    next();
  } catch (error) {
    next(error);
  }
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "Techsari — Zawadi",
    supabaseConfigured: Boolean(supabase),
    paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY)
  });
});

app.get("/api/config", (_req, res) => {
  res.json({
    supabase: {
      configured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
      url: process.env.VITE_SUPABASE_URL || "",
      anonKey: process.env.VITE_SUPABASE_ANON_KEY || ""
    },
    paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
    countries: africanCountries,
    pricingPlans
  });
});

app.get("/api/me", async (req, res, next) => {
  try {
    const context = await getAuthContext(req);
    res.json({ user: context ? serializeUser(context.user) : null });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const name = text(req.body.name);
    const email = text(req.body.email).toLowerCase();
    const password = text(req.body.password);
    const country = text(req.body.country, "Kenya");

    if (!name || !email || password.length < 8) {
      res
        .status(400)
        .json({ error: "Name, email and an 8+ character password are required" });
      return;
    }

    const db = await loadDb();
    if (db.users.some((user) => user.email === email)) {
      res.status(409).json({ error: "An account with that email already exists" });
      return;
    }

    const user = normalizeUser({
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash: createPasswordHash(password),
      country,
      plan: "free",
      planName: "Explorer",
      planStatus: "free",
      profile: defaultProfile(country),
      createdAt: nowIso()
    });

    db.users.push(user);
    await createSessionForUser(db, user.id, res);
    res.status(201).json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = text(req.body.email).toLowerCase();
    const password = text(req.body.password);
    const db = await loadDb();
    const user = db.users.find((item) => item.email === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Email or password is incorrect" });
      return;
    }

    db.sessions = db.sessions.filter((session) => session.userId !== user.id);
    await createSessionForUser(db, user.id, res);
    res.json({ user: serializeUser(normalizeUser(user)) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[sessionCookie];
    const db = await loadDb();
    db.sessions = db.sessions.filter((session) => session.token !== token);
    await saveDb(db);
    clearSession(res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// --- Password Reset ---

// Request password reset
app.post("/api/auth/forgot-password", async (req, res, next) => {
  try {
    const email = text(req.body.email).toLowerCase();
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const db = await loadDb();
    const user = db.users.find((u) => u.email === email);

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ ok: true, message: "If that email exists, a reset link has been sent." });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    if (!db.passwordResets) db.passwordResets = [];
    db.passwordResets.push({
      id: crypto.randomUUID(),
      userId: user.id,
      token: resetToken,
      expiresAt,
      used: false,
      createdAt: nowIso()
    });

    await saveDb(db);

    // In production, send email. For dev, return the token.
    res.json({
      ok: true,
      message: "Password reset link generated.",
      devToken: process.env.NODE_ENV === "production" ? undefined : resetToken,
      devResetUrl: process.env.NODE_ENV === "production" ? undefined :
        `http://localhost:${port}/reset-password?token=${resetToken}`
    });
  } catch (error) {
    next(error);
  }
});

// Reset password with token
app.post("/api/auth/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: "Token and a password of 8+ characters are required" });
      return;
    }

    const db = await loadDb();
    if (!db.passwordResets) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const reset = db.passwordResets.find(
      (r) => r.token === token && !r.used && new Date(r.expiresAt) > new Date()
    );

    if (!reset) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const user = db.users.find((u) => u.id === reset.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    user.passwordHash = createPasswordHash(newPassword);
    reset.used = true;

    // Invalidate all sessions for security
    db.sessions = db.sessions.filter((s) => s.userId !== user.id);

    await saveDb(db);

    res.json({ ok: true, message: "Password reset successfully. Please log in with your new password." });
  } catch (error) {
    next(error);
  }
});

// Change password (authenticated)
app.post("/api/auth/change-password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: "Current password and a new password of 8+ characters are required" });
      return;
    }

    if (!verifyPassword(currentPassword, req.user.passwordHash)) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const user = req.db.users.find((u) => u.id === req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    user.passwordHash = createPasswordHash(newPassword);

    // Invalidate other sessions (keep current)
    req.db.sessions = req.db.sessions.filter(
      (s) => s.userId !== req.user.id || s.token === req.session?.token
    );

    await saveDb(req.db);
    res.json({ ok: true, message: "Password changed successfully." });
  } catch (error) {
    next(error);
  }
});

// Get active sessions
app.get("/api/auth/sessions", requireAuth, (req, res) => {
  const userSessions = req.db.sessions
    .filter((s) => s.userId === req.user.id)
    .map((s) => ({
      id: s.id || s.token.slice(0, 8),
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.token === (req.session?.token || ""),
      ip: s.ip || "Unknown",
      userAgent: s.userAgent || "Unknown"
    }));

  res.json({ sessions: userSessions, total: userSessions.length });
});

// Logout all sessions except current
app.post("/api/auth/logout-all", requireAuth, async (req, res, next) => {
  try {
    const currentToken = req.session?.token || "";
    req.db.sessions = req.db.sessions.filter(
      (s) => s.userId !== req.user.id || s.token === currentToken
    );
    await saveDb(req.db);
    res.json({ ok: true, message: "All other sessions have been logged out." });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/profile", requireAuth, async (req, res, next) => {
  try {
    const user = req.db.users.find((item) => item.id === req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    user.country = text(req.body.country, user.country);
    user.profile = {
      ...user.profile,
      country: user.country,
      targetLevel: text(req.body.targetLevel, user.profile.targetLevel),
      fieldInterests: list(req.body.fieldInterests || user.profile.fieldInterests),
      studyCountries: list(req.body.studyCountries || user.profile.studyCountries),
      accessibilityNeeds: list(
        req.body.accessibilityNeeds || user.profile.accessibilityNeeds
      )
    };

    await saveDb(req.db);
    res.json({ user: serializeUser(normalizeUser(user)) });
  } catch (error) {
    next(error);
  }
});

// --- Scholarship Ingestion (Zawadi Bot) ---
// Mounted before other /api/scholarships routes to avoid conflicts
app.use("/api/scholarships", scholarshipIngestionRouter);

app.get("/api/scholarships", requireAuth, (req, res) => {
  // Admins see all scholarships; regular users only see verified (published) ones
  const visibleScholarships = isAdmin(req)
    ? req.db.scholarships
    : req.db.scholarships.filter((s) => s.verifiedAt);

  const rows = visibleScholarships
    .map((row) => scholarshipWithApplication(req.db, req.user, row))
    .sort((a, b) => b.match.score - a.match.score || new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json({
    scholarships: rows,
    stats: buildStats(rows),
    countries: africanCountries,
    documents: userDocuments(req.db, req.user.id)
  });
});

app.post("/api/scholarships", requireAuth, async (req, res, next) => {
  try {
    const scholarship = sanitizeScholarship(req.body, req.user.id);
    req.db.scholarships.unshift(scholarship);
    req.db.notifications.unshift({
      id: crypto.randomUUID(),
      type: "new_scholarship",
      scholarshipId: scholarship.id,
      title: scholarship.name,
      createdAt: nowIso()
    });
    await saveDb(req.db);
    res.status(201).json({
      scholarship: scholarshipWithApplication(req.db, req.user, scholarship)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/scholarships/bulk", requireAuth, async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body.scholarships) ? req.body.scholarships : [];
    if (!rows.length) {
      res.status(400).json({ error: "No scholarships were provided" });
      return;
    }

    // Dedup: collect existing (name, host) pairs
    const existingPairs = new Set(
      req.db.scholarships.map(s =>
        `${s.name.toLowerCase().trim()}::${s.host.toLowerCase().trim()}`
      )
    );

    const incoming = [];
    const skipped = [];
    for (const row of rows.slice(0, 150)) {
      const scholarship = sanitizeScholarship(
        { ...row, source: row.source || req.body.source },
        req.user.id
      );
      const pairKey = `${scholarship.name.toLowerCase().trim()}::${scholarship.host.toLowerCase().trim()}`;
      if (existingPairs.has(pairKey)) {
        skipped.push(scholarship.name);
        continue;
      }
      existingPairs.add(pairKey);
      incoming.push(scholarship);
    }

    if (!incoming.length) {
      res.status(200).json({
        scholarships: [],
        skipped: skipped.length,
        message: skipped.length ? `${skipped.length} duplicate(s) skipped` : "No new scholarships"
      });
      return;
    }

    req.db.scholarships = [...incoming, ...req.db.scholarships];
    incoming.forEach((scholarship) => {
      req.db.notifications.unshift({
        id: crypto.randomUUID(),
        type: "new_scholarship",
        scholarshipId: scholarship.id,
        title: scholarship.name,
        createdAt: nowIso()
      });
    });
    await saveDb(req.db);

    res.status(201).json({
      scholarships: incoming.map((row) =>
        scholarshipWithApplication(req.db, req.user, row)
      ),
      added: incoming.length,
      skipped: skipped.length
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/scholarships/:id", requireAuth, async (req, res, next) => {
  try {
    const index = req.db.scholarships.findIndex((row) => row.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Scholarship not found" });
      return;
    }

    const updated = {
      ...sanitizeScholarship({ ...req.db.scholarships[index], ...req.body }, req.user.id),
      id: req.db.scholarships[index].id,
      createdAt: req.db.scholarships[index].createdAt,
      createdBy: req.db.scholarships[index].createdBy,
      updatedAt: nowIso()
    };

    req.db.scholarships[index] = updated;
    await saveDb(req.db);
    res.json({ scholarship: scholarshipWithApplication(req.db, req.user, updated) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/scholarships/:id", requireAuth, async (req, res, next) => {
  try {
    const before = req.db.scholarships.length;
    req.db.scholarships = req.db.scholarships.filter((row) => row.id !== req.params.id);
    req.db.applications = req.db.applications.filter(
      (row) => row.scholarshipId !== req.params.id
    );
    if (before === req.db.scholarships.length) {
      res.status(404).json({ error: "Scholarship not found" });
      return;
    }
    await saveDb(req.db);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/applications/:scholarshipId", requireAuth, async (req, res, next) => {
  try {
    const scholarship = req.db.scholarships.find(
      (row) => row.id === req.params.scholarshipId
    );
    if (!scholarship) {
      res.status(404).json({ error: "Scholarship not found" });
      return;
    }

    const applicationId = `${req.user.id}:${scholarship.id}`;
    let application = req.db.applications.find((row) => row.id === applicationId);

    if (!application) {
      application = defaultApplication(req.user.id, scholarship.id);
      req.db.applications.push(application);
    }

    if (req.body.applied !== undefined) application.applied = Boolean(req.body.applied);
    if (req.body.status !== undefined) application.status = text(req.body.status);
    if (req.body.priority !== undefined) application.priority = text(req.body.priority);
    if (req.body.notes !== undefined) application.notes = text(req.body.notes);
    if (req.body.applied === false) {
      application.applied = false;
      if (application.status === "Applied") application.status = "Not started";
    }
    if (req.body.applied === true && application.status === "Not started") {
      application.status = "Applied";
    }
    if (application.status === "Applied") {
      application.applied = true;
    }
    application.updatedAt = nowIso();

    await saveDb(req.db);
    res.json({ scholarship: scholarshipWithApplication(req.db, req.user, scholarship) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/documents", requireAuth, (req, res) => {
  res.json({ documents: userDocuments(req.db, req.user.id) });
});

app.post("/api/documents", requireAuth, async (req, res, next) => {
  try {
    const doc = {
      id: crypto.randomUUID(),
      userId: req.user.id,
      type: text(req.body.type, "Other"),
      name: text(req.body.name || req.body.fileName, "Document"),
      fileName: text(req.body.fileName || req.body.name, "document"),
      size: Number(req.body.size || 0),
      mimeType: text(req.body.mimeType, ""),
      storagePath: text(req.body.storagePath, ""),
      source: text(req.body.source, "Local metadata"),
      uploadedAt: nowIso()
    };

    req.db.documents.unshift(doc);
    await saveDb(req.db);
    res.status(201).json({ document: doc });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/documents/:id", requireAuth, async (req, res, next) => {
  try {
    req.db.documents = req.db.documents.filter(
      (doc) => !(doc.id === req.params.id && doc.userId === req.user.id)
    );
    await saveDb(req.db);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/updates", requireAuth, (req, res) => {
  const latest = req.db.notifications[0] || null;
  res.json({
    latest,
    count: req.db.notifications.length,
    recent: req.db.notifications.slice(0, 5)
  });
});

// --- Enhanced Billing & Subscription ---

app.get("/api/pricing", (_req, res) => {
  res.json({ plans: Object.values(PLANS) });
});

// Get full billing dashboard
app.get("/api/billing", requireAuth, (req, res) => {
  const summary = getBillingSummary(req.db, req.user.id);
  res.json(summary);
});

// Get payment history
app.get("/api/billing/history", requireAuth, (req, res) => {
  const history = getPaymentHistory(req.db, req.user.id);
  res.json(history);
});

// Get invoice for a payment
app.get("/api/billing/invoice/:paymentId", requireAuth, (req, res) => {
  const invoice = generateInvoice(req.db, req.user.id, req.params.paymentId);
  if (!invoice) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  res.json(invoice);
});

// Start free trial
app.post("/api/billing/trial", requireAuth, async (req, res, next) => {
  try {
    if (req.user.plan !== "free") {
      res.status(400).json({ error: "Trial is only available for free plan users" });
      return;
    }
    startTrial(req.user);
    await saveDb(req.db);
    res.json({
      success: true,
      plan: req.user.planName,
      daysLeft: trialsDaysLeft(req.user),
      endsAt: req.user.trialEndsAt
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/billing/checkout", requireAuth, async (req, res, next) => {
  try {
    const planId = text(req.body.planId, "plus");
    const interval = text(req.body.interval, "monthly");
    const plan = PLANS[planId];
    if (!plan || plan.id === "free") {
      res.status(400).json({ error: "Choose a paid plan" });
      return;
    }

    const amountKes = interval === "annual" ? plan.annualKes : plan.monthlyKes;
    const reference = `zawadi-${planId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const planCode = process.env[
      `PAYSTACK_${planId.toUpperCase()}_${interval.toUpperCase()}_PLAN_CODE`
    ];

    if (!process.env.PAYSTACK_SECRET_KEY) {
      res.status(503).json({ error: "Payment processing is not configured. Please try again later." });
      return;
    }

    const body = {
      email: req.user.email,
      amount: String(amountKes * 100),
      currency: "KES",
      reference,
      callback_url: process.env.PAYSTACK_CALLBACK_URL || `http://localhost:${port}`,
      metadata: {
        userId: req.user.id,
        planId,
        interval
      }
    };
    if (planCode) body.plan = planCode;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok || !payload.status) {
      res.status(502).json({ error: payload.message || "Paystack checkout failed" });
      return;
    }

    res.json({
      authorizationUrl: payload.data.authorization_url,
      reference: payload.data.reference,
      plan
    });
  } catch (error) {
    next(error);
  }
});

// Cancel subscription
app.post("/api/billing/cancel", requireAuth, async (req, res, next) => {
  try {
    const result = cancelSubscription(req.db, req.user);
    if (result.error) {
      res.status(400).json(result);
      return;
    }
    await saveDb(req.db);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Change plan (upgrade/downgrade)
app.post("/api/billing/change-plan", requireAuth, async (req, res, next) => {
  try {
    const newPlanId = text(req.body.planId);
    if (!newPlanId || !PLANS[newPlanId]) {
      res.status(400).json({ error: "Invalid plan" });
      return;
    }
    const result = changePlan(req.db, req.user, newPlanId);
    if (result.error) {
      res.status(400).json(result);
      return;
    }
    await saveDb(req.db);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get usage stats
app.get("/api/billing/usage", requireAuth, (req, res) => {
  const usage = getUserUsage(req.db, req.user.id);
  const plan = PLANS[req.user.plan] || PLANS.free;

  res.json({
    monthly: usage.monthly,
    daily: usage.daily,
    limits: plan.limits,
    plan: plan.name
  });
});

// ============================================================
// Paystack Payment Integration — New Routes
// ============================================================

// POST /api/payment/initiate — Create Paystack payment link (KES amounts, userId in metadata)
app.post("/api/payment/initiate", requireAuth, async (req, res, next) => {
  try {
    const planId = text(req.body.planId, "season_pass");
    const upgradePlan = UPGRADE_PLANS[planId];
    const legacyPlan = PLANS[planId];

    if (!upgradePlan && !legacyPlan) {
      res.status(400).json({ error: "Invalid plan. Choose season_pass or premium." });
      return;
    }

    const amountKes = upgradePlan ? upgradePlan.priceKes : legacyPlan.monthlyKes;

    // If user already on this plan and is_paid, no need to repay
    if (req.user.plan === planId && req.user.is_paid) {
      res.json({
        alreadyPaid: true,
        plan: upgradePlan || legacyPlan,
        message: "You already have access to this plan."
      });
      return;
    }

    const result = await initiatePayment(req.user, planId, req.user.email, amountKes);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/payment/verify/:reference — Check payment status
app.get("/api/payment/verify/:reference", requireAuth, async (req, res, next) => {
  try {
    const result = await verifyPayment(req.params.reference);

    // If payment was successful and user not yet marked, mark them
    if (result.status && result.data?.status === "success" && result.data?.metadata?.userId === req.user.id) {
      const metadata = result.data.metadata;
      if (!req.user.is_paid) {
        req.user.plan = metadata.planId || req.user.plan;
        req.user.planName = PLANS[metadata.planId]?.name || metadata.planId;
        req.user.is_paid = true;
        req.user.paid_at = result.data.paidAt || nowIso();
        req.user.planStatus = "active";
        await saveDb(req.db);
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/webhook/paystack — Verify signature, update user plan on charge.success
app.post(
  "/api/webhook/paystack",
  express.raw({ type: "application/json" }),
  async (req, res, next) => {
    try {
      const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
      if (!secret) {
        res.status(204).send();
        return;
      }

      const signature = req.headers["x-paystack-signature"] || "";

      if (!verifyWebhookSignature(req.body, signature, secret)) {
        res.status(401).json({ error: "Invalid Paystack signature" });
        return;
      }

      const event = JSON.parse(req.body.toString("utf8"));
      const db = await loadDb();
      const result = processWebhookEvent(event, db);

      if (result.success) {
        await saveDb(db);
      }

      res.status(200).json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

// --- Upgrade Plans Endpoint (for UpgradeModal) ---
app.get("/api/payment/plans", (_req, res) => {
  const plans = [
    {
      id: "free",
      name: "Explorer",
      priceKes: 0,
      badge: "Free",
      description: "Scholarship discovery and basic application tracking.",
      features: [
        "Open scholarship database",
        "Basic country, level and field filters",
        "1 AI essay generation",
        "Track up to 3 applications",
        "Weekly in-app updates"
      ]
    },
    ...Object.values(UPGRADE_PLANS)
  ];
  res.json({ plans });
});

// ============================================================
// NEW ROUTES — AI-Powered Features
// ============================================================

// --- Document Intelligence ---

// Analyze a single document to detect its type
app.post("/api/documents/analyze", requireAuth, async (req, res, next) => {
  try {
    const { fileName, mimeType, contentText, fileSize } = req.body;
    const result = await detectDocumentType({ fileName, mimeType, contentText, fileSize });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Batch analyze user's documents
app.post("/api/documents/analyze-batch", requireAuth, async (req, res, next) => {
  try {
    const docs = userDocuments(req.db, req.user.id);
    const results = await analyzeDocumentSet(docs);

    // Update documents with detected types
    for (const result of results) {
      const doc = req.db.documents.find((d) => d.id === result.documentId);
      if (doc) {
        doc.detectedType = result.detectedType;
        doc.confidence = result.confidence;
        doc.extractedData = result.extractedData || {};
        doc.analyzedAt = result.timestamp;
      }
    }
    await saveDb(req.db);

    // Record learning event
    recordEvent(req.db, {
      userId: req.user.id,
      type: EVENT_TYPES.DOCUMENT_ANALYZED,
      data: { count: results.length },
      metadata: { userCountry: req.user.country, plan: req.user.plan }
    });
    await saveDb(req.db);

    res.json({ results, updated: true });
  } catch (error) {
    next(error);
  }
});

// Get document gap analysis for a specific scholarship
app.get("/api/documents/gap/:scholarshipId", requireAuth, (req, res) => {
  const scholarship = req.db.scholarships.find((s) => s.id === req.params.scholarshipId);
  if (!scholarship) {
    res.status(404).json({ error: "Scholarship not found" });
    return;
  }

  const userDocs = userDocuments(req.db, req.user.id);
  const gap = checkDocumentGap(userDocs, scholarship.requiredDocuments);

  res.json({
    scholarshipName: scholarship.name,
    requiredDocuments: scholarship.requiredDocuments,
    ...gap
  });
});

// --- Auto-Apply Engine ---

// Run auto-apply for a single scholarship
app.post("/api/apply/:scholarshipId", requireAuth, async (req, res, next) => {
  try {
    const scholarship = req.db.scholarships.find((s) => s.id === req.params.scholarshipId);
    if (!scholarship) {
      res.status(404).json({ error: "Scholarship not found" });
      return;
    }

    const userDocs = userDocuments(req.db, req.user.id);
    const result = await autoApply({
      user: req.user,
      profile: req.user.profile,
      scholarship,
      documents: userDocs
    });

    // Save the application draft
    const existingIndex = req.db.applications.findIndex(
      (a) => a.id === `${req.user.id}:${scholarship.id}`
    );

    const application = {
      ...result.application,
      id: `${req.user.id}:${scholarship.id}`,
      draft: result.application.draft,
      gaps: result.application.gaps,
      status: result.canProceed ? "Ready" : "Drafting",
      applied: false,
      updatedAt: nowIso()
    };

    if (existingIndex >= 0) {
      req.db.applications[existingIndex] = {
        ...req.db.applications[existingIndex],
        ...application
      };
    } else {
      req.db.applications.push({
        ...defaultApplication(req.user.id, scholarship.id),
        ...application
      });
    }

    // Save alerts
    if (result.alerts.length > 0) {
      if (!req.db.alerts) req.db.alerts = [];
      for (const alert of result.alerts) {
        const alreadyExists = req.db.alerts.some((a) =>
          a.userId === alert.userId && a.field === alert.field && a.scholarshipName === alert.scholarshipName
        );
        if (!alreadyExists) {
          req.db.alerts.push(alert);
        }
      }

      // Record learning event for gaps
      for (const gap of result.application.gaps?.issues || []) {
        recordEvent(req.db, {
          userId: req.user.id,
          type: EVENT_TYPES.DOCUMENT_GAP_DETECTED,
          scholarshipId: scholarship.id,
          data: { document: gap.label, field: gap.field, severity: gap.severity },
          metadata: { userCountry: req.user.country, plan: req.user.plan }
        });
      }
    }

    if (result.canProceed) {
      recordEvent(req.db, {
        userId: req.user.id,
        type: EVENT_TYPES.APPLICATION_READY,
        scholarshipId: scholarship.id,
        data: { filledFields: result.filledFields }
      });
    } else {
      recordEvent(req.db, {
        userId: req.user.id,
        type: EVENT_TYPES.APPLICATION_DRAFTED,
        scholarshipId: scholarship.id,
        data: { missingFields: result.missingFields }
      });
    }

    await saveDb(req.db);

    res.json({
      ...result,
      scholarship: scholarshipWithApplication(req.db, req.user, scholarship)
    });
  } catch (error) {
    next(error);
  }
});

// Batch auto-apply to multiple scholarships
app.post("/api/apply/batch", requireAuth, async (req, res, next) => {
  try {
    const scholarshipIds = req.body.scholarshipIds || [];
    const scholarships = req.db.scholarships.filter((s) => scholarshipIds.includes(s.id));

    if (!scholarships.length) {
      res.status(400).json({ error: "No matching scholarships found" });
      return;
    }

    const userDocs = userDocuments(req.db, req.user.id);
    const batchResult = await batchAutoApply({
      user: req.user,
      profile: req.user.profile,
      scholarships,
      documents: userDocs
    });

    // Save all application drafts
    for (const result of batchResult.results) {
      const scholarship = scholarships.find((s) => s.id === result.application.scholarshipId);
      if (!scholarship) continue;

      const appId = `${req.user.id}:${result.application.scholarshipId}`;
      const existing = req.db.applications.findIndex((a) => a.id === appId);

      const app = {
        id: appId,
        userId: req.user.id,
        scholarshipId: result.application.scholarshipId,
        draft: result.application.draft,
        gaps: result.application.gaps,
        status: result.canProceed ? "Ready" : "Drafting",
        applied: false,
        updatedAt: nowIso()
      };

      if (existing >= 0) {
        req.db.applications[existing] = { ...req.db.applications[existing], ...app };
      } else {
        req.db.applications.push(app);
      }
    }

    await saveDb(req.db);

    res.json(batchResult);
  } catch (error) {
    next(error);
  }
});

// Get all user alerts
app.get("/api/alerts", requireAuth, (req, res) => {
  const alerts = (req.db.alerts || []).filter(
    (a) => a.userId === req.user.id && !a.acknowledged
  );
  res.json({ alerts, count: alerts.length });
});

// Acknowledge an alert
app.patch("/api/alerts/:id/acknowledge", requireAuth, async (req, res, next) => {
  try {
    const alert = (req.db.alerts || []).find(
      (a) => a.id === req.params.id && a.userId === req.user.id
    );
    if (!alert) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }
    alert.acknowledged = true;
    alert.acknowledgedAt = nowIso();
    await saveDb(req.db);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// --- Essay Generator ---

// Get available essay types
app.get("/api/essays/types", requireAuth, (_req, res) => {
  res.json({ types: ESSAY_TYPES });
});

// Generate a 3-stage essay
app.post("/api/essays/generate", requireAuth, async (req, res, next) => {
  try {
    const {
      essayType = "personal_statement",
      scholarshipId,
      prompt = "",
      maxWords = 1000
    } = req.body;

    // Collect user's essay samples
    const userDocs = userDocuments(req.db, req.user.id);
    const essaySamples = userDocs.filter(
      (d) => ["essay", "statement_of_purpose", "motivation_letter", "personal_statement"]
        .includes(d.detectedType || d.type?.toLowerCase())
    );

    // Also check dedicated essay samples collection
    if (req.db.essaySamples) {
      const userSamples = req.db.essaySamples.filter(
        (s) => s.userId === req.user.id
      );
      for (const sample of userSamples) {
        if (!essaySamples.some((e) => e.id === sample.id)) {
          essaySamples.push(sample);
        }
      }
    }

    if (essaySamples.length < 1) {
      res.status(400).json({
        error: true,
        message: "You need at least 1 writing sample. Please upload essays or personal statements you've written before so I can learn your voice.",
        samplesNeeded: 1
      });
      return;
    }

    // Get scholarship details if specified
    const scholarship = scholarshipId
      ? req.db.scholarships.find((s) => s.id === scholarshipId) || null
      : null;

    // Get user's learned preferences
    const preferences = getUserPreferences(req.db, req.user.id);
    const preferenceGuidance = buildPreferenceGuidance(preferences);

    const result = await generateEssay({
      essayType,
      userProfile: {
        name: req.user.name,
        country: req.user.country,
        targetLevel: req.user.profile?.targetLevel,
        fieldInterests: req.user.profile?.fieldInterests,
        studyCountries: req.user.profile?.studyCountries
      },
      scholarship,
      samples: essaySamples,
      prompt,
      maxWords,
      preferenceGuidance
    });

    // Include preferences in result
    result.preferencesUsed = Boolean(preferenceGuidance);
    result.totalEditsLearned = preferences?.totalEdits || 0;

    // Record learning event
    recordEvent(req.db, {
      userId: req.user.id,
      type: EVENT_TYPES.ESSAY_GENERATED,
      scholarshipId: scholarshipId || null,
      data: { essayType, wordCount: result.wordCount, samplesUsed: result.samplesUsed },
      metadata: { userCountry: req.user.country, plan: req.user.plan }
    });
    await saveDb(req.db);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Upload an essay sample for voice learning
app.post("/api/essays/samples", requireAuth, async (req, res, next) => {
  try {
    const { content, title, type } = req.body;
    if (!content || content.length < 50) {
      res.status(400).json({ error: "Sample too short. Please provide at least 50 characters." });
      return;
    }

    if (!req.db.essaySamples) req.db.essaySamples = [];

    const sample = {
      id: crypto.randomUUID(),
      userId: req.user.id,
      title: title || "Writing Sample",
      type: type || "essay",
      content,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      uploadedAt: nowIso()
    };

    req.db.essaySamples.push(sample);
    await saveDb(req.db);

    res.status(201).json({ sample, totalSamples: req.db.essaySamples.filter((s) => s.userId === req.user.id).length });
  } catch (error) {
    next(error);
  }
});

// Get user's essay samples
app.get("/api/essays/samples", requireAuth, (req, res) => {
  const samples = (req.db.essaySamples || []).filter((s) => s.userId === req.user.id);
  res.json({ samples, count: samples.length });
});

// --- Essay Learning (Edit Tracking & Preferences) ---

// Save an edited essay with feedback
app.post("/api/essays/edit", requireAuth, async (req, res, next) => {
  try {
    const { essayId, essayType, originalText, editedText, feedback, rating, scholarshipId } = req.body;

    if (!essayId || !originalText || !editedText) {
      res.status(400).json({ error: "essayId, originalText, and editedText are required" });
      return;
    }

    const edit = recordEdit(req.db, {
      userId: req.user.id,
      essayId,
      essayType: essayType || "personal_statement",
      originalText,
      editedText,
      feedback: feedback || "",
      rating: rating || null,
      scholarshipId: scholarshipId || null
    });

    // Record learning events
    recordEvent(req.db, {
      userId: req.user.id,
      type: EVENT_TYPES.ESSAY_EDITED,
      scholarshipId: scholarshipId || null,
      data: {
        essayType,
        changesDetected: edit.changes?.length || 0,
        hasFeedback: Boolean(feedback),
        hasRating: rating !== null
      },
      metadata: { userCountry: req.user.country, plan: req.user.plan }
    });

    await saveDb(req.db);

    res.json({
      edit,
      preferencesUpdated: true,
      message: "Edit recorded. Your preferences have been updated for future essays."
    });
  } catch (error) {
    next(error);
  }
});

// Get edit history and learned preferences
app.get("/api/essays/history", requireAuth, (req, res) => {
  const summary = getEditHistorySummary(req.db, req.user.id);
  const preferences = getUserPreferences(req.db, req.user.id);

  res.json({
    ...summary,
    preferences,
    preferenceGuidance: buildPreferenceGuidance(preferences)
  });
});

// Get user's writing preferences only
app.get("/api/essays/preferences", requireAuth, (req, res) => {
  const preferences = getUserPreferences(req.db, req.user.id);

  res.json({
    preferences,
    totalEdits: preferences.totalEdits || 0,
    averageRating: preferences.averageRating,
    preferredLength: preferences.preferredLength,
    preferredTone: preferences.preferredTone,
    guidance: buildPreferenceGuidance(preferences)
  });
});

// --- Learning System ---

// Get learning insights
app.get("/api/learning/insights", requireAuth, (req, res) => {
  const userEvents = (req.db.learningLog || []).filter((e) => e.userId === req.user.id);
  const analysis = analyzeLearningData(userEvents);
  const userDocs = userDocuments(req.db, req.user.id);
  const recommendations = generateRecommendations(analysis, req.user, userDocs);

  res.json({
    analysis,
    recommendations,
    eventsTotal: userEvents.length,
    aiConfigured
  });
});

// Get learning dashboard summary
app.get("/api/learning/summary", requireAuth, (req, res) => {
  const userEvents = (req.db.learningLog || []).filter((e) => e.userId === req.user.id);
  const analysis = analyzeLearningData(userEvents);

  const alertCount = (req.db.alerts || []).filter(
    (a) => a.userId === req.user.id && !a.acknowledged
  ).length;

  const draftCount = req.db.applications.filter(
    (a) => a.userId === req.user.id && a.status === "Drafting"
  ).length;

  const readyCount = req.db.applications.filter(
    (a) => a.userId === req.user.id && a.status === "Ready"
  ).length;

  res.json({
    totalEvents: userEvents.length,
    insights: analysis.insights || [],
    stats: {
      alertCount,
      draftCount,
      readyCount,
      draftRate: analysis.applicationStats?.draftRate || 0,
      submissionRate: analysis.applicationStats?.submissionRate || 0
    },
    topDocumentGaps: analysis.topDocumentGaps || [],
    aiConfigured
  });
});

// --- Enhanced Filtering ---

// Get scholarships filtered by African-eligible only + country
app.get("/api/scholarships/filtered", requireAuth, (req, res) => {
  const africanOnly = req.query.africanOnly !== "false"; // Default: true
  const targetCountry = req.query.country || "";
  const degreeLevel = req.query.degreeLevel || "";
  const fundingType = req.query.fundingType || "";
  const field = req.query.field || "";

  let filtered = req.db.scholarships;

  // African-eligible filter
  if (africanOnly) {
    filtered = filtered.filter((s) => {
      const hasAfricanEligible =
        s.eligibleRegions?.some((r) => r.toLowerCase().includes("africa")) ||
        s.eligibleCountries?.some((c) => africanCountries.includes(c)) ||
        s.eligibleCountries?.some((c) => c.toLowerCase().includes("all african"));
      return hasAfricanEligible;
    });
  }

  // Country-specific filter (study destination)
  if (targetCountry) {
    filtered = filtered.filter((s) =>
      s.countries?.some((c) => c.toLowerCase().includes(targetCountry.toLowerCase()))
    );
  }

  // Degree level filter
  if (degreeLevel) {
    filtered = filtered.filter((s) =>
      s.degreeLevels?.some((l) => l.toLowerCase().includes(degreeLevel.toLowerCase()))
    );
  }

  // Funding type filter
  if (fundingType) {
    filtered = filtered.filter((s) =>
      (s.fundingType || "").toLowerCase().includes(fundingType.toLowerCase())
    );
  }

  // Field filter
  if (field) {
    filtered = filtered.filter((s) =>
      s.fields?.some((f) => f.toLowerCase().includes(field.toLowerCase())) ||
      s.fields?.includes("All fields") ||
      s.tags?.some((t) => t.toLowerCase().includes(field.toLowerCase()))
    );
  }

  const rows = filtered
    .map((row) => scholarshipWithApplication(req.db, req.user, row))
    .sort((a, b) => b.match.score - a.match.score);

  res.json({
    scholarships: rows,
    stats: buildStats(rows),
    filters: { africanOnly, targetCountry, degreeLevel, fundingType, field },
    countries: africanCountries,
    documents: userDocuments(req.db, req.user.id)
  });
});

// ============================================================
// Admin Authentication & User Management
// ============================================================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@zawadi.app";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || createPasswordHash("zawadi-admin-2026");
const adminSessionCookie = "zawadi_admin_session";

function isAdmin(req) {
  return req.user?.role === "admin";
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

// Admin login
app.post("/api/admin/login", async (req, res, next) => {
  try {
    const email = text(req.body.email).toLowerCase();
    const password = text(req.body.password);

    if (email !== ADMIN_EMAIL || !verifyPassword(password, ADMIN_PASSWORD_HASH)) {
      res.status(401).json({ error: "Invalid admin credentials" });
      return;
    }

    // Set admin session — reuse the same session mechanism with admin role
    const db = await loadDb();
    let adminUser = db.users.find(u => u.role === "admin");
    if (!adminUser) {
      adminUser = normalizeUser({
        id: "admin-001",
        name: "Administrator",
        email: ADMIN_EMAIL,
        country: "Kenya",
        plan: "mentor",
        planName: "Mentor Review",
        planStatus: "active",
        role: "admin",
        is_paid: true,
        createdAt: nowIso()
      });
      db.users.push(adminUser);
      await saveDb(db);
    }

    await createSessionForUser(db, adminUser.id, res);
    res.json({ user: serializeUser(adminUser) });
  } catch (error) {
    next(error);
  }
});

// Get all users (admin only)
app.get("/api/admin/users", requireAuth, requireAdmin, (req, res) => {
  const users = req.db.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    country: u.country,
    plan: u.plan,
    planName: u.planName,
    planStatus: u.planStatus,
    is_paid: Boolean(u.is_paid),
    role: u.role || "user",
    createdAt: u.createdAt,
    applicationsCount: req.db.applications.filter(a => a.userId === u.id).length,
    documentsCount: req.db.documents.filter(d => d.userId === u.id).length
  }));

  res.json({
    users,
    total: users.length,
    plans: Object.values(PLANS).map(p => ({ id: p.id, name: p.name })),
    stats: {
      totalScholarships: req.db.scholarships.length,
      totalApplications: req.db.applications.length,
      totalDocuments: req.db.documents.length
    }
  });
});

// Update user plan (admin only)
app.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const user = req.db.users.find(u => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (req.body.plan !== undefined) {
      const plan = PLANS[req.body.plan];
      if (!plan) {
        res.status(400).json({ error: "Invalid plan" });
        return;
      }
      user.plan = req.body.plan;
      user.planName = plan.name;
      user.is_paid = req.body.is_paid !== undefined ? Boolean(req.body.is_paid) : user.is_paid;
    }

    if (req.body.planStatus !== undefined) {
      user.planStatus = req.body.planStatus;
    }

    await saveDb(req.db);
    res.json({ ok: true, user: serializeUser(normalizeUser(user)) });
  } catch (error) {
    next(error);
  }
});

// Admin check — returns admin status
app.get("/api/admin/check", requireAuth, (req, res) => {
  res.json({ isAdmin: isAdmin(req) });
});

// Get all scholarships (admin view — includes unverified)
app.get("/api/admin/scholarships", requireAuth, requireAdmin, (req, res) => {
  const scholarships = req.db.scholarships.map((s) => ({
    ...s,
    isBotInjected: Boolean(s.source?.toLowerCase().includes("bot") || s.createdBy?.toLowerCase().includes("bot"))
  }));
  res.json({
    scholarships,
    stats: {
      total: scholarships.length,
      verified: scholarships.filter((s) => s.verifiedAt).length,
      unverified: scholarships.filter((s) => !s.verifiedAt).length,
      botInjected: scholarships.filter((s) => s.isBotInjected).length
    }
  });
});

// Add a scholarship (admin only)
app.post("/api/admin/scholarships", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const scholarship = sanitizeScholarship(
      {
        ...req.body,
        source: req.body.source || "Admin console",
        createdBy: req.user.id
      },
      req.user.id
    );
    req.db.scholarships.unshift(scholarship);
    req.db.notifications.unshift({
      id: crypto.randomUUID(),
      type: "new_scholarship",
      scholarshipId: scholarship.id,
      title: scholarship.name,
      createdAt: nowIso()
    });
    await saveDb(req.db);
    res.status(201).json({ scholarship });
  } catch (error) {
    next(error);
  }
});

// Update a scholarship (admin only)
app.patch("/api/admin/scholarships/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const index = req.db.scholarships.findIndex((row) => row.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Scholarship not found" });
      return;
    }

    const updated = {
      ...sanitizeScholarship({ ...req.db.scholarships[index], ...req.body }, req.user.id),
      id: req.db.scholarships[index].id,
      createdAt: req.db.scholarships[index].createdAt,
      createdBy: req.db.scholarships[index].createdBy,
      updatedAt: nowIso()
    };

    // Preserve verifiedAt unless explicitly set in request body
    if (req.body.verifiedAt !== undefined) {
      updated.verifiedAt = req.body.verifiedAt;
    } else {
      updated.verifiedAt = req.db.scholarships[index].verifiedAt;
    }

    req.db.scholarships[index] = updated;
    await saveDb(req.db);
    res.json({ scholarship: updated });
  } catch (error) {
    next(error);
  }
});

// Verify a scholarship — publishes it to the user-facing website
app.post("/api/admin/scholarships/:id/verify", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const scholarship = req.db.scholarships.find((row) => row.id === req.params.id);
    if (!scholarship) {
      res.status(404).json({ error: "Scholarship not found" });
      return;
    }
    scholarship.verifiedAt = nowIso();
    scholarship.updatedAt = nowIso();
    // Notify users about this newly published scholarship
    req.db.notifications.unshift({
      id: crypto.randomUUID(),
      type: "scholarship_verified",
      scholarshipId: scholarship.id,
      title: scholarship.name,
      createdAt: nowIso()
    });
    await saveDb(req.db);
    res.json({ ok: true, scholarship });
  } catch (error) {
    next(error);
  }
});

// Unverify a scholarship — removes it from the user-facing website
app.post("/api/admin/scholarships/:id/unverify", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const scholarship = req.db.scholarships.find((row) => row.id === req.params.id);
    if (!scholarship) {
      res.status(404).json({ error: "Scholarship not found" });
      return;
    }
    scholarship.verifiedAt = "";
    scholarship.updatedAt = nowIso();
    await saveDb(req.db);
    res.json({ ok: true, scholarship });
  } catch (error) {
    next(error);
  }
});

// Delete a scholarship (admin only)
app.delete("/api/admin/scholarships/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const before = req.db.scholarships.length;
    req.db.scholarships = req.db.scholarships.filter((row) => row.id !== req.params.id);
    if (before === req.db.scholarships.length) {
      res.status(404).json({ error: "Scholarship not found" });
      return;
    }
    req.db.applications = req.db.applications.filter((row) => row.scholarshipId !== req.params.id);
    req.db.notifications = req.db.notifications.filter((row) => row.scholarshipId !== req.params.id);
    await saveDb(req.db);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong inside Zawadi" });
});

// Serve static files: production mode, or Vercel serverless
if (isProduction || process.env.VERCEL === "1") {
  const distDir = path.join(rootDir, "dist");
  app.use(express.static(distDir));

  // Admin page at /admin
  app.get("/admin", (_req, res) => {
    res.sendFile(path.join(distDir, "admin.html"));
  });

  // SPA fallback — return index.html for all non-API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  // Local dev: use Vite dev server with HMR
  const { createServer } = await import("vite");
  const vite = await createServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: "spa"
  });

  // Admin page in dev mode
  app.get("/admin", (_req, res) => {
    res.sendFile(path.join(rootDir, "public", "admin.html"));
  });

  app.use(vite.middlewares);
}

// Only listen when run directly (not imported by Vercel)
const isMainModule = process.argv[1]?.includes("server/index.js") || process.argv[1]?.includes("server\\index.js");
if (isMainModule) {
  app.listen(port, () => {
    console.log(`Zawadi is running at http://localhost:${port}`);
  });
}

export default app;
