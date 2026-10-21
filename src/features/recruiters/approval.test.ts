import { describe, expect, it } from 'vitest';
import { approvalCheckToast } from './approval';

describe('approvalCheckToast', () => {
  it('says "Ainda em análise" with the deadline and the contact when nothing changed', () => {
    expect(approvalCheckToast({ isError: false, state: 'pending' })).toEqual({
      title: 'Ainda em análise',
      description: 'A análise leva até 1 dia útil. Se precisar, escreva para lucas@jobmatchrh.com.',
    });
  });

  it('stays quiet when the account was approved or needs data (the screen changes by itself)', () => {
    expect(approvalCheckToast({ isError: false, state: 'approved' })).toBeNull();
    expect(approvalCheckToast({ isError: false, state: 'company' })).toBeNull();
    expect(approvalCheckToast({ isError: false, state: 'form' })).toBeNull();
  });

  it('explains when the check itself failed', () => {
    expect(approvalCheckToast({ isError: true, state: null })?.title).toBe(
      'Não foi possível verificar agora',
    );
  });
});
