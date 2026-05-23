import React from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  Bell,
  BellRing,
  BookOpen,
  Briefcase,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  FileUp,
  Filter,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  X
} from "lucide-react";
import "./styles.css";

// --- Techsari Zawadi AI Components ---
import EssayGenerator from "./components/EssayGenerator.jsx";
import ApplicationCenter from "./components/ApplicationCenter.jsx";
import IntelligencePanel from "./components/IntelligencePanel.jsx";
import UpgradeModal from "./components/UpgradeModal.jsx";
import LandingPage from "./components/LandingPage.jsx";

let supabaseClient = null;

const statusOptions = [
  "Not started",
  "Saved",
  "Drafting",
  "Ready",
  "Applied",
  "Interview",
  "Awarded",
  "Rejected",
  "Archived"
];

const priorityOptions = ["High", "Normal", "Low"];
const documentTypes = [
  "CV",
  "Resume",
  "Transcript",
  "Certificate",
  "Motivation Letter",
  "Statement of Purpose",
  "References",
  "Passport",
  "Financial Need Evidence",
  "Admission Letter",
  "Essay",
  "Other"
];

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  const token = await getSupabaseToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, {
    credentials: "include",
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

async function getSupabaseToken() {
  if (!supabaseClient) return "";
  const { data } = await supabaseClient.auth.getSession();
  return data.session?.access_token || "";
}

function configureSupabase(config) {
  if (!config?.supabase?.configured || supabaseClient) return;
  supabaseClient = createClient(config.supabase.url, config.supabase.anonKey);
}

function isPaid(user) {
  return user?.is_paid || (user?.plan && user.plan !== "free");
}

function planRank(planId = "free") {
  return { free: 0, plus: 1, pro: 2, mentor: 3 }[planId] ?? 0;
}

function App() {
  const [booting, setBooting] = React.useState(true);
  const [config, setConfig] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [rows, setRows] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);
  const [stats, setStats] = React.useState(emptyStats());
  const [toast, setToast] = React.useState("");
  const [showLanding, setShowLanding] = React.useState(true);
  const [authMode, setAuthMode] = React.useState("login");

  React.useEffect(() => {
    bootstrap();
  }, []);

  React.useEffect(() => {
    if (!user) return undefined;
    registerServiceWorker();
    const timer = window.setInterval(checkForUpdates, 45000);
    return () => window.clearInterval(timer);
  }, [user]);

  async function bootstrap() {
    try {
      const appConfig = await api("/api/config");
      configureSupabase(appConfig);
      setConfig(appConfig);

      if (supabaseClient) {
        const { data } = await supabaseClient.auth.getSession();
        if (data.session) {
          const me = await api("/api/me");
          if (me.user) {
            setUser(me.user);
            await loadScholarships();
            setBooting(false);
            return;
          }
        }
      }

      const me = await api("/api/me");
      if (me.user) {
        setUser(me.user);
        await loadScholarships();
      }
    } catch {
      setConfig({ supabase: { configured: false }, pricingPlans: [] });
    } finally {
      setBooting(false);
    }
  }

  async function loadScholarships() {
    const data = await api("/api/scholarships");
    setRows(data.scholarships);
    setStats(data.stats || emptyStats());
    setDocuments(data.documents || []);
  }

  async function checkForUpdates() {
    try {
      const data = await api("/api/updates");
      const lastSeen = window.localStorage.getItem("zawadi:lastNotification");
      if (data.latest && data.latest.id !== lastSeen) {
        window.localStorage.setItem("zawadi:lastNotification", data.latest.id);
        notifyUser("New scholarship update", data.latest.title);
      }
    } catch {
      // Polling is best-effort while the web app is open.
    }
  }

  function applyRows(nextRows) {
    setRows(nextRows);
    setStats(computeStats(nextRows));
  }

  function replaceRow(updated) {
    applyRows(rows.map((row) => (row.id === updated.id ? updated : row)));
  }

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(""), 2600);
  }

  async function handleLogout() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setRows([]);
    setDocuments([]);
    setStats(emptyStats());
  }

  if (booting) return <BootScreen />;

  if (!user) {
    if (showLanding) {
      return (
        <LandingPage
          onGetStarted={() => {
            setAuthMode("register");
            setShowLanding(false);
          }}
          onLogin={() => {
            setAuthMode("login");
            setShowLanding(false);
          }}
        />
      );
    }
    return (
      <AuthScreen
        config={config}
        initialMode={authMode}
        onAuthed={async (nextUser) => {
          setUser(nextUser);
          await loadScholarships();
        }}
        onBackToLanding={() => setShowLanding(true)}
      />
    );
  }

  return (
    <>
      <Portal
        config={config}
        user={user}
        rows={rows}
        documents={documents}
        stats={stats}
        onUserChanged={setUser}
        onDocumentsChanged={setDocuments}
        onLogout={handleLogout}
        onRefresh={loadScholarships}
        onReplaceRow={replaceRow}
        onRowsChanged={applyRows}
        onToast={showToast}
      />
      <Toast message={toast} />
    </>
  );
}

function emptyStats() {
  return {
    total: 0,
    applied: 0,
    drafting: 0,
    notApplied: 0,
    urgent: 0,
    strongMatches: 0
  };
}

function computeStats(rows) {
  return {
    total: rows.length,
    applied: rows.filter((row) => row.application.applied).length,
    drafting: rows.filter((row) => row.application.status === "Drafting").length,
    notApplied: rows.filter((row) => !row.application.applied).length,
    urgent: rows.filter((row) => row.match.urgency.tone === "urgent").length,
    strongMatches: rows.filter((row) => row.match.score >= 75).length
  };
}

function BootScreen() {
  return (
    <main className="boot-screen">
      <Loader2 className="spin" size={32} />
      <span>Techsari &mdash; Zawadi</span>
    </main>
  );
}

