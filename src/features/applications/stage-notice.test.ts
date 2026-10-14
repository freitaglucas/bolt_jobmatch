import { describe, expect, it } from 'vitest';
import { shouldNotifyStageChange } from './stage-notice';

describe('shouldNotifyStageChange', () => {
  it('notifies when the candidate advances to the next stage', () => {
    expect(shouldNotifyStageChange('Em análise', 'Triagem')).toBe(true);
    expect(shouldNotifyStageChange('Triagem', 'Entrevista')).toBe(true);
    expect(shouldNotifyStageChange('Entrevista', 'Final')).toBe(true);
  });

  it('does not notify on approval, rejection or going back', () => {
    expect(shouldNotifyStageChange('Final', 'Aprovado')).toBe(false);
    expect(shouldNotifyStageChange('Triagem', 'Rejeitado')).toBe(false);
    expect(shouldNotifyStageChange('Entrevista', 'Triagem')).toBe(false);
    expect(shouldNotifyStageChange('Em análise', 'Entrevista')).toBe(false);
  });

  it('does not notify when the origin stage is unknown', () => {
    expect(shouldNotifyStageChange(undefined, 'Triagem')).toBe(false);
  });
});
