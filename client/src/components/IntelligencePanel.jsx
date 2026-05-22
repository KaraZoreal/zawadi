// Document Intelligence Panel
// Shows what document types were detected, confidence, and gap analysis

import React from "react";
import {
  FileCheck2, Search, Loader2, Check, AlertTriangle,
  Brain, FileText, ShieldCheck, Eye, BarChart3, X
} from "lucide-react";

const TYPE_ICONS = {
  cv: FileText,
  transcript: FileText,
  passport: ShieldCheck,
  national_id: ShieldCheck,
  essay: FileText,
  motivation_letter: FileText,
  statement_of_purpose: FileText,
  references: FileCheck2,
  certificate: FileCheck2,
  admission_letter: FileText,
  financial_evidence: FileText,
  other: FileText
};

const TYPE_COLORS = {
  cv: "var(--blue)",
  transcript: "var(--green)",
  passport: "var(--gold)",
  national_id: "var(--gold)",
  essay: "var(--blue)",
  motivation_letter: "var(--blue)",
  statement_of_purpose: "var(--blue)",
  references: "var(--green)",
  certificate: "var(--green)",
  admission_letter: "var(--green)",
  financial_evidence: "var(--rust)",
  other: "var(--muted)"
};

export default function IntelligencePanel({ api, documents = [], onToast, onDocumentsChanged }) {
  const [analyzing, setAnalyzing] = React.useState(false);
  const [results, setResults] = React.useState(null);
  const [selectedDoc, setSelectedDoc] = React.useState(null);
  const [manualFile, setManualFile] = React.useState(null);
  const [singleResult, setSingleResult] = React.useState(null);
  const [singleAnalyzing, setSingleAnalyzing] = React.useState(false);

  async function analyzeAll() {
    if (documents.length === 0) {
      onToast("No documents to analyze. Upload documents first.");
      return;
    }
    setAnalyzing(true);
    try {
      const data = await api("/api/documents/analyze-batch", { method: "POST" });
      setResults(data.results);
      onToast(`${data.results.length} documents analyzed ✓`);
      if (onDocumentsChanged) {
        // Refresh documents from API
        const docsData = await api("/api/documents");
        onDocumentsChanged(docsData.documents || []);
      }
    } catch (err) {
      onToast("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function analyzeSingle(fileName, mimeType, contentText) {
    setSingleAnalyzing(true);
    try {
      const data = await api("/api/documents/analyze", {
        method: "POST",
        body: JSON.stringify({ fileName, mimeType, contentText })
      });
      setSingleResult(data);
    } catch (err) {
      onToast("Analysis failed: " + err.message);
    } finally {
      setSingleAnalyzing(false);
    }
  }

  function confidenceColor(score) {
    if (score >= 80) return "var(--green)";
    if (score >= 50) return "var(--gold)";
    return "var(--rust)";
  }

  function confidenceLabel(score) {
    if (score >= 80) return "High";
    if (score >= 50) return "Medium";
    return "Low";
  }

  return (
    <div className="intelligence-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Document Intelligence</span>
          <h2>Smart Document Recognition</h2>
        </div>
        <Brain size={22} color="var(--green)" />
      </div>

      <p className="helper-text">
        The system auto-detects document types regardless of naming conventions or country-specific formats.
        It can identify transcripts, CVs, passports, national IDs, essays, and more.
      </p>

      {/* Batch Analysis */}
      <div className="analyze-actions">
        <button className="primary-btn" onClick={analyzeAll} disabled={analyzing || documents.length === 0}>
          {analyzing ? <Loader2 className="spin" size={18} /> : <Search size={18} />}
          Analyze All Documents ({documents.length})
        </button>
      </div>

      {/* Document List */}
      <section className="doc-intel-list">
        <h3><FileCheck2 size={18} /> Your Documents</h3>

        {documents.length === 0 ? (
          <div className="empty-state">
            <FileText size={20} />
            <span>No documents uploaded yet. Upload documents in the Document Vault.</span>
          </div>
        ) : (
          <div className="doc-cards">
            {documents.map((doc) => {
              const detected = doc.detectedType || (results?.find((r) => r.documentId === doc.id)?.detectedType);
              const confidence = doc.confidence || (results?.find((r) => r.documentId === doc.id)?.confidence) || 0;
              const Icon = TYPE_ICONS[detected] || FileText;
              const color = TYPE_COLORS[detected] || "var(--muted)";

              return (
                <div key={doc.id} className="doc-intel-card" onClick={() => setSelectedDoc(doc)}>
                  <div className="doc-intel-icon" style={{ background: color }}>
                    <Icon size={20} color="white" />
                  </div>
                  <div className="doc-intel-info">
                    <strong>{doc.name || doc.fileName || "Document"}</strong>
                    <span className="doc-intel-type">
                      {detected ? (
                        <span style={{ color }}>
                          {detected.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          {confidence > 0 && (
                            <span className="confidence-badge" style={{ background: confidenceColor(confidence) }}>
                              {confidenceLabel(confidence)} ({confidence}%)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="not-analyzed">Not analyzed — click Analyze All</span>
                      )}
                    </span>
                  </div>
                  <ChevronRight size={16} color="var(--muted)" />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Results Summary */}
      {results && (
        <section className="analysis-summary">
          <h3><BarChart3 size={18} /> Analysis Summary</h3>
          <div className="summary-grid">
            {results.slice(0, 6).map((r) => (
              <div key={r.documentId} className="summary-item">
                <span className="summary-filename">{r.fileName}</span>
                <span className="summary-type" style={{ color: TYPE_COLORS[r.detectedType] || "var(--muted)" }}>
                  {r.readableType}
                </span>
                <span className="summary-confidence" style={{ color: confidenceColor(r.confidence) }}>
                  {r.confidence}% — {r.detectionMethod}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Manual Single Analysis */}
      <section className="manual-analyze">
        <h3><Search size={18} /> Quick Check</h3>
        <div className="manual-row">
          <input
            placeholder="File name (e.g., my_cv.pdf)"
            onChange={(e) => setManualFile({ ...manualFile, fileName: e.target.value })}
          />
          <input
            placeholder="Optional: paste text content"
            onChange={(e) => setManualFile({ ...manualFile, contentText: e.target.value })}
          />
          <button
            className="secondary-btn"
            onClick={() => manualFile?.fileName && analyzeSingle(manualFile.fileName, "", manualFile.contentText || "")}
            disabled={singleAnalyzing || !manualFile?.fileName}
          >
            {singleAnalyzing ? <Loader2 className="spin" size={16} /> : <Search size={16} />}
            Check
          </button>
        </div>
        {singleResult && (
          <div className="quick-result">
            <span style={{ color: TYPE_COLORS[singleResult.detectedType] || "var(--muted)" }}>
              {singleResult.readableType}
            </span>
            <span style={{ color: confidenceColor(singleResult.confidence) }}>
              {singleResult.confidence}% confidence
            </span>
            {singleResult.aiAnalysis && <span className="ai-note">AI: {singleResult.aiAnalysis}</span>}
          </div>
        )}
      </section>
    </div>
  );
}
