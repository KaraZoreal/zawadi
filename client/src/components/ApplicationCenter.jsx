// Application Center Component
// Auto-apply dashboard, draft manager, alert center

import React from "react";
import {
  Zap, FileWarning, CheckCircle2, AlertTriangle, Clock,
  Loader2, ChevronRight, Eye, X, Send, Copy, FileText
} from "lucide-react";

export default function ApplicationCenter({ api, rows = [], onToast, onRefresh }) {
  const [applying, setApplying] = React.useState(false);
  const [batchApplying, setBatchApplying] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [results, setResults] = React.useState(null);
  const [alerts, setAlerts] = React.useState([]);
  const [activeResult, setActiveResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      const data = await api("/api/alerts");
      setAlerts(data.alerts || []);
    } catch { /* ignore */ }
  }

  async function applySingle(scholarshipId) {
    setApplying(true);
    try {
      const data = await api(`/api/apply/${scholarshipId}`, { method: "POST" });
      setActiveResult(data);
      onToast(data.canProceed ? "Application ready for review ✓" : "Application saved as draft — check alerts");
      await loadAlerts();
      if (onRefresh) await onRefresh();
    } catch (err) {
      onToast("Error: " + err.message);
    } finally {
      setApplying(false);
    }
  }

  async function applyBatch() {
    if (selectedIds.length === 0) {
      onToast("Select scholarships to apply to first");
      return;
    }
    setBatchApplying(true);
    try {
      const data = await api("/api/apply/batch", {
        method: "POST",
        body: JSON.stringify({ scholarshipIds: selectedIds })
      });
      setResults(data);
      onToast(`${data.summary.ready} ready, ${data.summary.drafts} drafts`);
      await loadAlerts();
      if (onRefresh) await onRefresh();
    } catch (err) {
      onToast("Error: " + err.message);
    } finally {
      setBatchApplying(false);
    }
  }

  async function acknowledgeAlert(alertId) {
    try {
      await api(`/api/alerts/${alertId}/acknowledge`, { method: "PATCH" });
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      onToast("Alert acknowledged");
    } catch { /* ignore */ }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  const drafts = rows.filter((r) => r.application.status === "Drafting");
  const ready = rows.filter((r) => r.application.status === "Ready");
  const notStarted = rows.filter((r) => r.application.status === "Not started");

  return (
    <div className="app-center">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Application Center</span>
          <h2>Auto-Apply &amp; Draft Manager</h2>
        </div>
        <Zap size={22} color="var(--green)" />
      </div>

      <p className="helper-text">
        The system fills application forms automatically using your profile and documents.
        When something is missing, the application is saved as a draft with specific alerts.
      </p>

      {/* Stats Bar */}
      <div className="app-stats-bar">
        <div className="app-stat">
          <strong>{ready.length}</strong>
          <span>Ready</span>
        </div>
        <div className="app-stat draft">
          <strong>{drafts.length}</strong>
          <span>Drafts</span>
        </div>
        <div className="app-stat">
          <strong>{notStarted.length}</strong>
          <span>Available</span>
        </div>
        <div className="app-stat alert">
          <strong>{alerts.length}</strong>
          <span>Alerts</span>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <section className="alerts-section">
          <h3><AlertTriangle size={18} /> Alerts ({alerts.length})</h3>
          <div className="alerts-list">
            {alerts.slice(0, 8).map((alert) => (
              <div key={alert.id} className={`alert-card ${alert.type}`}>
                <div className="alert-header">
                  {alert.type === "blocker" ? <X size={16} color="var(--danger)" /> :
                   alert.type === "warning" ? <AlertTriangle size={16} color="var(--gold)" /> :
                   <FileText size={16} color="var(--blue)" />}
                  <strong>{alert.title}</strong>
                  <span className="alert-scholarship">{alert.scholarshipName}</span>
                </div>
                <p>{alert.message}</p>
                <div className="alert-actions">
                  <span className="alert-fix">Fix: {alert.fix}</span>
                  <button className="quiet-btn" onClick={() => acknowledgeAlert(alert.id)}>
                    <CheckCircle2 size={14} /> Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Scholarship List for Auto-Apply */}
      <section className="apply-list-section">
        <div className="panel-head">
          <h3>Scholarships</h3>
          <div className="apply-actions">
            <button
              className="secondary-btn"
              onClick={applyBatch}
              disabled={batchApplying || selectedIds.length === 0}
            >
              {batchApplying ? <Loader2 className="spin" size={16} /> : <Zap size={16} />}
              Auto-Apply ({selectedIds.length})
            </button>
          </div>
        </div>

        <div className="scholarship-apply-list">
          {rows.slice(0, 30).map((row) => {
            const isDraft = row.application.status === "Drafting";
            const isReady = row.application.status === "Ready";
            const isSelected = selectedIds.includes(row.id);

            return (
              <div key={row.id} className={`apply-row ${isDraft ? "draft" : ""} ${isReady ? "ready" : ""} ${isSelected ? "selected" : ""}`}>
                <label className="apply-check">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(row.id)}
                  />
                </label>

                <div className="apply-info">
                  <strong>{row.name}</strong>
                  <span className="apply-meta">
                    {row.match.score}% match · {(row.requiredDocuments || []).length} docs required
                    {isDraft && <span className="tag draft-tag">Draft</span>}
                    {isReady && <span className="tag ready-tag">Ready</span>}
                  </span>
                </div>

                <div className="apply-actions">
                  <button
                    className="secondary-btn"
                    onClick={() => applySingle(row.id)}
                    disabled={applying}
                  >
                    {applying ? <Loader2 size={14} className="spin" /> : <Zap size={14} />}
                    Auto-Apply
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Result Detail Modal */}
      {activeResult && (
        <div className="modal-backdrop" onClick={() => setActiveResult(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                {activeResult.canProceed ? <CheckCircle2 size={20} color="var(--green)" /> : <FileWarning size={20} color="var(--gold)" />}
                {activeResult.canProceed ? "Application Ready" : "Application Drafted"}
              </h3>
              <button className="icon-btn" onClick={() => setActiveResult(null)}><X size={18} /></button>
            </div>

            <p className="result-summary">{activeResult.summary}</p>

            {activeResult.application?.draft && (
              <div className="draft-preview">
                <h4>Filled Application Form</h4>
                {Object.entries(activeResult.application.draft).map(([section, fields]) => {
                  if (section.startsWith("_issue_")) return null;
                  if (typeof fields !== "object") return null;
                  return (
                    <div key={section} className="draft-section">
                      <strong>{section.replace(/([A-Z])/g, " $1").trim()}</strong>
                      {Object.entries(fields).map(([key, val]) => (
                        <div key={key} className="draft-field">
                          <span className="draft-key">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                          <span className={`draft-val ${String(val).includes("MISSING") || String(val).includes("NOT PROVIDED") ? "missing" : ""}`}>
                            {String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {activeResult.application?.gaps?.issues?.length > 0 && (
              <div className="gaps-list">
                <h4>Issues to Resolve ({activeResult.application.gaps.issues.length})</h4>
                {activeResult.application.gaps.issues.map((issue, i) => (
                  <div key={i} className={`gap-item ${issue.severity}`}>
                    <strong>{issue.label}</strong>
                    <p>{issue.message}</p>
                    <span className="gap-fix">{issue.fix}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button className="quiet-btn" onClick={() => setActiveResult(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
