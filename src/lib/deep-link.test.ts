import { describe, expect, it } from 'vitest';
import { readDeepLinkScreen, stripDeepLinkParam } from './deep-link';

describe('readDeepLinkScreen', () => {
  it('opens Candidaturas from the e-mail link', () => {
    expect(readDeepLinkScreen('?tela=candidaturas')).toBe('applications');
    expect(readDeepLinkScreen('tela=Candidaturas')).toBe('applications');
  });

  it('ignores missing or unknown screens', () => {
    expect(readDeepLinkScreen('')).toBeNull();
    expect(readDeepLinkScreen('?tela=dashboard')).toBeNull();
    expect(readDeepLinkScreen('?tela=constructor')).toBeNull();
    expect(readDeepLinkScreen('?outra=1')).toBeNull();
  });
});

describe('stripDeepLinkParam', () => {
  it('removes only the "tela" parameter', () => {
    expect(stripDeepLinkParam('/', '?tela=candidaturas', '')).toBe('/');
    expect(stripDeepLinkParam('/', '?tela=candidaturas&utm=x', '#topo')).toBe('/?utm=x#topo');
  });
});
