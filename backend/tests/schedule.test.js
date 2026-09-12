const { generateSchedule } = require('../src/services/schedule.service');

describe('Module 8: Schedule Allocation Unit Tests', () => {
  const mockRequirements = [
    { id: 'REQ-1', text: 'Node.js', priority: 'must' },
    { id: 'REQ-2', text: 'System Design', priority: 'must' }
  ];

  const mockQuestions = [
    { id: 'Q-1', requirement_ids: ['REQ-1'], difficulty: 3 },
    { id: 'Q-2', requirement_ids: ['REQ-2'], difficulty: 2 },
    { id: 'Q-3', requirement_ids: ['REQ-1'], difficulty: 1 },
    { id: 'Q-4', requirement_ids: [], difficulty: 2 }
  ];

  test('creates exactly N day buckets as requested', () => {
    const schedule3 = generateSchedule(3, mockQuestions, mockRequirements);
    expect(schedule3.days_available).toBe(3);
    expect(schedule3.days.length).toBe(3);

    const schedule5 = generateSchedule(5, mockQuestions, mockRequirements);
    expect(schedule5.days.length).toBe(5);
  });

  test('ensures all minute allocations are integers and positive', () => {
    const schedule = generateSchedule(3, mockQuestions, mockRequirements);
    schedule.days.forEach(day => {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThan(0);
    });
  });

  test('ensures no orphan question IDs appear in the schedule', () => {
    const schedule = generateSchedule(3, mockQuestions, mockRequirements);
    const validIds = new Set(mockQuestions.map(q => q.id));
    
    schedule.days.forEach(day => {
      day.question_ids.forEach(qId => {
        expect(validIds.has(qId)).toBe(true);
      });
    });
  });
});
