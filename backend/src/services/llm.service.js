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
 * Calls Gemini API with 25s timeout guard or returns structured fallback output.
 */
async function generateLlmJson(prompt, systemInstruction = '', timeoutMs = 25000) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
    // Use valid fast models only
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];
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

        // 25-second timeout race to ensure full response generation
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`LLM generation timeout (${timeoutMs}ms)`)), timeoutMs)
        );

        const generatePromise = model.generateContent(fullPrompt);
        const result = await Promise.race([generatePromise, timeoutPromise]);
        
        const text = result.response.text();
        const cleanedText = cleanJsonResponse(text);
        const parsed = JSON.parse(cleanedText);
        logger.info(`[LLM Service] AI content generated successfully using model '${modelName}'.`);
        return parsed;
      } catch (err) {
        logger.warn(`[LLM Service] Model '${modelName}' attempt notice: ${err.message}. Trying fallback...`);
      }
    }
  }

  logger.info('[LLM Service] Operating in fast offline/rule-based fallback mode.');
  return null; // Return null so callers can execute domain-specific fallback logic
}

module.exports = { generateLlmJson, cleanJsonResponse };