function AuthScreen({ config, initialMode = "login", onAuthed, onBackToLanding }) {
  const [mode, setMode] = React.useState(initialMode);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    country: "Kenya"
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (supabaseClient) {
        if (mode === "register") {
          const { data, error: signUpError } = await supabaseClient.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
              data: {
                name: form.name,
                country: form.country
              }
            }
          });
          if (signUpError) throw signUpError;
          if (!data.session) {
            setError("Check your email to confirm your account, then sign in.");
            return;
          }
        } else {
          const { error: signInError } =
            await supabaseClient.auth.signInWithPassword({
              email: form.email,
              password: form.password
            });
          if (signInError) throw signInError;
        }
        const me = await api("/api/me");
        onAuthed(me.user);
        return;
      }

      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const data = await api(path, {
        method: "POST",
        body: JSON.stringify(form)
      });
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell premium-auth">
      <section className="auth-panel">
        <BrandBlock />
        <div className="auth-copy">
          <h1>A scholarship portal for African applicants</h1>
          <p>
            Match with funding, track documents, watch deadlines and manage every
            application from one premium web app.
          </p>
        </div>

        <div className="mode-switch" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                Country
                <input
                  value={form.country}
                  onChange={(event) =>
                    setForm({ ...form, country: event.target.value })
                  }
                  autoComplete="country-name"
                  required
                />
              </label>
            </>
          )}
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn full" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>

      <section className="auth-preview" aria-label="Scholarship portal preview">
        <article className="glass-panel">
          <div className="mini-top">
            <Sparkles size={18} />
            <span>Premium match</span>
          </div>
          <strong>89%</strong>
          <p>Masters in Data Science, fully funded, Africa eligible.</p>
        </article>
        <div className="preview-table">
          {["Applied", "Drafting", "Urgent", "Documents ready"].map((item, index) => (
            <div key={item}>
              <span>{item}</span>
              <strong>{[12, 5, 3, 18][index]}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function BrandBlock() {
  return (
    <div className="brand-block">
      <div className="brand-mark" aria-hidden="true">
        <GraduationCap size={24} />
      </div>
      <div>
        <strong>Techsari &mdash; Zawadi</strong>
        <span>Scholarship Portal</span>
      </div>
    </div>
  );
}

function Portal({
  config,
  user,
  rows,
  documents,
  stats,
  onUserChanged,
  onDocumentsChanged,
  onLogout,
  onRefresh,
  onReplaceRow,
  onRowsChanged,
  onToast
}) {
  const [view, setView] = React.useState("dashboard");
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);
  const [upgradePlans, setUpgradePlans] = React.useState([]);
  const [selectedCategory, setSelectedCategory] = React.useState("All categories");
  const canManageScholarships = user?.role === "admin";

  // Load upgrade plans on mount
  React.useEffect(() => {
    loadUpgradePlans();
  }, []);

  async function loadUpgradePlans() {
    try {
      const data = await api("/api/payment/plans");
      setUpgradePlans(data.plans || []);
    } catch {
      setUpgradePlans([]);
    }
  }

  async function handleUpgrade(planId) {
    const result = await api("/api/payment/initiate", {
      method: "POST",
      body: JSON.stringify({ planId })
    });

    return result;
  }

  function navButton(id, label, Icon) {
    return (
      <button
        type="button"
        className={view === id ? "active" : ""}
        onClick={() => setView(id)}
      >
        <Icon size={18} />
        {label}
      </button>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <BrandBlock />
        <nav className="side-nav" aria-label="Workspace">
          {navButton("dashboard", "Overview", LayoutDashboard)}
          {navButton("scholarships", "Scholarships", Database)}
          {navButton("application-center", "Apply", Check)}
          {navButton("essay-generator", "Essays", Sparkles)}
          {navButton("intelligence", "Doc Intel", FileCheck2)}
          {navButton("documents", "Documents", FileText)}
          {navButton("pricing", "Pricing", CreditCard)}
          {canManageScholarships && (
            <button type="button" onClick={() => setUploadOpen(true)}>
              <FileUp size={18} />
              Intake
            </button>
          )}
          {canManageScholarships && (
            <button type="button" onClick={() => { window.location.href = "/admin"; }}>
              <ShieldCheck size={18} />
              Admin
            </button>
          )}
        </nav>
        <div className="gate-panel">
          <div className="gate-title">
            <ShieldCheck size={17} />
            Portal filters
          </div>
          <span>African eligibility</span>
          <span>Funding amount</span>
          <span>School and degree</span>
          <span>Document readiness</span>
          <span>Urgency and status</span>
        </div>
        <div className="user-tile">
          <div>
            <strong>{user.name}</strong>
            <span>{user.country} - {user.planName}</span>
          </div>
          <button
            className="icon-btn"
            type="button"
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Africa-wide scholarship web app</span>
            <h1>{viewTitle(view)}</h1>
          </div>
          <div className="topbar-actions">
            <NotificationButton onToast={onToast} />
            <button className="quiet-btn" type="button" onClick={onRefresh}>
              <Database size={17} />
              Sync
            </button>
            {canManageScholarships && (
              <>
                <button className="secondary-btn" type="button" onClick={() => setEditing({})}>
                  <Plus size={17} />
                  Add
                </button>
                <button className="primary-btn" type="button" onClick={() => setUploadOpen(true)}>
                  <Upload size={17} />
                  Upload
                </button>
              </>
            )}
          </div>
        </header>

        {view === "dashboard" && (
          <DashboardHome
            user={user}
            rows={rows}
            stats={stats}
            documents={documents}
            onUserChanged={onUserChanged}
            onRefresh={onRefresh}
            onOpenScholarshipCategory={(category) => {
              setSelectedCategory(category);
              setView("scholarships");
            }}
            onViewChange={setView}
            onToast={onToast}
          />
        )}

        {view === "scholarships" && (
          <ScholarshipWorkspace
            user={user}
            rows={rows}
            selectedCategory={selectedCategory}
            canManageScholarships={canManageScholarships}
            onEdit={setEditing}
            onReplaceRow={onReplaceRow}
            onRowsChanged={onRowsChanged}
            onToast={onToast}
          />
        )}

        {view === "documents" && (
          <DocumentsWorkspace
            user={user}
            documents={documents}
            rows={rows}
            onDocumentsChanged={onDocumentsChanged}
            onToast={onToast}
            onUpgrade={() => setUpgradeOpen(true)}
          />
        )}

        {view === "pricing" && (
          <PricingWorkspace
            config={config}
            user={user}
            onUserChanged={onUserChanged}
            onToast={onToast}
          />
        )}

        {view === "application-center" && (
          <ApplicationCenter
            api={api}
            rows={rows}
            user={user}
            onToast={onToast}
            onRefresh={onRefresh}
            onUpgrade={() => setUpgradeOpen(true)}
          />
        )}

        {view === "essay-generator" && (
          <EssayGenerator
            api={api}
            scholarships={rows}
            user={user}
            onToast={onToast}
            onUpgrade={() => setUpgradeOpen(true)}
          />
        )}

        {view === "intelligence" && (
          <IntelligencePanel
            api={api}
            documents={documents}
            onToast={onToast}
            onDocumentsChanged={onDocumentsChanged}
          />
        )}
      </section>

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onImported={(incoming) => {
            onRowsChanged([...incoming, ...rows]);
            onToast(`${incoming.length} scholarship${incoming.length === 1 ? "" : "s"} uploaded`);
            notifyUser("Scholarships uploaded", `${incoming.length} new opportunities added.`);
            setUploadOpen(false);
          }}
        />
      )}

      {editing && (
        <ScholarshipEditor
          row={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            if (editing.id) onReplaceRow(saved);
            else onRowsChanged([saved, ...rows]);
            onToast(editing.id ? "Scholarship updated" : "Scholarship added");
            setEditing(null);
          }}
        />
      )}

      {upgradeOpen && (
        <UpgradeModal
          plans={upgradePlans}
          user={user}
          onClose={() => setUpgradeOpen(false)}
          onUpgrade={handleUpgrade}
          onToast={onToast}
        />
      )}
    </main>
  );
}

