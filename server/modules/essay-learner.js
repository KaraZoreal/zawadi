// Essay Learning System
// Tracks user edits, recommendations, and preferences to continuously improve essays.
//
// Core Loop:
//   1. AI generates essay (3-stage)
//   2. User reviews, edits, or provides feedback
//   3. System extracts patterns from edits (added content, removed phrases, tone shifts)
//   4. User preference profile is updated
//   5. Next generation incorporates all accumulated preferences
//
// Learning Dimensions:
//   - Tone preferences (formal vs warm, academic vs personal)
//   - Content preferences (what topics resonate, what to avoid)
//   - Structure preferences (paragraph length, section ordering)
//   - Vocabulary preferences (simple vs sophisticated)
//   - Phrase patterns (commonly added/removed phrases)
//   - Length preferences (shorter/longer than AI defaults)

import crypto from "node:crypto";

function nowIso() {
  return new Date().toISOString();
}

// What we track per edit
const EDIT_TYPES = {
  CONTENT_ADDED: "content_added",
  CONTENT_REMOVED: "content_removed",
  CONTENT_REWRITTEN: "content_rewritten",
  TONE_ADJUSTED: "tone_adjusted",
  LENGTH_REDUCED: "length_reduced",
  LENGTH_EXPANDED: "length_expanded",
  STRUCTURE_CHANGED: "structure_changed",
  FEEDBACK_GIVEN: "feedback_given",
  RATING: "rating"
};

// --- Edit Recording ---

function recordEdit(db, { userId, essayId, essayType, originalText, editedText, feedback = "", rating = null, scholarshipId = null }) {
  if (!db.essayEditHistory) db.essayEditHistory = [];

  // Detect what changed
  const changes = detectChanges(originalText, editedText);

  const edit = {
    id: crypto.randomUUID(),
    userId,
    essayId,
    essayType,
    scholarshipId,
    originalPreview: (originalText || "").slice(0, 500),
    editedPreview: (editedText || "").slice(0, 500),
    feedback: feedback || "",
    rating: rating || null,
    changes,
    editedAt: nowIso()
  };

  db.essayEditHistory.push(edit);

  // Update user's writing preferences
  updatePreferences(db, userId, edit);

  // Keep history manageable
  if (db.essayEditHistory.length > 5000) {
    db.essayEditHistory = db.essayEditHistory.slice(-3000);
  }

  return edit;
}

// --- Change Detection ---

