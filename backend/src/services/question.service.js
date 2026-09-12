const { generateLlmJson } = require('./llm.service');
const logger = require('../utils/logger');

/**
 * Extracts structured Interview Kit metadata, requirements, questions, and flashcards from JD & Research.
 * Generates (daysAvailable * 10) questions and flashcards tailored to Seniority Level.
 */
async function generateInitialKitData(jobDescription, companyUrl, researchData, overrideCompanyName = '', overrideRoleTitle = '', overrideSeniority = 'Senior', daysAvailable = 5) {
  const extractedCompany = overrideCompanyName || extractCompanyName(jobDescription, companyUrl);
  const extractedRole = overrideRoleTitle || extractRoleTitle(jobDescription);
  const seniority = overrideSeniority || 'Senior';
  const numDays = Math.max(1, parseInt(daysAvailable) || 5);
  const totalQuestionsToGenerate = numDays * 10;

  const systemInstruction = `
You are an expert technical recruiter and hiring manager.
Your task is to analyze a Job Description and company research context to generate a structured Interview Preparation Kit.

CRITICAL REQUIREMENTS:
1. Company Name: "${extractedCompany}". Role Title: "${extractedRole}". Seniority Level: "${seniority}".
2. Generate EXACTLY ${totalQuestionsToGenerate} interview questions and ${totalQuestionsToGenerate} corresponding flashcards.
3. The depth, complexity, and technical detail of the questions and answers MUST strictly reflect the "${seniority}" seniority level (e.g. Executive/Lead requires high-level system architecture, leadership, strategy, trade-offs, edge cases; Junior requires solid fundamentals, syntax, patterns).
4. Answers must be detailed, comprehensive, step-by-step explanations.

Return ONLY a valid JSON object matching this exact structure:
{
  "source": {
    "company": "${extractedCompany}",
    "company_url": "${companyUrl || ''}",
    "role": "${extractedRole}",
    "location": "Location or Remote",
    "jd_chars": ${jobDescription.length}
  },
  "company_brief": {
    "summary": "2-3 sentence overview of company background & mission based on research context.",
    "what_they_do": "Key products, business model, and tech focus based on research context."
  },
  "role": {
    "title": "${extractedRole}",
    "seniority": "${seniority}",
    "responsibilities": ["Responsibility 1", "Responsibility 2"],
    "requirements": ["Requirement text 1", "Requirement text 2"]
  },
  "raw_requirements": [
    { "text": "Requirement 1 text", "priority": "must" },
    { "text": "Requirement 2 text", "priority": "must" },
    { "text": "Requirement 3 text", "priority": "nice" }
  ],
  "questions": [
    {
      "temp_req_text": "Requirement 1 text",
      "category": "Technical",
      "prompt": "Detailed interview question prompt tailored to ${seniority} level?",
      "answer_outline": "Detailed, comprehensive step-by-step answer outline including core concepts, edge cases, and best practices.",
      "difficulty": 2
    }
  ],
  "flashcards": [
    {
      "temp_req_text": "Requirement 1 text",
      "front": "Flashcard front question/concept",
      "back": "Flashcard back concise explanation"
    }
  ]
}
`;

  const prompt = `
TARGET COMPANY: ${extractedCompany}
TARGET ROLE: ${extractedRole}
SENIORITY LEVEL: ${seniority}
DAYS AVAILABLE: ${numDays} (Generate total ${totalQuestionsToGenerate} questions & flashcards)

JOB DESCRIPTION:
${jobDescription}

COMPANY RESEARCH CONTEXT:
${researchData.aggregatedWebText || 'Public Web Search'}
`;

  try {
    const llmResult = await generateLlmJson(prompt, systemInstruction);
    if (llmResult && llmResult.raw_requirements && Array.isArray(llmResult.raw_requirements)) {
      return processLlmKitResponse(llmResult, companyUrl, jobDescription, researchData, extractedCompany, extractedRole, seniority, numDays);
    }
  } catch (err) {
    logger.warn(`[Question Service] LLM generation warning: ${err.message}. Falling back to deterministic kit generator.`);
  }

  logger.info('[Question Service] Generating deterministic kit data from Job Description analysis.');
  return generateFallbackKitData(jobDescription, companyUrl, researchData, extractedCompany, extractedRole, seniority, numDays);
}

/**
 * Normalizes LLM raw response into standard Kit data contract with stable IDs (REQ-1, Q-1, FC-1).
 */
