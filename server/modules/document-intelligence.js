// Document Intelligence Module
// Auto-detects document types regardless of naming conventions or national formats.
// Handles: CV/Resume, Transcript, Passport, National ID, Essay, Motivation Letter,
//          Statement of Purpose, References, Certificate, Admission Letter, Financial Evidence
//
// Uses a two-layer approach:
//   1. Heuristic analysis (file name, mime type, extension, structure keywords)
//   2. AI-powered content analysis (when AI is configured)

import { aiConfigured, chatCompletion, buildSystemPrompt, buildUserPrompt } from "./ai-client.js";

// Document type taxonomy with detection hints
const DOCUMENT_TYPES = {
  cv: {
    aliases: ["cv", "curriculum vitae", "resume", "résumé", "bio data", "biodata", "personal profile"],
    extensions: [".pdf", ".docx", ".doc", ".txt"],
    keywords: ["curriculum vitae", "resume", "work experience", "professional experience", "employment", "skills", "education", "references available", "objective", "summary of qualifications", "personal details", "date of birth", "nationality", "marital status"],
    category: "identity-career"
  },
  transcript: {
    aliases: ["transcript", "academic transcript", "academic record", "grade report", "result slip", "statement of results", "mark sheet", "marksheet", "exam results", "academic history"],
    extensions: [".pdf", ".jpg", ".jpeg", ".png", ".docx"],
    keywords: ["transcript", "academic record", "semester", "gpa", "grade point", "credit hours", "course code", "university", "college", "institution", "registrar", "certified true copy", "examination", "cgpa", "cumulative", "sgpa", "class of degree", "upper second", "lower second", "first class", "pass", "credit", "distinction", "merit"],
    category: "academic"
  },
  passport: {
    aliases: ["passport", "international passport", "travel document", "ecowas passport", "east african passport"],
    extensions: [".jpg", ".jpeg", ".png", ".pdf"],
    keywords: ["passport", "passport no", "passport number", "nationality", "date of issue", "date of expiry", "surname", "given names", "place of birth", "authority", "machine readable zone", "mrz", "p<"],
    category: "identity"
  },
  national_id: {
    aliases: ["national id", "id card", "identity card", "national identity", "voter's card", "voters card", "national identification", "kra pin", "nin", "ghana card", "voter id", "national registration", "citizen id", "omang", "national id number"],
    extensions: [".jpg", ".jpeg", ".png", ".pdf"],
    keywords: ["national id", "identity number", "id number", "registration number", "card number", "issued by", "republic of", "citizen", "identification card", "date of birth", "place of issue", "nin", "national identification number"],
    category: "identity"
  },
  essay: {
    aliases: ["essay", "personal essay", "scholarship essay", "application essay", "personal statement", "reflective essay", "statement", "writing sample"],
    extensions: [".pdf", ".docx", ".doc", ".txt"],
    keywords: ["essay", "personal statement", "i believe", "my experience", "my journey", "my goal", "my passion", "i have always", "growing up", "my community", "my vision", "leadership", "in conclusion", "in my opinion", "the reason i", "i chose"],
    category: "written-work"
  },
  motivation_letter: {
    aliases: ["motivation letter", "motivational letter", "cover letter", "letter of motivation", "statement of interest", "letter of intent", "cover note"],
    extensions: [".pdf", ".docx", ".doc", ".txt"],
    keywords: ["motivation", "dear sir", "dear madam", "dear admissions", "dear selection committee", "dear scholarship committee", "i am writing to apply", "i am writing to express", "i would like to apply", "yours sincerely", "yours faithfully", "looking forward", "thank you for considering", "letter of motivation"],
    category: "written-work"
  },
  statement_of_purpose: {
    aliases: ["statement of purpose", "sop", "research statement", "academic statement", "personal statement academic", "research proposal summary"],
    extensions: [".pdf", ".docx", ".doc", ".txt"],
    keywords: ["statement of purpose", "research interest", "academic background", "why i want to study", "my research", "proposed research", "academic goals", "graduate studies", "doctoral research", "why this program", "my academic interests", "research methodology", "i intend to"],
    category: "written-work"
  },
  references: {
    aliases: ["references", "reference letter", "recommendation letter", "letter of recommendation", "referee report", "lor", "testimonial", "character reference", "academic reference", "professional reference"],
    extensions: [".pdf", ".docx", ".doc"],
    keywords: ["recommendation", "reference", "referee", "testimonial", "to whom it may concern", "i have known", "i am pleased to recommend", "i highly recommend", "character", "work ethic", "academic performance", "leadership qualities", "letter of recommendation"],
    category: "supporting"
  },
  certificate: {
    aliases: ["certificate", "degree certificate", "diploma", "award certificate", "completion certificate", "bachelor certificate", "master certificate", "testimonial certificate", "graduation certificate", "proficiency certificate"],
    extensions: [".pdf", ".jpg", ".jpeg", ".png"],
    keywords: ["certificate", "certify that", "has been awarded", "degree of", "bachelor of", "master of", "doctor of", "diploma in", "conferred", "graduation", "has completed", "this is to certify", "awarded on"],
    category: "academic"
  },
  admission_letter: {
    aliases: ["admission letter", "offer letter", "acceptance letter", "admission offer", "provisional admission", "unconditional offer", "conditional offer", "placement letter"],
    extensions: [".pdf", ".docx", ".doc"],
    keywords: ["admission", "offer of admission", "pleased to offer", "congratulations", "accepted", "provisional admission", "unconditional offer", "conditional offer", "program of study", "commencing", "academic year", "enrollment", "registration", "acceptance"],
    category: "academic"
  },
  financial_evidence: {
    aliases: ["financial evidence", "bank statement", "financial statement", "proof of funds", "sponsor letter", "affidavit of support", "scholarship letter", "financial need", "income statement", "tax return", "payslip", "salary slip", "financial affidavit"],
    extensions: [".pdf", ".jpg", ".jpeg", ".png", ".docx"],
    keywords: ["bank statement", "financial", "account balance", "sponsor", "income", "salary", "payslip", "tax", "funds", "affidavit of support", "financial need", "statement of account", "available balance", "proof of", "i hereby declare"],
    category: "financial"
  }
};

