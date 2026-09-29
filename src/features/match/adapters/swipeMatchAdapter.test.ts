import { describe, expect, it } from 'vitest';
import { mockJobs } from '../../../lib/mock-data';
import { calculateSwipeMatch } from './swipeMatchAdapter';

describe('calculateSwipeMatch', () => {
  it('adapts the legacy mock job and candidate into the Match Score engine', () => {
    const candidateSkills = [
      { skill_name: 'Gestão de Projetos', declared_level: 4, evidenced_by_project: false },
      { skill_name: 'Inovação Aberta', declared_level: 4, evidenced_by_project: false },
      { skill_name: 'Negociação', declared_level: 4, evidenced_by_project: false },
      { skill_name: 'Metodologias Ágeis', declared_level: 4, evidenced_by_project: false },
      { skill_name: 'Liderança', declared_level: 3, evidenced_by_project: false },
      { skill_name: 'Design Thinking', declared_level: 3, evidenced_by_project: false },
    ];
    const result = calculateSwipeMatch(mockJobs[0], candidateSkills);

    expect(result.score).toBe(95.83);
    expect(result.factors).toHaveLength(mockJobs[0].skills.length);
    expect(result.factors[0]).toMatchObject({
      skill: 'Gestão de Projetos',
      required: 4,
      declared: 4,
      gap: 0,
      mandatory: true,
    });
  });

  it('calculates the score from skills instead of the legacy stored score', () => {
    const candidateSkills = [
      { skill_name: 'Inovação Aberta', declared_level: 4, evidenced_by_project: false },
      { skill_name: 'Gestão de Projetos', declared_level: 4, evidenced_by_project: false },
      { skill_name: 'Negociação', declared_level: 4, evidenced_by_project: false },
      { skill_name: 'Metodologias Ágeis', declared_level: 4, evidenced_by_project: false },
      { skill_name: 'Liderança', declared_level: 3, evidenced_by_project: false },
      { skill_name: 'Design Thinking', declared_level: 3, evidenced_by_project: false },
    ];
    const result = calculateSwipeMatch(mockJobs[1], candidateSkills);

    expect(result.score).toBe(100);
    expect(result.score).not.toBe(mockJobs[1].matchScore);
  });
});
