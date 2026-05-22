// Self-Learning System
// Tracks application outcomes, failures, and document gaps to continuously improve.
//
// The system learns across multiple dimensions:
//   1. Document gaps — what documents are most commonly missing across applications
//   2. Application failures — why applications failed, patterns in rejection reasons
//   3. Scholarship matching — which types of scholarships users succeed with
//   4. Essay effectiveness — which essay approaches yield better results
//   5. User behavior — what patterns lead to higher completion rates
//
// Learning feeds back into:
//   - Auto-apply engine: better field completion, smarter draft detection
//   - Document intelligence: better type detection from real-world examples
//   - Essay generator: improved style matching, better content targeting
//   - Recommendations: what the user should do next

import crypto from "node:crypto";

function nowIso() {
  return new Date().toISOString();
}

// Learning event types
const EVENT_TYPES = {
  APPLICATION_STARTED: "application_started",
  APPLICATION_DRAFTED: "application_drafted",
  APPLICATION_READY: "application_ready",
  APPLICATION_SUBMITTED: "application_submitted",
  APPLICATION_FAILED: "application_failed",
  APPLICATION_SUCCEEDED: "application_succeeded",

  DOCUMENT_UPLOADED: "document_uploaded",
  DOCUMENT_ANALYZED: "document_analyzed",
  DOCUMENT_GAP_DETECTED: "document_gap_detected",
  DOCUMENT_GAP_RESOLVED: "document_gap_resolved",

  ESSAY_GENERATED: "essay_generated",
  ESSAY_EDITED: "essay_edited",
  ESSAY_USED: "essay_used",

  SCHOLARSHIP_VIEWED: "scholarship_viewed",
  SCHOLARSHIP_SAVED: "scholarship_saved",
  SCHOLARSHIP_MATCHED: "scholarship_matched",
  SCHOLARSHIP_MISMATCHED: "scholarship_mismatched",

  ISSUE_ENCOUNTERED: "issue_encountered",
  ISSUE_RESOLVED: "issue_resolved",
  ISSUE_BLOCKED: "issue_blocked",

  USER_ACTION: "user_action",
  SYSTEM_IMPROVEMENT: "system_improvement"
};

// Record a learning event
function recordEvent(db, { userId, type, scholarshipId, data = {}, metadata = {} }) {
  const event = {
    id: crypto.randomUUID(),
    userId: userId || "system",
    type,
    scholarshipId: scholarshipId || null,
    data,
    metadata: {
      ...metadata,
      userCountry: metadata.userCountry || null,
      plan: metadata.plan || null,
      source: metadata.source || "system"
    },
    timestamp: nowIso()
  };

  if (!db.learningLog) db.learningLog = [];
  db.learningLog.push(event);

  // Keep only last 10,000 events to prevent unbounded growth
  if (db.learningLog.length > 10000) {
    db.learningLog = db.learningLog.slice(-8000);
  }

  return event;
}

// Analyze learning data to derive actionable insights
function analyzeLearningData(learningLog = []) {
  if (!learningLog || learningLog.length === 0) {
    return {
      ready: false,
      message: "Not enough data for learning analysis. Events accumulate as you use the platform.",
      eventsAnalyzed: 0
    };
  }

  const recent = learningLog.slice(-500); // Last 500 events
  const byType = {};
  const byScholarship = {};
  const documentGaps = {};
  const failureReasons = {};
  const resolvedIssues = [];
  const blockedIssues = [];

  for (const event of recent) {
    // Count by event type
    byType[event.type] = (byType[event.type] || 0) + 1;

    // Track per-scholarship activity
    if (event.scholarshipId) {
      byScholarship[event.scholarshipId] = byScholarship[event.scholarshipId] || { events: 0, types: {} };
      byScholarship[event.scholarshipId].events++;
      byScholarship[event.scholarshipId].types[event.type] = (byScholarship[event.scholarshipId].types[event.type] || 0) + 1;
    }

    // Document gaps
    if (event.type === EVENT_TYPES.DOCUMENT_GAP_DETECTED && event.data.document) {
      const doc = event.data.document;
      documentGaps[doc] = (documentGaps[doc] || 0) + 1;
    }

    // Failure analysis
    if (event.type === EVENT_TYPES.APPLICATION_FAILED && event.data.reason) {
      failureReasons[event.data.reason] = (failureReasons[event.data.reason] || 0) + 1;
    }

    // Issue tracking
    if (event.type === EVENT_TYPES.ISSUE_RESOLVED && event.data.field) {
      resolvedIssues.push({
        field: event.data.field,
        resolvedAt: event.timestamp,
        scholarshipId: event.scholarshipId
      });
    }

    if (event.type === EVENT_TYPES.ISSUE_BLOCKED && event.data.field) {
      blockedIssues.push({
        field: event.data.field,
        blockedAt: event.timestamp,
        scholarshipId: event.scholarshipId
      });
    }
  }

  // Generate insights
  const insights = [];

  // Most common document gaps
  const topGaps = Object.entries(documentGaps)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  if (topGaps.length > 0) {
    insights.push({
      type: "document_gap_pattern",
      title: "Common Missing Documents",
      description: "Documents most frequently missing across applications",
      data: topGaps.map(([doc, count]) => ({ document: doc, occurrences: count })),
      recommendation: `Upload your ${topGaps[0][0]} — it's the most commonly required document.`
    });
  }

  // Most common failure reasons
  const topFailures = Object.entries(failureReasons)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  if (topFailures.length > 0) {
    insights.push({
      type: "failure_pattern",
      title: "Common Application Issues",
      description: "Reasons applications most frequently encounter problems",
      data: topFailures.map(([reason, count]) => ({ reason, occurrences: count })),
      recommendation: `Watch out for: ${topFailures[0][0]}. Double-check this before submitting.`
    });
  }

  // Blocked vs resolved ratio
  const blockRate = blockedIssues.length > 0
    ? Math.round((blockedIssues.length / (blockedIssues.length + resolvedIssues.length)) * 100)
    : 0;

  if (blockedIssues.length > 0) {
    // Most blocked fields
    const blockerFields = {};
    for (const issue of blockedIssues) {
      blockerFields[issue.field] = (blockerFields[issue.field] || 0) + 1;
    }
    const topBlockers = Object.entries(blockerFields)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    insights.push({
      type: "blocker_pattern",
      title: "Frequent Blocker Fields",
      description: "Application fields that most often block auto-submission",
      data: topBlockers.map(([field, count]) => ({ field, times: count })),
      recommendation: topBlockers.length > 0
        ? `Ensure your ${topBlockers[0][0].replace(/_/g, " ")} is complete before applying.`
        : ""
    });
  }

  // Application readiness stats
  const appsReady = byType[EVENT_TYPES.APPLICATION_READY] || 0;
  const appsDrafted = byType[EVENT_TYPES.APPLICATION_DRAFTED] || 0;
  const appsSubmitted = byType[EVENT_TYPES.APPLICATION_SUBMITTED] || 0;
  const totalApps = appsReady + appsDrafted + appsSubmitted;

  return {
    ready: true,
    eventsAnalyzed: recent.length,
    totalEvents: learningLog.length,
    byEventType: byType,
    insights,
    applicationStats: {
      total: totalApps,
      drafted: appsDrafted,
      ready: appsReady,
      submitted: appsSubmitted,
      draftRate: totalApps > 0 ? Math.round((appsDrafted / totalApps) * 100) : 0,
      readyRate: totalApps > 0 ? Math.round((appsReady / totalApps) * 100) : 0,
      submissionRate: totalApps > 0 ? Math.round((appsSubmitted / totalApps) * 100) : 0
    },
    blockerRate: blockRate,
    topDocumentGaps: topGaps.map(([doc, count]) => ({ document: doc, count })),
    topFailureReasons: topFailures.map(([reason, count]) => ({ reason, count }))
  };
}

