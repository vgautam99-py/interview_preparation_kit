const logger = require('../utils/logger');
const { generateLlmJson } = require('./llm.service');

/**
 * Handles section regeneration while strictly preserving `edited`, `manual`, and `pinned` items.
 */
async function regenerateSection(kit, targetSection, targetCategory = null) {
  const updatedKit = { ...kit.toObject ? kit.toObject() : kit };

  if (targetSection === 'company_brief') {
    // If state is edited, manual, or pinned, protect it!
    if (['edited', 'manual', 'pinned'].includes(updatedKit.company_brief?.state)) {
      logger.info(`[Builder Service] Protected state '${updatedKit.company_brief.state}' on company_brief. Skipping overwrite.`);
      return updatedKit;
    }
    
    // Regenerate brief
    updatedKit.company_brief = {
      summary: `Updated overview of ${updatedKit.source.company} focussing on recent product engineering priorities.`,
      what_they_do: updatedKit.company_brief.what_they_do || `Leading provider of modern software solutions.`,
      sources: updatedKit.source.pages_used || [],
      state: 'generated'
    };

    return updatedKit;
  }

  if (targetSection === 'category' && targetCategory) {
    logger.info(`[Builder Service] Regenerating category '${targetCategory}' while preserving protected items.`);

    const questions = updatedKit.questions || [];
    
    // Separate protected items vs replaceable items in target category
    const categoryQuestions = questions.filter(q => q.category === targetCategory);
    const protectedCategoryQuestions = categoryQuestions.filter(q => ['edited', 'manual', 'pinned'].includes(q.state));
    
    // Generate fresh replacement items for un-protected 'generated' items
    const unProtectedCount = categoryQuestions.length - protectedCategoryQuestions.length;
    const freshReplacements = [];

    for (let i = 0; i < Math.max(1, unProtectedCount); i++) {
      const newId = `Q-${questions.length + freshReplacements.length + 1}`;
      freshReplacements.push({
        id: newId,
        requirement_ids: [updatedKit.requirements[0]?.id || 'REQ-1'],
        category: targetCategory,
        prompt: `[Regenerated] Enhanced ${targetCategory} scenario: How do you address performance optimization in ${updatedKit.source.role}?`,
        answer_outline: `1. Identification of bottlenecks\n2. Implementation strategy\n3. Empirical verification`,
        difficulty: 2,
        state: 'generated'
      });
    }

    // Merge: retain non-target questions + protected target questions + new replacements
    const nonTargetQuestions = questions.filter(q => q.category !== targetCategory);
    updatedKit.questions = [
      ...nonTargetQuestions,
      ...protectedCategoryQuestions,
      ...freshReplacements
    ];

    return updatedKit;
  }

  if (targetSection === 'schedule') {
    const { generateSchedule } = require('./schedule.service');
    updatedKit.schedule = generateSchedule(updatedKit.schedule.days_available, updatedKit.questions, updatedKit.requirements);
    return updatedKit;
  }

  return updatedKit;
}

module.exports = { regenerateSection };