function processLlmKitResponse(raw, companyUrl, jobDescription, researchData, companyName, roleTitle, seniority, daysAvailable) {
  const isGenericCompany = (name) => !name || /^(company|company name|target company|untitled|company prep)$/i.test(name.trim());
  const isGenericRole = (title) => !title || /^(role|role title|interview prep kit|untitled role|prep kit|personalized prep kit)$/i.test(title.trim());

  const finalCompanyName = (companyName && !isGenericCompany(companyName))
    ? companyName
    : ((raw.source?.company && !isGenericCompany(raw.source.company)) ? raw.source.company : extractCompanyName(jobDescription, companyUrl));

  const finalRoleTitle = (roleTitle && !isGenericRole(roleTitle))
    ? roleTitle
    : ((raw.role?.title && !isGenericRole(raw.role.title)) ? raw.role.title : extractRoleTitle(jobDescription));

  const finalSeniority = seniority || raw.role?.seniority || 'Senior';
  const numDays = Math.max(1, parseInt(daysAvailable) || 5);
  const targetTotalCount = numDays * 10;

  // 1. Assign stable requirement IDs
  const requirements = (raw.raw_requirements || []).map((req, idx) => ({
    id: `REQ-${idx + 1}`,
    text: req.text || `Requirement ${idx + 1}`,
    kind: 'technical',
    priority: (req.priority === 'nice') ? 'nice' : 'must'
  }));

  const resolveReqIds = (tempText, idx) => {
    if (!tempText || requirements.length === 0) return ['REQ-1'];
    const matched = requirements.find(r => r.text.toLowerCase().includes(tempText.toLowerCase()) || tempText.toLowerCase().includes(r.text.toLowerCase()));
    return [matched ? matched.id : requirements[idx % requirements.length]?.id || 'REQ-1'];
  };

  // 2. Format Questions
  let questions = (raw.questions || []).map((q, idx) => ({
    id: `Q-${idx + 1}`,
    requirement_ids: resolveReqIds(q.temp_req_text, idx),
    category: q.category || (idx % 2 === 0 ? 'Technical' : 'System Design'),
    prompt: q.prompt,
    answer_outline: q.answer_outline,
    difficulty: Math.min(3, Math.max(1, parseInt(q.difficulty) || 2)),
    completed: false,
    state: 'generated'
  }));

  // 3. Format Flashcards - Guarantee 1-to-1 matching with interview questions
  let flashcards = questions.map((q, idx) => {
    const rawFc = raw.flashcards && raw.flashcards[idx];
    const frontText = (rawFc && rawFc.front) ? rawFc.front : `Key Concept Q${idx + 1}: ${q.prompt.replace(/^\[.*?\]\s*/, '')}`;
    const backText = (rawFc && rawFc.back) ? rawFc.back : (q.answer_outline ? q.answer_outline.split('\n').slice(0, 3).join('\n') : 'Key takeaway point.');

    return {
      id: `FC-${idx + 1}`,
      requirement_ids: q.requirement_ids || [`REQ-${(idx % (requirements.length || 1)) + 1}`],
      front: frontText,
      back: backText,
      confidence: 0,
      state: 'generated'
    };
  });

  return {
    source: {
      company: finalCompanyName,
      company_url: companyUrl || '',
      role: finalRoleTitle,
      location: raw.source?.location || 'Remote',
      jd_chars: jobDescription.length,
      researched_at: new Date(),
      pages_used: researchData.pagesUsed || []
    },
    company_brief: {
      summary: raw.company_brief?.summary || `Interview prep kit for ${finalRoleTitle} at ${finalCompanyName}.`,
      what_they_do: raw.company_brief?.what_they_do || `${finalCompanyName} operates in the technology services and software development industry.`,
      sources: researchData.pagesUsed || [],
      state: 'generated'
    },
    role: {
      title: finalRoleTitle,
      seniority: finalSeniority,
      responsibilities: raw.role?.responsibilities || [`Architect and deliver high quality systems for ${finalRoleTitle}`, `Collaborate across product and engineering teams`],
      requirements: requirements.map(r => r.text)
    },
    requirements,
    questions,
    flashcards
  };
}

/**
 * Deterministic fallback kit generator producing (daysAvailable * 10) questions and flashcards.
 */
