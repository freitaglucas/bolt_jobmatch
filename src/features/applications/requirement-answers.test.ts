import { describe, expect, it } from 'vitest';
import type { JobRequirementView } from '../../lib/types';
import { buildRequirementAnswers, countAnswered, rejectionNotice } from './requirement-answers';

const REQUIREMENTS: JobRequirementView[] = [
  { id: 'r1', name: 'CNH categoria B', question: 'Você tem CNH categoria B válida?', detail: null },
  { id: 'r2', name: 'Trabalho presencial', question: 'Você pode trabalhar presencialmente?', detail: 'Vila Olímpia' },
];

describe('buildRequirementAnswers', () => {
  it('monta uma resposta por requisito, na ordem da vaga', () => {
    expect(buildRequirementAnswers(REQUIREMENTS, { r2: false, r1: true })).toEqual([
      { requirementId: 'r1', meets: true },
      { requirementId: 'r2', meets: false },
    ]);
  });

  it('devolve null enquanto faltar resposta', () => {
    expect(buildRequirementAnswers(REQUIREMENTS, { r1: true })).toBeNull();
  });

  it('vaga sem requisito vira lista vazia', () => {
    expect(buildRequirementAnswers([], {})).toEqual([]);
  });

  it('conta as respostas dadas', () => {
    expect(countAnswered(REQUIREMENTS, { r1: false })).toBe(1);
    expect(countAnswered(REQUIREMENTS, {})).toBe(0);
  });
});

describe('rejectionNotice', () => {
  it('cita o requisito da vaga no singular', () => {
    const notice = rejectionNotice('Motorista', ['CNH categoria B (moto não serve)']);
    expect(notice.title).toBe('Sua candidatura não seguiu');
    expect(notice.body).toBe(
      'A vaga Motorista exige: CNH categoria B (moto não serve). Pela sua resposta, esse requisito não foi atendido, por isso a candidatura não seguiu. O retorno também fica em Minhas candidaturas.',
    );
  });

  it('usa o plural com mais de um requisito', () => {
    expect(rejectionNotice('Motorista', ['A', 'B']).body).toContain(
      'exige: A; B. Pela sua resposta, esses requisitos não foram atendidos',
    );
  });

  it('nunca fala de score ou numero', () => {
    expect(rejectionNotice('Vaga', ['A']).body).not.toMatch(/score|\d/i);
  });
});