function viewTitle(view) {
  if (view === "scholarships") return "Scholarship finder";
  if (view === "documents") return "Document vault";
  if (view === "application-center") return "Application Center";
  if (view === "essay-generator") return "AI Essay Generator";
  if (view === "intelligence") return "Document Intelligence";
  if (view === "pricing") return "Pricing";
  return "Command center";
}

function NotificationButton({ onToast }) {
  const [permission, setPermission] = React.useState(
    "Notification" in window ? Notification.permission : "unsupported"
  );

  async function request() {
    if (!("Notification" in window)) {
      onToast("This browser does not support notifications");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      onToast("Scholarship notifications enabled");
      notifyUser("Techsari \u2014 Zawadi notifications enabled", "New scholarship matches can now alert you.");
    }
  }

  return (
    <button className="quiet-btn" type="button" onClick={request}>
      {permission === "granted" ? <BellRing size={17} /> : <Bell size={17} />}
      Alerts
    </button>
  );
}

function DashboardHome({
  user,
  rows,
  stats,
  documents,
  onUserChanged,
  onRefresh,
  onOpenScholarshipCategory,
  onViewChange,
  onToast
}) {
  const topMatches = rows.slice(0, 3);
  const missingDocs = [...new Set(topMatches.flatMap((row) => row.match.missingDocuments))].slice(0, 5);
  const categoryCards = buildDashboardCategories(rows);

  return (
    <>
      <section className="metrics" aria-label="Scholarship summary">
        <MetricCard label="Scholarships" value={stats.total} icon={<Database size={18} />} />
        <MetricCard label="Strong matches" value={stats.strongMatches} icon={<Sparkles size={18} />} />
        <MetricCard label="Applied" value={stats.applied} icon={<FileCheck2 size={18} />} />
        <MetricCard label="Urgent" value={stats.urgent} icon={<Clock3 size={18} />} tone="urgent" />
      </section>

      <section className="category-dashboard" aria-label="Scholarship categories">
        {categoryCards.map((category) => (
          <button
            key={category.name}
            className="category-card"
            type="button"
            onClick={() => onOpenScholarshipCategory(category.name)}
          >
            <span>{category.name}</span>
            <strong>{category.count}</strong>
            <small>{category.preview}</small>
          </button>
        ))}
      </section>

      <section className="dashboard-grid">
        <ProfileCard
          user={user}
          onUserChanged={onUserChanged}
          onRefresh={onRefresh}
          onToast={onToast}
        />
        <article className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Recommended</span>
              <h2>Best matches</h2>
            </div>
            <button className="ghost-btn" type="button" onClick={() => onViewChange("scholarships")}>
              View all
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="match-list">
            {topMatches.map((row) => (
              <MatchCard key={row.id} row={row} compact />
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Readiness</span>
              <h2>Document gaps</h2>
            </div>
            <button className="ghost-btn" type="button" onClick={() => onViewChange("documents")}>
              Upload
              <FileUp size={16} />
            </button>
          </div>
          <div className="doc-gap-list">
            <strong>{documents.length} uploaded</strong>
            {missingDocs.length ? (
              missingDocs.map((doc) => <span key={doc}>{doc}</span>)
            ) : (
              <span>No gaps in top matches</span>
            )}
          </div>
        </article>
      </section>
    </>
  );
}

function MetricCard({ label, value, icon, tone = "" }) {
  return (
    <article className={`metric ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function buildDashboardCategories(rows) {
  const preferred = [
    "Africa eligible",
    "Fully funded",
    "AI, Data & STEM",
    "Masters",
    "PhD & Research",
    "Urgent deadlines"
  ];
  const map = new Map();
  rows.forEach((row) => {
    const categories = row.categories?.length ? row.categories : inferClientCategories(row);
    categories.forEach((category) => {
      if (!map.has(category)) map.set(category, []);
      map.get(category).push(row);
    });
  });

  return [...map.entries()]
    .map(([name, categoryRows]) => ({
      name,
      count: categoryRows.length,
      preview: categoryRows
        .slice(0, 2)
        .map((row) => row.name)
        .join(" | ")
    }))
    .sort((a, b) => {
      const ai = preferred.indexOf(a.name);
      const bi = preferred.indexOf(b.name);
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? preferred.length : ai) - (bi === -1 ? preferred.length : bi);
      }
      return b.count - a.count || a.name.localeCompare(b.name);
    })
    .slice(0, 6);
}

function inferClientCategories(row) {
  const haystack = [
    row.name,
    row.provider,
    row.host,
    row.scholarshipType,
    row.fundingType,
    row.amountLabel,
    row.description,
    ...(row.fields || []),
    ...(row.degreeLevels || []),
    ...(row.eligibleRegions || []),
    ...(row.accessibility || [])
  ].join(" ").toLowerCase();
  const categories = [];
  const add = (label, terms) => {
    if (terms.some((term) => haystack.includes(term))) categories.push(label);
  };
  if (haystack.includes("africa")) categories.push("Africa eligible");
  add("Fully funded", ["fully funded", "full tuition", "stipend"]);
  add("AI, Data & STEM", ["artificial intelligence", "machine learning", "data science", "engineering", "stem", "technology"]);
  add("Masters", ["masters", "master", "msc", "mba"]);
  add("PhD & Research", ["phd", "doctoral", "doctorate", "research"]);
  if (row.match?.urgency?.tone === "urgent") categories.push("Urgent deadlines");
  return [...new Set(categories)].slice(0, 6);
}

function ProfileCard({ user, onUserChanged, onRefresh, onToast }) {
  const [profile, setProfile] = React.useState(user.profile);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setProfile(user.profile);
  }, [user.profile]);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(profile)
      });
      onUserChanged(data.user);
      await onRefresh?.();
      onToast("Profile updated and matches refreshed");
    } catch (err) {
      onToast(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="panel profile-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Matching profile</span>
          <h2>{user.country}</h2>
        </div>
        <span className="plan-pill">{user.planName}</span>
      </div>
      <form className="profile-form" onSubmit={saveProfile}>
        <label>
          Applicant country
          <input
            value={profile.country}
            onChange={(event) => setProfile({ ...profile, country: event.target.value })}
          />
        </label>
        <label>
          Target level
          <select
            value={profile.targetLevel}
            onChange={(event) => setProfile({ ...profile, targetLevel: event.target.value })}
          >
            <option>Undergraduate</option>
            <option>Honours</option>
            <option>Masters</option>
            <option>PhD</option>
            <option>Fellowship</option>
          </select>
        </label>
        <label>
          Fields
          <input
            value={profile.fieldInterests.join(", ")}
            onChange={(event) =>
              setProfile({ ...profile, fieldInterests: toList(event.target.value) })
            }
          />
        </label>
        <label>
          Preferred study countries
          <input
            value={profile.studyCountries.join(", ")}
            onChange={(event) =>
              setProfile({ ...profile, studyCountries: toList(event.target.value) })
            }
          />
        </label>
        <button className="primary-btn" type="submit" disabled={saving}>
          {saving ? <Loader2 className="spin" size={16} /> : <Check size={16} />}
          Save profile
        </button>
      </form>
    </article>
  );
}

function ScholarshipWorkspace({
  user,
  rows,
  selectedCategory,
  canManageScholarships,
  onEdit,
  onReplaceRow,
  onRowsChanged,
  onToast
}) {
  const [filters, setFilters] = React.useState({
    query: "",
    country: "All countries",
    applicantCountry: user.profile.country || user.country,
    level: "All levels",
    category: selectedCategory || "All categories",
    status: "All statuses",
    type: "All types",
    funding: "All funding",
    accessibility: "Any access",
    school: "",
    minScore: "0",
    urgency: "Any urgency",
    documentReadyOnly: false,
    amountOnly: false
  });
  const [sortBy, setSortBy] = React.useState("match");

  React.useEffect(() => {
    setFilters((current) => ({
      ...current,
      category: selectedCategory || "All categories"
    }));
  }, [selectedCategory]);

  const optionData = React.useMemo(() => buildOptionData(rows), [rows]);
  const filteredRows = React.useMemo(
    () => filterScholarships(rows, filters, sortBy, isPaid(user)),
    [rows, filters, sortBy, user]
  );

  async function updateApplication(row, patch) {
    const payload = { ...row.application, ...patch };
    if (patch.applied === true && row.application.status === "Not started") {
      payload.status = "Applied";
    }
    if (patch.applied === false && row.application.status === "Applied") {
      payload.status = "Not started";
    }
    if (payload.status === "Applied") payload.applied = true;

    const data = await api(`/api/applications/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    onReplaceRow(data.scholarship);
  }

  async function deleteScholarship(row) {
    if (!canManageScholarships) return;
    if (!window.confirm(`Delete "${row.name}" from the shared portal?`)) return;
    await api(`/api/scholarships/${row.id}`, { method: "DELETE" });
    onRowsChanged(rows.filter((item) => item.id !== row.id));
    onToast("Scholarship removed");
  }

  function exportCsv() {
    const headers = [
      "Name",
      "Provider",
      "Countries",
      "Eligible Countries",
      "Degree Levels",
      "Categories",
      "Schools",
      "Funding",
      "Amount",
      "Deadline",
      "Required Documents",
      "Match Score",
      "Status",
      "Official URL"
    ];
    const values = filteredRows.map((row) => [
      row.name,
      row.provider,
      row.countries.join("; "),
      row.eligibleCountries.join("; "),
      row.degreeLevels.join("; "),
      (row.categories || []).join("; "),
      row.schools.join("; "),
      row.fundingType,
      row.amountLabel,
      row.deadline,
      row.requiredDocuments.join("; "),
      row.match.score,
      row.application.status,
      row.officialUrl
    ]);
    downloadCsv("zawadi-scholarships.csv", [headers, ...values]);
    onToast("CSV exported");
  }

  return (
    <>
      <section className="premium-filter-panel">
        <div className="filter-title">
          <SlidersHorizontal size={18} />
          <strong>Premium filter system</strong>
          {!isPaid(user) && <span><Lock size={13} /> Upgrade to unlock all filters</span>}
        </div>
        <div className="toolbar premium-toolbar" aria-label="Scholarship filters">
          <label className="search-box">
            <Search size={18} />
            <input
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
              placeholder="Search scholarship, school, country, field"
            />
          </label>
          <FilterSelect
            icon={<Filter size={17} />}
            value={filters.country}
            onChange={(country) => setFilters({ ...filters, country })}
            options={["All countries", ...optionData.countries]}
          />
          <FilterSelect
            value={filters.level}
            onChange={(level) => setFilters({ ...filters, level })}
            options={["All levels", ...optionData.levels]}
          />
          <FilterSelect
            value={filters.category}
            onChange={(category) => setFilters({ ...filters, category })}
            options={["All categories", ...optionData.categories]}
          />
          <FilterSelect
            value={filters.status}
            onChange={(status) => setFilters({ ...filters, status })}
            options={["All statuses", ...statusOptions]}
          />
          <FilterSelect
            value={filters.funding}
            onChange={(funding) => setFilters({ ...filters, funding })}
            options={["All funding", ...optionData.funding]}
          />
          <FilterSelect
            value={filters.type}
            onChange={(type) => setFilters({ ...filters, type })}
            options={["All types", ...optionData.types]}
          />
          <FilterSelect
            locked={!isPaid(user)}
            value={filters.accessibility}
            onChange={(accessibility) => setFilters({ ...filters, accessibility })}
            options={["Any access", ...optionData.accessibility]}
          />
          <FilterSelect
            locked={!isPaid(user)}
            value={filters.urgency}
            onChange={(urgency) => setFilters({ ...filters, urgency })}
            options={["Any urgency", "Urgent", "Soon", "Unknown"]}
          />
          <label className="select-wrap">
            <BookOpen size={17} />
            <input
              value={filters.school}
              onChange={(event) => setFilters({ ...filters, school: event.target.value })}
              placeholder="School"
              disabled={!isPaid(user)}
            />
          </label>
          <label className="toggle-pill">
            <input
              type="checkbox"
              checked={filters.documentReadyOnly}
              onChange={(event) =>
                setFilters({ ...filters, documentReadyOnly: event.target.checked })
              }
              disabled={!isPaid(user)}
            />
            Docs ready
          </label>
          <label className="toggle-pill">
            <input
              type="checkbox"
              checked={filters.amountOnly}
              onChange={(event) =>
                setFilters({ ...filters, amountOnly: event.target.checked })
              }
              disabled={!isPaid(user)}
            />
            Amount shown
          </label>
          <FilterSelect
            icon={<Sparkles size={17} />}
            value={sortBy}
            onChange={setSortBy}
            options={["match", "deadline", "amount", "status", "name"]}
          />
        </div>
      </section>

      <div className="section-actions">
        <span>{filteredRows.length} opportunities</span>
        <button className="ghost-btn" type="button" onClick={exportCsv}>
          <Download size={16} />
          Export
        </button>
      </div>

      <ScholarshipTable
        rows={filteredRows}
        canManageScholarships={canManageScholarships}
        onEdit={onEdit}
        onDelete={deleteScholarship}
        onUpdateApplication={updateApplication}
      />
    </>
  );
}

function FilterSelect({ value, onChange, options, icon, locked = false }) {
  return (
    <label className="select-wrap">
      {icon || (locked ? <Lock size={16} /> : <Filter size={16} />)}
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={locked}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function buildOptionData(rows) {
  const all = (selector) => [...new Set(rows.flatMap(selector).filter(Boolean))].sort();
  return {
    countries: all((row) => row.countries),
    levels: all((row) => row.degreeLevels),
    categories: all((row) => row.categories?.length ? row.categories : inferClientCategories(row)),
    funding: all((row) => [row.fundingType]),
    types: all((row) => [row.scholarshipType]),
    accessibility: all((row) => row.accessibility)
  };
}

function filterScholarships(rows, filters, sortBy, paid) {
  const query = filters.query.toLowerCase().trim();
  return rows
    .filter((row) => {
      const haystack = [
        row.name,
        row.provider,
        row.host,
        row.description,
        row.countries.join(" "),
        row.eligibleCountries.join(" "),
        row.fields.join(" "),
        (row.categories || []).join(" "),
        row.schools.join(" "),
        row.requiredDocuments.join(" "),
        row.accessibility.join(" "),
        row.application.notes
      ]
        .join(" ")
        .toLowerCase();

      if (query && !haystack.includes(query)) return false;
      if (filters.country !== "All countries" && !row.countries.includes(filters.country)) return false;
      if (filters.level !== "All levels" && !row.degreeLevels.includes(filters.level)) return false;
      if (filters.category !== "All categories") {
        const categories = row.categories?.length ? row.categories : inferClientCategories(row);
        if (!categories.includes(filters.category)) return false;
      }
      if (filters.status !== "All statuses" && row.application.status !== filters.status) return false;
      if (filters.type !== "All types" && row.scholarshipType !== filters.type) return false;
      if (filters.funding !== "All funding" && row.fundingType !== filters.funding) return false;
      if (paid && filters.accessibility !== "Any access" && !row.accessibility.includes(filters.accessibility)) return false;
      if (paid && filters.school && !row.schools.join(" ").toLowerCase().includes(filters.school.toLowerCase())) return false;
      if (paid && filters.documentReadyOnly && row.match.missingDocuments.length) return false;
      if (paid && filters.amountOnly && row.amountLabel.toLowerCase().includes("not stated")) return false;
      if (paid && filters.urgency !== "Any urgency" && row.match.urgency.tone !== filters.urgency.toLowerCase()) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "deadline") {
        const at = Date.parse(a.deadlineDate || a.deadline);
        const bt = Date.parse(b.deadlineDate || b.deadline);
        return (Number.isNaN(at) ? Infinity : at) - (Number.isNaN(bt) ? Infinity : bt);
      }
      if (sortBy === "amount") return (b.amountMax || 0) - (a.amountMax || 0);
      if (sortBy === "status") return a.application.status.localeCompare(b.application.status);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.match.score - a.match.score;
    });
}

function ScholarshipTable({ rows, canManageScholarships, onEdit, onDelete, onUpdateApplication }) {
  if (!rows.length) {
    return (
      <section className="empty-state">
        <Search size={28} />
        <strong>No scholarships match these filters</strong>
      </section>
    );
  }

  return (
    <section className="sheet-shell" aria-label="Scholarship spreadsheet">
      <table className="sheet-table portal-table">
        <thead>
          <tr>
            <th>Match</th>
            <th>Scholarship</th>
            <th>Country and school</th>
            <th>Amount</th>
            <th>Eligibility</th>
            <th>Documents</th>
            <th>Urgency</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Notes</th>
            {canManageScholarships && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ScholarshipRow
              key={row.id}
              row={row}
              canManageScholarships={canManageScholarships}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateApplication={onUpdateApplication}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ScholarshipRow({ row, canManageScholarships, onEdit, onDelete, onUpdateApplication }) {
  const statusClass = row.application.status.toLowerCase().replace(/\s+/g, "-");

  return (
    <tr className={`status-row ${statusClass}`}>
      <td>
        <div className="score-ring" style={{ "--score": `${row.match.score}%` }}>
          <strong>{row.match.score}</strong>
        </div>
        <div className="applied-toggle">
          <label className="checkbox-cell" title="Toggle applied">
            <input
              type="checkbox"
              checked={row.application.applied}
              onChange={(event) =>
                onUpdateApplication(row, { applied: event.target.checked })
              }
            />
            <span aria-hidden="true"><Check size={14} /></span>
          </label>
          {row.application.applied ? "Applied" : "Not applied"}
        </div>
      </td>
      <td className="name-cell">
        <strong>{row.name}</strong>
        <span>{row.provider} - {row.scholarshipType}</span>
        <div className="tag-row">
          {row.fields.slice(0, 3).map((field) => <em key={field}>{field}</em>)}
        </div>
        {row.officialUrl && (
          <a href={row.officialUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            Official portal
          </a>
        )}
      </td>
      <td>
        <div className="stacked-cell">
          <strong>{row.countries.join(", ")}</strong>
          <span>{row.schools.join(", ")}</span>
          <small>{row.degreeLevels.join(", ")}</small>
        </div>
      </td>
      <td className="wrap-cell">
        <strong>{row.fundingType}</strong>
        <span>{row.amountLabel}</span>
      </td>
      <td className="wrap-cell">
        <span>{row.eligibleRegions.join(", ")}</span>
        <small>{row.eligibleCountries.slice(0, 4).join(", ")}{row.eligibleCountries.length > 4 ? "..." : ""}</small>
      </td>
      <td className="wrap-cell">
        <span>{row.requiredDocuments.join(", ")}</span>
        {!!row.match.missingDocuments.length && (
          <small className="missing-docs">Missing: {row.match.missingDocuments.slice(0, 3).join(", ")}</small>
        )}
      </td>
      <td>
        <span className={`deadline-chip ${row.match.urgency.tone}`}>
          {row.match.urgency.label}
        </span>
        <small>{row.deadline}</small>
      </td>
      <td>
        <select
          className="cell-select"
          value={row.application.status}
          onChange={(event) =>
            onUpdateApplication(row, { status: event.target.value })
          }
        >
          {statusOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </td>
      <td>
        <select
          className="cell-select compact"
          value={row.application.priority}
          onChange={(event) =>
            onUpdateApplication(row, { priority: event.target.value })
          }
        >
          {priorityOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </td>
      <td>
        <input
          className="notes-input"
          defaultValue={row.application.notes}
          onBlur={(event) => {
            if (event.target.value !== row.application.notes) {
              onUpdateApplication(row, { notes: event.target.value });
            }
          }}
          placeholder="Next step"
        />
      </td>
      {canManageScholarships && (
        <td className="actions-col">
          <>
            <button className="icon-btn" type="button" onClick={() => onEdit(row)} title="Edit scholarship" aria-label="Edit scholarship">
              <Pencil size={16} />
            </button>
            <button className="icon-btn danger" type="button" onClick={() => onDelete(row)} title="Delete scholarship" aria-label="Delete scholarship">
              <Trash2 size={16} />
            </button>
          </>
        </td>
      )}
    </tr>
  );
}

function MatchCard({ row, compact = false }) {
  return (
    <article className={`match-card ${compact ? "compact" : ""}`}>
      <div className="score-ring" style={{ "--score": `${row.match.score}%` }}>
        <strong>{row.match.score}</strong>
      </div>
      <div>
        <strong>{row.name}</strong>
        <span>{row.countries.join(", ")} - {row.amountLabel}</span>
        <div className="tag-row">
          {row.match.reasons.slice(0, 3).map((reason) => <em key={reason}>{reason}</em>)}
        </div>
      </div>
    </article>
  );
}

function DocumentsWorkspace({ user, documents, rows, onDocumentsChanged, onToast, onUpgrade }) {
  const [type, setType] = React.useState("CV");
  const needed = [...new Set(rows.slice(0, 6).flatMap((row) => row.match.missingDocuments))];
  const isFree = user?.plan === "free" && !user?.is_paid;
  const canUpload = !isFree || documents.length < 3;

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isFree && documents.length >= 3) {
      onUpgrade?.();
      return;
    }

    let storagePath = "";
    let source = "Local metadata";
    let fileData = "";

    try {
      if (supabaseClient) {
        storagePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error } = await supabaseClient.storage
          .from("documents")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined
          });
        if (error) throw error;
        source = "Supabase Storage";
      } else {
        fileData = await fileToDataUrl(file);
        source = "Local secure storage";
      }

      const response = await api("/api/documents", {
        method: "POST",
        body: JSON.stringify({
          type,
          name: file.name,
          fileName: file.name,
          size: file.size,
          mimeType: file.type,
          storagePath,
          source,
          data: fileData
        })
      });
      onDocumentsChanged([response.document, ...documents]);
      onToast("Document uploaded");
    } catch (err) {
      onToast(err.message);
    } finally {
      event.target.value = "";
    }
  }

  async function removeDocument(id) {
    await api(`/api/documents/${id}`, { method: "DELETE" });
    onDocumentsChanged(documents.filter((doc) => doc.id !== id));
    onToast("Document removed");
  }

  return (
    <section className="dashboard-grid documents-grid">
      {isFree && (
        <div className="free-tier-banner">
          <Lock size={16} />
          <span>Free plan: limited to 3 documents. </span>
          <button className="ghost-btn" onClick={onUpgrade}>
            Upgrade to unlock unlimited documents
            <ChevronRight size={14} />
          </button>
        </div>
      )}
      <article className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Vault</span>
            <h2>Application documents</h2>
          </div>
          <span className="plan-pill">
            {documents.length} files
            {isFree && ` / 3 free`}
          </span>
        </div>
        <div className="document-upload-row">
          <label>
            Document type
            <select value={type} onChange={(event) => setType(event.target.value)}>
              {documentTypes.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          {canUpload ? (
            <label className="file-drop compact-drop">
              <FileUp size={22} />
              <span>Upload resume, transcript or certificate</span>
              <input type="file" onChange={handleFile} />
            </label>
          ) : (
            <button className="secondary-btn" onClick={onUpgrade}>
              <Lock size={18} />
              Upgrade to upload more documents
            </button>
          )}
        </div>
        <div className="document-list">
          {documents.map((doc) => (
            <article key={doc.id}>
              <FileText size={18} />
              <div>
                <strong>{doc.type}</strong>
                <span>{doc.fileName} - {formatBytes(doc.size)} - {doc.source}</span>
              </div>
              <button className="icon-btn danger" type="button" onClick={() => removeDocument(doc.id)} aria-label="Delete document">
                <Trash2 size={16} />
              </button>
            </article>
          ))}
          {!documents.length && <div className="empty-mini">No documents uploaded yet</div>}
        </div>
      </article>
      <article className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Required by matches</span>
            <h2>What to prepare next</h2>
          </div>
        </div>
        <div className="doc-gap-list large">
          {needed.length ? needed.map((doc) => <span key={doc}>{doc}</span>) : <span>Top matches are document-ready</span>}
        </div>
      </article>
      <article className="panel security-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Security</span>
            <h2>Private document vault</h2>
          </div>
          <ShieldCheck size={20} color="var(--green)" />
        </div>
        <div className="security-list">
          <span>Account-only access</span>
          <span>Private storage paths</span>
          <span>Server-side session cookies</span>
          <span>Payment verification webhooks</span>
        </div>
      </article>
    </section>
  );
}

function PricingWorkspace({ config, user, onUserChanged, onToast }) {
  const [interval, setInterval] = React.useState("monthly");
  const [loadingPlan, setLoadingPlan] = React.useState("");
  const plans = config?.pricingPlans || [];

  async function checkout(planId) {
    setLoadingPlan(planId);
    try {
      const data = await api("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ planId, interval })
      });
      window.location.href = data.authorizationUrl;
    } catch (err) {
      onToast(err.message);
    } finally {
      setLoadingPlan("");
    }
  }

  return (
    <section className="pricing-shell">
      <div className="pricing-top">
        <div>
          <span className="eyebrow">Research-based pricing</span>
          <h2>Keep discovery free. Charge for power.</h2>
        </div>
        <div className="mode-switch billing-switch">
          <button className={interval === "monthly" ? "active" : ""} type="button" onClick={() => setInterval("monthly")}>Monthly</button>
          <button className={interval === "annual" ? "active" : ""} type="button" onClick={() => setInterval("annual")}>Annual</button>
        </div>
      </div>
      <div className="pricing-grid">
        {plans.map((plan) => {
          const price = planDisplayPrice(plan, interval, user.country);
          const isCurrent = user.plan === plan.id;
          const isIncluded = isPaid(user) && planRank(plan.id) < planRank(user.plan);
          return (
            <article key={plan.id} className={`price-card ${plan.id === "plus" ? "featured" : ""}`}>
              <span className="plan-badge">{plan.badge}</span>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <strong className="price">{price.primary}</strong>
              <span className="price-note">{price.note}</span>
              <ul>
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <button
                className={plan.id === "free" ? "ghost-btn full" : "primary-btn full"}
                type="button"
                disabled={isCurrent || isIncluded || plan.id === "free" || loadingPlan === plan.id}
                onClick={() => checkout(plan.id)}
              >
                {loadingPlan === plan.id ? <Loader2 className="spin" size={16} /> : <CircleDollarSign size={16} />}
                {isCurrent ? "Current plan" : isIncluded || plan.id === "free" ? "Included" : "Pay with Paystack"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function UploadModal({ onClose, onImported }) {
  const [rawText, setRawText] = React.useState(sampleZawadiOutput);
  const [preview, setPreview] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function parseCurrentText(text = rawText) {
    try {
      const parsed = parseScholarshipText(text);
      setPreview(parsed);
      setError(parsed.length ? "" : "No scholarship rows were found");
    } catch (err) {
      setPreview([]);
      setError(err.message);
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRawText(text);
    parseCurrentText(text);
  }

  async function upload() {
    if (!preview.length) {
      parseCurrentText();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/scholarships/bulk", {
        method: "POST",
        body: JSON.stringify({
          source: "Techsari Zawadi agent or CSV upload",
          scholarships: preview
        })
      });
      onImported(data.scholarships);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Upload scholarships" onClose={onClose}>
      <label className="file-drop">
        <FileUp size={22} />
        <span>CSV, JSON or Techsari Zawadi agent text</span>
        <input type="file" accept=".csv,.json,.txt" onChange={handleFile} />
      </label>
      <textarea
        className="upload-textarea"
        value={rawText}
        onChange={(event) => setRawText(event.target.value)}
        spellCheck="false"
      />
      <div className="modal-actions">
        <button className="quiet-btn" type="button" onClick={() => parseCurrentText()}>
          <Search size={16} />
          Preview
        </button>
        <button className="primary-btn" type="button" onClick={upload} disabled={loading || !rawText.trim()}>
          {loading ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
          Upload {preview.length || ""}
        </button>
      </div>
      {error && <div className="form-error">{error}</div>}
      {!!preview.length && (
        <div className="preview-list">
          {preview.slice(0, 5).map((row, index) => (
            <article key={`${row.name}-${index}`}>
              <strong>{row.name}</strong>
              <span>{row.countries?.join(", ") || row.host}</span>
              <em>{row.fundingType || row.amountLabel}</em>
            </article>
          ))}
          {preview.length > 5 && <span className="preview-more">+{preview.length - 5} more</span>}
        </div>
      )}
    </Modal>
  );
}

function ScholarshipEditor({ row, onClose, onSaved }) {
  const [form, setForm] = React.useState(
    row || {
      name: "",
      provider: "",
      host: "",
      countries: [],
      eligibleCountries: [],
      eligibleRegions: ["Africa"],
      degreeLevels: ["Masters"],
      fields: [],
      schools: [],
      scholarshipType: "Government",
      fundingType: "Fully funded",
      amountLabel: "",
      amountMin: 0,
      amountMax: 0,
      currency: "USD",
      deadline: "Check portal",
      deadlineDate: "",
      accessibility: [],
      requiredDocuments: ["CV", "Transcript", "Motivation Letter", "References"],
      officialUrl: "",
      description: "",
      tags: [],
      categories: []
    }
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const path = row ? `/api/scholarships/${row.id}` : "/api/scholarships";
      const data = await api(path, {
        method: row ? "PATCH" : "POST",
        body: JSON.stringify(form)
      });
      onSaved(data.scholarship);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={row ? "Edit scholarship" : "Add scholarship"} onClose={onClose}>
      <form className="editor-form portal-editor" onSubmit={save}>
        <label>Name<input value={form.name} onChange={(event) => update("name", event.target.value)} required /></label>
        <label>Provider<input value={form.provider} onChange={(event) => update("provider", event.target.value)} /></label>
        <label>Host<input value={form.host} onChange={(event) => update("host", event.target.value)} /></label>
        <label>Study countries<input value={asText(form.countries)} onChange={(event) => update("countries", toList(event.target.value))} /></label>
        <label>Eligible countries<input value={asText(form.eligibleCountries)} onChange={(event) => update("eligibleCountries", toList(event.target.value))} /></label>
        <label>Degree levels<input value={asText(form.degreeLevels)} onChange={(event) => update("degreeLevels", toList(event.target.value))} /></label>
        <label>Fields<input value={asText(form.fields)} onChange={(event) => update("fields", toList(event.target.value))} /></label>
        <label>Schools<input value={asText(form.schools)} onChange={(event) => update("schools", toList(event.target.value))} /></label>
        <label>Scholarship type<input value={form.scholarshipType} onChange={(event) => update("scholarshipType", event.target.value)} /></label>
        <label>Funding type<input value={form.fundingType} onChange={(event) => update("fundingType", event.target.value)} /></label>
        <label>Dashboard categories<input value={asText(form.categories)} onChange={(event) => update("categories", toList(event.target.value))} /></label>
        <label>Amount shown<input value={form.amountLabel} onChange={(event) => update("amountLabel", event.target.value)} /></label>
        <label>Deadline<input value={form.deadline} onChange={(event) => update("deadline", event.target.value)} /></label>
        <label>Deadline date<input type="date" value={form.deadlineDate} onChange={(event) => update("deadlineDate", event.target.value)} /></label>
        <label>Accessibility tags<input value={asText(form.accessibility)} onChange={(event) => update("accessibility", toList(event.target.value))} /></label>
        <label>Required documents<input value={asText(form.requiredDocuments)} onChange={(event) => update("requiredDocuments", toList(event.target.value))} /></label>
        <label>Official URL<input value={form.officialUrl} onChange={(event) => update("officialUrl", event.target.value)} /></label>
        <label>Description<textarea value={form.description} onChange={(event) => update("description", event.target.value)} /></label>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <button className="ghost-btn" type="button" onClick={onClose}><X size={16} />Cancel</button>
          <button className="primary-btn" type="submit" disabled={saving}>
            {saving ? <Loader2 className="spin" size={16} /> : <Check size={16} />}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  React.useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" type="button" onClick={onClose} title="Close" aria-label="Close">
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Toast({ message }) {
  return <div className={`toast ${message ? "show" : ""}`}>{message}</div>;
}

function parseScholarshipText(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const json = JSON.parse(trimmed);
    const rows = Array.isArray(json) ? json : json.scholarships || [];
    return rows.map(normalizeParsedRow).filter((row) => row.name);
  }
  const structured = parseZawadiBlocks(trimmed);
  if (structured.length) return structured;
  return parseCsv(trimmed).map(normalizeParsedRow).filter((row) => row.name);
}

function parseZawadiBlocks(text) {
  const rows = [];
  let current = null;
  const labels = {
    NAME: "name",
    PROVIDER: "provider",
    HOST: "host",
    COUNTRY: "countries",
    COUNTRIES: "countries",
    DEGREE: "degreeLevels",
    FIELD: "fields",
    FIELDS: "fields",
    SCHOOLS: "schools",
    FUNDING: "fundingType",
    AMOUNT: "amountLabel",
    DEADLINE: "deadline",
    "DEADLINE DATE": "deadlineDate",
    ELIGIBILITY: "eligibleCountries",
    "KENYA ELIGIBLE": "eligibleCountries",
    "AFRICA ELIGIBLE": "eligibleRegions",
    "REQUIRED DOCUMENTS": "requiredDocuments",
    DOCUMENTS: "requiredDocuments",
    ACCESSIBILITY: "accessibility",
    CATEGORY: "categories",
    CATEGORIES: "categories",
    APPLY: "officialUrl",
    URL: "officialUrl"
  };

  text.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([A-Z/ ]+):\s*(.*)$/);
    if (!match) return;
    const key = labels[match[1].trim()];
    if (!key) return;
    if (key === "name") {
      if (current?.name) rows.push(normalizeParsedRow(current));
      current = {};
    }
    if (!current) current = {};
    current[key] = match[2].trim();
  });

  if (current?.name) rows.push(normalizeParsedRow(current));
  return rows.filter((row) => row.name);
}

function parseCsv(text) {
  const lines = splitCsvLines(text);
  if (lines.length < 2) return [];
  const headers = lines[0].map((header) => normalizeHeader(header));
  return lines.slice(1).map((line) =>
    headers.reduce((row, header, index) => {
      row[header] = line[index] || "";
      return row;
    }, {})
  );
}

function splitCsvLines(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeParsedRow(row) {
  const pick = (...keys) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== "") return row[key];
    }
    return "";
  };
  return {
    name: pick("name", "scholarship", "title"),
    provider: pick("provider", "host", "institution"),
    host: pick("host", "institution", "university"),
    countries: toList(pick("countries", "country", "studycountry")),
    eligibleCountries: toList(pick("eligibleCountries", "eligiblecountries", "eligibility", "kenyaeligible")),
    eligibleRegions: toList(pick("eligibleRegions", "eligibleregions", "africaeligible") || "Africa"),
    degreeLevels: toList(pick("degreeLevels", "degreelevels", "degree", "level") || "Masters"),
    fields: toList(pick("fields", "field", "aimltrack")),
    schools: toList(pick("schools", "school", "host")),
    scholarshipType: pick("scholarshipType", "scholarshiptype", "type") || "Scholarship",
    fundingType: pick("fundingType", "fundingtype", "funding") || "Verify funding",
    amountLabel: pick("amountLabel", "amountlabel", "amount", "award") || pick("funding"),
    deadline: pick("deadline") || "Check portal",
    deadlineDate: pick("deadlineDate", "deadlinedate"),
    accessibility: toList(pick("accessibility", "accessibilitytags")),
    requiredDocuments: toList(pick("requiredDocuments", "requireddocuments", "documents") || "CV, Transcript, Motivation Letter, References"),
    officialUrl: pick("officialUrl", "officialurl", "apply", "url"),
    description: pick("description"),
    tags: toList(pick("tags")),
    categories: toList(pick("categories", "category"))
  };
}

function toList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function asText(value) {
  return Array.isArray(value) ? value.join(", ") : value || "";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

const countryCurrency = {
  Kenya: "KES",
  Nigeria: "NGN",
  Ghana: "GHS",
  "South Africa": "ZAR",
  Uganda: "UGX",
  Tanzania: "TZS",
  Rwanda: "RWF",
  Ethiopia: "ETB",
  Egypt: "EGP",
  Morocco: "MAD",
  "United States": "USD",
  USA: "USD"
};

const usdRates = {
  USD: 1,
  KES: 130,
  NGN: 1500,
  GHS: 15,
  ZAR: 18,
  UGX: 3800,
  TZS: 2600,
  RWF: 1300,
  ETB: 57,
  EGP: 48,
  MAD: 10
};

function localCurrencyForCountry(country = "") {
  return countryCurrency[country] || "USD";
}

function formatCurrency(amount, currency) {
  if (!amount) return "Free";
  if (currency === "USD") return `$${amount.toLocaleString()}`;
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

function planDisplayPrice(plan, interval = "monthly", country = "") {
  const usd = interval === "annual"
    ? Number(plan.annualUsd || 0)
    : Number(plan.monthlyUsd || 0);
  if (!usd) return { primary: "Free", note: "forever" };
  const period = interval === "annual" ? "year" : "month";
  const currency = localCurrencyForCountry(country);
  const local = Math.round(usd * (usdRates[currency] || 1));
  const localNote = currency !== "USD"
    ? `~${formatCurrency(local, currency)} per ${period}`
    : `per ${period}`;
  return {
    primary: formatCurrency(usd, "USD"),
    note: localNote
  };
}

function downloadCsv(filename, rows) {
  const csv = rows.map(csvLine).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvLine(values) {
  return values
    .map((value) => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    })
    .join(",");
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    // PWA registration should not block the app.
  }
}

async function notifyUser(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const registration = await navigator.serviceWorker?.getRegistration?.();
  if (registration?.showNotification) {
    registration.showNotification(title, {
      body,
      icon: "/icon.svg",
      tag: "zawadi-update"
    });
    return;
  }
  new Notification(title, { body });
}

const sampleZawadiOutput = `NAME: Example Africa Masters Scholarship
PROVIDER: Example Foundation
HOST: Partner universities
COUNTRIES: Germany, South Africa
ELIGIBILITY: Kenya, Ghana, Nigeria, Uganda
DEGREE: Masters
FIELDS: Data Science, Public Health
SCHOOLS: Partner universities only
FUNDING: Fully funded
AMOUNT: Full tuition, stipend, travel and insurance
DEADLINE: 2026-09-30
DEADLINE DATE: 2026-09-30
REQUIRED DOCUMENTS: CV, Transcript, Motivation Letter, References, Passport
ACCESSIBILITY: Africa eligible, No GRE, Low application fee
APPLY: https://example.edu/scholarship`;

createRoot(document.getElementById("root")).render(<App />);
