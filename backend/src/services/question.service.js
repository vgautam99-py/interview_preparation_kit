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

  // 3. Format Flashcards
  let flashcards = (raw.flashcards || []).map((fc, idx) => ({
    id: `FC-${idx + 1}`,
    requirement_ids: resolveReqIds(fc.temp_req_text, idx),
    front: fc.front,
    back: fc.back,
    confidence: 0,
    state: 'generated'
  }));

  // Pad Questions and Flashcards up to targetTotalCount (e.g. 50 questions & flashcards for 5 days)
  if (questions.length < targetTotalCount) {
    const categories = ['System Design', 'Technical', 'Behavioral', 'Database Architecture', 'Security & Performance'];
    const currentLen = questions.length;
    for (let i = currentLen; i < targetTotalCount; i++) {
      const qNum = i + 1;
      questions.push({
        id: `Q-${qNum}`,
        requirement_ids: [`REQ-${(i % (requirements.length || 1)) + 1}`],
        category: categories[i % categories.length],
        prompt: `[${finalSeniority} Level] Q${qNum}: How do you design and optimize scalable ${finalRoleTitle} architecture at ${finalCompanyName}?`,
        answer_outline: `1. Key architectural trade-off analysis\n2. Database query optimization and index design\n3. High-availability fault tolerance & error handling\n4. Performance monitoring & operational metrics`,
        difficulty: (i % 3) + 1,
        completed: false,
        state: 'generated'
      });

      flashcards.push({
        id: `FC-${qNum}`,
        requirement_ids: [`REQ-${(i % (requirements.length || 1)) + 1}`],
        front: `What is the primary architecture pattern for ${finalRoleTitle}?`,
        back: `Decoupled microservices architecture with cached data access layers and asynchronous message queues for ${finalCompanyName}.`,
        confidence: 0,
        state: 'generated'
      });
    }
  }

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
  
  const reqTexts = [
    lines.find(l => /experience|years|proficient|knowledge/i.test(l)) || `${seniority} level experience in Software Engineering & Architecture`,
    lines.find(l => /node|typescript|javascript|react|python|java/i.test(l)) || 'Strong proficiency in Full-Stack Technologies & Frameworks',
    lines.find(l => /database|sql|mongo|postgres/i.test(l)) || 'Hands-on experience with Relational / NoSQL Databases & Schema Design',
    lines.find(l => /testing|ci\/cd|cloud|aws|gcp/i.test(l)) || 'Familiarity with Automated Testing, CI/CD, and Cloud Infrastructure',
    lines.find(l => /communication|leadership|agile/i.test(l)) || 'Excellent communication, system ownership, and cross-functional leadership'
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

  const categories = ['System Design', 'Technical', 'Behavioral', 'Database Architecture', 'Security & Performance'];

  const questionTemplates = [
    {
      prompt: (c, r, s, i) => `[${s} Level] How would you design a highly available, fault-tolerant system for ${r} at ${c}?`,
      answer: '1. Deconstruct requirement SLAs (99.99% availability)\n2. Database indexing, partitioning, and read replicas\n3. Microservices decoupling via event-driven messaging\n4. Monitoring, rate limiting, and graceful degradation'
    },
    {
      prompt: (c, r, s, i) => `[${s} Level] Explain advanced asynchronous queue handling and event loop optimization strategies for high throughput in ${c}'s core services.`,
      answer: '1. Event loop profiling and CPU bound offloading via worker threads\n2. Backpressure management using stream pipelines\n3. Dead-letter queues and idempotency mechanisms'
    },
    {
      prompt: (c, r, s, i) => `[${s} Level] How do you design high-efficiency database index schemas to eliminate collection scan bottlenecks?`,
      answer: '1. ESR (Equality, Sort, Range) rule alignment\n2. Explain plan query execution inspection\n3. Write concern vs read preference trade-offs'
    },
    {
      prompt: (c, r, s, i) => `[${s} Level] Describe your automated CI/CD pipeline strategy for zero-downtime microservice deployments.`,
      answer: '1. Blue-Green / Canary deployment traffic routing\n2. Automated smoke tests & rollback health checks\n3. Infrastructure-as-code and container vulnerability scanning'
    },
    {
      prompt: (c, r, s, i) => `[${s} Level] Describe how you handle conflicting technical priorities under tight deadlines while preserving code quality.`,
      answer: '1. STAR framework (Situation, Task, Action, Result)\n2. Explicit trade-off evaluation (Tech Debt vs Speed to Market)\n3. Stakeholder alignment & clear roadmap renegotiation'
    }
  ];

  const flashcardTemplates = [
    { front: 'What is the ESR Rule in Indexing?', back: 'Equality fields first, Sort fields second, Range fields last in compound database indexes.' },
    { front: 'Difference between process.nextTick and setImmediate in Node.js?', back: 'process.nextTick executes immediately after current phase; setImmediate runs in the Check phase.' },
    { front: 'What is SSRF and how do you prevent it?', back: 'Server-Side Request Forgery occurs when server fetches untrusted URLs; mitigate by strict domain white-listing and blocking private IP ranges.' },
    { front: 'What is a Canary Deployment?', back: 'Rolling out new code to a small subset of users (5-10%) to monitor error metrics before full production rollout.' },
    { front: 'What is Idempotency in API Design?', back: 'Ensuring an operation produces the same result no matter how many times it is repeatedly invoked (e.g., using Idempotency-Key headers).' }
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
      answer_outline: `${qTmpl.answer}\n5. Seniority Depth (${finalSeniority}): Tailored analysis considering cost, scale, and operational simplicity.`,
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
      location: 'Remote / Hybrid',
      jd_chars: jobDescription.length,
      researched_at: new Date(),
      pages_used: researchData.pagesUsed || []
    },
    company_brief: {
      summary: `${finalCompanyName} is actively hiring and preparing candidates for the ${finalRoleTitle} (${finalSeniority}) position.`,
      what_they_do: `Provides web services, scalable APIs, and software solutions tailored for modern business operations at ${finalCompanyName}.`,
      sources: researchData.pagesUsed || [],
      state: 'generated'
    },
    role: {
      title: finalRoleTitle,
      seniority: finalSeniority,
      responsibilities: [
        `Architect and implement reliable web applications and microservices for ${finalRoleTitle}`,
        `Lead code reviews, enforce design standards, and mentor engineers at ${finalCompanyName}`,
        `Ensure system reliability, security compliance, and performance optimization`
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
