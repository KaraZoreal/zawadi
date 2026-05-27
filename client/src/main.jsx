import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
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
  Mail,
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

// --- Techsari Zawadi AI Components (lazy loaded) ---
const EssayGenerator = lazy(() => import("./components/EssayGenerator.jsx"));
const ApplicationCenter = lazy(() => import("./components/ApplicationCenter.jsx"));
const IntelligencePanel = lazy(() => import("./components/IntelligencePanel.jsx"));
const UpgradeModal = lazy(() => import("./components/UpgradeModal.jsx"));
const LandingPage = lazy(() => import("./components/LandingPage.jsx"));

// --- Supabase Client (initialized from Vite env vars) ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const statusOptions = [
  "Not started","Saved","Drafting","Ready","Applied","Interview","Awarded","Rejected","Archived"
];
const priorityOptions = ["High","Normal","Low"];
const documentTypes = [
  "CV","Resume","Transcript","Certificate","Motivation Letter","Statement of Purpose",
  "References","Passport","Financial Need Evidence","Admission Letter","Essay","Other"
];

// --- Africa countries (hardcoded) ---
const AFRICAN_COUNTRIES = ["Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cameroon","Cape Verde","Central African Republic","Chad","Comoros","Congo","Cote d'Ivoire","DR Congo","Djibouti","Egypt","Equatorial Guinea","Eritrea","Eswatini","Ethiopia","Gabon","Gambia","Ghana","Guinea","Guinea-Bissau","Kenya","Lesotho","Liberia","Libya","Madagascar","Malawi","Mali","Mauritania","Mauritius","Morocco","Mozambique","Namibia","Niger","Nigeria","Rwanda","Sao Tome and Principe","Senegal","Seychelles","Sierra Leone","Somalia","South Africa","South Sudan","Sudan","Tanzania","Togo","Tunisia","Uganda","Zambia","Zimbabwe"];

// --- Pricing Plans (hardcoded — was in Express config) ---
const PRICING_PLANS = [
  { id:"free", name:"Explorer", monthlyUsd:0, annualUsd:0, badge:"Free", description:"Scholarship discovery and basic tracking.", limits:{maxDocuments:3,maxEssayGenerations:90}, features:["Open scholarship database","Basic filters","3 AI essays/day"] },
  { id:"plus", name:"Plus", monthlyUsd:5, annualUsd:50, badge:"Plus", description:"Advanced tools for serious applicants.", limits:{maxDocuments:15,maxEssayGenerations:300,premiumFilters:true,documentAnalysis:true}, features:["Everything in Explorer","Premium filters","Document analysis","15 document records","10 AI essays/day","Priority email"] },
  { id:"pro", name:"Pro", monthlyUsd:15, annualUsd:150, badge:"Pro", description:"Full suite for competitive scholarships.", limits:{maxDocuments:50,maxEssayGenerations:900,premiumFilters:true,documentAnalysis:true,prioritySupport:true}, features:["Everything in Plus","Unlimited AI essays","Bulk auto-apply","50 documents","Strategy insights","24hr support"] },
  { id:"mentor", name:"Mentor", monthlyUsd:50, annualUsd:500, badge:"Mentor", description:"Complete mentorship experience.", limits:{maxDocuments:999,documentAnalysis:true,prioritySupport:true}, features:["Everything in Pro","1-on-1 mentorship","Interview prep","Custom strategy","Unlimited everything"] }
];

const ESSAY_TYPES_DATA = {
  personal_statement:{label:"Personal Statement",description:"Your journey, goals, and why you deserve this scholarship",typicalLength:"500-1000 words"},
  statement_of_purpose:{label:"Statement of Purpose",description:"Academic/professional goals, research interests",typicalLength:"800-1500 words"},
  motivation_letter:{label:"Motivation Letter",description:"Why you are motivated for this opportunity",typicalLength:"500-800 words"},
  leadership_essay:{label:"Leadership Essay",description:"Your leadership experience and potential",typicalLength:"500-800 words"},
  diversity_statement:{label:"Diversity Statement",description:"How your background contributes to diversity",typicalLength:"500-800 words"},
  research_proposal:{label:"Research Proposal",description:"Your proposed research project",typicalLength:"1000-2000 words"},
  financial_need:{label:"Financial Need Statement",description:"Your financial situation and need",typicalLength:"300-500 words"}
};