function detectChanges(original, edited) {
  if (!original || !edited) return [];

  const changes = [];
  const origLines = original.split("\n").filter(Boolean);
  const editLines = edited.split("\n").filter(Boolean);

  // Detect length change
  const origWords = original.split(/\s+/).filter(Boolean).length;
  const editWords = edited.split(/\s+/).filter(Boolean).length;
  const wordDiff = editWords - origWords;

  if (Math.abs(wordDiff) > 20) {
    changes.push({
      type: wordDiff > 0 ? EDIT_TYPES.LENGTH_EXPANDED : EDIT_TYPES.LENGTH_REDUCED,
      delta: wordDiff,
      description: `${Math.abs(wordDiff)} words ${wordDiff > 0 ? "added" : "removed"}`
    });
  }

  // Detect sections added
  if (editLines.length > origLines.length + 3) {
    changes.push({
      type: EDIT_TYPES.CONTENT_ADDED,
      description: `${editLines.length - origLines.length} lines added`,
      detail: "User expanded content significantly"
    });
  }

  // Detect sections removed
  if (origLines.length > editLines.length + 3 && origLines.length > 0) {
    changes.push({
      type: EDIT_TYPES.CONTENT_REMOVED,
      description: `${origLines.length - editLines.length} lines removed`,
      detail: "User trimmed content"
    });
  }

  // Detect tone shifts (heuristic)
  const toneKeywords = {
    formal: ["furthermore", "moreover", "consequently", "thus", "hence", "thereby", "notwithstanding"],
    personal: ["i feel", "i believe", "my experience", "my journey", "personally", "in my view"],
    passionate: ["passion", "love", "driven", "dedicated", "committed", "deeply", "profound"],
    humble: ["humbled", "grateful", "honored", "privileged", "fortunate"]
  };

  for (const [tone, keywords] of Object.entries(toneKeywords)) {
    const origCount = keywords.filter((k) => original.toLowerCase().includes(k)).length;
    const editCount = keywords.filter((k) => edited.toLowerCase().includes(k)).length;
    const diff = editCount - origCount;

    if (Math.abs(diff) >= 2) {
      changes.push({
        type: EDIT_TYPES.TONE_ADJUSTED,
        tone,
        direction: diff > 0 ? "increased" : "decreased",
        delta: Math.abs(diff),
        description: `${tone} tone ${diff > 0 ? "strengthened" : "softened"}`
      });
    }
  }

  // Detect structural changes
  const origHeaders = original.match(/^#+\s/gm) || [];
  const editHeaders = edited.match(/^#+\s/gm) || [];
  if (origHeaders.length !== editHeaders.length) {
    changes.push({
      type: EDIT_TYPES.STRUCTURE_CHANGED,
      description: `Section structure changed (${origHeaders.length} → ${editHeaders.length} sections)`
    });
  }

  // Detect rewrite (significant overlap but not identical)
  if (original !== edited && changes.length === 0) {
    changes.push({
      type: EDIT_TYPES.CONTENT_REWRITTEN,
      description: "Content refined without major structural changes"
    });
  }

  return changes;
}

// --- Preference Learning ---

function updatePreferences(db, userId, edit) {
  if (!db.essayPreferences) db.essayPreferences = {};

  let prefs = db.essayPreferences[userId] || createDefaultPreferences();
  prefs.lastUpdated = nowIso();
  prefs.totalEdits = (prefs.totalEdits || 0) + 1;

  // Learn from changes
  for (const change of edit.changes || []) {
    switch (change.type) {
      case EDIT_TYPES.LENGTH_EXPANDED:
        prefs.preferredLength = Math.min(
          (prefs.preferredLength || 1000) + 100,
          3000
        );
        break;
      case EDIT_TYPES.LENGTH_REDUCED:
        prefs.preferredLength = Math.max(
          (prefs.preferredLength || 1000) - 100,
          300
        );
        break;
      case EDIT_TYPES.TONE_ADJUSTED:
        if (!prefs.tonePreferences) prefs.tonePreferences = {};
        prefs.tonePreferences[change.tone] = (prefs.tonePreferences[change.tone] || 0) + (change.direction === "increased" ? 1 : -1);
        break;
      case EDIT_TYPES.CONTENT_ADDED:
        prefs.likesExpansion = true;
        break;
      case EDIT_TYPES.CONTENT_REMOVED:
        prefs.likesConciseness = true;
        break;
    }
  }

  // Learn from feedback
  if (edit.feedback) {
    if (!prefs.feedbackHistory) prefs.feedbackHistory = [];
    prefs.feedbackHistory.push({
      text: edit.feedback,
      essayType: edit.essayType,
      date: nowIso()
    });

    // Extract keywords from feedback
    const feedbackLower = edit.feedback.toLowerCase();
    if (feedbackLower.includes("too formal") || feedbackLower.includes("less formal")) {
      prefs.preferredTone = "personal";
      prefs.avoidFormal = true;
    }
    if (feedbackLower.includes("too casual") || feedbackLower.includes("more professional")) {
      prefs.preferredTone = "formal";
      prefs.avoidCasual = true;
    }
    if (feedbackLower.includes("shorter") || feedbackLower.includes("too long")) {
      prefs.preferredLength = Math.max((prefs.preferredLength || 1000) - 200, 300);
    }
    if (feedbackLower.includes("more detail") || feedbackLower.includes("expand")) {
      prefs.preferredLength = Math.min((prefs.preferredLength || 1000) + 200, 3000);
      prefs.likesExpansion = true;
    }
    if (feedbackLower.includes("personal") || feedbackLower.includes("more personal")) {
      prefs.wantsPersonalStories = true;
    }
    if (feedbackLower.includes("achievement") || feedbackLower.includes("accomplishment")) {
      prefs.wantsAchievementsHighlighted = true;
    }
    if (feedbackLower.includes("community") || feedbackLower.includes("impact")) {
      prefs.wantsCommunityFocus = true;
    }

    // Track feedback history for pattern analysis
    if (prefs.feedbackHistory.length > 50) {
      prefs.feedbackHistory = prefs.feedbackHistory.slice(-30);
    }
  }

  // Learn from ratings
  if (edit.rating !== null) {
    if (!prefs.ratingHistory) prefs.ratingHistory = [];
    prefs.ratingHistory.push({
      rating: edit.rating,
      essayType: edit.essayType,
      date: nowIso()
    });
    prefs.averageRating = prefs.ratingHistory.reduce((sum, r) => sum + r.rating, 0) / prefs.ratingHistory.length;
  }

  db.essayPreferences[userId] = prefs;
}

function createDefaultPreferences() {
  return {
    createdAt: nowIso(),
    lastUpdated: nowIso(),
    totalEdits: 0,
    preferredLength: 1000,
    preferredTone: null,
    tonePreferences: {},
    likesExpansion: false,
    likesConciseness: false,
    avoidFormal: false,
    avoidCasual: false,
    wantsPersonalStories: false,
    wantsAchievementsHighlighted: false,
    wantsCommunityFocus: false,
    feedbackHistory: [],
    ratingHistory: [],
    averageRating: null,
    commonAdditions: [],
    commonRemovals: []
  };
}

// --- Preference Retrieval ---

function getUserPreferences(db, userId) {
  return db.essayPreferences?.[userId] || createDefaultPreferences();
}

// Generate a guidance string for the essay generator based on learned preferences
function buildPreferenceGuidance(preferences) {
  if (!preferences || preferences.totalEdits < 1) return null;

  const guidance = [];

  if (preferences.preferredTone) {
    guidance.push(`- PREFERRED TONE: ${preferences.preferredTone}`);
  }

  if (preferences.tonePreferences) {
    const topTones = Object.entries(preferences.tonePreferences)
      .sort(([, a], [, b]) => b - a)
      .filter(([, v]) => v > 0)
      .slice(0, 2);
    if (topTones.length > 0) {
      guidance.push(`- TONE PREFERENCES: ${topTones.map(([t]) => t).join(", ")}`);
    }
  }

  if (preferences.preferredLength) {
    guidance.push(`- PREFERRED LENGTH: ~${preferences.preferredLength} words`);
  }

  if (preferences.wantsPersonalStories) {
    guidance.push("- Include more personal stories and specific experiences");
  }

  if (preferences.wantsAchievementsHighlighted) {
    guidance.push("- Highlight specific achievements and accomplishments");
  }

  if (preferences.wantsCommunityFocus) {
    guidance.push("- Emphasize community impact and broader contributions");
  }

  if (preferences.likesExpansion) {
    guidance.push("- User prefers more detail — expand on key points");
  }

  if (preferences.likesConciseness) {
    guidance.push("- User prefers concise writing — avoid unnecessary elaboration");
  }

  if (preferences.avoidFormal) {
    guidance.push("- Avoid overly formal or academic tone");
  }

  if (preferences.avoidCasual) {
    guidance.push("- Maintain professional/academic tone, avoid casual language");
  }

  if (preferences.feedbackHistory?.length > 0) {
    const recent = preferences.feedbackHistory.slice(-3).map((f) => f.text);
    guidance.push(`- RECENT FEEDBACK: ${recent.join(" | ")}`);
  }

  if (preferences.averageRating !== null) {
    guidance.push(`- AVERAGE RATING: ${preferences.averageRating.toFixed(1)}/10 (${preferences.ratingHistory?.length || 0} ratings)`);
  }

  if (guidance.length === 0) return null;

  return [
    "USER PREFERENCES (learned from edits):",
    ...guidance,
    `Based on ${preferences.totalEdits} previous edits. Apply these preferences to every essay generated.`
  ].join("\n");
}

// Get edit history summary
function getEditHistorySummary(db, userId) {
  const history = (db.essayEditHistory || []).filter((e) => e.userId === userId);
  const prefs = getUserPreferences(db, userId);

  if (history.length === 0) {
    return {
      totalEdits: 0,
      message: "No edit history yet. Edit a generated essay to start building your preference profile."
    };
  }

  const byType = {};
  for (const edit of history) {
    byType[edit.essayType] = (byType[edit.essayType] || 0) + 1;
  }

  const recentEdits = history.slice(-5).reverse().map((e) => ({
    id: e.id,
    essayType: e.essayType,
    changes: e.changes?.map((c) => c.description) || [],
    feedback: e.feedback || null,
    rating: e.rating,
    date: e.editedAt
  }));

  // Extract top patterns
  const allChanges = history.flatMap((e) => e.changes || []);
  const changeCounts = {};
  for (const c of allChanges) {
    const key = c.description || c.type;
    changeCounts[key] = (changeCounts[key] || 0) + 1;
  }

  const topPatterns = Object.entries(changeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([pattern, count]) => ({ pattern, count }));

  return {
    totalEdits: history.length,
    byEssayType: byType,
    preferences: prefs,
    recentEdits,
    topPatterns,
    averageRating: prefs.averageRating,
    guidance: buildPreferenceGuidance(prefs),
    message: `${history.length} edits recorded. The system is learning your preferences.`
  };
}

export {
  EDIT_TYPES,
  recordEdit,
  getUserPreferences,
  buildPreferenceGuidance,
  getEditHistorySummary,
  createDefaultPreferences
};
