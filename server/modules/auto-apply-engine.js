// Auto-Apply Engine
// Manages automated scholarship application form-filling with draft support.
// When issues arise during auto-application, saves as draft and alerts the user
// with specific details about what needs attention.
//
// Key behaviors:
// - Attempts to fill all known fields from user profile + documents
// - When a required field can't be filled, marks as DRAFT and alerts
// - Each application gets a detailed log of what was filled vs what's missing
// - Supports human-in-the-loop: applicants review drafts before submission

import crypto from "node:crypto";
import { aiConfigured, chatCompletion, buildSystemPrompt, buildUserPrompt } from "./ai-client.js";
import { checkDocumentGap } from "./document-intelligence.js";

// Standard scholarship application form fields
const APPLICATION_FIELDS = {
  personal: [
    "firstName", "middleName", "lastName", "fullName",
    "dateOfBirth", "placeOfBirth", "nationality", "countryOfResidence",
    "gender", "maritalStatus", "passportNumber", "nationalIdNumber",
    "email", "phoneNumber", "physicalAddress", "postalAddress"
  ],
  academic: [
    "highestDegree", "degreeTitle", "university", "graduationYear",
    "gpa", "cgpa", "classOfDegree", "major", "minor",
    "institutionCountry", "transcriptAvailable", "degreeCertificateAvailable"
  ],
  program: [
    "desiredProgram", "desiredDegree", "desiredUniversity", "desiredCountry",
    "researchArea", "proposedThesis", "studyStartYear", "studyDuration"
  ],
  language: [
    "englishProficiency", "toeflScore", "ieltsScore", "otherLanguages",
    "englishTestDate", "languageCertificateAvailable"
  ],
  experience: [
    "workExperience", "yearsOfExperience", "currentEmployer", "currentPosition",
    "relevantExperience", "leadershipRoles", "volunteerExperience"
  ],
  documents: [
    "cvUploaded", "transcriptUploaded", "passportUploaded", "essayUploaded",
    "referencesUploaded", "motivationLetterUploaded", "certificatesUploaded",
    "financialEvidenceUploaded"
  ],
  essays: [
    "personalStatement", "motivationLetter", "researchProposal",
    "scholarshipEssay", "studyPlan"
  ],
  referees: [
    "referee1Name", "referee1Email", "referee1Position", "referee1Institution",
    "referee2Name", "referee2Email", "referee2Position", "referee2Institution"
  ],
  additional: [
    "financialNeedStatement", "sponsorDetails", "previousScholarships",
    "disabilityDisclosure", "specialCircumstances", "additionalInfo"
  ]
};

const ALL_FIELDS = Object.values(APPLICATION_FIELDS).flat();

// Application statuses specific to auto-apply
const AUTO_APPLY_STATUSES = {
  NOT_STARTED: "not_started",
  ANALYZING: "analyzing",
  FILLING: "filling",
  DRAFT: "draft",
  NEEDS_REVIEW: "needs_review",
  READY: "ready",
  SUBMITTED: "submitted",
  FAILED: "failed",
  CANCELLED: "cancelled"
};

// Issue severity levels
const SEVERITY = {
  BLOCKER: "blocker",     // Cannot proceed without this
  WARNING: "warning",     // Should be addressed
  INFO: "info"            // Nice to have
};

function nowIso() {
  return new Date().toISOString();
}

