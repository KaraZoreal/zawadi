# Zawadi v2 — Scholarship Recommendation & Matching System

**Document:** RECOMMENDATION_SYSTEM.md  
**Version:** 2.0 (Pan-African Edition)  
**Date:** May 28, 2026  
**Author:** Techsari Engineering  
**Status:** Implementation Spec — Phase 1

> **Design principle:** This system must work equally well for a student in Dakar, Cairo, Luanda, Nairobi, Lagos, Addis Ababa, Antananarivo, or Windhoek. Every assumption, every data field, every grading scale, every language system, and every document type must be designed for all 54 African countries — not retrofitted for Kenya and patched for the rest.

---

## Overview

The Zawadi recommendation system provides intelligent scholarship matching across all African countries by:

1. **Pan-African Data Foundation** - Supporting all 54 African countries with language-specific grading systems
2. **User Profile Signal Collection** - Gathering academic, linguistic, and demographic signals  
3. **Grading System Normalization** - Converting all national grading scales to a universal 0-1 scale
4. **Document Intelligence Pipeline** - Analyzing CVs, transcripts, and essays
5. **8-Dimension Matching Algorithm** - Academic credentials, linguistic fit, geographic eligibility, field alignment, funding availability, timeline suitability, competition level, and institution prestige
6. **Real-Time Signal Updates** - Continuous learning from user edits and preferences

---

## Key Components

### 1. Pan-African Country & Grading Support

**Supported Language Groups:**
- **Anglophone** (20 countries): English-primary; British or US GPA systems
- **Francophone** (20 countries): French-primary; Mention systems or 0-20 scales
- **Arabophone** (6 countries): Arabic-primary; Honour or percentage systems
- **Lusophone** (5 countries): Portuguese-primary; 0-20 scales
- **Bilingual** (3 countries): Multiple official languages

**Grading Systems Supported:**
- US 4.0 GPA (0.0–4.0)
- Nigeria CGPA (0.0–5.0)
- British Classification (First/2:1/2:2/Third)
- South Africa percentage (0–100%)
- French mention (Très Bien/Bien/Assez Bien/Passable)
- Belgian/Congolese 0–20
- Lusophone 0–20
- Arabic honour (Imtiyaz/Jayyid Jiddan/Jayyid/Maqbul)
- Spanish 0–10

### 2. User Profile Signals

The system collects and normalizes:
- **Academic Achievement**: GPA (raw + normalized), degree class, institution, graduation year
- **Linguistic Profile**: Native language, languages of instruction, proficiency levels
- **Study Intentions**: Target degree, fields of study, target countries
- **Geographic Eligibility**: Home country, region, willing to stay in Africa
- **Financial Profile**: Financial need, work experience, employment plans
- **Document Status**: CV, transcript, certificate uploads
- **Application History**: Past scholarship attempts, outcomes

### 3. Matching Algorithm (8 Dimensions)

Each scholarship match is scored across:

1. **Academic Credentials** (25%) - GPA vs. scholarship requirements
2. **Linguistic Fit** (15%) - Language requirements vs. student proficiency
3. **Geographic Eligibility** (20%) - Eligibility by country/region
4. **Field Alignment** (15%) - Academic field matches scholarship focus
5. **Funding Alignment** (10%) - Financial support level matches need
6. **Timeline Suitability** (5%) - Application deadline vs. prep time
7. **Competition Level** (5%) - Realistic win probability estimate
8. **Institution Prestige** (5%) - Ranking alignment with student profile

**Final Match Score:** 0–100, indicating likelihood of success

### 4. Document Intelligence

The system analyzes:
- **CV/Resume**: Extracts work experience, skills, certifications
- **Transcript**: Identifies GPA, grades by subject, honours/distinctions
- **Essays**: Analyzes tone, achievements mentioned, community focus
- **Certificates**: Flags language proficiency evidence (IELTS, TOEFL, DELF, etc.)

---

## Implementation Notes

### Database Schema
The recommendation system requires:
- `user_profile_signals` - Core user academic and linguistic data
- `scholarship_requirements` - Scholarship eligibility criteria
- `match_scores` - Cached match calculations per user-scholarship pair
- `document_extractions` - Indexed text from uploaded documents

### Edge Functions
Two primary Vercel Edge Functions support matching:
- `match-scholarships` - Computes all matches for a user profile
- `analyze-document` - Extracts text and metadata from PDFs/DOCX

### Language Encouragement
**Important:** Throughout the UI, students should be encouraged to input data and write essays **in English** for maximum scholarship eligibility:
- Scholarships are predominantly offered in English
- Most international institutions require English proficiency
- English essays reach broader audiences
- While the system supports multiple languages, English maximizes opportunities

---

## Integration Checklist

- [x] All 54 African countries defined with language groups
- [x] GPA systems configured for each language group
- [x] Database schema documented
- [x] User profile signal collection defined
- [x] 8-dimension matching algorithm specified
- [x] Document intelligence pipeline designed
- [x] Recommendation ranking logic documented
- [ ] Vercel Edge Functions deployed
- [ ] Real-time signal updates implemented
- [ ] Admin dashboard for scholarship curation ready
- [ ] Frontend UI integration with new designs

---

## Future Enhancements

1. **Predictive Modeling** - Machine learning to estimate win probability by scholarship type
2. **Collaborative Filtering** - Recommend scholarships based on similar students' successes
3. **Deadline Automation** - Auto-apply to scholarships matching criteria
4. **Interview Prep** - AI coaching for scholarship interview practice
5. **Regional Insights** - Scholarship trends by country and field

---

**For questions or updates, contact: tech@techsari.online**
