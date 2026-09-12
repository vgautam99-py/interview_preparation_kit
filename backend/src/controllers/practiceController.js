const Kit = require('../models/Kit');
const mongoose = require('mongoose');
const { getPrioritizedFlashcards, updateCardConfidence } = require('../services/flashcard.service');

// Safe Mongoose query helper for string IDs vs ObjectIds with userId isolation
function getKitQuery(id, userId) {
  const query = (id && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id))
    ? { $or: [{ _id: id }, { id }] }
    : { id };
  if (userId) {
    query.userId = userId;
  }
  return query;
}

async function getPracticeFlashcards(req, res) {
  const { kitId } = req.params;
  const { mode } = req.query; // 'weak' or 'all'
  const userId = req.user?.userId || req.user?.id || 'demo_user';

  try {
    let kit = null;
    if (Kit.db && Kit.db.readyState === 1) {
      kit = await Kit.findOne(getKitQuery(kitId, userId));
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
  const userId = req.user?.userId || req.user?.id || 'demo_user';

  try {
    let kit = null;
    if (Kit.db && Kit.db.readyState === 1) {
      kit = await Kit.findOne(getKitQuery(kitId, userId));
    }

    if (!kit) return res.status(404).json({ error: 'Kit not found' });

    const updatedFlashcards = updateCardConfidence(kit.flashcards, cardId, confidence);
    
    if (Kit.db && Kit.db.readyState === 1) {
      await Kit.updateOne(getKitQuery(kitId, userId), { $set: { flashcards: updatedFlashcards } });
    }

    res.json({ message: 'Confidence updated successfully', flashcards: updatedFlashcards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getPracticeFlashcards, updateConfidence };

