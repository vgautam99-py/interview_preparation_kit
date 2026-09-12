const Kit = require('../models/Kit');
const User = require('../models/User');
const mongoose = require('mongoose');
const { validateKitInput } = require('../validators/kitValidator');
const { runKitPipeline } = require('../pipeline/runKitPipeline');
const { regenerateSection } = require('../services/builder.service');
const logger = require('../utils/logger');

// In-memory store fallback if DB offline
const inMemoryKits = new Map();

// Safe Mongoose query helper for string IDs vs ObjectIds with optional userId isolation
function getKitQuery(id, userId) {
  const query = (id && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id))
    ? { $or: [{ _id: id }, { id }] }
    : { id };
  if (userId) {
    query.userId = userId;
  }
  return query;
}

const { generateRegeneratedQuestions } = require('../services/question.service');

async function createKit(req, res) {
  const validation = validateKitInput(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { jobDescription, companyUrl, companyName, roleTitle, seniorityLevel, daysAvailable } = req.body;
  const userId = req.user?.userId || req.user?.id || 'demo_user';

  // Check user subscription & kit limit
  try {
    let currentCount = 0;
    let subscription = 'free';

    if (Kit.db && Kit.db.readyState === 1) {
      currentCount = await Kit.countDocuments({ userId });
      const user = await User.findById(userId);
      if (user) subscription = user.subscription || 'free';
    } else {
      currentCount = Array.from(inMemoryKits.values()).filter(k => k.userId === userId).length;
    }

    const limitsMap = { free: 10, mid: 25, pro: 50, ultra: 100, 'ultra pro': 100 };
    const maxAllowed = limitsMap[subscription.toLowerCase()] || 10;

    if (currentCount >= maxAllowed) {
      return res.status(403).json({
        error: `Kit limit reached for ${subscription.toUpperCase()} plan (${currentCount}/${maxAllowed} kits used). Please upgrade your plan to create more prep kits!`
      });
    }
  } catch (err) {
    logger.warn(`Limit check exception: ${err.message}`);
  }

  const kitId = `kit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const initialDraft = {
    id: kitId,
    _id: kitId,
    userId,
    status: 'pending',
    readiness: 'yellow',
    errorMessage: '',
    regeneration_attempts: 0,
    source: { company: companyName || '', company_url: companyUrl || '', role: roleTitle || '', jd_chars: jobDescription.length },
    role: { title: roleTitle || '', seniority: seniorityLevel || 'Junior' },
    schedule: { days_available: daysAvailable || 5, days: [] },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    if (Kit.db && Kit.db.readyState === 1) {
      await Kit.create({ ...initialDraft, _id: undefined });
    } else {
      inMemoryKits.set(kitId, initialDraft);
    }
  } catch (err) {
    logger.error(`[Kit Controller] DB initial draft save warning: ${err.message}`);
    inMemoryKits.set(kitId, initialDraft);
  }

  // Trigger background AI pipeline
  runPipelineInBackground(kitId, jobDescription, companyUrl, daysAvailable, companyName, roleTitle, seniorityLevel, userId).catch(err => {
    logger.error(`Background pipeline exception for kit ${kitId}: ${err.message}`);
  });

  res.status(202).json({
    message: 'Kit generation initiated successfully',
    kitId,
    status: 'pending'
  });
}

async function runPipelineInBackground(kitId, jobDescription, companyUrl, daysAvailable, companyName, roleTitle, seniorityLevel, userId) {
  const updateStatus = async (status) => {
    try {
      if (Kit.db && Kit.db.readyState === 1) {
        await Kit.updateOne(getKitQuery(kitId, userId), { $set: { status, updatedAt: new Date() } });
      }
      const existing = inMemoryKits.get(kitId);
      if (existing && existing.userId === userId) {
        existing.status = status;
        existing.updatedAt = new Date();
      }
    } catch (e) {}
  };

  try {
    const finalKitData = await runKitPipeline(
      { jobDescription, companyUrl, daysAvailable, companyName, roleTitle, seniorityLevel },
      async (stage) => await updateStatus(stage)
    );

    if (Kit.db && Kit.db.readyState === 1) {
      const updateRes = await Kit.updateOne(
        getKitQuery(kitId, userId),
        {
          $set: {
            ...finalKitData,
            status: 'completed',
            updatedAt: new Date()
          }
        }
      );
      logger.info(`[Kit Controller] Saved generated kit ${kitId} to DB (matched: ${updateRes.matchedCount}, modified: ${updateRes.modifiedCount})`);
    }
    
    const cached = inMemoryKits.get(kitId) || {};
    inMemoryKits.set(kitId, {
      ...cached,
      ...finalKitData,
      id: kitId,
      _id: kitId,
      userId,
      status: 'completed',
      updatedAt: new Date()
    });

  } catch (err) {
    logger.error(`[Kit Controller] Pipeline failed for ${kitId}: ${err.message}`);
    if (Kit.db && Kit.db.readyState === 1) {
      await Kit.updateOne(getKitQuery(kitId, userId), { $set: { status: 'failed', errorMessage: err.message } });
    }
    const cached = inMemoryKits.get(kitId);
    if (cached) {
      cached.status = 'failed';
      cached.errorMessage = err.message;
    }
  }
}

async function getKitStatus(req, res) {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id || 'demo_user';
  try {
    let kit = null;
    if (Kit.db && Kit.db.readyState === 1) {
      kit = await Kit.findOne(getKitQuery(id, userId));
    }
    if (!kit) {
      const cached = inMemoryKits.get(id);
      if (cached && cached.userId === userId) kit = cached;
    }

    if (!kit) return res.status(404).json({ error: 'Kit not found' });

    res.json({
      id: kit.id || kit._id,
      status: kit.status,
      readiness: kit.readiness || 'yellow',
      errorMessage: kit.errorMessage || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function syncKitSchedule(kitObj) {
  if (!kitObj || !kitObj.questions || kitObj.questions.length === 0) return kitObj;
  const numDays = kitObj.schedule?.days_available || (kitObj.schedule?.days?.length) || 5;
  const currentTotalAssigned = (kitObj.schedule?.days || []).reduce((acc, d) => acc + (d.question_ids?.length || 0), 0);

  if (currentTotalAssigned !== kitObj.questions.length) {
    const updatedSchedule = generateSchedule(numDays, kitObj.questions, kitObj.requirements || []);
    if (kitObj.schedule?.days) {
      const completedMap = {};
      kitObj.schedule.days.forEach(d => { if (d.completed) completedMap[d.day] = true; });
      updatedSchedule.days.forEach(d => { if (completedMap[d.day]) d.completed = true; });
    }
    kitObj.schedule = updatedSchedule;

    if (Kit.db && Kit.db.readyState === 1 && kitObj._id) {
      Kit.updateOne({ _id: kitObj._id }, { $set: { schedule: updatedSchedule } }).catch(() => {});
    }
  }
  return kitObj;
}

async function getKit(req, res) {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id || 'demo_user';
  try {
    let kit = null;
    if (Kit.db && Kit.db.readyState === 1) {
      kit = await Kit.findOne(getKitQuery(id, userId));
    }
    if (!kit) {
      const cached = inMemoryKits.get(id);
      if (cached && cached.userId === userId) kit = cached;
    }

    if (!kit) return res.status(404).json({ error: 'Kit not found' });

    const kitObj = kit.toObject ? kit.toObject() : kit;
    kitObj.id = kitObj.id || kitObj._id;
    res.json(syncKitSchedule(kitObj));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listKits(req, res) {
  const userId = req.user?.userId || req.user?.id || 'demo_user';
  try {
    let kits = [];
    if (Kit.db && Kit.db.readyState === 1) {
      kits = await Kit.find({ userId }).sort({ createdAt: -1 }).limit(50);
    }
    if (kits.length === 0 && inMemoryKits.size > 0) {
      kits = Array.from(inMemoryKits.values()).filter(k => k.userId === userId);
    }
    res.json(kits.map(k => {
      const obj = k.toObject ? k.toObject() : k;
      obj.id = obj.id || obj._id;
      return syncKitSchedule(obj);
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateKit(req, res) {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id || 'demo_user';
  const updates = req.body;

  try {
    let kit = null;
    if (Kit.db && Kit.db.readyState === 1) {
      kit = await Kit.findOneAndUpdate(getKitQuery(id, userId), { $set: updates }, { new: true });
    }
    if (!kit && inMemoryKits.has(id)) {
      const existing = inMemoryKits.get(id);
      if (existing && existing.userId === userId) {
        kit = { ...existing, ...updates, updatedAt: new Date() };
        inMemoryKits.set(id, kit);
      }
    }

    if (!kit) return res.status(404).json({ error: 'Kit not found' });
    
    const obj = kit.toObject ? kit.toObject() : kit;
    obj.id = obj.id || obj._id;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateReadiness(req, res) {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id || 'demo_user';
  const { readiness } = req.body; // 'red' | 'yellow' | 'green'

  if (!['red', 'yellow', 'green'].includes(readiness)) {
    return res.status(400).json({ error: 'Invalid readiness level.' });
  }

  try {
    let kit = null;
    if (Kit.db && Kit.db.readyState === 1) {
      kit = await Kit.findOneAndUpdate(getKitQuery(id, userId), { $set: { readiness } }, { new: true });
    }
    if (!kit && inMemoryKits.has(id)) {
      const memKit = inMemoryKits.get(id);
      if (memKit && memKit.userId === userId) {
        memKit.readiness = readiness;
        kit = memKit;
      }
    }

    if (!kit) return res.status(404).json({ error: 'Kit not found' });
    res.json({ message: 'Readiness updated', readiness });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateFlashcardLevel(req, res) {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id || 'demo_user';
  const { cardId, understandingLevel } = req.body; // 'beginner' | 'intermediate' | 'fully'

  try {
    let kit = null;
    if (Kit.db && Kit.db.readyState === 1) {
      kit = await Kit.findOne(getKitQuery(id, userId));
      if (kit) {
        kit.flashcards = kit.flashcards.map(fc => {
          if (fc.id === cardId) {
            fc.understandingLevel = understandingLevel;
          }
          return fc;
        });
        await kit.save();
      }
    }
    if (inMemoryKits.has(id)) {
      const memKit = inMemoryKits.get(id);
      if (memKit && memKit.userId === userId) {
        memKit.flashcards = (memKit.flashcards || []).map(fc => {
          if (fc.id === cardId) fc.understandingLevel = understandingLevel;
          return fc;
        });
        kit = memKit;
      }
    }

    if (!kit) return res.status(404).json({ error: 'Kit not found' });

    res.json({ message: 'Flashcard understanding level updated', cardId, understandingLevel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const { generateSchedule } = require('../services/schedule.service');

async function regenerateKitSection(req, res) {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id || 'demo_user';

  try {
    let kit = null;
    if (Kit.db && Kit.db.readyState === 1) {
      kit = await Kit.findOne(getKitQuery(id, userId));
    }
    if (!kit) {
      const cached = inMemoryKits.get(id);
      if (cached && cached.userId === userId) kit = cached;
    }

    if (!kit) return res.status(404).json({ error: 'Kit not found' });

    const attempts = kit.regeneration_attempts || 0;
    if (attempts >= 3) {
      return res.status(400).json({ error: 'Maximum 3 regeneration attempts reached for this prep kit.' });
    }

    const { questions: newQs, flashcards: newFcs } = await generateRegeneratedQuestions(kit, 5);

    const updatedQuestions = [...(kit.questions || []), ...newQs];
    const updatedFlashcards = [...(kit.flashcards || []), ...newFcs];
    const newAttempts = attempts + 1;

    // Automatically divide updated questions across day buckets in schedule
    const daysAvailable = kit.schedule?.days_available || (kit.schedule?.days?.length) || 5;
    const updatedSchedule = generateSchedule(daysAvailable, updatedQuestions, kit.requirements || []);

    if (kit.schedule?.days) {
      const completedMap = {};
      kit.schedule.days.forEach(d => {
        if (d.completed) completedMap[d.day] = true;
      });
      updatedSchedule.days.forEach(d => {
        if (completedMap[d.day]) d.completed = true;
      });
    }

    const updates = {
      questions: updatedQuestions,
      flashcards: updatedFlashcards,
      schedule: updatedSchedule,
      regeneration_attempts: newAttempts,
      updatedAt: new Date()
    };

    let updatedKitObj = null;
    if (Kit.db && Kit.db.readyState === 1) {
      updatedKitObj = await Kit.findOneAndUpdate(getKitQuery(id, userId), { $set: updates }, { new: true });
    }
    if (!updatedKitObj && inMemoryKits.has(id)) {
      const existing = inMemoryKits.get(id);
      if (existing && existing.userId === userId) {
        updatedKitObj = { ...existing, ...updates };
        inMemoryKits.set(id, updatedKitObj);
      }
    }

    const obj = updatedKitObj ? (updatedKitObj.toObject ? updatedKitObj.toObject() : updatedKitObj) : updates;
    obj.id = obj.id || id;

    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteKit(req, res) {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id || 'demo_user';
  try {
    if (Kit.db && Kit.db.readyState === 1) {
      await Kit.deleteOne(getKitQuery(id, userId));
    }
    const memKit = inMemoryKits.get(id);
    if (memKit && memKit.userId === userId) {
      inMemoryKits.delete(id);
    }
    res.json({ message: 'Kit deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function duplicateKit(req, res) {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id || 'demo_user';
  try {
    let original = null;
    if (Kit.db && Kit.db.readyState === 1) {
      original = await Kit.findOne(getKitQuery(id, userId));
    }
    if (!original) {
      const cached = inMemoryKits.get(id);
      if (cached && cached.userId === userId) original = cached;
    }

    if (!original) return res.status(404).json({ error: 'Original kit not found' });

    const obj = original.toObject ? original.toObject() : { ...original };
    delete obj._id;
    delete obj.__v;

    const newId = `kit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    obj.id = newId;
    obj.userId = userId;
    obj.createdAt = new Date();
    obj.updatedAt = new Date();

    if (obj.source) {
      obj.source = { ...obj.source, company: `${obj.source.company || 'Kit'} (Copy)` };
    }
    if (obj.role) {
      obj.role = { ...obj.role, title: `${obj.role.title || 'Role'} (Copy)` };
    }

    let createdKit = obj;
    if (Kit.db && Kit.db.readyState === 1) {
      const doc = await Kit.create(obj);
      createdKit = doc.toObject();
      createdKit.id = createdKit.id || createdKit._id;
    } else {
      inMemoryKits.set(newId, obj);
    }

    res.status(201).json(createdKit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
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
};
