import { describe, expect, it } from 'vitest';
import {
  SEAL_MIN_RETURNS,
  SEAL_WINDOW_DAYS,
  returnPromiseText,
  sealPeriodText,
  sealText,
  sealsByJob,
} from './seal-rules';

describe('constantes do selo', () => {
  it('espelham o banco (30 retornos, 90 dias)', () => {
    expect(SEAL_MIN_RETURNS).toBe(30);
    expect(SEAL_WINDOW_DAYS).toBe(90);
  });
});

describe('textos', () => {
  it('promessa vem do SLA (5 dias)', () => {
    expect(returnPromiseText()).toBe('Retorno em até 5 dias');
  });

  it('selo e periodo', () => {
    expect(sealText(94)).toBe('94% dos candidatos receberam retorno no prazo');
    expect(sealPeriodText()).toBe('Últimos 90 dias');
  });
});

describe('sealsByJob', () => {
  it('monta o mapa por vaga', () => {
    expect(
      sealsByJob([
        { job_id: 'a', seal_percent: 94 },
        { job_id: 'b', seal_percent: 90 },
      ]),
    ).toEqual({ a: 94, b: 90 });
  });

  it('vazio nao tem selo', () => {
    expect(sealsByJob([])).toEqual({});
  });

  it('ignora valores invalidos', () => {
    expect(
      sealsByJob([
        { job_id: 'a', seal_percent: Number.NaN },
        { job_id: 'b', seal_percent: 120 },
        { job_id: 'c', seal_percent: -1 },
        { job_id: 'd', seal_percent: 91.9 },
      ]),
    ).toEqual({ d: 91 });
  });
});