// Extract a plain-text snippet from a filename for heuristic analysis
function analyzeFilename(fileName = "") {
  const normalized = fileName.toLowerCase().replace(/[-_\s]+/g, " ").replace(/[0-9]/g, "").trim();

  const scores = {};
  for (const [type, config] of Object.entries(DOCUMENT_TYPES)) {
    let score = 0;
    for (const alias of config.aliases) {
      if (normalized.includes(alias)) {
        score += 30;
        break;
      }
    }
    // Bonus for partial matches
    for (const alias of config.aliases) {
      const words = alias.split(" ");
      const matchCount = words.filter((w) => normalized.includes(w)).length;
      if (matchCount >= Math.ceil(words.length / 2)) {
        score += 10;
      }
    }
    if (score > 0) scores[type] = score;
  }

  return scores;
}

// Analyze MIME type and extension
function analyzeFormat(mimeType = "", fileName = "") {
  const ext = (fileName || "").toLowerCase().split(".").pop() || "";
  const imageTypes = ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "tif", "webp"];

  return {
    isImage: imageTypes.includes(ext) || (mimeType || "").startsWith("image/"),
    isPDF: ext === "pdf" || mimeType === "application/pdf",
    isWordDoc: ["docx", "doc"].includes(ext) || mimeType.includes("wordprocessingml") || mimeType.includes("msword"),
    isText: ["txt", "md", "rtf"].includes(ext) || (mimeType || "").startsWith("text/"),
    extension: ext,
    mimeType
  };
}

// Heuristic content analysis using keyword density
function analyzeContentKeywords(contentText = "") {
  if (!contentText || contentText.length < 10) return {};

  const normalized = contentText.toLowerCase();
  const preview = normalized.slice(0, 3000); // First 3000 chars for efficiency

  const scores = {};
  for (const [type, config] of Object.entries(DOCUMENT_TYPES)) {
    let matches = 0;
    let totalKeywords = config.keywords.length;

    for (const keyword of config.keywords) {
      if (preview.includes(keyword.toLowerCase())) {
        matches++;
      }
    }

    const density = totalKeywords > 0 ? matches / totalKeywords : 0;
    if (density > 0.05 || matches >= 3) {
      scores[type] = Math.round(density * 100);
    }
  }

  return scores;
}

