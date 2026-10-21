import { describe, expect, it } from 'vitest';
import {
  CANDIDATE_STEPS,
  COMPANY_STEPS,
  HERO_SUBTITLE,
  HERO_TITLE,
  RETURN_POINTS,
} from './content';

const ALL_TEXT = [
  HERO_TITLE,
  HERO_SUBTITLE,
  ...CANDIDATE_STEPS,
  ...COMPANY_STEPS,
  ...RETURN_POINTS.flatMap((point) => [point.title, point.text]),
].join(' ');

describe('conteudo da Landing', () => {
  it('nao promete o que o produto nao tem nem usa termos antigos', () => {
    expect(ALL_TEXT.toLowerCase()).not.toMatch(
      /token|gamifica|drag|arrastar|prot[óo]tipo|mock|swipe/,
    );
  });

  it('nao tem numeros fictícios: so prazo, adiamentos e meta vindos das regras', () => {
    const numbers = ALL_TEXT.match(/\d+/g) ?? [];
    expect(numbers.sort()).toEqual(['2', '5', '90']);
  });

  it('cada lado tem 4 passos e ha 4 pontos do retorno no prazo', () => {
    expect(CANDIDATE_STEPS).toHaveLength(4);
    expect(COMPANY_STEPS).toHaveLength(4);
    expect(RETURN_POINTS).toHaveLength(4);
  });

  it('a headline diz o centro do produto', () => {
    expect(HERO_TITLE).toBe('Nenhum candidato fica sem resposta.');
    expect(HERO_SUBTITLE).toContain('retorno');
  });
});
