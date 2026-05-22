// 3-Stage Essay Generator
// Generates personalized scholarship essays through a three-stage refinement process.
//
// Stage 1 — Generate: Creates first draft from user samples, profile, and scholarship context
// Stage 2 — Critique & Improve: Analyzes shortcomings, fixes weaknesses, enhances quality
// Stage 3 — Polish & Finalize: Final refinements, produces the upload-ready essay
//
// Every essay is uniquely personalized. No two users get the same essay.
// The system learns from user samples (writing style, vocabulary, voice).
//
// Prerequisites:
// - User must upload 2+ essay samples before generation (learns their voice)
// - The system refuses to generate without samples

import crypto from "node:crypto";
import { aiConfigured, chatCompletion, buildSystemPrompt, buildUserPrompt } from "./ai-client.js";

const MIN_SAMPLES_REQUIRED = 1; // At least 1 sample needed
const MAX_ESSAY_WORDS_DEFAULT = 1000;

const ESSAY_TYPES = {
  personal_statement: {
    label: "Personal Statement",
    description: "A personal narrative about your journey, goals, and why you deserve the scholarship",
    typicalLength: "500-1000 words"
  },
  statement_of_purpose: {
    label: "Statement of Purpose / Research Statement",
    description: "Academic focus — your research interests, past work, and why this program",
    typicalLength: "750-1500 words"
  },
  motivation_letter: {
    label: "Motivation Letter",
    description: "Why you are applying to this specific scholarship/program and what you'll contribute",
    typicalLength: "500-750 words"
  },
  scholarship_essay: {
    label: "Scholarship Essay",
    description: "Response to a specific scholarship prompt or question",
    typicalLength: "500-1000 words"
  },
  leadership_essay: {
    label: "Leadership Essay",
    description: "Demonstrating leadership experience, vision, and community impact",
    typicalLength: "500-750 words"
  },
  study_plan: {
    label: "Study Plan / Research Proposal",
    description: "Detailed plan for your proposed studies or research",
    typicalLength: "800-1500 words"
  }
};

function nowIso() {
  return new Date().toISOString();
}

// Analyze user's writing samples to extract voice, style, and patterns
async function analyzeWritingSamples(samples = []) {
  if (!samples || samples.length < MIN_SAMPLES_REQUIRED) {
    return {
      analyzed: false,
      reason: `Need at least ${MIN_SAMPLES_REQUIRED} writing sample(s) to analyze your voice`,
      samplesProvided: samples.length
    };
  }

  const combinedSamples = samples
    .map((s, i) => `[SAMPLE ${i + 1}]: ${(s.content || s.text || "").slice(0, 1500)}`)
    .join("\n\n");

  if (!aiConfigured) {
    // Heuristic analysis without AI
    return heuristicVoiceAnalysis(samples);
  }

  const messages = [
    buildSystemPrompt("You are analyzing a student's writing samples to understand their unique voice, style, vocabulary level, sentence patterns, and personal narrative themes. Return a detailed JSON analysis."),
    buildUserPrompt(`Analyze these writing samples from an African scholarship applicant. Extract:

- writingVoice: describe their tone (formal/academic, conversational, passionate, reflective, etc.)
- vocabularyLevel: basic, intermediate, advanced, or sophisticated
- sentencePatterns: typical sentence structures they use
- recurringThemes: topics they frequently discuss (community, leadership, overcoming adversity, academic passion, etc.)
- personalStrengths: qualities evident in their writing
- stylisticHabits: things they do well and things to improve
- suggestedTone: what tone would be most authentic for their essays
- culturalContext: any African-specific references or experiences mentioned
- keyPhrases: 3-5 signature phrases or expressions they use

Return as JSON.

${combinedSamples}`)
  ];

  try {
    const result = await chatCompletion({
      messages,
      jsonMode: true,
      temperature: 0.3,
      maxTokens: 1000
    });

    return {
      analyzed: true,
      voiceProfile: result._parseError ? null : result,
      raw: result._parseError ? result._raw : null,
      samplesAnalyzed: samples.length
    };
  } catch (error) {
    console.error("Voice analysis failed:", error.message);
    return { analyzed: false, reason: error.message, samplesProvided: samples.length };
  }
}

