const { regenerateSection } = require('../src/services/builder.service');

describe('Module 7: Builder & State Preservation Unit Tests', () => {
  const mockKit = {
    source: { company: 'Acme Corp', role: 'Engineer' },
    company_brief: { summary: 'Brief 1', what_they_do: 'Tech', state: 'generated' },
    requirements: [{ id: 'REQ-1', text: 'Node.js', priority: 'must' }],
    questions: [
      { id: 'Q-1', category: 'Technical', prompt: 'Gen 1', state: 'generated' },
      { id: 'Q-2', category: 'Technical', prompt: 'Edited by user', state: 'edited' },
      { id: 'Q-3', category: 'Technical', prompt: 'Pinned by user', state: 'pinned' },
      { id: 'Q-4', category: 'Technical', prompt: 'Manual question', state: 'manual' }
    ],
    schedule: { days_available: 2, days: [] }
  };

  test('regenerating category preserves edited, pinned, and manual questions', async () => {
    const updatedKit = await regenerateSection(mockKit, 'category', 'Technical');
    
    // Q-2 (edited), Q-3 (pinned), Q-4 (manual) must all survive
    expect(updatedKit.questions.some(q => q.id === 'Q-2' && q.prompt === 'Edited by user')).toBe(true);
    expect(updatedKit.questions.some(q => q.id === 'Q-3' && q.prompt === 'Pinned by user')).toBe(true);
    expect(updatedKit.questions.some(q => q.id === 'Q-4' && q.prompt === 'Manual question')).toBe(true);
  });

  test('does not overwrite company_brief if state is edited or pinned', async () => {
    const editedKit = {
      ...mockKit,
      company_brief: { summary: 'User custom summary', what_they_do: 'Custom', state: 'edited' }
    };

    const result = await regenerateSection(editedKit, 'company_brief');
    expect(result.company_brief.summary).toBe('User custom summary');
  });
});
