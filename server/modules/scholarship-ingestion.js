// ============================================================================
// Scholarship Ingestion Endpoint
// ============================================================================
// Accepts scholarship data from the Zawadi Telegram bot and upserts into
// BOTH Supabase and the local db.json. Deduplicates by (name, host).
//
// POST /api/scholarships/ingest
// Headers: Authorization: Bearer ***
// Body: { scholarships: [...] }

import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const text = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

const nowIso = () => new Date().toISOString();

function list(value) {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean);
  return text(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueList(values) {
  const seen = new Set();
  return values
    .map((value) => text(value))
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeScholarship(input) {
  return {
    name: text(input.NAME || input.name, "Untitled scholarship"),
    host: text(input.HOST || input.host, "Verify host"),
    field: text(input.FIELD || input.field, "All fields"),
    degree: text(input.DEGREE || input.degree, "Masters"),
    funding: text(input.FUNDING || input.funding, "Verify funding"),
    deadline: text(input.DEADLINE || input.deadline, "Check portal"),
    africa_eligible: parseBool(input.AFRICA_ELIGIBLE ?? input.africa_eligible, false),
    ai_ml_track: parseBool(input.AI_ML_TRACK ?? input.ai_ml_track, false),
    barrier: text(input.BARRIER || input.barrier, ""),
    apply_url: text(input.APPLY || input.apply_url || input.apply, ""),
    categories: list(input.CATEGORIES || input.CATEGORY || input.categories || input.category),
  };
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value).trim().toLowerCase();
  if (s === "true" || s === "yes" || s === "1" || s === "y") return true;
  if (s === "false" || s === "no" || s === "0" || s === "n" || s === "") return false;
  return fallback;
}

// ---------------------------------------------------------------------------
// Local DB helpers
// ---------------------------------------------------------------------------

const DATA_DIR = process.env.VERCEL ? "/tmp" : path.resolve(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "zawadi-db.json");

async function loadLocalDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const db = JSON.parse(raw);
    db.scholarships ||= [];
    return db;
  } catch {
    return { scholarships: [] };
  }
}

async function saveLocalDb(db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

/** Convert ingested scholarship to full local-db format */
function toLocalScholarship(record, source = "Zawadi Bot") {
  const africanCountries = [
    "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cameroon",
    "Cape Verde","Central African Republic","Chad","Comoros","Congo",
    "Cote d'Ivoire","Democratic Republic of the Congo","Djibouti","Egypt",
    "Equatorial Guinea","Eritrea","Eswatini","Ethiopia","Gabon","Gambia",
    "Ghana","Guinea","Guinea-Bissau","Kenya","Lesotho","Liberia","Libya",
    "Madagascar","Malawi","Mali","Mauritania","Mauritius","Morocco",
    "Mozambique","Namibia","Niger","Nigeria","Rwanda","Sao Tome and Principe",
    "Senegal","Seychelles","Sierra Leone","Somalia","South Africa",
    "South Sudan","Sudan","Tanzania","Togo","Tunisia","Uganda","Zambia","Zimbabwe"
  ];

  const eligibleCountries = record.africa_eligible
    ? africanCountries
    : ["Verify eligibility"];

  const now = nowIso();
  const dedupKey = `${record.name.toLowerCase().trim()}::${record.host.toLowerCase().trim()}`;
  const categories = inferCategories(record);

  return {
    id: `sch-ingest-${Buffer.from(dedupKey).toString("hex").slice(0, 16)}`,
    name: record.name,
    provider: record.host,
    host: record.host,
    countries: ["Global"],
    eligibleCountries,
    eligibleRegions: record.africa_eligible ? ["Africa"] : ["Verify"],
    degreeLevels: [record.degree],
    fields: [record.field],
    schools: [record.host],
    scholarshipType: "Scholarship",
    fundingType: record.funding.toLowerCase().includes("full") ? "Fully funded" : record.funding,
    amountLabel: record.funding,
    amountMin: 0,
    amountMax: 0,
    currency: "USD",
    deadline: record.deadline,
    deadlineDate: "",
    accessibility: record.africa_eligible ? ["Africa eligible"] : [],
    requiredDocuments: ["CV", "Transcript", "Motivation Letter", "References"],
    description: record.barrier ? `Note: ${record.barrier}` : "",
    officialUrl: record.apply_url,
    source,
    tags: record.ai_ml_track ? ["ai", "ml", "tech"] : [],
    categories,
    category: categories[0] || "General",
    createdAt: now,
    updatedAt: now,
    verifiedAt: "",
    createdBy: "zawadi-bot",
    _dedupKey: dedupKey
  };
}

function inferCategories(record) {
  const haystack = [
    record.name,
    record.host,
    record.field,
    record.degree,
    record.funding,
    record.barrier,
    ...(record.categories || [])
  ].join(" ").toLowerCase();
  const categories = [...(record.categories || [])];
  const add = (label, terms) => {
    if (terms.some((term) => haystack.includes(term))) categories.push(label);
  };

  if (record.africa_eligible) categories.push("Africa eligible");
  if (record.ai_ml_track) categories.push("AI, Data & STEM");
  add("Fully funded", ["fully funded", "full tuition", "stipend"]);
  add("Partial funding", ["partial", "fee waiver", "tuition support"]);
  add("Masters", ["masters", "master", "msc", "ma ", "mba"]);
  add("Undergraduate", ["undergraduate", "bachelor"]);
  add("PhD & Research", ["phd", "doctoral", "doctorate", "research"]);
  add("Public Health & Development", ["public health", "development", "policy", "climate"]);
  add("Leadership & Business", ["leadership", "business", "entrepreneur"]);
  return uniqueList(categories).slice(0, 8);
}

// ---------------------------------------------------------------------------
// Supabase client (lazy singleton)
// ---------------------------------------------------------------------------

let _supabase = null;

function getSupabase() {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null; // Don't throw — just skip Supabase writes
  }

  _supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return _supabase;
}

