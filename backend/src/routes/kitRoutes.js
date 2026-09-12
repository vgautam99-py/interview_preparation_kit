const express = require('express');
const router = express.Router();
const {
  createKit,
  getKitStatus,
  getKit,
  listKits,
  updateKit,
  updateReadiness,
  updateFlashcardLevel,
  regenerateKitSection,
  deleteKit,
  duplicateKit
} = require('../controllers/kitController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createKit);
router.get('/', authMiddleware, listKits);
router.get('/:id', authMiddleware, getKit);
router.get('/:id/status', authMiddleware, getKitStatus);
router.put('/:id', authMiddleware, updateKit);
router.delete('/:id', authMiddleware, deleteKit);
router.post('/:id/duplicate', authMiddleware, duplicateKit);
router.put('/:id/readiness', authMiddleware, updateReadiness);
router.put('/:id/flashcard-level', authMiddleware, updateFlashcardLevel);
router.post('/:id/regenerate', authMiddleware, regenerateKitSection);

module.exports = router;