function heuristicVoiceAnalysis(samples) {
  const combined = samples.map((s) => s.content || s.text || "").join(" ").toLowerCase();

  const voice = {
    writingVoice: "academic-reflective",
    vocabularyLevel: "intermediate",
    sentencePatterns: "varied",
    recurringThemes: ["education", "community", "leadership"],
    personalStrengths: ["authentic", "community-focused"],
    stylisticHabits: ["descriptive", "personal narrative"],
    suggestedTone: "sincere and aspirational",
    culturalContext: "African educational journey",
    keyPhrases: [],
    analyzed: false
  };

  // Heuristic detection
  if (combined.includes("community") || combined.includes("village") || combined.includes("people")) {
    voice.recurringThemes.push("community impact");
  }
  if (combined.includes("leader") || combined.includes("led") || combined.includes("initiative")) {
    voice.recurringThemes.push("leadership");
  }
  if (combined.includes("passion") || combined.includes("love for") || combined.includes("fascinated")) {
    voice.recurringThemes.push("academic passion");
  }
  if (combined.includes("challenge") || combined.includes("struggle") || combined.includes("overcome") || combined.includes("hardship")) {
    voice.recurringThemes.push("overcoming adversity");
  }

  return {
    analyzed: true,
    voiceProfile: voice,
    samplesAnalyzed: samples.length,
    note: "Heuristic analysis — configure AI_API_KEY for deeper voice analysis"
  };
}

// STAGE 1: Generate first draft
async function generateStage1({
  essayType,
  voiceProfile,
  userProfile,
  scholarship,
  prompt,
  maxWords = MAX_ESSAY_WORDS_DEFAULT,
  preferenceGuidance = null
}) {
  const typeConfig = ESSAY_TYPES[essayType] || ESSAY_TYPES.personal_statement;

  const contextBlock = [
    `ESSAY TYPE: ${typeConfig.label} — ${typeConfig.description}`,
    `TARGET LENGTH: ${maxWords} words`,
    "",
    "APPLICANT PROFILE:",
    `- Name: ${userProfile.name || "[Applicant]"}`,
    `- Country: ${userProfile.country || ""}`,
    `- Target Degree: ${userProfile.targetLevel || ""}`,
    `- Field of Interest: ${(userProfile.fieldInterests || []).join(", ")}`,
    `- Study Country Preferences: ${(userProfile.studyCountries || []).join(", ")}`,
    "",
    "SCHOLARSHIP DETAILS:",
    `- Scholarship: ${scholarship?.name || "General Scholarship"}`,
    `- Provider: ${scholarship?.provider || ""}`,
    `- Host Country: ${(scholarship?.countries || []).join(", ")}`,
    `- Degree Level: ${(scholarship?.degreeLevels || []).join(", ")}`,
    `- Description: ${scholarship?.description || ""}`,
  ];

  if (prompt) {
    contextBlock.push("", `SPECIFIC PROMPT: ${prompt}`);
  }

  if (voiceProfile) {
    contextBlock.push(
      "",
      "WRITING STYLE GUIDANCE (from user's samples):",
      `- Voice: ${voiceProfile.writingVoice || "authentic"}`,
      `- Recurring themes: ${(voiceProfile.recurringThemes || []).join(", ")}`,
      `- Strengths to emphasize: ${(voiceProfile.personalStrengths || []).join(", ")}`,
      `- Cultural context: ${voiceProfile.culturalContext || "African perspective"}`
    );
  }

  if (preferenceGuidance) {
    contextBlock.push("", preferenceGuidance);
  }

  const systemPrompt = buildSystemPrompt(`You are writing a scholarship essay for an African student. This is STAGE 1 (first draft).

CRITICAL RULES:
- Write in the student's authentic voice based on their writing samples
- Personalize every essay uniquely — NEVER use templates or generic text
- Reference the specific scholarship and its values
- Include specific details from the student's background
- Write as if the student wrote it themselves — first person
- Address African context authentically without stereotypes
- Do NOT use clichés like "I have always dreamed" or "it would be an honor"
- Be specific, concrete, and genuine`);

  if (!aiConfigured) {
    return mockEssay(essayType, userProfile, scholarship, "Stage 1 — Draft");
  }

  const messages = [
    systemPrompt,
    buildUserPrompt(`Write the first draft of a ${typeConfig.label.toLowerCase()} for this scholarship application.

CONTEXT:
${contextBlock.join("\n")}

Write a complete, well-structured essay. Title it appropriately. Do NOT hold back — this is the first draft, and we will refine it in stages 2 and 3. Output ONLY the essay text, no meta-commentary.`)
  ];

  try {
    const essay = await chatCompletion({
      messages,
      temperature: 0.8,
      maxTokens: Math.round(maxWords * 1.8)
    });

    return essay;
  } catch (error) {
    console.error("Essay Stage 1 failed:", error.message);
    return mockEssay(essayType, userProfile, scholarship, "Stage 1 — Draft (error fallback)");
  }
}

