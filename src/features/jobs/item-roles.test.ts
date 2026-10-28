import { describe, expect, it } from 'vitest';
import {
  DEFAULT_JOB_ITEM_ROLE,
  JOB_ITEM_ROLES,
  JOB_ITEM_ROLE_HINTS,
  JOB_ITEM_ROLE_LABELS,
  isJobItemRole,
  isMandatoryRole,
  roleFromMandatory,
} from './item-roles';

describe('papel do item na vaga', () => {
  it('tem obrigatorio, desejavel e implicito', () => {
    expect(JOB_ITEM_ROLES.map((role) => JOB_ITEM_ROLE_LABELS[role])).toEqual([
      'Obrigatório',
      'Desejável',
      'Implícito',
    ]);
    for (const role of JOB_ITEM_ROLES) {
      expect(JOB_ITEM_ROLE_HINTS[role].length).toBeGreaterThan(10);
    }
  });

  it('comeca em desejavel', () => {
    expect(DEFAULT_JOB_ITEM_ROLE).toBe('preferred');
  });

  it('converte o antigo obrigatorio sim/nao', () => {
    expect(roleFromMandatory(true)).toBe('required');
    expect(roleFromMandatory(false)).toBe('preferred');
  });

  it('so o obrigatorio marca mandatory', () => {
    expect(isMandatoryRole('required')).toBe(true);
    expect(isMandatoryRole('preferred')).toBe(false);
    expect(isMandatoryRole('implicit')).toBe(false);
  });

  it('reconhece so os papeis validos', () => {
    expect(isJobItemRole('implicit')).toBe(true);
    expect(isJobItemRole('mandatory')).toBe(false);
  });
});