// Extract what we know about the user from their profile and documents
function buildUserKnowledge(user, profile, documents) {
  const docs = documents || [];

  // Detect document types present
  const docTypes = docs.map((d) => (d.detectedType || d.type || "").toLowerCase());

  const hasPassport = docTypes.some((t) => t.includes("passport"));
  const hasId = docTypes.some((t) => t.includes("national_id") || t.includes("id"));
  const hasCv = docTypes.some((t) => t.includes("cv") || t.includes("resume"));
  const hasTranscript = docTypes.some((t) => t.includes("transcript"));
  const hasEssay = docTypes.some((t) => t.includes("essay") || t.includes("sop") || t.includes("personal_statement"));
  const hasRefs = docTypes.some((t) => t.includes("reference") || t.includes("recommendation"));
  const hasCert = docTypes.some((t) => t.includes("certificate"));
  const hasMotivation = docTypes.some((t) => t.includes("motivation"));
  const hasFinancial = docTypes.some((t) => t.includes("financial"));

  return {
    // From profile
    name: user.name || "",
    email: user.email || "",
    country: user.country || profile?.country || "",
    targetLevel: profile?.targetLevel || "",
    fieldInterests: profile?.fieldInterests || [],
    studyCountries: profile?.studyCountries || [],
    accessibilityNeeds: profile?.accessibilityNeeds || [],

    // Document availability
    hasPassport,
    hasId,
    hasCv,
    hasTranscript,
    hasEssay,
    hasReferences: hasRefs,
    hasCertificates: hasCert,
    hasMotivationLetter: hasMotivation,
    hasFinancialEvidence: hasFinancial,
    totalDocuments: docs.length,

    // Extracted data from documents
    extractedNames: docs
      .filter((d) => d.extractedData?.name)
      .map((d) => d.extractedData.name),
    extractedNationalities: docs
      .filter((d) => d.extractedData?.nationality)
      .map((d) => d.extractedData.nationality),
    extractedInstitutions: docs
      .filter((d) => d.extractedData?.institution || d.extractedData?.university)
      .map((d) => d.extractedData.institution || d.extractedData.university)
  };
}

// Identify what's missing for a given scholarship's requirements
function identifyGaps(userKnowledge, scholarship, documents = []) {
  const issues = [];

  // Check identity documents
  if (scholarship.requiredDocuments.some((d) => d.toLowerCase().includes("passport"))) {
    if (!userKnowledge.hasPassport && !userKnowledge.hasId) {
      issues.push({
        field: "identityDocument",
        label: "Passport or National ID",
        severity: SEVERITY.BLOCKER,
        message: "You need to upload a passport or national ID. This is required for identity verification.",
        fix: "Upload passport or national ID in the Document Vault"
      });
    } else if (!userKnowledge.hasPassport && userKnowledge.hasId) {
      issues.push({
        field: "passport",
        label: "Passport",
        severity: SEVERITY.WARNING,
        message: "You have a national ID but some scholarships specifically require a passport for international applications.",
        fix: "Upload your international passport if available"
      });
    }
  }

  // Check academic documents
  if (scholarship.requiredDocuments.some((d) =>
    d.toLowerCase().includes("transcript") || d.toLowerCase().includes("academic record"))) {
    if (!userKnowledge.hasTranscript) {
      issues.push({
        field: "transcript",
        label: "Academic Transcript",
        severity: SEVERITY.BLOCKER,
        message: "Academic transcript is required but not found in your documents.",
        fix: "Upload your official transcript or academic record"
      });
    }
  }

  if (scholarship.requiredDocuments.some((d) =>
    d.toLowerCase().includes("cv") || d.toLowerCase().includes("resume"))) {
    if (!userKnowledge.hasCv) {
      issues.push({
        field: "cv",
        label: "CV / Resume",
        severity: SEVERITY.BLOCKER,
        message: "CV or Resume is required for this application.",
        fix: "Upload your CV or Resume"
      });
    }
  }

  // Check written documents
  const needsEssay = scholarship.requiredDocuments.some((d) =>
    ["essay", "essays", "personal statement", "statement of purpose", "sop"].includes(d.toLowerCase())
  );

  if (needsEssay && !userKnowledge.hasEssay) {
    issues.push({
      field: "essay",
      label: "Essay / Personal Statement",
      severity: SEVERITY.BLOCKER,
      message: "This scholarship requires an essay or personal statement. You haven't uploaded one yet.",
      fix: "Use the Essay Generator or upload your own essay"
    });
  }

  if (scholarship.requiredDocuments.some((d) =>
    d.toLowerCase().includes("motivation") || d.toLowerCase().includes("cover letter"))) {
    if (!userKnowledge.hasMotivationLetter) {
      issues.push({
        field: "motivationLetter",
        label: "Motivation Letter",
        severity: SEVERITY.BLOCKER,
        message: "A motivation letter is required. It should explain why you're applying for this specific scholarship.",
        fix: "Use the Essay Generator to create a motivation letter or upload your own"
      });
    }
  }

  // Reference letters
  if (scholarship.requiredDocuments.some((d) =>
    d.toLowerCase().includes("reference") || d.toLowerCase().includes("recommendation"))) {
    if (!userKnowledge.hasReferences) {
      issues.push({
        field: "references",
        label: "Reference Letters",
        severity: SEVERITY.BLOCKER,
        message: "Reference or recommendation letters are required. Usually 2-3 referees.",
        fix: "Upload reference letters from your academic or professional referees"
      });
    }
  }

  // Check document gap using the intelligence module
  const gap = checkDocumentGap(
    documents.map((d) => ({ detectedType: d.detectedType, type: d.type })),
    scholarship.requiredDocuments
  );

  // Add gap-based issues
  for (const missing of gap.missing) {
    // Avoid duplicates
    if (!issues.some((i) => i.label.toLowerCase().includes(missing.toLowerCase()))) {
      issues.push({
        field: `missing_${missing.replace(/\s+/g, "_").toLowerCase()}`,
        label: missing,
        severity: SEVERITY.BLOCKER,
        message: `"${missing}" is a required document that was not found in your vault.`,
        fix: `Upload your ${missing.toLowerCase()}`
      });
    }
  }

  const blockerCount = issues.filter((i) => i.severity === SEVERITY.BLOCKER).length;
  const warningCount = issues.filter((i) => i.severity === SEVERITY.WARNING).length;

  return {
    issues,
    totalIssues: issues.length,
    blockerCount,
    warningCount,
    canProceed: blockerCount === 0,
    documentReadiness: gap.readinessPercent
  };
}

