import { describe, expect, it } from 'vitest';
import { canReject, getNextStage } from './pipeline-transitions';

describe('getNextStage', () => {
  it('follows the funnel order', () => {
    expect(getNextStage('Em análise')).toBe('Triagem');
    expect(getNextStage('Triagem')).toBe('Entrevista');
    expect(getNextStage('Entrevista')).toBe('Final');
    expect(getNextStage('Final')).toBe('Aprovado');
  });

  it('has no next stage after the final ones', () => {
    expect(getNextStage('Aprovado')).toBeNull();
    expect(getNextStage('Rejeitado')).toBeNull();
  });
});

describe('canReject', () => {
  it('allows rejecting any open stage', () => {
    expect(canReject('Em análise')).toBe(true);
    expect(canReject('Triagem')).toBe(true);
    expect(canReject('Entrevista')).toBe(true);
    expect(canReject('Final')).toBe(true);
  });

  it('blocks rejecting a finished application', () => {
    expect(canReject('Aprovado')).toBe(false);
    expect(canReject('Rejeitado')).toBe(false);
  });
});