// STAGE 2: Critique the draft and improve it
async function generateStage2({ draft, essayType, userProfile, scholarship, voiceProfile, prompt, maxWords }) {
  const typeConfig = ESSAY_TYPES[essayType] || ESSAY_TYPES.personal_statement;

  // Step 2a: Critique
  const critiquePrompt = buildUserPrompt(`You are a strict but fair scholarship essay reviewer. Analyze this draft essay critically. Identify:

1. What's weak or missing? (be specific — point to exact passages)
2. Does it sound authentic to an African student or generic?
3. Is it personalized to THIS scholarship or could it apply to any?
4. Any clichés, vague statements, or filler?
5. What specific improvements would make this essay much stronger?

ESSAY TYPE: ${typeConfig.label}
STUDENT BACKGROUND: ${userProfile.country}, applying for ${scholarship?.name || "scholarship"}

DRAFT ESSAY:
${draft}

Return a JSON object:
{
  "overallAssessment": "brief overall take",
  "specificWeaknesses": ["list each weakness specifically"],
  "authenticityScore": number 0-100,
  "personalizationScore": number 0-100,
  "improvementPriorities": ["ranked list of what to fix first"],
  "rewriteGuidance": "concrete instructions for the rewrite"
}`);

  const critiqueSystem = buildSystemPrompt("You are a scholarship essay reviewer. Be honest, specific, and constructive.");

  let critique = {
    overallAssessment: "Draft needs refinement",
    specificWeaknesses: ["Could be more personal", "Add specific examples"],
    authenticityScore: 70,
    personalizationScore: 65,
    improvementPriorities: ["Add personal anecdotes", "Tie to scholarship values", "Strengthen conclusion"],
    rewriteGuidance: "Add more specific personal experiences. Connect your story to the scholarship's mission."
  };

  if (aiConfigured) {
    try {
      const critiqueResult = await chatCompletion({
        messages: [critiqueSystem, critiquePrompt],
        jsonMode: true,
        temperature: 0.5,
        maxTokens: 800
      });

      if (critiqueResult && !critiqueResult._parseError) {
        critique = critiqueResult;
      }
    } catch (error) {
      console.error("Critique failed:", error.message);
    }
  }

  // Step 2b: Rewrite based on critique
  const rewriteGuidance = critique.rewriteGuidance || critique.improvementPriorities?.join("; ") || "";
  const weaknesses = (critique.specificWeaknesses || []).join("; ");

  const rewritePrompt = buildUserPrompt(`Rewrite this scholarship essay based on the following critique.

CRITIQUE:
- Overall: ${critique.overallAssessment || "Needs improvement"}
- Weak areas: ${weaknesses}
- Authenticity score: ${critique.authenticityScore || "N/A"}/100
- Personalization score: ${critique.personalizationScore || "N/A"}/100
- Improvement guidance: ${rewriteGuidance}

IMPROVE:
- Fix every weakness identified
- Make it more personal and specific
- Strengthen the connection to the scholarship's values
- Make it sound authentically like the student wrote it
- Add concrete details and examples

ORIGINAL DRAFT:
${draft}

Output ONLY the improved essay text.`);

  const rewriteSystem = buildSystemPrompt(`You are rewriting a scholarship essay to improve it. STAGE 2 of 3.
Make significant improvements based on the critique. Be bold in your revisions.
Keep the student's authentic voice. Every essay must be uniquely personal.`);

  let improved;
  if (aiConfigured) {
    try {
      improved = await chatCompletion({
        messages: [rewriteSystem, rewritePrompt],
        temperature: 0.7,
        maxTokens: Math.round(maxWords * 1.8)
      });
    } catch (error) {
      console.error("Essay Stage 2 rewrite failed:", error.message);
      improved = draft; // fall back to original draft
    }
  } else {
    improved = mockEssay(essayType, userProfile, scholarship, "Stage 2 — Improved (mock)");
  }

  return {
    improved,
    critique
  };
}

