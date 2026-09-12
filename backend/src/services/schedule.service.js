const logger = require('../utils/logger');

/**
 * Deterministically distributes 10 questions per day across N day buckets with integer minutes.
 */
function generateSchedule(daysAvailable, questions, requirements = []) {
  const numDays = Math.max(1, parseInt(daysAvailable) || 5);
  const questionsPerDay = Math.max(1, Math.ceil(questions.length / numDays));

  // Initialize N day buckets
  const days = Array.from({ length: numDays }, (_, i) => ({
    day: i + 1,
    focus: getDayFocusTitle(i + 1, numDays),
    question_ids: [],
    minutes: 60,
    completed: false
  }));

  // Distribute questions 10 per day sequentially (Day 1: Q1-Q10, Day 2: Q11-Q20, etc.)
  questions.forEach((q, idx) => {
    const dayIdx = Math.min(numDays - 1, Math.floor(idx / questionsPerDay));
    days[dayIdx].question_ids.push(q.id);
  });

  // Calculate integer minutes per question (e.g. 15-25 mins per question based on difficulty)
  days.forEach(d => {
    let dayMins = 0;
    d.question_ids.forEach(qId => {
      const q = questions.find(item => item.id === qId);
      const diff = q ? q.difficulty : 2;
      dayMins += diff === 3 ? 20 : (diff === 2 ? 15 : 10);
    });
    d.minutes = Math.round(Math.max(45, dayMins));
  });

  // Validate zero orphan IDs
  const validQuestionIds = new Set(questions.map(q => q.id));
  days.forEach(d => {
    d.question_ids = d.question_ids.filter(id => validQuestionIds.has(id));
  });

  return {
    days_available: numDays,
    days
  };
}

function getDayFocusTitle(dayNum, totalDays) {
  if (totalDays === 1) return 'Complete Intensive Preparation';
  if (dayNum === 1) return 'High-Priority Architecture & Must-Have Concepts';
  if (dayNum === 2) return 'Core Technical Deep Dives & System Design';
  if (dayNum === 3) return 'Advanced Data Engineering & API Integration';
  if (dayNum === 4) return 'Performance Tuning, Security & Infrastructure';
  if (dayNum === totalDays) return 'Final Practice, Mock Review & Company Culture';
  return `Focused Module Practice — Day ${dayNum}`;
}

module.exports = { generateSchedule };