// ---------------------------------------------------------------------------
// API key auth middleware
// ---------------------------------------------------------------------------

function requireIngestApiKey(req, res, next) {
  const expectedKey = process.env.INGEST_API_KEY;

  if (!expectedKey) {
    return res.status(500).json({
      error: "Server misconfigured — INGEST_API_KEY is not set.",
    });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (token !== expectedKey) {
    return res.status(401).json({ error: "Invalid or missing API key." });
  }

  next();
}

// ---------------------------------------------------------------------------
// POST /api/scholarships/ingest
// ---------------------------------------------------------------------------

async function ingestScholarships(req, res) {
  const supabase = getSupabase();
  const source = text(req.body.source, "Zawadi Bot");

  const scholarships = Array.isArray(req.body.scholarships)
    ? req.body.scholarships
    : Array.isArray(req.body)
      ? req.body
      : [];

  if (scholarships.length === 0) {
    return res.status(400).json({
      ok: false,
      error: "No scholarships provided. Send { scholarships: [...] } in the request body.",
    });
  }

  const batch = scholarships.slice(0, 500).map(normalizeScholarship);

  // --- Load local DB for dedup check ---
  const localDb = await loadLocalDb();
  const existingDedupKeys = new Set(
    localDb.scholarships
      .filter(s => s._dedupKey)
      .map(s => s._dedupKey)
  );

  // Also track by (name, host) for existing entries without _dedupKey
  const existingNameHost = new Set(
    localDb.scholarships.map(s =>
      `${s.name.toLowerCase().trim()}::${s.host.toLowerCase().trim()}`
    )
  );

  let newCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const details = [];

  for (const record of batch) {
    const localScholarship = toLocalScholarship(record, source);
    const dedupKey = localScholarship._dedupKey;
    const nameHostKey = `${record.name.toLowerCase().trim()}::${record.host.toLowerCase().trim()}`;

    // --- Dedup check ---
    if (existingDedupKeys.has(dedupKey) || existingNameHost.has(nameHostKey)) {
      skippedCount++;
      details.push({
        name: record.name,
        host: record.host,
        status: "skipped",
        reason: "Duplicate — already exists in database"
      });
      continue;
    }

    // --- Try Supabase write ---
    if (supabase) {
      try {
        let { error } = await supabase
          .from("scholarships")
          .upsert(record, {
            onConflict: "name,host",
            ignoreDuplicates: false,
          });

        if (error && /categor/i.test(error.message || "")) {
          const { categories: _categories, ...supabaseRecord } = record;
          const retry = await supabase
            .from("scholarships")
            .upsert(supabaseRecord, {
              onConflict: "name,host",
              ignoreDuplicates: false,
            });
          error = retry.error;
        }

        if (error) {
          // RLS or other Supabase error — continue to local write anyway
          console.warn(`[ingest] Supabase write skipped for "${record.name}": ${error.message}`);
        }
      } catch (err) {
        console.warn(`[ingest] Supabase error for "${record.name}": ${err.message}`);
      }
    }

    // --- Always write to local DB ---
    try {
      // Remove the _dedupKey helper field before storing
      const { _dedupKey: _, ...clean } = localScholarship;
      localDb.scholarships.unshift(clean);
      existingDedupKeys.add(dedupKey);
      existingNameHost.add(nameHostKey);
      newCount++;
      details.push({
        name: record.name,
        host: record.host,
        status: "new",
      });
    } catch (err) {
      errorCount++;
      details.push({
        name: record.name,
        host: record.host,
        status: "error",
        error: err.message,
      });
    }
  }

  // Save local DB
  if (newCount > 0) {
    await saveLocalDb(localDb);
  }

  return res.status(200).json({
    ok: true,
    new: newCount,
    updated: updatedCount,
    skipped: skippedCount,
    total: newCount + updatedCount,
    errors: errorCount,
    details,
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const router = Router();

router.post("/ingest", requireIngestApiKey, (req, res, next) => {
  ingestScholarships(req, res).catch(next);
});

export default router;
