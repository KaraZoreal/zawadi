// ============================================================================
// Scholarship Ingestion Endpoint
// ============================================================================
// Accepts scholarship data from the Zawadi Telegram bot and upserts into
// the Supabase scholarships table. Deduplicates by (name, host) combination.
//
// POST /api/scholarships/ingest
// Headers: Authorization: Bearer <INGEST_API_KEY>
// Body: { scholarships: [...] }

import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize a value to a trimmed string, with optional fallback. */
const text = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

/**
 * Map Zawadi bot field names (UPPERCASE with underscores) to the scholarships
 * table columns. The bot output fields are:
 *   NAME, HOST, FIELD, DEGREE, FUNDING, DEADLINE,
 *   AFRICA_ELIGIBLE, AI_ML_TRACK, BARRIER, APPLY
 */
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
  };
}

/**
 * Parse a boolean from various input shapes. The Zawadi bot may emit
 * "TRUE"/"FALSE", "Yes"/"No", true/false, 1/0, or already a boolean.
 */
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
    throw new Error("Supabase is not configured (missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
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

/**
 * Expects an Authorization: Bearer <token> header whose value must match
 * process.env.INGEST_API_KEY.
 */
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

/**
 * Upsert scholarships into the Supabase `scholarships` table.
 *
 * Request body (JSON):
 *   { scholarships: [ { NAME, HOST, FIELD, DEGREE, FUNDING, DEADLINE,
 *                       AFRICA_ELIGIBLE, AI_ML_TRACK, BARRIER, APPLY }, ... ] }
 *
 * Response:
 *   { ok: true, new: number, updated: number, total: number,
 *     errors: number, details: [{ name, host, status, error? }] }
 */
async function ingestScholarships(req, res) {
  const supabase = getSupabase();

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

  // Cap batch size to prevent abuse
  const batch = scholarships.slice(0, 500).map(normalizeScholarship);

  let newCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  const details = [];

  for (const record of batch) {
    try {
      const { data, error } = await supabase
        .from("scholarships")
        .upsert(record, {
          onConflict: "name,host", // matches the UNIQUE constraint
          ignoreDuplicates: false, // update if exists
        })
        .select("id, name, host, created_at, updated_at")
        .single();

      if (error) {
        errorCount++;
        details.push({
          name: record.name,
          host: record.host,
          status: "error",
          error: error.message,
        });
        continue;
      }

      // Determine if this was an insert or update by comparing timestamps.
      // When upserted, created_at ≈ updated_at for new rows; updated_at > created_at for updates.
      const created = new Date(data.created_at).getTime();
      const updated = new Date(data.updated_at).getTime();
      const isNew = Math.abs(updated - created) < 500; // within 500ms = new insert

      if (isNew) {
        newCount++;
      } else {
        updatedCount++;
      }

      details.push({
        name: data.name,
        host: data.host,
        status: isNew ? "new" : "updated",
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

  return res.status(200).json({
    ok: true,
    new: newCount,
    updated: updatedCount,
    total: newCount + updatedCount,
    errors: errorCount,
    details,
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const router = Router();

// Apply API key auth to all routes on this router
router.use(requireIngestApiKey);

router.post("/ingest", (req, res, next) => {
  ingestScholarships(req, res).catch(next);
});

export default router;