// Build a filled application form from available data
function buildApplicationDraft(userKnowledge, scholarship, gaps) {
  const profile = userKnowledge;

  const draft = {
    // Personal info — always populated from profile
    personalInfo: {
      fullName: profile.name || "[NOT PROVIDED]",
      email: profile.email || "[NOT PROVIDED]",
      nationality: profile.extractedNationalities[0] || profile.country || "[NOT PROVIDED]",
      countryOfResidence: profile.country || "[NOT PROVIDED]",
      passportNumber: profile.hasPassport ? "[EXTRACTED FROM PASSPORT]" : "[MISSING]",
      nationalIdNumber: profile.hasId ? "[EXTRACTED FROM ID]" : "[MISSING]"
    },

    // Academic info
    academicInfo: {
      highestDegree: profile.targetLevel || "[UPDATE FROM PROFILE]",
      institution: profile.extractedInstitutions[0] || "[EXTRACT FROM TRANSCRIPT]",
      fieldOfStudy: profile.fieldInterests?.[0] || "[UPDATE FROM PROFILE]",
      gpa: "[EXTRACT FROM TRANSCRIPT]"
    },

    // Program preferences — matched to scholarship
    programPreferences: {
      desiredProgram: scholarship.fields?.[0] || "[MATCH TO SCHOLARSHIP]",
      desiredDegree: scholarship.degreeLevels?.[0] || profile.targetLevel || "",
      desiredCountry: scholarship.countries?.[0] || profile.studyCountries?.[0] || "",
      desiredUniversity: scholarship.schools?.[0] || ""
    },

    // Document inventory
    documents: {
      cv: profile.hasCv ? "Uploaded ✓" : "Missing ✗",
      transcript: profile.hasTranscript ? "Uploaded ✓" : "Missing ✗",
      passport: profile.hasPassport ? "Uploaded ✓" : "Missing ✗",
      essay: profile.hasEssay ? "Uploaded ✓" : "Missing ✗",
      references: profile.hasReferences ? "Uploaded ✓" : "Missing ✗",
      motivationLetter: profile.hasMotivationLetter ? "Uploaded ✓" : "Missing ✗",
      certificates: profile.hasCertificates ? "Uploaded ✓" : "Missing ✗",
      financialEvidence: profile.hasFinancialEvidence ? "Uploaded ✓" : "Missing ✗"
    }
  };

  // Mark fields with issues
  const fieldsWithIssues = gaps.issues.map((issue) => issue.field);
  for (const field of fieldsWithIssues) {
    // Tag fields that have issues
    draft[`_issue_${field}`] = true;
  }

  return draft;
}

