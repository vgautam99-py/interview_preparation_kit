const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

/**
 * Sanitizes markdown code blocks from LLM raw text response to yield clean JSON.
 */
function cleanJsonResponse(rawText) {
  if (!rawText) return '{}';
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Calls Gemini API or returns structured fallback output if API key is not set.
 */
async function generateLlmJson(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json'
          }
        });

        const fullPrompt = systemInstruction 
          ? `${systemInstruction}\n\nUSER PROMPT:\n${prompt}` 
          : prompt;

        const result = await model.generateContent(fullPrompt);
        const text = result.response.text();
        const cleanedText = cleanJsonResponse(text);
        const parsed = JSON.parse(cleanedText);
        logger.info(`[LLM Service] AI content generated successfully using model '${modelName}'.`);
        return parsed;
      } catch (err) {
        logger.warn(`[LLM Service] Model '${modelName}' attempt failed: ${err.message}. Trying next model...`);
      }
    }
  }

  logger.info('[LLM Service] Operating in offline/rule-based fallback mode.');
  return null; // Return null so callers can execute domain-specific fallback logic
}

module.exports = { generateLlmJson, cleanJsonResponse };