function generateFallbackKitData(jobDescription, companyUrl, researchData, companyName, roleTitle, seniority, daysAvailable = 5) {
  const isGenericCompany = (name) => !name || /^(company|company name|target company|untitled|company prep)$/i.test(name.trim());
  const isGenericRole = (title) => !title || /^(role|role title|interview prep kit|untitled role|prep kit|personalized prep kit)$/i.test(title.trim());

  const finalCompanyName = (companyName && !isGenericCompany(companyName)) ? companyName : extractCompanyName(jobDescription, companyUrl);
  const finalRoleTitle = (roleTitle && !isGenericRole(roleTitle)) ? roleTitle : extractRoleTitle(jobDescription);
  const finalSeniority = seniority || 'Senior';

  const lines = jobDescription.split('\n').map(l => l.trim()).filter(l => l.length > 15);
  
  const extractedReqs = lines.slice(0, 5);
  const reqTexts = [
    extractedReqs[0] || `${finalSeniority} level experience and core domain expertise as ${finalRoleTitle}`,
    extractedReqs[1] || `Proficiency in key tools, methodologies, and standards required for ${finalRoleTitle}`,
    extractedReqs[2] || `Strong analytical, problem-solving, and operational execution capabilities at ${finalCompanyName}`,
    extractedReqs[3] || `Compliance with industry regulations, quality assurance, and standard operating procedures`,
    extractedReqs[4] || `Effective cross-functional communication, teamwork, and leadership skills`
  ];

  const requirements = [
    { id: 'REQ-1', text: reqTexts[0], kind: 'technical', priority: 'must' },
    { id: 'REQ-2', text: reqTexts[1], kind: 'technical', priority: 'must' },
    { id: 'REQ-3', text: reqTexts[2], kind: 'technical', priority: 'must' },
    { id: 'REQ-4', text: reqTexts[3], kind: 'technical', priority: 'must' },
    { id: 'REQ-5', text: reqTexts[4], kind: 'behavioral', priority: 'nice' }
  ];

  const totalQuestions = daysAvailable * 10;
  const questions = [];
  const flashcards = [];

  const categories = ['Domain Mastery', 'Core Responsibilities', 'Quality & Compliance', 'Operational Problem Solving', 'Behavioral & Leadership'];

  const questionTemplates = [
    {
      prompt: (c, r, s, i) => `[${s} Level] As a ${r} at ${c}, how do you execute core clinical / operational responsibilities under high-pressure scenarios?`,
      answer: `1. Systematic initial assessment and triage based on established protocol\n2. Priority management and clear task delegation\n3. Strict adherence to ${c}'s safety, regulatory, and quality guidelines\n4. Post-procedure documentation and continuous quality evaluation`
    },
    {
      prompt: (c, r, s, i) => `[${s} Level] Describe your methodology for ensuring quality assurance, risk mitigation, and compliance for ${r} position.`,
      answer: `1. Regular audit of operational processes and compliance standards\n2. Root-cause analysis for any procedural variances or errors\n3. Implementation of corrective action plans and staff training\n4. Active communication with regulatory bodies and internal audit teams`
    },
    {
      prompt: (c, r, s, i) => `[${s} Level] Walk us through a complex case or project you managed as ${r} that required cross-functional coordination.`,
      answer: `1. Situation & Task overview outlining key objectives and constraints\n2. Collaborative action plan engaging interdisciplinary team members\n3. Overcoming communication barriers and resource bottlenecks\n4. Quantifiable positive outcome and key takeaways for ${c}`
    },
    {
      prompt: (c, r, s, i) => `[${s} Level] How do you handle unexpected complications or emergency situations while serving as ${r}?`,
      answer: `1. Rapid critical thinking and emergency response protocols\n2. De-escalation techniques and calm, authoritative communication\n3. Immediate escalation to senior leadership / medical direction when required\n4. Thorough incident documentation and debriefing`
    },
    {
      prompt: (c, r, s, i) => `[${s} Level] Describe a situation where you had to adapt quickly to new protocols or technology platforms at ${c}.`,
      answer: `1. Proactive learning mindset and quick adoption of updated guidelines\n2. Hands-on practice and peer knowledge-sharing\n3. Validating competency through testing and supervisor evaluation\n4. Assisting team members in seamless transition`
    }
  ];

  const flashcardTemplates = [
    { front: `What is the primary responsibility of a ${finalRoleTitle}?`, back: `To deliver high-quality patient care / professional services adhering to industry standards and ${finalCompanyName} protocols.` },
    { front: `How do you ensure strict compliance in ${finalRoleTitle} workflows?`, back: `By following standard operating procedures, completing mandatory documentation, and participating in regular audits.` },
    { front: `What critical steps are taken during an emergency response in ${finalRoleTitle}?`, back: `Immediate patient / situation stabilization, rapid triage, notification of lead team, and execution of emergency protocols.` },
    { front: `Why is effective documentation crucial for ${finalRoleTitle}?`, back: `Ensures continuity of care, legal compliance, accurate reporting, and transparent communication across departments.` },
    { front: `What is the key to managing high workload as ${finalRoleTitle}?`, back: `Prioritizing critical tasks, delegating appropriately, maintaining open team communication, and managing time efficiently.` }
  ];

  for (let i = 0; i < totalQuestions; i++) {
    const templateIdx = i % questionTemplates.length;
    const qTmpl = questionTemplates[templateIdx];
    const fcTmpl = flashcardTemplates[templateIdx];

    questions.push({
      id: `Q-${i + 1}`,
      requirement_ids: [`REQ-${(i % 5) + 1}`],
      category: categories[i % categories.length],
      prompt: qTmpl.prompt(finalCompanyName, finalRoleTitle, finalSeniority, i + 1),
      answer_outline: `${qTmpl.answer}\n5. Seniority Depth (${finalSeniority}): Tailored execution reflecting professional standards and leadership expectations.`,
      difficulty: (i % 3) + 1,
      completed: false,
      state: 'generated'
    });

    flashcards.push({
      id: `FC-${i + 1}`,
      requirement_ids: [`REQ-${(i % 5) + 1}`],
      front: fcTmpl.front,
      back: fcTmpl.back,
      confidence: 0,
      state: 'generated'
    });
  }

  return {
    source: {
      company: finalCompanyName,
      company_url: companyUrl || '',
      role: finalRoleTitle,
      location: 'Remote / On-site',
      jd_chars: jobDescription.length,
      researched_at: new Date(),
      pages_used: researchData.pagesUsed || []
    },
    company_brief: {
      summary: `${finalCompanyName} is actively recruiting qualified professionals for the ${finalRoleTitle} (${finalSeniority}) position.`,
      what_they_do: `Delivers dedicated services and operational excellence tailored to their sector at ${finalCompanyName}.`,
      sources: researchData.pagesUsed || [],
      state: 'generated'
    },
    role: {
      title: finalRoleTitle,
      seniority: finalSeniority,
      responsibilities: [
        `Execute core domain duties and deliver high-quality outcomes for ${finalRoleTitle}`,
        `Ensure adherence to safety, quality, and regulatory standards at ${finalCompanyName}`,
        `Collaborate with interdisciplinary teams and mentor junior staff members`
      ],
      requirements: requirements.map(r => r.text)
    },
    requirements,
    questions,
    flashcards
  };
}

