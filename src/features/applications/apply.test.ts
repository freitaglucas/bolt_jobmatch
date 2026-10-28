import { describe, expect, it } from 'vitest';
import { applyErrorMessage, parseApplyResult, toAnswersPayload } from './apply';

const BASE = {
  id: 'app-1',
  job_id: 'job-1',
  candidate_id: 'cand-1',
  match_score: 72.5,
  created_at: '2026-10-27T12:00:00Z',
};

describe('toAnswersPayload', () => {
  it('manda uma resposta sim/nao por requisito', () => {
    expect(
      toAnswersPayload([
        { requirementId: 'r1', meets: true },
        { requirementId: 'r2', meets: false },
      ]),
    ).toEqual([
      { requirement_id: 'r1', meets: true },
      { requirement_id: 'r2', meets: false },
    ]);
  });

  it('vaga sem requisito manda lista vazia', () => {
    expect(toAnswersPayload([])).toEqual([]);
  });
});

describe('parseApplyResult', () => {
  it('le uma candidatura criada', () => {
    expect(
      parseApplyResult({ ...BASE, created: true, auto_rejected: false, unmet_requirements: [] }),
    ).toEqual({
      application: BASE,
      created: true,
      autoRejected: false,
      unmetRequirements: [],
    });
  });

  it('le a recusa imediata com os requisitos nao atendidos', () => {
    const result = parseApplyResult({
      ...BASE,
      created: true,
      auto_rejected: true,
      unmet_requirements: ['CNH categoria B (moto não serve)'],
    });
    expect(result.autoRejected).toBe(true);
    expect(result.unmetRequirements).toEqual(['CNH categoria B (moto não serve)']);
  });

  it('candidatura repetida volta como nao criada', () => {
    expect(parseApplyResult({ ...BASE, created: false }).created).toBe(false);
  });

  it('recusa resposta fora do formato', () => {
    expect(() => parseApplyResult(null)).toThrow('Resposta inesperada');
    expect(() => parseApplyResult({ ...BASE, created: 'sim' })).toThrow('Resposta inesperada');
  });
});

describe('applyErrorMessage', () => {
  it('traduz os erros conhecidos', () => {
    expect(applyErrorMessage({ message: 'requirements_unanswered' })).toBe(
      'Responda todos os requisitos da vaga para se candidatar.',
    );
    expect(applyErrorMessage({ message: 'job_not_active' })).toBe(
      'Esta vaga não está mais recebendo candidaturas.',
    );
  });

  it('devolve null para erro desconhecido', () => {
    expect(applyErrorMessage({ message: 'outro' })).toBeNull();
    expect(applyErrorMessage(null)).toBeNull();
  });
});