// AI-powered form completion for complex fields
async function aiCompleteFields(draft, userKnowledge, scholarship) {
  if (!aiConfigured) return draft;

  const messages = [
    buildSystemPrompt(`You are filling a scholarship application form for an African student.
You have access to the student's profile and the scholarship requirements.
Fill in any gaps in the application form. Only use information you can reasonably infer.
If you don't know something, leave it as "[NEEDS VERIFICATION]".

Scholarship: ${scholarship.name}
Provider: ${scholarship.provider}
Country: ${(scholarship.countries || []).join(", ")}
Degree: ${(scholarship.degreeLevels || []).join(", ")}
Requirements: ${(scholarship.requiredDocuments || []).join(", ")}`),

    buildUserPrompt(`Student Profile:
- Name: ${userKnowledge.name}
- Country: ${userKnowledge.country}
- Target Level: ${userKnowledge.targetLevel}
- Field Interests: ${(userKnowledge.fieldInterests || []).join(", ")}
- Study Country Preferences: ${(userKnowledge.studyCountries || []).join(", ")}

Current draft application:
${JSON.stringify(draft, null, 2)}

Return a JSON object with the completed application form. For any field you cannot fill, keep it as "[NEEDS VERIFICATION]". Include a "completionNotes" field explaining what was filled and what needs user input.`)
  ];

  try {
    const completed = await chatCompletion({
      messages,
      jsonMode: true,
      temperature: 0.3,
      maxTokens: 1500
    });

    if (completed && !completed._parseError) {
      return { ...draft, ...completed, aiCompleted: true };
    }
  } catch (error) {
    console.error("AI form completion failed:", error.message);
  }

  return draft;
}

// Main auto-apply function
async function autoApply({
  user,
  profile,
  scholarship,
  documents = [],
  userKnowledge = null
}) {
  const knowledge = userKnowledge || buildUserKnowledge(user, profile, documents);
  const gaps = identifyGaps(knowledge, scholarship, documents);

  // Create application draft
  let draft = buildApplicationDraft(knowledge, scholarship, gaps);

  // If AI is available, enhance the draft
  if (aiConfigured && !gaps.canProceed) {
    // Only use AI if there are no blockers — AI assists, doesn't replace
    // Actually, AI helps even with drafts to suggest what's needed
  }

  if (gaps.canProceed && aiConfigured) {
    draft = await aiCompleteFields(draft, knowledge, scholarship);
  }

  const applicationId = crypto.randomUUID();
  const status = gaps.canProceed ? AUTO_APPLY_STATUSES.READY : AUTO_APPLY_STATUSES.DRAFT;

  const application = {
    id: applicationId,
    userId: user.id,
    scholarshipId: scholarship.id,
    scholarshipName: scholarship.name,
    status,
    draft,
    gaps,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    applied: false,
    submittedAt: null,
    errorLog: [],
    humanReviewed: false,
    notes: ""
  };

  // If it's a draft, generate alerts
  const alerts = [];
  if (status === AUTO_APPLY_STATUSES.DRAFT) {
    for (const issue of gaps.issues) {
      alerts.push({
        id: crypto.randomUUID(),
        applicationId,
        userId: user.id,
        type: issue.severity,
        title: issue.label,
        message: issue.message,
        fix: issue.fix,
        field: issue.field,
        scholarshipName: scholarship.name,
        createdAt: nowIso(),
        acknowledged: false,
        resolved: false
      });
    }
  }

  return {
    application,
    alerts,
    canProceed: gaps.canProceed,
    filledFields: Object.keys(draft).filter((k) => !k.startsWith("_issue_")).length,
    missingFields: gaps.issues.length,
    summary: gaps.canProceed
      ? "Application is ready to submit. Review the filled form before submitting."
      : `Application saved as draft. ${gaps.blockerCount} issue(s) need attention before submission.`
  };
}

// Batch auto-apply for multiple scholarships
async function batchAutoApply({ user, profile, scholarships, documents }) {
  const knowledge = buildUserKnowledge(user, profile, documents);
  const results = [];

  for (const scholarship of scholarships) {
    const result = await autoApply({
      user,
      profile,
      scholarship,
      documents,
      userKnowledge: knowledge
    });
    results.push(result);
  }

  // Summary stats
  const ready = results.filter((r) => r.canProceed).length;
  const drafts = results.filter((r) => !r.canProceed).length;
  const totalAlerts = results.reduce((sum, r) => sum + r.alerts.length, 0);

  return {
    results,
    summary: {
      total: results.length,
      ready,
      drafts,
      totalAlerts,
      readyPercent: Math.round((ready / results.length) * 100)
    }
  };
}

export {
  AUTO_APPLY_STATUSES,
  SEVERITY,
  APPLICATION_FIELDS,
  autoApply,
  batchAutoApply,
  identifyGaps,
  buildUserKnowledge,
  buildApplicationDraft
};