/**
 * Generates 5 new questions and flashcards for a kit regeneration attempt.
 */
async function generateRegeneratedQuestions(kit, count = 5) {
  const company = kit.source?.company || 'Target Company';
  const role = kit.source?.role || kit.role?.title || 'Prep Kit';
  const seniority = kit.role?.seniority || 'Senior';
  const existingCount = kit.questions ? kit.questions.length : 0;

  const systemInstruction = `
You are an expert technical interviewer. Generate EXACTLY ${count} brand new interview questions and corresponding flashcards for a ${seniority} ${role} candidate at ${company}.
Return JSON only:
{
  "questions": [
    {
      "category": "Technical",
      "prompt": "Question prompt?",
      "answer_outline": "Detailed step-by-step answer outline.",
      "difficulty": 2
    }
  ],
  "flashcards": [
    {
      "front": "Flashcard front concept?",
      "back": "Concise explanation."
    }
  ]
}
`;

  const prompt = `COMPANY: ${company}, ROLE: ${role}, SENIORITY: ${seniority}. Generate ${count} new interview questions and flashcards.`;

  try {
    const res = await generateLlmJson(prompt, systemInstruction, 3500);
    if (res && res.questions && Array.isArray(res.questions)) {
      const newQs = res.questions.slice(0, count).map((q, idx) => ({
        id: `Q-${existingCount + idx + 1}`,
        requirement_ids: ['REQ-1'],
        category: q.category || 'Technical',
        prompt: q.prompt,
        answer_outline: q.answer_outline,
        difficulty: Math.min(3, Math.max(1, parseInt(q.difficulty) || 2)),
        completed: false,
        state: 'generated'
      }));

      const newFcs = (res.flashcards || []).slice(0, count).map((fc, idx) => ({
        id: `FC-${existingCount + idx + 1}`,
        requirement_ids: ['REQ-1'],
        front: fc.front || `Concept Q${existingCount + idx + 1}`,
        back: fc.back || `Explanation for concept Q${existingCount + idx + 1}`,
        confidence: 0,
        state: 'generated'
      }));

      return { questions: newQs, flashcards: newFcs };
    }
  } catch (e) {
    logger.warn(`[Regeneration] LLM call notice: ${e.message}. Using fast fallback generated questions.`);
  }

  // Fallback 5 new questions
  const newQs = [];
  const newFcs = [];
  for (let i = 0; i < count; i++) {
    const qNum = existingCount + i + 1;
    newQs.push({
      id: `Q-${qNum}`,
      requirement_ids: ['REQ-1'],
      category: i % 2 === 0 ? 'System Architecture' : 'Technical Mastery',
      prompt: `[${seniority}] Advanced Question #${qNum}: How do you design resilient microservice fault tolerance mechanisms at ${company}?`,
      answer_outline: '1. Circuit breaker pattern implementation (e.g. Resilience4j / Hystrix)\n2. Exponential backoff retry policies with jitter\n3. Bulkhead isolation pattern\n4. Observability tracing via OpenTelemetry',
      difficulty: 3,
      completed: false,
      state: 'generated'
    });

    newFcs.push({
      id: `FC-${qNum}`,
      requirement_ids: ['REQ-1'],
      front: `Q${qNum}: What is the Circuit Breaker pattern?`,
      back: 'Prevents cascading failures by opening circuit and failing fast when downstream call error rates cross thresholds.',
      confidence: 0,
      state: 'generated'
    });
  }

  return { questions: newQs, flashcards: newFcs };
}

