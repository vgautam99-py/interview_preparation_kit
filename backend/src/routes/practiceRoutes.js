const express = require('express');
const router = express.Router();
const { getPracticeFlashcards, updateConfidence } = require('../controllers/practiceController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:kitId/flashcards', authMiddleware, getPracticeFlashcards);
router.post('/:kitId/confidence', authMiddleware, updateConfidence);

module.exports = router;