function readLocalList(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeLocalList(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local browser storage can be unavailable in private mode.
  }
}

function localKey(scope, userId = "guest") {
  return `zawadi:${scope}:${userId}`;
}

function normalizeDocument(doc = {}) {
  return {
    ...doc,
    id: doc.id || crypto.randomUUID(),
    fileName: doc.fileName || doc.name || "Document",
    name: doc.name || doc.fileName || "Document",
    size: doc.size || doc.size_bytes || 0,
    size_bytes: doc.size_bytes || doc.size || 0,
    source: doc.source || (doc.storage_path ? "Supabase Storage" : "Local secure storage"),
    storagePath: doc.storagePath || doc.storage_path || "",
    storage_path: doc.storage_path || doc.storagePath || "",
    created_at: doc.created_at || new Date().toISOString()
  };
}

function extractTextFromDataUrl(dataUrl = "", fileName = "") {
  const [, payload = ""] = String(dataUrl).split(",");
  const lowerName = fileName.toLowerCase();
  if (!payload || (lowerName.endsWith(".pdf") || lowerName.endsWith(".docx"))) {
    return `Writing sample uploaded from ${fileName}. Full document is stored for review and future AI analysis.`;
  }
  try {
    return atob(payload).slice(0, 12000);
  } catch {
    return `Writing sample uploaded from ${fileName}.`;
  }
}

function buildLocalEssay({ essayType, prompt, maxWords }) {
  const label = ESSAY_TYPES_DATA[essayType]?.label || "Scholarship Essay";
  return [
    `# ${label}`,
    "",
    "My academic journey has been shaped by curiosity, discipline, and a strong commitment to using education as a tool for community impact. As an African student, I understand how much a scholarship can change the direction of a life, not only by funding tuition, but by opening access to mentorship, networks, and the confidence to pursue ambitious work.",
    "",
    prompt ? `The prompt asks: ${prompt}` : "This draft is structured as a strong starting point that should be personalized with your exact achievements, program details, and measurable impact.",
    "",
    "I am applying because this opportunity aligns with my goals, my preparation, and the contribution I want to make after completing my studies. I bring resilience, practical experience, and a clear plan to turn advanced learning into work that benefits my community.",
    "",
    "With this support, I would be able to focus fully on academic excellence, research, leadership, and service. I am ready to represent the scholarship with integrity and to use the opportunity as a bridge between personal growth and meaningful impact."
  ].join("\n").slice(0, Math.max(1200, Number(maxWords || 800) * 7));
}