// AI-powered document classification
async function aiClassifyDocument(contentText, fileName, mimeType) {
  if (!aiConfigured) return null;

  const preview = (contentText || "").slice(0, 4000);
  const fileNameHint = fileName ? `File name: "${fileName}"` : "";
  const mimeHint = mimeType ? `Format: ${mimeType}` : "";

  const messages = [
    buildSystemPrompt("You are analyzing an uploaded document. Classify it into one of these types and extract key information."),
    buildUserPrompt(`Analyze this document and return a JSON object with:
- documentType: one of [cv, transcript, passport, national_id, essay, motivation_letter, statement_of_purpose, references, certificate, admission_letter, financial_evidence, other]
- confidence: number 0-100
- reasoning: brief explanation (1-2 sentences)
- extractedData: relevant info (for CV: name, nationality, education level, field; for transcript: institution, degree, GPA; for passport: nationality, expiry; etc.)
- suggestedName: a clean, descriptive filename

${fileNameHint}
${mimeHint}

Document content:
${preview}`)
  ];

  try {
    const result = await chatCompletion({ messages, jsonMode: true, temperature: 0.2, maxTokens: 800 });
    return result;
  } catch (error) {
    console.error("AI document classification failed:", error.message);
    return null;
  }
}

// Main detection function — combines all layers
async function detectDocumentType({ fileName = "", mimeType = "", contentText = "", fileSize = 0 }) {
  const format = analyzeFormat(mimeType, fileName);
  const nameScores = analyzeFilename(fileName);
  const keywordScores = analyzeContentKeywords(contentText);

  // Combine heuristic scores
  const combinedScores = {};
  const allTypes = new Set([
    ...Object.keys(nameScores),
    ...Object.keys(keywordScores)
  ]);

  for (const type of allTypes) {
    const nameScore = nameScores[type] || 0;
    const keywordScore = keywordScores[type] || 0;
    combinedScores[type] = nameScore * 0.4 + keywordScore * 0.6;
  }

  // Format-based boosts
  if (format.isImage && !combinedScores.passport && !combinedScores.national_id && !combinedScores.certificate) {
    combinedScores.passport = (combinedScores.passport || 0) + 15;
    combinedScores.national_id = (combinedScores.national_id || 0) + 15;
    combinedScores.certificate = (combinedScores.certificate || 0) + 10;
    combinedScores.transcript = (combinedScores.transcript || 0) + 10;
  }

  // Sort by score
  const sorted = Object.entries(combinedScores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  // AI analysis (if available)
  let aiResult = null;
  if (contentText && contentText.length > 50) {
    aiResult = await aiClassifyDocument(contentText, fileName, mimeType);
  }

  // Merge AI result with heuristic
  const bestHeuristic = sorted[0];
  const detectedType = aiResult?.documentType || (bestHeuristic ? bestHeuristic[0] : "other");
  const confidence = aiResult?.confidence || (bestHeuristic ? Math.min(Math.round(bestHeuristic[1]), 85) : 30);

  const readableType = DOCUMENT_TYPES[detectedType]
    ? detectedType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Other";

  return {
    detectedType,
    readableType,
    confidence,
    heuristicScores: Object.fromEntries(sorted.slice(0, 5)),
    aiAnalysis: aiResult?.reasoning || null,
    extractedData: aiResult?.extractedData || {},
    suggestedName: aiResult?.suggestedName || fileName,
    format,
    detectionMethod: aiResult ? "ai+heuristic" : "heuristic",
    timestamp: new Date().toISOString()
  };
}

// Batch analysis for multiple documents
async function analyzeDocumentSet(documents) {
  const results = [];
  for (const doc of documents) {
    const analysis = await detectDocumentType(doc);
    results.push({
      documentId: doc.id,
      fileName: doc.fileName || doc.name,
      ...analysis
    });
  }
  return results;
}

// Check which required documents a user has vs what a scholarship needs
function checkDocumentGap(userDocuments, requiredDocuments) {
  const userDocTypes = userDocuments.map((d) => (d.detectedType || d.type || "").toLowerCase());

  const missing = [];
  const covered = [];

  for (const required of requiredDocuments) {
    const reqLower = required.toLowerCase();
    const found = DOCUMENT_TYPES[reqLower.replace(/\s+/g, "_")] || null;
    const aliases = found ? [reqLower, ...found.aliases] : [reqLower];

    const hasMatch = aliases.some((alias) =>
      userDocTypes.some((userType) =>
        alias.includes(userType) || userType.includes(alias)
      )
    );

    if (hasMatch) {
      covered.push(required);
    } else {
      missing.push(required);
    }
  }

  return { missing, covered, allRequired: requiredDocuments, readinessPercent: requiredDocuments.length > 0
    ? Math.round((covered.length / requiredDocuments.length) * 100)
    : 0 };
}

export {
  DOCUMENT_TYPES,
  detectDocumentType,
  analyzeDocumentSet,
  checkDocumentGap,
  analyzeFilename,
  analyzeFormat,
  analyzeContentKeywords
};
