const logger = require('../utils/logger');
const { generateLlmJson } = require('./llm.service');

/**
 * Computes uncovered must-have requirement IDs deterministically.
 */
function calculateCoverage(requirements, questions) {
  const mustHaveReqs = requirements.filter(r => r.priority === 'must');
  const coveredSet = new Set();

  questions.forEach(q => {
    if (Array.isArray(q.requirement_ids)) {
      q.requirement_ids.forEach(id => coveredSet.add(id));
    }
  });

  const uncoveredReqs = mustHaveReqs.filter(r => !coveredSet.has(r.id));
  const uncovered_requirement_ids = uncoveredReqs.map(r => r.id);

  return {
    uncovered_requirement_ids,
    isComplete: uncovered_requirement_ids.length === 0,
    uncoveredReqs
  };
}

/**
 * Performs coverage check and triggers a targeted 2nd pass if any must-have requirements are uncovered.
 */
async function processCoverageAndSecondPass(requirements, questions, flashcards) {
  let initialCoverage = calculateCoverage(requirements, questions);
  
  if (initialCoverage.isComplete) {
    logger.info('[Coverage Service] All must-have requirements covered in Pass 1.');
    return {
      questions,
      flashcards,
      coverage: {
        uncovered_requirement_ids: [],
        passes: 1
      }
    };
  }

  logger.info(`[Coverage Service] Uncovered must-have requirements detected in Pass 1: ${initialCoverage.uncovered_requirement_ids.join(', ')}. Triggering Pass 2.`);

  const updatedQuestions = [...questions];
  const updatedFlashcards = [...flashcards];

  // Pass 2: Deterministic generation of missing questions/flashcards for uncovered requirement IDs
  for (const req of initialCoverage.uncoveredReqs) {
    const newQId = `Q-${updatedQuestions.length + 1}`;
    const newFcId = `FC-${updatedFlashcards.length + 1}`;

    const newQuestion = {
      id: newQId,
      requirement_ids: [req.id],
      category: 'Technical',
      prompt: `Deep Dive: How do you demonstrate proficiency in ${req.text}?`,
      answer_outline: `1. Key architectural concepts of ${req.text}\n2. Production edge cases and error handling\n3. Measurement and validation techniques`,
      difficulty: 2,
      state: 'generated'
    };

    const newFlashcard = {
      id: newFcId,
      requirement_ids: [req.id],
      front: `Core concept: ${req.text}`,
      back: `Essential knowledge for ${req.text}: understanding implementation details, key parameters, and best practices.`,
      confidence: 0,
      state: 'generated'
    };

    updatedQuestions.push(newQuestion);
    updatedFlashcards.push(newFlashcard);
  }

  // Re-calculate coverage after Pass 2
  const finalCoverage = calculateCoverage(requirements, updatedQuestions);

  return {
    questions: updatedQuestions,
    flashcards: updatedFlashcards,
    coverage: {
      uncovered_requirement_ids: finalCoverage.uncovered_requirement_ids,
      passes: 2
    }
  };
}

module.exports = { calculateCoverage, processCoverageAndSecondPass };