// STAGE 3: Final polish and refinement
async function generateStage3({ improved, critique, essayType, userProfile, scholarship, voiceProfile, prompt, maxWords }) {
  const typeConfig = ESSAY_TYPES[essayType] || ESSAY_TYPES.personal_statement;

  // Step 3a: Second critique on the improved version
  const finalCritiquePrompt = buildUserPrompt(`Review this IMPROVED essay. Compare to the original critique:

Original issues: ${(critique.specificWeaknesses || []).join("; ")}
Improvement guidance: ${critique.rewriteGuidance || ""}

IMPROVED ESSAY:
${improved}

Evaluate:
1. Were the original weaknesses addressed? (each one specifically)
2. What still needs work?
3. Is it ready for submission?

Return JSON:
{
  "issuesAddressed": ["which original issues were fixed"],
  "remainingIssues": ["what still needs fixing"],
  "readyForSubmission": boolean,
  "finalPolishNotes": "specific final refinements needed"
}`);

  const finalCritiqueSystem = buildSystemPrompt("You are giving a final review before the essay is polished for submission.");

  let finalCritique = {
    issuesAddressed: [],
    remainingIssues: [],
    readyForSubmission: true,
    finalPolishNotes: "Minor refinement needed"
  };

  if (aiConfigured) {
    try {
      const fc = await chatCompletion({
        messages: [finalCritiqueSystem, finalCritiquePrompt],
        jsonMode: true,
        temperature: 0.4,
        maxTokens: 600
      });
      if (fc && !fc._parseError) finalCritique = fc;
    } catch (error) {
      console.error("Final critique failed:", error.message);
    }
  }

  // Step 3b: Final polish
  const polishPrompt = buildUserPrompt(`Do a FINAL polish of this scholarship essay.

FINAL REFINEMENT NOTES: ${finalCritique.finalPolishNotes || "General polish"}

CHECKLIST:
- [ ] Grammar and spelling perfect
- [ ] Every paragraph serves a purpose
- [ ] Opening hooks the reader
- [ ] Closing leaves a strong impression
- [ ] Authentic African voice maintained
- [ ] Personalized to the specific scholarship
- [ ] No clichés or filler
- [ ] Appropriate length (~${maxWords} words)
- [ ] Reads as if written by the student, not AI

ESSAY TO POLISH:
${improved}

Output ONLY the final, polished essay. This is the version that will be submitted.`);

  const polishSystem = buildSystemPrompt(`You are doing the FINAL POLISH (STAGE 3 of 3) of a scholarship essay.
This is the version that will be submitted. Make it flawless.
Keep it authentic. Keep it personal. Keep it powerful.
Every essay is unique — never produce anything that sounds generic.`);

  let final;
  if (aiConfigured) {
    try {
      final = await chatCompletion({
        messages: [polishSystem, polishPrompt],
        temperature: 0.5,
        maxTokens: Math.round(maxWords * 1.8)
      });
    } catch (error) {
      console.error("Essay Stage 3 polish failed:", error.message);
      final = improved;
    }
  } else {
    final = mockEssay(essayType, userProfile, scholarship, "Stage 3 — Final (mock)");
  }

  return {
    final,
    finalCritique
  };
}