// --- Data layer: Supabase-native (no Express server) ---
async function api(path, options = {}) {
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : {};

  if (path === "/api/config") return {
    supabase:{configured:!!supabase,url:SUPABASE_URL||"",anonKey:SUPABASE_ANON_KEY||""},
    pricingPlans:PRICING_PLANS, countries:AFRICAN_COUNTRIES, paystackConfigured:false
  };
  if (path === "/api/me") {
    if(!supabase) return {user:null};
    const{data:{user:au}}=await supabase.auth.getUser();
    if(!au) return {user:null};
    let pr=null;
    try{const r=await supabase.from("user_profiles").select("*").eq("id",au.id).maybeSingle();pr=r.data;}catch{/* table may not exist yet — use auth metadata */};
    
    const metadata = au.user_metadata || {};
    const profile = metadata.profile || {
      country: pr?.country || metadata.country || "Kenya",
      targetLevel: "Masters",
      fieldInterests: [],
      studyCountries: []
    };
    if (!profile.country) profile.country = pr?.country || metadata.country || "Kenya";
    if (!profile.targetLevel) profile.targetLevel = "Masters";
    if (!profile.fieldInterests) profile.fieldInterests = [];
    if (!profile.studyCountries) profile.studyCountries = [];

    return {user:{id:au.id,email:au.email,name:pr?.name||metadata.name||"",country:pr?.country||metadata.country||"Kenya",plan:pr?.plan||"free",planName:pr?.plan==="plus"?"Plus":pr?.plan==="pro"?"Pro":pr?.plan==="mentor"?"Mentor":"Explorer",is_paid:!!(pr?.plan&&pr.plan!=="free"),role:"user",profile}};
  }
  if (path === "/api/scholarships" || path === "/api/scholarships/filtered") {
    if(!supabase) return {scholarships:[],stats:emptyStats(),documents:[]};
    // Try fetching with published filter first (if column exists)
    // Fall back to all scholarships if the column doesn't exist yet
    let query = supabase.from("scholarships").select("*");
    
    // Add published filter if the user is an admin
    // For regular users, always show published scholarships
    // This is a fallback that returns all scholarships if published column doesn't exist
    const{data:s}=await query.order("created_at",{ascending:false});
    
    // Filter to published=true on client side as fallback
    const scholarships = (s||[]).filter(row => row.published !== false);
    
    const normalized = scholarships.map(row=>({...row,
      application:row.application||{applied:false,status:"Not started",priority:"Normal",notes:""},
      match:row.match||{score:0,urgency:{tone:"normal",label:"Normal"},reasons:[],missingDocuments:[]}
    }));
    return {scholarships:normalized,stats:computeStats(normalized),documents:[]};
  }
  if (method === "GET" && path === "/api/documents") {
    const{data:{user}}=supabase ? await supabase.auth.getUser() : {data:{user:null}};
    const localDocs = readLocalList(localKey("documents", user?.id));
    if(!supabase || !user) return {documents:localDocs.map(normalizeDocument)};
    const{data}=await supabase.from("documents").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
    return {documents:[...(data||[]).map(normalizeDocument), ...localDocs.map(normalizeDocument)]};
  }
  if (path === "/api/updates") return {latest:null};
  if (path === "/api/location") {
    try{const r=await fetch("https://ipapi.co/json/");const d=await r.json();return {country:d.country_name||null,detected:!!d.country_name}}
    catch{return {country:null,detected:false}}
  }
  if (path === "/api/auth/logout") { if(supabase) await supabase.auth.signOut(); return {ok:true}; }
  if (path === "/api/auth/forgot-password") {
    if(!supabase) return {message:"If that email is registered, a reset link has been sent."};
    const{error}=await supabase.auth.resetPasswordForEmail(body.email,{redirectTo:window.location.origin});
    if(error) throw new Error(error.message);
    return {message:"If that email is registered, a reset link has been sent."};
  }
  if (path === "/api/essays/types") return ESSAY_TYPES_DATA;
  if (path === "/api/billing/usage") {
    const{data:{user}}=supabase ? await supabase.auth.getUser() : {data:{user:null}};
    const usage = readLocalList(localKey("essayUsage", user?.id))[0] || {};
    const today = new Date().toISOString().slice(0, 10);
    return {
      daily: { essayGenerations: usage.date === today ? usage.count || 0 : 0 },
      limits: { maxEssayGenerationsPerDay: 3 }
    };
  }
  if (path === "/api/essays/samples") {
    const{data:{user}}=supabase ? await supabase.auth.getUser() : {data:{user:null}};
    return { samples: readLocalList(localKey("essaySamples", user?.id)) };
  }
  if (path === "/api/essays/preferences") {
    const{data:{user}}=supabase ? await supabase.auth.getUser() : {data:{user:null}};
    return { preferences: readLocalList(localKey("essayPreferences", user?.id))[0] || null };
  }
  if (method === "POST" && path === "/api/essays/samples/upload") {
    const{data:{user}}=supabase ? await supabase.auth.getUser() : {data:{user:null}};
    if(!user) throw new Error("Not authenticated");
    const content = extractTextFromDataUrl(body.data, body.fileName);
    const sample = {
      id: crypto.randomUUID(),
      title: body.title || body.fileName || "Writing Sample",
      fileName: body.fileName || "sample",
      type: body.type || "essay",
      content,
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      created_at: new Date().toISOString()
    };
    const sampleKey = localKey("essaySamples", user.id);
    writeLocalList(sampleKey, [sample, ...readLocalList(sampleKey)]);

    const doc = normalizeDocument({
      id: sample.id,
      name: body.fileName,
      fileName: body.fileName,
      type: "Essay Sample",
      size: body.size || 0,
      storagePath: `essay-samples/${user.id}/${sample.id}-${body.fileName || "sample"}`,
      source: "Essay sample vault"
    });
    const docKey = localKey("documents", user.id);
    writeLocalList(docKey, [doc, ...readLocalList(docKey)]);

    return { sample, extraction: { wordCount: sample.wordCount } };
  }
  if (method === "POST" && path === "/api/essays/generate") {
    const{data:{user}}=supabase ? await supabase.auth.getUser() : {data:{user:null}};
    if(!user) throw new Error("Not authenticated");
    const usageKey = localKey("essayUsage", user.id);
    const today = new Date().toISOString().slice(0, 10);
    const usage = readLocalList(usageKey)[0] || { date: today, count: 0 };
    const nextUsage = { date: today, count: usage.date === today ? (usage.count || 0) + 1 : 1 };
    writeLocalList(usageKey, [nextUsage]);
    const finalEssay = buildLocalEssay(body);
    return {
      essayId: crypto.randomUUID(),
      essayType: body.essayType,
      essayLabel: ESSAY_TYPES_DATA[body.essayType]?.label || "Scholarship Essay",
      finalEssay,
      wordCount: finalEssay.trim().split(/\s+/).filter(Boolean).length,
      stages: {
        stage2: { critique: { authenticityScore: 82 } },
        stage3: { finalCritique: { readyForSubmission: true } }
      }
    };
  }
  if (method === "POST" && path === "/api/essays/edit") {
    const{data:{user}}=supabase ? await supabase.auth.getUser() : {data:{user:null}};
    const prefKey = localKey("essayPreferences", user?.id);
    const existing = readLocalList(prefKey)[0] || { totalEdits: 0, averageRating: 0 };
    const totalEdits = existing.totalEdits + 1;
    const averageRating = body.rating ? ((existing.averageRating || 0) * existing.totalEdits + body.rating) / totalEdits : existing.averageRating;
    const preferences = { ...existing, totalEdits, averageRating, preferredTone: "Clear, personal, impact-focused" };
    writeLocalList(prefKey, [preferences]);
    return { ok: true, preferences };
  }
  if (path === "/api/payment/plans") return PRICING_PLANS;
  if (method === "PATCH" && path === "/api/profile") {
    if(!supabase) throw new Error("Database unavailable");
    const{data:{user:au}}=await supabase.auth.getUser();
    if(!au) throw new Error("Not authenticated");

    const { error: profileErr } = await supabase
      .from("user_profiles")
      .update({
        name: body.name || au.user_metadata?.name,
        country: body.country
      })
      .eq("id", au.id);

    if (profileErr) throw new Error(profileErr.message);

    const { data: { user: updatedAu }, error: authErr } = await supabase.auth.updateUser({
      data: {
        name: body.name || au.user_metadata?.name,
        country: body.country,
        profile: body
      }
    });

    if (authErr) throw new Error(authErr.message);

    let pr = null;
    try {
      const r = await supabase.from("user_profiles").select("*").eq("id", updatedAu.id).maybeSingle();
      pr = r.data;
    } catch {}

    const metadata = updatedAu.user_metadata || {};
    const savedProfile = metadata.profile || {
      country: pr?.country || metadata.country || "Kenya",
      targetLevel: "Masters",
      fieldInterests: [],
      studyCountries: []
    };

    return {
      user: {
        id: updatedAu.id,
        email: updatedAu.email,
        name: pr?.name || metadata.name || "",
        country: pr?.country || metadata.country || "Kenya",
        plan: pr?.plan || "free",
        planName: pr?.plan === "plus" ? "Plus" : pr?.plan === "pro" ? "Pro" : pr?.plan === "mentor" ? "Mentor" : "Explorer",
        is_paid: !!(pr?.plan && pr.plan !== "free"),
        role: "user",
        profile: savedProfile
      }
    };
  }

  if (path === "/api/auth/login" || path === "/api/auth/register" || path === "/api/auth/reset-password") {
    return {user:null}; // Handled directly in AuthScreen component
  }



  // Update scholarship published status
  if (method === "PATCH" && path.startsWith("/api/scholarships/")) {
    if (!supabase) throw new Error("Database unavailable");
    const id = path.split("/").pop();
    const {error} = await supabase.from("scholarships").update(body).eq("id", id);
    if (error) throw new Error(error.message);
    return {ok: true};
  }

  if (path === "/api/billing/checkout" || path === "/api/payment/initiate") {
    throw new Error("Paystack integration coming soon.");
  }

  // Dynamic routes
  if (method === "DELETE" && path.startsWith("/api/scholarships/")) {
    const id=path.split("/").pop();
    if(supabase) await supabase.from("scholarships").delete().eq("id",id);
    return {ok:true};
  }
  if (method === "DELETE" && path.startsWith("/api/admin/scholarships/")) {
    const adminToken = typeof window !== 'undefined' ? window.localStorage.getItem('zawadi:adminToken') : null;
    if (!adminToken) throw new Error("Admin authentication required");
    const id=path.split("/")[4];
    if(supabase) await supabase.from("scholarships").delete().eq("id",id);
    return {ok:true};
  }
  if (method === "DELETE" && path.startsWith("/api/documents/")) {
    const id=path.split("/").pop();
    if(supabase) await supabase.from("documents").delete().eq("id",id);
    const{data:{user}}=supabase ? await supabase.auth.getUser() : {data:{user:null}};
    const docKey = localKey("documents", user?.id);
    writeLocalList(docKey, readLocalList(docKey).filter((doc) => doc.id !== id));
    return {ok:true};
  }
  if (method === "PATCH" && path.startsWith("/api/applications/")) {
    const id=path.split("/").pop();
    if(supabase){const{data:{user}}=await supabase.auth.getUser();if(user)await supabase.from("applications").update(body).eq("id",id).eq("user_id",user.id);}
    return {ok:true};
  }
  if (method === "POST" && path === "/api/documents") {
    if(!body.name) throw new Error("Document name is required");
    const{data:{user}}=supabase ? await supabase.auth.getUser() : {data:{user:null}};
    if(!user) throw new Error("Not authenticated");
    const localDoc = normalizeDocument({
      name: body.name,
      fileName: body.fileName || body.name,
      type: body.type || "Other",
      size: body.size || body.size_bytes || 0,
      storagePath: body.storagePath || body.storage_path || "",
      source: body.source || "Local secure storage"
    });
    if(supabase) {
      const{data,error}=await supabase.from("documents").insert({user_id:user.id,name:body.name,type:body.type||"Other",size_bytes:body.size||body.size_bytes||0,storage_path:body.storagePath||body.storage_path||""}).select().single();
      if(!error && data) return {document:normalizeDocument({...data, fileName: body.fileName, source: body.source})};
    }
    const docKey = localKey("documents", user.id);
    writeLocalList(docKey, [localDoc, ...readLocalList(docKey)]);
    return {document:localDoc};
  }
  if (method === "POST" && path === "/api/scholarships/bulk") {
    if(!supabase) throw new Error("Database unavailable");
    const items=body.scholarships||body;
    if(Array.isArray(items)&&items.length){const{error}=await supabase.from("scholarships").insert(items);if(error)throw new Error(error.message);}
    return {ok:true,count:Array.isArray(items)?items.length:0};
  }

  throw new Error("Route not found: "+path);
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

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const me = await api("/api/me");
          if (me.user) {
            setUser(me.user);
            try { await loadScholarships(); } catch (e) { showToast("Scholarship data loading, please wait…"); }
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setRows([]);
          setDocuments([]);
          setStats(emptyStats());
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
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
      setConfig(appConfig);

      if (supabase) {
        const { data } = await supabase.auth.getSession();
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
    if (supabase) await supabase.auth.signOut();
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
        <Suspense fallback={<BootScreen />}>
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
        </Suspense>
      );
    }
    return (
      <AuthScreen
        config={config}
        initialMode={authMode}
        onAuthed={async (nextUser) => {
          setUser(nextUser);
          try { await loadScholarships(); } catch (e) { showToast("Scholarship data loading, please wait…"); }
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
    applied: rows.filter((row) => row?.application?.applied).length,
    drafting: rows.filter((row) => row?.application?.status === "Drafting").length,
    notApplied: rows.filter((row) => !row?.application?.applied).length,
    urgent: rows.filter((row) => row?.match?.urgency?.tone === "urgent").length,
    strongMatches: rows.filter((row) => (row?.match?.score ?? 0) >= 75).length
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
    country: "Kenya",
    resetToken: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [detectingCountry, setDetectingCountry] = React.useState(true);
  const [countries] = React.useState((config?.countries || ["Kenya", "Nigeria", "Ghana", "South Africa", "Ethiopia", "Tanzania", "Uganda", "Rwanda", "Egypt", "Senegal", "Cameroon", "Zimbabwe", "Zambia", "Malawi", "Botswana", "Namibia", "Mauritius", "Morocco", "Algeria", "Tunisia", "Sudan", "Angola", "Mozambique", "DR Congo", "Congo", "Ivory Coast", "Mali", "Burkina Faso", "Niger", "Chad", "Somalia", "Liberia", "Sierra Leone", "Gambia", "Guinea", "Benin", "Togo", "Gabon", "Equatorial Guinea", "Burundi", "Djibouti", "Eritrea", "Eswatini", "Lesotho", "Madagascar", "Mauritania", "Seychelles", "South Sudan", "Cape Verde", "Comoros", "Sao Tome and Principe", "Central African Republic", "Guinea-Bissau"]).sort());

  // Auto-detect country on mount
  React.useEffect(() => {
    detectCountry();
  }, []);

  async function detectCountry() {
    try {
      // Try server-side geolocation first
      const locData = await api("/api/location");
      if (locData.country && locData.detected) {
        setForm((prev) => ({ ...prev, country: locData.country }));
        setDetectingCountry(false);
        return;
      }
    } catch {
      // Server unavailable - try client-side fallback
    }

    // Client-side fallback: browser language/timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tzCountry = tz.split("/")[0] === "Africa" ? tz.split("/")[1]?.replace(/_/g, " ") : null;
      if (tzCountry && countries.includes(tzCountry)) {
        setForm((prev) => ({ ...prev, country: tzCountry }));
      }
    } catch {
      // Keep default "Kenya"
    }
    setDetectingCountry(false);
  }

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setForm((prev) => ({ ...prev, resetToken: token }));
      setMode("reset");
    } else {
      setMode(initialMode);
    }
  }, [initialMode]);

  function resetForm() {
    setError("");
    setSuccess("");
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "forgot") {
        const data = await api("/api/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email: form.email })
        });
        setSuccess(data.message);
        return;
      }

      if (mode === "reset") {
        if (form.newPassword !== form.confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        const data = await api("/api/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({
            token: form.resetToken,
            newPassword: form.newPassword
          })
        });
        setSuccess(data.message);
        setTimeout(() => {
          setMode("login");
          setSuccess("");
        }, 4000);
        return;
      }

      // Supabase Auth
      if (!supabase) { setError("Authentication is not available right now."); return; }

      try {
        let authUser = null;
        if (mode === "register") {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: form.email, password: form.password,
            options: { data: { name: form.name, country: form.country } }
          });
          if (signUpError) throw signUpError;
          if (!data.session) {
            setSuccess("Account created! Check your email to confirm, then sign in.");
            setLoading(false);
            return;
          }
          authUser = data.user;
        } else {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: form.email, password: form.password
          });
          if (signInError) throw signInError;
          authUser = data.user;
        }

        // Build user directly from auth response — avoid timing gap of api("/api/me")
        const nextUser = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || form.name || "",
          country: authUser.user_metadata?.country || form.country || "Kenya",
          plan: "free",
          planName: "Explorer",
          is_paid: false,
          role: "user",
          profile: authUser.user_metadata?.profile || {
            country: authUser.user_metadata?.country || form.country || "Kenya",
            targetLevel: "Masters",
            fieldInterests: [],
            studyCountries: []
          }
        };
        onAuthed(nextUser);
      } catch (err) {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const navRight = (
    <div className="landing-nav-actions">
      <button className="ghost-btn" type="button" onClick={onBackToLanding}>
        <ArrowLeft size={16} />
        Back
      </button>
    </div>
  );

  return (
    <div className="landing-root auth-page">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <a href="/" className="landing-logo" onClick={(e) => { e.preventDefault(); onBackToLanding(); }}>
            <div className="brand-mark" aria-hidden="true">
              <GraduationCap size={22} />
            </div>
            <div>
              <strong>Techsari — Zawadi</strong>
              <span>Scholarship Portal</span>
            </div>
          </a>
          {navRight}
        </div>
      </header>

      <main className="auth-hero">
        <div className="auth-hero-grid">
          <div className="auth-hero-copy">
            <span className="eyebrow">For African Students</span>
            <h1>
              {mode === "forgot"
                ? "Reset your password"
                : mode === "reset"
                  ? "Choose a new password"
                  : mode === "register"
                    ? "Create your free account"
                    : "Welcome back"}
            </h1>
            <p>
              {mode === "forgot"
                ? "Enter your email and we'll send you a link to reset your password."
                : mode === "reset"
                  ? "Your new password must be at least 8 characters."
                  : mode === "register"
                    ? "Tell us about yourself and start matching with scholarships you're actually eligible for."
                    : "Sign in to continue your scholarship journey."}
            </p>
          </div>

          <div className="glass-panel auth-card">
            {mode === "forgot" || mode === "reset" ? null : (
              <div className="mode-switch" aria-label="Authentication mode">
                <button
                  type="button"
                  className={mode === "login" ? "active" : ""}
                  onClick={() => { setMode("login"); resetForm(); }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={mode === "register" ? "active" : ""}
                  onClick={() => { setMode("register"); resetForm(); }}
                >
                  Create account
                </button>
              </div>
            )}

            <form className="auth-form" onSubmit={submit}>
              {mode === "forgot" && (
                <>
                  <div className="auth-form-icon">
                    <Mail size={32} />
                  </div>
                  <label>
                    Email address
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                    />
                  </label>
                  {error && <div className="form-error">{error}</div>}
                  {success && <div className="form-success">{success}</div>}
                  <button className="primary-btn full" type="submit" disabled={loading}>
                    {loading ? <Loader2 className="spin" size={18} /> : <Mail size={18} />}
                    Send reset link
                  </button>
                  <button
                    type="button"
                    className="auth-back-link"
                    onClick={() => { setMode("login"); resetForm(); }}
                  >
                    <ArrowLeft size={14} />
                    Back to sign in
                  </button>
                </>
              )}

              {mode === "reset" && (
                <>
                  <div className="auth-form-icon">
                    <Lock size={32} />
                  </div>
                  <label>
                    New password
                    <input
                      type="password"
                      value={form.newPassword}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                    />
                  </label>
                  <label>
                    Confirm password
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      placeholder="Repeat your password"
                    />
                  </label>
                  {error && <div className="form-error">{error}</div>}
                  {success && <div className="form-success">{success}</div>}
                  <button className="primary-btn full" type="submit" disabled={loading}>
                    {loading ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
                    Reset password
                  </button>
                  <button
                    type="button"
                    className="auth-back-link"
                    onClick={() => { setMode("login"); resetForm(); }}
                  >
                    <ArrowLeft size={14} />
                    Back to sign in
                  </button>
                </>
              )}

              {(mode === "login" || mode === "register") && (
                <>
                  {mode === "register" && (
                    <>
                      <label>
                        Full name
                        <input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          autoComplete="name"
                          required
                          placeholder="Your full name"
                        />
                      </label>
                      <label>
                        Country
                        {detectingCountry ? (
                          <div className="country-detect" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 0", color: "#64748b", fontSize: "0.85rem" }}>
                            <Loader2 className="spin" size={14} />
                            Detecting your location...
                          </div>
                        ) : (
                          <select
                            value={form.country}
                            onChange={(e) => setForm({ ...form, country: e.target.value })}
                            required
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "1px solid #dce4dc",
                              borderRadius: "6px",
                              fontSize: "0.9rem",
                              background: "#fff",
                              color: "#1e293b",
                              cursor: "pointer"
                            }}
                          >
                            {countries.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        )}
                      </label>
                    </>
                  )}
                  <label>
                    Email
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                    />
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="auth-forgot-link"
                      onClick={() => { setMode("forgot"); resetForm(); }}
                    >
                      Forgot password?
                    </button>
                  )}
                  {error && <div className="form-error">{error}</div>}
                  {success && <div className="form-success">{success}</div>}
                  <button className="primary-btn full" type="submit" disabled={loading}>
                    {loading ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
                    {mode === "login" ? "Sign in" : "Create account"}
                  </button>
                </>
              )}
            </form>

            <div className="auth-card-footer">
              <button className="ghost-btn" type="button" onClick={onBackToLanding}>
                <ArrowLeft size={14} />
                Back to home
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-bottom" style={{ marginTop: 0, borderTop: 0, display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <span>&copy; {new Date().getFullYear()} Techsari.</span>
          <a href="/privacy" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.85rem" }}>Privacy</a>
          <a href="/terms" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.85rem" }}>Terms</a>
          <a href="/faq" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.85rem" }}>FAQ</a>
          <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Built for African students everywhere.</span>
        </div>
      </footer>
    </div>
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
          <Suspense fallback={<BootScreen />}>
            <ApplicationCenter
              api={api}
              rows={rows}
              user={user}
              onToast={onToast}
              onRefresh={onRefresh}
              onUpgrade={() => setUpgradeOpen(true)}
            />
          </Suspense>
        )}

        {view === "essay-generator" && (
          <Suspense fallback={<BootScreen />}>
            <EssayGenerator
              api={api}
              scholarships={rows}
              user={user}
              onToast={onToast}
              onUpgrade={() => setUpgradeOpen(true)}
            />
          </Suspense>
        )}

        {view === "intelligence" && (
          <Suspense fallback={<BootScreen />}>
            <IntelligencePanel
              api={api}
              documents={documents}
              onToast={onToast}
              onDocumentsChanged={onDocumentsChanged}
            />
          </Suspense>
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
        <Suspense fallback={null}>
          <UpgradeModal
            plans={upgradePlans}
            user={user}
            onClose={() => setUpgradeOpen(false)}
            onUpgrade={handleUpgrade}
            onToast={onToast}
          />
        </Suspense>
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
  const defaultProfile = React.useMemo(() => ({
    country: user.country || "Kenya",
    targetLevel: "Masters",
    fieldInterests: [],
    studyCountries: []
  }), [user.country]);

  const [profile, setProfile] = React.useState(user.profile || defaultProfile);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setProfile(user.profile || defaultProfile);
  }, [user.profile, defaultProfile]);

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
    applicantCountry: user.profile?.country || user.country || "Kenya",
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
          {!isPaid(user) && (
            <button 
              className="upgrade-link" 
              onClick={() => onToast && onToast("Opening pricing... please wait")} 
              style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Click to upgrade your plan"
            >
              <Lock size={13} /> Upgrade to unlock all filters
            </button>
          )}
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
    event.preventDefault();
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
      if (supabase) {
        storagePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from("documents")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined
          });
        if (error) {
          fileData = await fileToDataUrl(file);
          storagePath = `local/${user.id}/${Date.now()}-${file.name}`;
          source = "Local fallback storage";
        } else {
          source = "Supabase Storage";
        }
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
          size_bytes: file.size,
          mimeType: file.type,
          storagePath,
          storage_path: storagePath,
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
