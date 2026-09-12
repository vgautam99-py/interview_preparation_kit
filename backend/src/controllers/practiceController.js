const Kit = require('../models/Kit');
const mongoose = require('mongoose');
const { getPrioritizedFlashcards, updateCardConfidence } = require('../services/flashcard.service');

// Safe Mongoose query helper for string IDs vs ObjectIds
function getKitQuery(id) {
  if (id && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
    return { $or: [{ _id: id }, { id }] };
  }
  return { id };
}

async function getPracticeFlashcards(req, res) {
  const { kitId } = req.params;
  const { mode } = req.query; // 'weak' or 'all'
  try {
    let kit = null;
    if (Kit.db && Kit.db.readyState === 1) {
      kit = await Kit.findOne(getKitQuery(kitId));
    }
    
    let flashcards = kit ? kit.flashcards || [] : [];
    if (mode === 'weak') {
      flashcards = getPrioritizedFlashcards(flashcards);
    }
    res.json({ flashcards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateConfidence(req, res) {
  const { kitId } = req.params;
  const { cardId, confidence } = req.body;

  try {
    let kit = null;
    if (Kit.db && Kit.db.readyState === 1) {
      kit = await Kit.findOne(getKitQuery(kitId));
    }

    if (!kit) return res.status(404).json({ error: 'Kit not found' });

    const updatedFlashcards = updateCardConfidence(kit.flashcards, cardId, confidence);
    
    if (Kit.db && Kit.db.readyState === 1) {
      await Kit.updateOne(getKitQuery(kitId), { $set: { flashcards: updatedFlashcards } });
    }

    res.json({ message: 'Confidence updated successfully', flashcards: updatedFlashcards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getPracticeFlashcards, updateConfidence };

