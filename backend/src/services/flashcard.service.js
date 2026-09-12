/**
 * Sorts flashcards by confidence score ascending (0 = unrated, 1 = low confidence, 2 = medium, 3 = high)
 * so least-confident cards appear first in practice sessions.
 */
function getPrioritizedFlashcards(flashcards) {
  if (!Array.isArray(flashcards)) return [];
  
  return [...flashcards].sort((a, b) => {
    const confA = a.confidence ?? 0;
    const confB = b.confidence ?? 0;
    // Unrated (0) or Low (1) first
    return confA - confB;
  });
}

/**
 * Updates confidence level (1-5) for a specific flashcard with lastSeenAt timestamp.
 */
function updateCardConfidence(flashcards, cardId, confidenceLevel) {
  return flashcards.map(card => {
    if (card.id === cardId) {
      return {
        ...card,
        confidence: Math.min(5, Math.max(1, parseInt(confidenceLevel) || 1)),
        lastSeenAt: new Date(),
        state: card.state === 'generated' ? 'edited' : card.state
      };
    }
    return card;
  });
}

module.exports = { getPrioritizedFlashcards, updateCardConfidence };