function extractCompanyName(jd, url) {
  if (url && typeof url === 'string' && url.trim() !== '') {
    try {
      let formattedUrl = url.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) formattedUrl = `https://${formattedUrl}`;
      const hostname = new URL(formattedUrl).hostname.replace(/^www\./i, '');
      const parts = hostname.split('.');
      if (parts[0] && !['com', 'org', 'net', 'co', 'io'].includes(parts[0].toLowerCase())) {
        const clean = parts[0].replace(/[-_]/g, ' ');
        return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    } catch (e) {}
  }

  const match = jd.match(/(?:at|company|team at|joining|about)\s+([A-Z][A-Za-z0-9\s&]{2,25})(?=\s|\n|,|\.|$)/i);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (!/^(the|a|an|our|this|senior|lead|engineer|developer|full|backend|frontend|software)$/i.test(candidate)) {
      return candidate;
    }
  }

  const line1 = jd.trim().split('\n')[0];
  const atMatch = line1.match(/(?:at|for|@)\s+([A-Z][A-Za-z0-9\s&]{2,25})/i);
  if (atMatch && atMatch[1]) return atMatch[1].trim();

  return 'Company Prep';
}

function extractRoleTitle(jd) {
  const lines = jd.trim().split('\n').map(l => l.trim()).filter(Boolean);
  
  if (lines[0] && lines[0].length < 80) {
    const roleInLine = lines[0].replace(/^(job description|role|position|hiring for|title)[:\s-]*/i, '').trim();
    if (roleInLine) {
      const match = roleInLine.match(/(.*?)\s+(?:at|for|@)\s+/i);
      if (match && match[1] && match[1].length > 3) return match[1].trim();
      if (!/responsibilities|requirements|about us|overview|summary/i.test(roleInLine) && roleInLine.length > 3) {
        return roleInLine;
      }
    }
  }

  const match = jd.match(/(Senior|Lead|Junior|Staff|Principal|Head of|VP of)?\s*([A-Za-z0-9\s\/-]{2,30})\s*(Engineer|Developer|Architect|Designer|Manager|Analyst|Consultant|Specialist|Lead|Director)/i);
  if (match && match[0]) return match[0].trim();

  return 'Software Engineer';
}

module.exports = { generateInitialKitData, generateRegeneratedQuestions };