// Generate personalized recommendations based on learning data
function generateRecommendations(learningData, user, userDocuments = []) {
  const recommendations = [];

  // Check document gaps
  if (learningData.topDocumentGaps?.length > 0) {
    for (const gap of learningData.topDocumentGaps.slice(0, 2)) {
      const userHas = userDocuments.some(
        (d) => (d.detectedType || d.type || "").toLowerCase().includes(gap.document.toLowerCase())
      );
      if (!userHas) {
        recommendations.push({
          priority: "high",
          action: "upload_document",
          title: `Upload ${gap.document}`,
          description: `${gap.document} is the most commonly required document. Adding this will unlock more applications.`,
          field: gap.document
        });
      }
    }
  }

  // Check for blockers
  if (learningData.insights) {
    const blockerInsight = learningData.insights.find((i) => i.type === "blocker_pattern");
    if (blockerInsight && blockerInsight.data?.length > 0) {
      for (const blocker of blockerInsight.data.slice(0, 1)) {
        recommendations.push({
          priority: "medium",
          action: "complete_field",
          title: `Complete ${blocker.field.replace(/_/g, " ")}`,
          description: `This field frequently blocks applications. Fill it in your profile to avoid drafts.`,
          field: blocker.field
        });
      }
    }
  }

  // Application readiness tip
  if (learningData.applicationStats && learningData.applicationStats.draftRate > 50) {
    recommendations.push({
      priority: "medium",
      action: "review_drafts",
      title: `${learningData.applicationStats.drafted} applications are in draft`,
      description: "Review your draft applications — most issues can be resolved by uploading the missing documents.",
    });
  }

  // Essay generation tip
  const essayEvents = learningData.byEventType?.[EVENT_TYPES.ESSAY_GENERATED] || 0;
  if (essayEvents === 0 && learningData.topDocumentGaps?.some((g) =>
    ["essay", "personal statement", "statement of purpose", "motivation letter"].includes(g.document.toLowerCase())
  )) {
    recommendations.push({
      priority: "high",
      action: "generate_essay",
      title: "Essays needed for applications",
      description: "Upload 2-3 writing samples and use the Essay Generator to create personalized essays for your applications.",
    });
  }

  return recommendations;
}

// Update the system's knowledge from resolved issues
function learnFromResolution(learningLog, resolvedField, scholarshipId) {
  // Track that a particular field was resolved — helps predict future issues
  const relatedEvents = learningLog.filter(
    (e) => e.type === EVENT_TYPES.ISSUE_ENCOUNTERED && e.data?.field === resolvedField
  );

  const resolutionTime = relatedEvents.length > 0
    ? `Field "${resolvedField}" has been an issue ${relatedEvents.length} times before.`
    : `Field "${resolvedField}" resolved — first occurrence tracked.`;

  return {
    field: resolvedField,
    history: relatedEvents.length,
    insight: resolutionTime,
    recommendation: relatedEvents.length >= 3
      ? `Consider pre-filling "${resolvedField}" in your profile to prevent future issues.`
      : null
  };
}

export {
  EVENT_TYPES,
  recordEvent,
  analyzeLearningData,
  generateRecommendations,
  learnFromResolution
};
