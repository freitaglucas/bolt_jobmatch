import { describe, expect, it } from 'vitest';
import {
  SLA_HOURS,
  isInsufficientTokensError,
  mapLedgerRow,
  summarizeMonth,
  formatLedgerDate,
  type LedgerEntry,
  type TokenLedgerRow,
} from './token-rules';

function row(kind: string, amount: number): TokenLedgerRow {
  return {
    id: 'x1',
    amount,
    kind,
    application_id: null,
    stage: null,
    created_at: new Date(2026, 9, 10, 12).toISOString(),
  };
}

describe('SLA_HOURS', () => {
  it('e de 120 horas (5 dias)', () => {
    expect(SLA_HOURS).toBe(120);
  });
});

describe('mapLedgerRow', () => {
  it('mapeia o credito inicial como ganho', () => {
    const entry = mapLedgerRow(row('initial_grant', 20));
    expect(entry.type).toBe('earn');
    expect(entry.amount).toBe(20);
    expect(entry.title).toBe('Tokens de boas-vindas');
  });

  it('mapeia o debito de etapa como gasto com valor absoluto', () => {
    const entry = mapLedgerRow(row('stage_move_debit', -1));
    expect(entry.type).toBe('spend');
    expect(entry.amount).toBe(1);
    expect(entry.title).toBe('Candidato movido de etapa');
  });

  it('mapeia o credito de feedback', () => {
    const entry = mapLedgerRow(row('feedback_credit', 1));
    expect(entry.type).toBe('earn');
    expect(entry.title).toBe('Feedback enviado no prazo');
  });

  it('usa titulo padrao para tipo desconhecido', () => {
    expect(mapLedgerRow(row('outro', 1)).title).toBe('Movimentação de tokens');
  });
});

describe('isInsufficientTokensError', () => {
  it('reconhece a mensagem do banco', () => {
    expect(isInsufficientTokensError({ message: 'insufficient_tokens', code: 'P0001' })).toBe(true);
    expect(isInsufficientTokensError(new Error('insufficient_tokens'))).toBe(true);
  });

  it('ignora outros erros e valores', () => {
    expect(isInsufficientTokensError({ message: 'permission denied' })).toBe(false);
    expect(isInsufficientTokensError(null)).toBe(false);
    expect(isInsufficientTokensError('insufficient_tokens')).toBe(false);
    expect(isInsufficientTokensError({})).toBe(false);
  });
});

describe('summarizeMonth', () => {
  const now = new Date(2026, 9, 20, 12);
  const entries: LedgerEntry[] = [
    { id: '1', title: 'a', amount: 20, type: 'earn', createdAt: new Date(2026, 9, 2, 12).toISOString() },
    { id: '2', title: 'b', amount: 1, type: 'spend', createdAt: new Date(2026, 9, 5, 12).toISOString() },
    { id: '3', title: 'c', amount: 1, type: 'spend', createdAt: new Date(2026, 9, 6, 12).toISOString() },
    { id: '4', title: 'd', amount: 1, type: 'earn', createdAt: new Date(2026, 8, 28, 12).toISOString() },
    { id: '5', title: 'e', amount: 9, type: 'earn', createdAt: 'data-invalida' },
  ];

  it('soma apenas o mes atual e ignora datas invalidas', () => {
    expect(summarizeMonth(entries, now)).toEqual({ earned: 20, spent: 2 });
  });

  it('retorna zeros para lista vazia', () => {
    expect(summarizeMonth([], now)).toEqual({ earned: 0, spent: 0 });
  });
});

describe('formatLedgerDate', () => {
  it('formata em pt-BR', () => {
    expect(formatLedgerDate(new Date(2026, 9, 10, 12).toISOString())).toBe('10/10/2026');
  });

  it('retorna vazio para data invalida', () => {
    expect(formatLedgerDate('xyz')).toBe('');
  });
});
