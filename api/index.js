// Vercel serverless entrypoint — API routes only (ESM)
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import express from "express";

const dataDir = "/tmp";
const dbPath = path.join(dataDir, "zawadi-db.json");
const sessionCookie = "zawadi_session";
const sessionMs = 1000 * 60 * 60 * 24 * 30;

// --- Helpers ---
const nowIso = () => new Date().toISOString();
const text = (v, fb = "") => (typeof v === "string" && v.trim()) ? v.trim() : fb;

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  return crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex") === hash;
}

// --- DB ---
async function loadDb() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return { users: [], sessions: [], scholarships: [], applications: [], documents: [], payments: [], auditLog: [], usageTracking: {} };
  }
}
async function saveDb(db) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

// --- Session ---
function parseCookies(h) { if (!h) return {}; return Object.fromEntries(h.split(";").map(c => c.trim().split("=").map(decodeURIComponent))); }
async function createSessionForUser(db, userId, res) {
  const token = crypto.randomBytes(48).toString("hex");
  db.sessions = db.sessions || [];
  db.sessions.push({ token, userId, createdAt: nowIso() });
  await saveDb(db);
  res.cookie(sessionCookie, token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: sessionMs, path: "/" });
}
function clearSession(res) { res.clearCookie(sessionCookie, { path: "/" }); }

function defaultProfile(country) {
  return { country: country || "Kenya", region: "Africa", targetLevel: "Masters", fieldInterests: ["Data Science", "Artificial Intelligence"], studyCountries: ["Germany", "United Kingdom", "South Africa", "Europe"], accessibilityNeeds: ["Fully funded", "No GRE", "Low document burden"] };
}
function normalizeUser(u) {
  return { ...u, plan: u.plan || "free", planName: u.planName || "Explorer", planStatus: u.planStatus || "free", role: u.role || "user", profile: u.profile || defaultProfile(u.country), is_paid: !!(u.is_paid || (u.plan && u.plan !== "free")), paid_at: u.paid_at || null };
}
function serializeUser(u) { const { passwordHash, ...safe } = u; return safe; }

// --- Express App ---
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});
app.use(express.json({ limit: "16mb" }));

// --- Health ---
app.get("/api/health", (_req, res) => res.json({ ok: true, time: nowIso() }));

// --- Config ---
app.get("/api/config", (_req, res) => {
  const supUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  res.json({
    supabase: { configured: !!(supUrl && supKey), url: supUrl || "", anonKey: supKey },
    pricingPlans: [],
    countries: ["Kenya","Nigeria","Ghana","South Africa","Ethiopia","Tanzania","Uganda","Rwanda","Egypt","Senegal","Cameroon","Zimbabwe","Zambia","Malawi","Botswana","Namibia","Mauritius","Morocco","Algeria","Tunisia","Sudan","Angola","Mozambique","DR Congo","Ivory Coast","Mali","Burkina Faso","Niger","Chad","Somalia","Liberia","Sierra Leone","Gambia","Guinea","Benin","Togo","Gabon","Burundi","Djibouti","Eritrea","Eswatini","Lesotho","Madagascar","Mauritania","Seychelles","South Sudan","Cape Verde","Comoros","Sao Tome","Central African Republic","Guinea-Bissau","Congo","Equatorial Guinea","Libya","Somaliland","Western Sahara","Mayotte","Reunion","Saint Helena"]
  });
});

// --- Auth Middleware ---
async function requireAuth(req, res, next) {
  try {
    const token = parseCookies(req.headers.cookie)[sessionCookie];
    if (!token) return res.status(401).json({ error: "Authentication required" });
    const db = await loadDb();
    const session = (db.sessions || []).find(s => s.token === token);
    if (!session) return res.status(401).json({ error: "Session expired" });
    const user = (db.users || []).find(u => u.id === session.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    req.db = db;
    next();
  } catch (err) { next(err); }
}

// --- Auth Routes ---
app.post("/api/auth/register", async (req, res) => {
  try {
    const name = text(req.body.name);
    const email = text(req.body.email).toLowerCase();
    const password = text(req.body.password);
    const country = text(req.body.country, "Kenya");
    if (!name || !email || password.length < 8) return res.status(400).json({ error: "Name, email and an 8+ character password are required" });
    const db = await loadDb();
    db.users = db.users || [];
    if (db.users.some(u => u.email === email)) return res.status(409).json({ error: "An account with that email already exists" });
    const user = normalizeUser({ id: crypto.randomUUID(), name, email, passwordHash: createPasswordHash(password), country, plan: "free", planName: "Explorer", planStatus: "free", profile: defaultProfile(country), createdAt: nowIso() });
    db.users.push(user);
    await createSessionForUser(db, user.id, res);
    return res.status(201).json({ user: serializeUser(user) });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = text(req.body.email).toLowerCase();
    const password = text(req.body.password);
    const db = await loadDb();
    db.users = db.users || [];
    const user = db.users.find(u => u.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: "Email or password is incorrect" });
    db.sessions = (db.sessions || []).filter(s => s.userId !== user.id);
    await createSessionForUser(db, user.id, res);
    return res.json({ user: serializeUser(normalizeUser(user)) });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const token = parseCookies(req.headers.cookie)[sessionCookie];
    const db = await loadDb();
    db.sessions = (db.sessions || []).filter(s => s.token !== token);
    await saveDb(db);
    clearSession(res);
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const email = text(req.body.email).toLowerCase();
    const db = await loadDb();
    db.users = db.users || [];
    const user = db.users.find(u => u.email === email);
    if (!user) return res.json({ message: "If that email is registered, a reset link has been sent." });
    const token = crypto.randomBytes(32).toString("hex");
    db.passwordResets = db.passwordResets || [];
    db.passwordResets.push({ token, userId: user.id, createdAt: nowIso(), expiresAt: new Date(Date.now() + 3600000).toISOString() });
    await saveDb(db);
    return res.json({ message: "If that email is registered, a reset link has been sent.", token });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const token = text(req.body.token);
    const newPassword = text(req.body.password || req.body.newPassword);
    if (!token || newPassword.length < 8) return res.status(400).json({ error: "Valid token and 8+ character password required" });
    const db = await loadDb();
    db.passwordResets = db.passwordResets || [];
    const reset = db.passwordResets.find(r => r.token === token && new Date(r.expiresAt) > new Date());
    if (!reset) return res.status(400).json({ error: "Invalid or expired reset token" });
    db.users = db.users || [];
    const user = db.users.find(u => u.id === reset.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.passwordHash = createPasswordHash(newPassword);
    db.sessions = (db.sessions || []).filter(s => s.userId !== user.id);
    db.passwordResets = db.passwordResets.filter(r => r.token !== token);
    await saveDb(db);
    return res.json({ message: "Password has been reset. You may now sign in." });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// --- Me ---
app.get("/api/me", async (req, res) => {
  try {
    const token = parseCookies(req.headers.cookie)[sessionCookie];
    if (!token) return res.json({ user: null });
    const db = await loadDb();
    db.sessions = db.sessions || [];
    db.users = db.users || [];
    const session = db.sessions.find(s => s.token === token);
    if (!session) return res.json({ user: null });
    const user = db.users.find(u => u.id === session.userId);
    if (!user) return res.json({ user: null });
    return res.json({ user: serializeUser(normalizeUser(user)) });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// --- Location ---
app.get("/api/location", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
    clearTimeout(t);
    const data = await resp.json();
    return res.json({ country: data.country_name || null, detected: !!data.country_name });
  } catch { return res.json({ country: null, detected: false }); }
});

// --- Error handler ---
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong", message: err.message });
});

export default app;
