import { describe, expect, it } from 'vitest';
import { APP_NAME, screenTitle } from './screen-title';

describe('screenTitle', () => {
  it('Landing usa so o nome do produto', () => {
    expect(screenTitle('landing')).toBe('Job Match');
    expect(APP_NAME).toBe('Job Match');
  });

  it('as outras telas levam o nome da tela', () => {
    expect(screenTitle('swipe')).toBe('Vagas para você · Job Match');
    expect(screenTitle('tokens')).toBe('Retorno no prazo · Job Match');
    expect(screenTitle('pipeline')).toBe('Pipeline · Job Match');
  });

  it('nenhuma tela fala de prototipo ou mock', () => {
    const screens = [
      'auth', 'swipe', 'job-detail', 'applications', 'profile', 'dashboard',
      'jobs', 'job-create', 'pipeline', 'post-hire', 'tokens', 'company',
    ] as const;
    for (const screen of screens) {
      expect(screenTitle(screen).toLowerCase()).not.toMatch(/prot[óo]tipo|mock/);
    }
  });
});