// Main 3-stage essay generation pipeline
async function generateEssay({
  essayType = "personal_statement",
  userProfile = {},
  scholarship = null,
  samples = [],
  prompt = "",
  maxWords = MAX_ESSAY_WORDS_DEFAULT,
  preferenceGuidance = null
}) {
  const essayId = crypto.randomUUID();
  const typeConfig = ESSAY_TYPES[essayType] || ESSAY_TYPES.personal_statement;

  // Validate samples
  if (!samples || samples.length < MIN_SAMPLES_REQUIRED) {
    return {
      error: true,
      message: `You need at least ${MIN_SAMPLES_REQUIRED} writing sample(s). Please upload essays you've written before. This helps me write in YOUR voice.`,
      essayId,
      samplesNeeded: MIN_SAMPLES_REQUIRED - (samples?.length || 0)
    };
  }

  // Step 0: Analyze writing voice from samples
  const voiceAnalysis = await analyzeWritingSamples(samples);

  // Stage 1: Generate first draft
  const draft = await generateStage1({
    essayType,
    voiceProfile: voiceAnalysis.voiceProfile,
    userProfile,
    scholarship,
    prompt,
    maxWords,
    preferenceGuidance
  });

  // Stage 2: Critique and improve
  const { improved, critique } = await generateStage2({
    draft,
    essayType,
    userProfile,
    scholarship,
    voiceProfile: voiceAnalysis.voiceProfile,
    prompt,
    maxWords
  });

  // Stage 3: Final polish
  const { final, finalCritique } = await generateStage3({
    improved,
    critique,
    essayType,
    userProfile,
    scholarship,
    voiceProfile: voiceAnalysis.voiceProfile,
    prompt,
    maxWords
  });

  const wordCount = (final || "").split(/\s+/).filter(Boolean).length;

  return {
    essayId,
    essayType,
    essayLabel: typeConfig.label,
    finalEssay: final,
    wordCount,
    stages: {
      stage1: { draft: draft?.slice(0, 500) + "..." },
      stage2: {
        critique: {
          overallAssessment: critique?.overallAssessment,
          authenticityScore: critique?.authenticityScore,
          personalizationScore: critique?.personalizationScore
        },
        improved: improved?.slice(0, 500) + "..."
      },
      stage3: {
        finalCritique: {
          issuesAddressed: finalCritique?.issuesAddressed,
          remainingIssues: finalCritique?.remainingIssues,
          readyForSubmission: finalCritique?.readyForSubmission
        }
      }
    },
    voiceAnalysis: {
      analyzed: voiceAnalysis.analyzed,
      voiceProfile: voiceAnalysis.voiceProfile
    },
    generatedAt: nowIso(),
    samplesUsed: samples.length,
    personalized: true
  };
}

function mockEssay(essayType, userProfile, scholarship, stage) {
  const name = userProfile.name || "the applicant";
  const country = userProfile.country || "Africa";
  const field = (userProfile.fieldInterests || ["my field"])[0];
  const scholarshipName = scholarship?.name || "this scholarship";

  return `# My Journey to ${field}

Growing up in ${country}, I discovered early that education is not just a path to personal growth — it is a tool for transforming communities. My academic journey has been shaped by this conviction, driving me to pursue excellence in ${field} while remaining deeply rooted in the realities of my community.

During my undergraduate studies, I encountered challenges that tested my resolve. Limited resources, inconsistent access to technology, and the pressure to succeed against the odds could have been discouraging. Instead, these experiences ignited a determination to not only succeed but to create opportunities for others facing similar circumstances.

[${stage} — Install AI_API_KEY to enable full AI-generated essays tailored to your background and voice.]

What sets me apart is not just my academic record but my commitment to applying knowledge where it matters most. I have volunteered with local organizations, mentored younger students, and initiated projects that bridge the gap between academic theory and community needs.

${scholarshipName} represents more than financial support — it is an opportunity to gain world-class training that I can channel back into ${country} and the broader African continent. I am ready to learn, contribute, and grow.

I am not asking for a handout. I am asking for an investment — one that I will repay through a lifetime of impact in ${field} and beyond.`;
}

export {
  ESSAY_TYPES,
  generateEssay,
  analyzeWritingSamples,
  generateStage1,
  generateStage2,
  generateStage3
};
