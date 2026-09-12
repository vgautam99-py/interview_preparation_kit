const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  kind: { type: String, default: 'technical' },
  priority: { type: String, enum: ['must', 'nice'], required: true }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  requirement_ids: [{ type: String }],
  category: { type: String, required: true },
  prompt: { type: String, required: true },
  answer_outline: { type: String, required: true },
  difficulty: { type: Number, min: 1, max: 3, required: true },
  completed: { type: Boolean, default: false },
  state: { type: String, enum: ['generated', 'edited', 'manual', 'pinned'], default: 'generated' }
}, { _id: false });

const flashcardSchema = new mongoose.Schema({
  id: { type: String, required: true },
  requirement_ids: [{ type: String }],
  front: { type: String, required: true },
  back: { type: String, required: true },
  confidence: { type: Number, default: 0 },
  understandingLevel: { type: String, enum: ['', 'beginner', 'intermediate', 'fully'], default: '' },
  state: { type: String, enum: ['generated', 'edited', 'manual', 'pinned'], default: 'generated' }
}, { _id: false });

const scheduleDaySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  focus: { type: String, required: true },
  question_ids: [{ type: String }],
  minutes: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
}, { _id: false });

const kitSchema = new mongoose.Schema({
  id: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'researching', 'generating', 'checking', 'finalizing', 'completed', 'failed'],
    default: 'pending'
  },
  readiness: {
    type: String,
    enum: ['red', 'yellow', 'green'],
    default: 'yellow' // Red = Struggling, Yellow = Moderate, Green = Prepared
  },
  errorMessage: { type: String, default: '' },
  regeneration_attempts: { type: Number, default: 0, max: 3 },
  source: {
    company: { type: String, default: '' },
    company_url: { type: String, default: '' },
    role: { type: String, default: '' },
    location: { type: String, default: '' },
    jd_chars: { type: Number, default: 0 },
    researched_at: { type: Date, default: Date.now },
    pages_used: [{ type: String }]
  },
  company_brief: {
    summary: { type: String, default: '' },
    what_they_do: { type: String, default: '' },
    sources: [{ type: String }],
    state: { type: String, enum: ['generated', 'edited', 'manual', 'pinned'], default: 'generated' }
  },
  role: {
    title: { type: String, default: '' },
    seniority: { type: String, default: 'Junior' },
    responsibilities: [{ type: String }],
    requirements: [{ type: String }]
  },
  requirements: [requirementSchema],
  questions: [questionSchema],
  flashcards: [flashcardSchema],
  schedule: {
    days_available: { type: Number, required: true, default: 5 },
    days: [scheduleDaySchema]
  },
  coverage: {
    uncovered_requirement_ids: [{ type: String }],
    passes: { type: Number, default: 1 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

kitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.Kit || mongoose.model('Kit', kitSchema);
