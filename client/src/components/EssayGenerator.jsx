// Essay Generator Component
// 3-stage essay generation with voice analysis from user samples

import React from "react";
import {
  Sparkles, FileText, Loader2, Check, AlertTriangle, Upload,
  BookOpen, ChevronRight, RefreshCw, Eye, Download, Copy, X,
  Pencil, Brain, Star, CheckCircle2, Lock
} from "lucide-react";

const ESSAY_TYPE_LABELS = {
  personal_statement: "Personal Statement",
  statement_of_purpose: "Statement of Purpose",
  motivation_letter: "Motivation Letter",
  scholarship_essay: "Scholarship Essay",
  leadership_essay: "Leadership Essay",
  study_plan: "Study Plan"
};

export default function EssayGenerator({ api, scholarships = [], user, onToast, onUpgrade }) {
  const [essayTypes, setEssayTypes] = React.useState(null);
  const [selectedType, setSelectedType] = React.useState("personal_statement");
  const [selectedScholarship, setSelectedScholarship] = React.useState("");
  const [prompt, setPrompt] = React.useState("");
  const [maxWords, setMaxWords] = React.useState(1000);
  const [samples, setSamples] = React.useState([]);
  const [samplesLoading, setSamplesLoading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [activeStage, setActiveStage] = React.useState(null);
  const [uploadingSample, setUploadingSample] = React.useState(false);
  const [sampleFile, setSampleFile] = React.useState(null);
  const [sampleTitle, setSampleTitle] = React.useState("");
  const [generationCount, setGenerationCount] = React.useState(0);
  const [usageLoading, setUsageLoading] = React.useState(true);

  // Edit & learning state
  const [editedEssay, setEditedEssay] = React.useState("");
  const [hasEdited, setHasEdited] = React.useState(false);
  const [rating, setRating] = React.useState(null);
  const [feedback, setFeedback] = React.useState("");
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [editSaved, setEditSaved] = React.useState(false);
  const [preferences, setPreferences] = React.useState(null);

  const isFree = user?.plan === "free" && !user?.is_paid;
  const essayLimit = 1;
  const limitReached = isFree && generationCount >= essayLimit;

  // Load essay types, samples, and usage on mount
  React.useEffect(() => {
    loadEssayTypes();
    loadSamples();
    loadPreferences();
    loadUsage();
  }, []);

  async function loadUsage() {
    setUsageLoading(true);
    try {
      const data = await api("/api/billing/usage");
      setGenerationCount(data.monthly?.essayGenerations || 0);
    } catch {
      setGenerationCount(0);
    } finally {
      setUsageLoading(false);
    }
  }

  async function loadEssayTypes() {
    try {
      const data = await api("/api/essays/types");
      setEssayTypes(data.types);
    } catch {
      setEssayTypes(ESSAY_TYPE_LABELS); // fallback
    }
  }

  async function loadSamples() {
    setSamplesLoading(true);
    try {
      const data = await api("/api/essays/samples");
      setSamples(data.samples || []);
    } catch {
      setSamples([]);
    } finally {
      setSamplesLoading(false);
    }
  }

  async function loadPreferences() {
    try {
      const data = await api("/api/essays/preferences");
      setPreferences(data.preferences || null);
    } catch { /* ignore */ }
  }

  async function saveEdit() {
    if (!result || !hasEdited) return;
    setSavingEdit(true);
    try {
      const saved = await api("/api/essays/edit", {
        method: "POST",
        body: JSON.stringify({
          essayId: result.essayId,
          essayType: result.essayType || "personal_statement",
          originalText: result.finalEssay,
          editedText: editedEssay,
          feedback: feedback || "",
          rating: rating,
          scholarshipId: selectedScholarship || null
        })
      });
      setEditSaved(true);
      setHasEdited(false);
      setFeedback("");
      onToast("Edits saved! Your preferences have been updated ✓");
      await loadPreferences();
    } catch (err) {
      onToast("Error saving edits: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  }

  async function uploadSample() {
    if (!sampleFile) {
      setError("Choose an essay document to upload.");
      return;
    }
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const lowerName = sampleFile.name.toLowerCase();
    const hasAllowedExtension = [".pdf", ".docx"].some((ext) => lowerName.endsWith(ext));
    if (!allowed.includes(sampleFile.type) && !hasAllowedExtension) {
      setError("Upload an essay as PDF or DOCX.");
      return;
    }
    if (sampleFile.size > 10 * 1024 * 1024) {
      setError("Essay document is too large. Upload a file under 10 MB.");
      return;
    }
    setUploadingSample(true);
    setError("");
    try {
      const fileData = await fileToDataUrl(sampleFile);
      const data = await api("/api/essays/samples/upload", {
        method: "POST",
        body: JSON.stringify({
          fileName: sampleFile.name,
          mimeType: sampleFile.type,
          size: sampleFile.size,
          data: fileData,
          title: sampleTitle || sampleFile.name.replace(/\.[^.]+$/, ""),
          type: "essay"
        })
      });
      onToast(`Essay document uploaded: ${data.extraction?.wordCount || data.sample.wordCount} words extracted`);
      setSampleFile(null);
      setSampleTitle("");
      const input = document.getElementById("essay-sample-file");
      if (input) input.value = "";
      await loadSamples();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingSample(false);
    }
  }

  async function generate() {
    if (samples.length < 1) {
      setError("Upload at least 1 writing sample first — I need to learn your voice.");
      return;
    }

    if (limitReached) {
      onUpgrade?.();
      return;
    }

    setGenerating(true);
    setError("");
    setResult(null);
    setActiveStage(1);

    try {
      const data = await api("/api/essays/generate", {
        method: "POST",
        body: JSON.stringify({
          essayType: selectedType,
          scholarshipId: selectedScholarship || undefined,
          prompt: prompt || undefined,
          maxWords
        })
      });

      setResult(data);
      setGenerationCount((prev) => prev + 1);
      setActiveStage(null);
      onToast("Essay generated successfully ✓");
    } catch (err) {
      setError(err.message);
      setActiveStage(null);
    } finally {
      setGenerating(false);
    }
  }

  function copyEssay() {
    if (result?.finalEssay) {
      navigator.clipboard.writeText(result.finalEssay).then(() => {
        onToast("Essay copied to clipboard ✓");
      });
    }
  }

  const stageLabels = ["Analyzing Your Voice", "Generating Draft & Improving", "Final Polish"];

  return (
    <div className="essay-generator">
      <div className="panel-head">
        <div>
          <span className="eyebrow">AI Essay Generator</span>
          <h2>3-Stage Personalized Essays</h2>
        </div>
        <Sparkles size={22} color="var(--green)" />
      </div>

      <p className="helper-text">
        Upload essay documents you've authored before. Zawadi extracts the full text from PDF
        or DOCX files, stores the document, and uses it to learn your voice.
      </p>

      {/* Free tier limit banner */}
      {isFree && (
        <div className="free-tier-banner">
          <Lock size={16} />
          <span>
            Free plan: {generationCount}/{essayLimit} essay generated this month.{" "}
          </span>
          <button className="ghost-btn" onClick={onUpgrade}>
            Upgrade for unlimited essays
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Samples Section */}
      <section className="essay-section">
        <h3>
          <BookOpen size={18} />
          Your Writing Samples ({samples.length})
        </h3>

        {samplesLoading ? (
          <div className="loading-row"><Loader2 className="spin" size={16} /> Loading samples...</div>
        ) : samples.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={20} />
            <span>No writing samples yet. Upload at least 1 to begin.</span>
          </div>
        ) : (
          <div className="samples-list">
            {samples.map((s) => (
              <div key={s.id} className="sample-card">
                <div className="sample-header">
                  <FileText size={16} />
                  <strong>{s.title || "Writing Sample"}</strong>
                  <span className="sample-meta">{s.wordCount} words</span>
                </div>
                <p className="sample-preview">{(s.content || "").slice(0, 200)}...</p>
              </div>
            ))}
          </div>
        )}

        {/* Upload new sample */}
        <div className="sample-upload">
          <label className="file-drop compact-drop essay-file-drop">
            <Upload size={22} />
            <span>{sampleFile ? sampleFile.name : "Upload essay PDF or DOCX"}</span>
            <input
              id="essay-sample-file"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setSampleFile(e.target.files?.[0] || null)}
            />
          </label>
          <div className="sample-upload-row">
            <input
              placeholder="Title (optional)"
              value={sampleTitle}
              onChange={(e) => setSampleTitle(e.target.value)}
            />
            <button className="secondary-btn" onClick={uploadSample} disabled={uploadingSample || !sampleFile}>
              {uploadingSample ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
              Extract & Store
            </button>
          </div>
          <p className="helper-text compact-helper">
            Only essay-style documents are accepted here: personal statements, scholarship essays,
            statements of purpose, motivation letters, leadership essays, and study plans.
          </p>
        </div>
      </section>

      {/* Configuration */}
      <section className="essay-section">
        <h3><FileText size={18} /> Essay Configuration</h3>

        <div className="essay-config-grid">
          <label>
            Essay Type
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              {Object.entries(essayTypes || ESSAY_TYPE_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{typeof val === "string" ? val : val.label}</option>
              ))}
            </select>
          </label>

          <label>
            For Scholarship (optional)
            <select value={selectedScholarship} onChange={(e) => setSelectedScholarship(e.target.value)}>
              <option value="">General / Not specified</option>
              {scholarships.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          <label>
            Max Words
            <input type="number" value={maxWords} onChange={(e) => setMaxWords(Number(e.target.value))} min={300} max={3000} />
          </label>
        </div>

        <label>
          Specific Prompt or Question (optional)
          <textarea
            placeholder="If the scholarship has a specific essay question, paste it here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
        </label>
      </section>

      {/* Generate Button */}
      {limitReached ? (
        <button
          className="primary-btn full upgrade-btn"
          onClick={onUpgrade}
        >
          <Lock size={18} />
          Upgrade to generate more essays
        </button>
      ) : (
        <button
          className="primary-btn full"
          onClick={generate}
          disabled={generating || samples.length < 1}
        >
          {generating ? (
            <><Loader2 className="spin" size={18} /> Generating Essay...</>
          ) : (
            <><Sparkles size={18} /> Generate Personalized Essay</>
          )}
        </button>
      )}

      {samples.length < 1 && (
        <div className="form-error">Upload at least 1 writing sample above before generating.</div>
      )}

      {error && <div className="form-error">{error}</div>}

      {/* Stage Progress */}
      {generating && (
        <div className="stages-progress">
          {stageLabels.map((label, i) => (
            <div key={i} className={`stage-indicator ${activeStage === i + 1 ? "active" : activeStage && activeStage > i + 1 ? "done" : ""}`}>
              <div className="stage-dot">
                {activeStage > i + 1 ? <Check size={14} /> : activeStage === i + 1 ? <Loader2 className="spin" size={14} /> : i + 1}
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {result && !generating && (
        <section className="essay-result">
          <div className="result-header">
            <h3>
              <Sparkles size={18} />
              {ESSAY_TYPE_LABELS[result.essayType] || result.essayLabel} — {result.wordCount} words
            </h3>
            <div className="result-actions">
              <button className="quiet-btn" onClick={copyEssay}><Copy size={16} /> Copy</button>
            </div>
          </div>

          {/* Stage Summary */}
          <div className="stage-summary">
            <div className="stage-card">
              <strong>Stage 1</strong> <span>Draft Generated</span>
              <Check size={16} color="var(--green)" />
            </div>
            <ChevronRight size={16} color="var(--muted)" />
            <div className="stage-card">
              <strong>Stage 2</strong>
              <span>Critiqued &amp; Improved</span>
              {result.stages?.stage2?.critique && (
                <span className="score-badge">Auth: {result.stages.stage2.critique.authenticityScore}/100</span>
              )}
            </div>
            <ChevronRight size={16} color="var(--muted)" />
            <div className="stage-card">
              <strong>Stage 3</strong>
              <span>Polished &amp; Final</span>
              {result.stages?.stage3?.finalCritique?.readyForSubmission ? (
                <Check size={16} color="var(--green)" />
              ) : (
                <RefreshCw size={16} color="var(--gold)" />
              )}
            </div>
          </div>

          {/* Final Essay */}
          <div className="final-essay">
            <h4>Final Essay</h4>
            <div className="essay-content">
              {(result.finalEssay || "").split("\n").map((line, i) => {
                if (line.startsWith("# ")) return <h5 key={i}>{line.slice(2)}</h5>;
                if (line.startsWith("## ")) return <h5 key={i}>{line.slice(3)}</h5>;
                if (line.trim() === "") return <br key={i} />;
                return <p key={i}>{line}</p>;
              })}
            </div>
          </div>

          {/* Edit & Improve Section */}
          <section className="essay-section essay-edit-section">
            <h3><Pencil size={18} /> Review & Edit</h3>
            <p className="helper-text">
              Edit this essay to match your voice. Every edit is recorded — I'll learn your preferences
              and improve future essays based on your changes.
            </p>

            <textarea
              className="essay-edit-area"
              value={editedEssay || result.finalEssay}
              onChange={(e) => {
                setEditedEssay(e.target.value);
                setHasEdited(true);
              }}
              rows={16}
              placeholder="Edit the essay here to personalize it..."
            />

            <label>
              What did you change or why? (helps me learn)
              <input
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g., Make it more personal, add achievements, shorter paragraphs..."
              />
            </label>

            <div className="rating-row">
              <span>Rate this essay:</span>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`rating-btn ${rating >= n ? "active" : ""}`}
                    onClick={() => setRating(rating === n ? null : n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {rating && <span className="rating-label">{rating}/10</span>}
            </div>

            <button
              className="primary-btn"
              onClick={saveEdit}
              disabled={savingEdit || !hasEdited}
            >
              {savingEdit ? <Loader2 className="spin" size={16} /> : <Check size={16} />}
              Save Edits &amp; Learn Preferences
            </button>

            {editSaved && (
              <div className="edit-saved-msg">
                <CheckCircle2 size={16} color="var(--green)" />
                <span>Edit saved! Your preferences have been updated. Future essays will reflect your style.</span>
              </div>
            )}
          </section>

          {/* Learning Summary */}
          {preferences && preferences.totalEdits > 0 && (
            <section className="essay-section preference-summary">
              <h3><Brain size={18} /> Your Writing Preferences</h3>
              <p className="helper-text">
                The system has learned from {preferences.totalEdits} edit(s).
              </p>
              <div className="pref-grid">
                {preferences.preferredLength && (
                  <div className="pref-item">
                    <strong>Preferred Length</strong>
                    <span>~{preferences.preferredLength} words</span>
                  </div>
                )}
                {preferences.preferredTone && (
                  <div className="pref-item">
                    <strong>Preferred Tone</strong>
                    <span>{preferences.preferredTone}</span>
                  </div>
                )}
                {preferences.averageRating && (
                  <div className="pref-item">
                    <strong>Avg Rating</strong>
                    <span>{preferences.averageRating.toFixed(1)}/10</span>
                  </div>
                )}
                {preferences.wantsPersonalStories && (
                  <div className="pref-item">
                    <strong>Style</strong>
                    <span>Prefers personal stories</span>
                  </div>
                )}
                {preferences.wantsAchievementsHighlighted && (
                  <div className="pref-item">
                    <strong>Focus</strong>
                    <span>Highlights achievements</span>
                  </div>
                )}
                {preferences.wantsCommunityFocus && (
                  <div className="pref-item">
                    <strong>Theme</strong>
                    <span>Community impact</span>
                  </div>
                )}
              </div>
            </section>
          )}
        </section>
      )}
    </div>
  );
}
