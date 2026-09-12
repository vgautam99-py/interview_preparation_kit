const { calculateCoverage, processCoverageAndSecondPass } = require('../src/services/coverage.service');

describe('Module 6: Coverage & Second Pass Unit Tests', () => {
  const mockRequirements = [
    { id: 'REQ-1', text: '5+ years Node.js', kind: 'technical', priority: 'must' },
    { id: 'REQ-2', text: 'MongoDB schema design', kind: 'technical', priority: 'must' },
    { id: 'REQ-3', text: 'GraphQL knowledge', kind: 'technical', priority: 'nice' }
  ];

  test('calculateCoverage returns empty uncovered list when all must-haves are covered', () => {
    const questions = [
      { id: 'Q-1', requirement_ids: ['REQ-1'], prompt: 'Node.js event loop' },
      { id: 'Q-2', requirement_ids: ['REQ-2'], prompt: 'Mongo indexing' }
    ];

    const result = calculateCoverage(mockRequirements, questions);
    expect(result.isComplete).toBe(true);
    expect(result.uncovered_requirement_ids).toEqual([]);
  });

  test('calculateCoverage correctly identifies uncovered must-have requirement IDs', () => {
    const questions = [
      { id: 'Q-1', requirement_ids: ['REQ-1'], prompt: 'Node.js event loop' }
    ];

    const result = calculateCoverage(mockRequirements, questions);
    expect(result.isComplete).toBe(false);
    expect(result.uncovered_requirement_ids).toEqual(['REQ-2']);
  });

  test('processCoverageAndSecondPass triggers Pass 2 and covers missing must-haves', async () => {
    const questions = [
      { id: 'Q-1', requirement_ids: ['REQ-1'], prompt: 'Node.js question' }
    ];
    const flashcards = [];

    const finalResult = await processCoverageAndSecondPass(mockRequirements, questions, flashcards);
    
    expect(finalResult.coverage.passes).toBe(2);
    expect(finalResult.coverage.uncovered_requirement_ids).toEqual([]);
    expect(finalResult.questions.length).toBeGreaterThan(1);
    expect(finalResult.questions.some(q => q.requirement_ids.includes('REQ-2'))).toBe(true);
  });
});
