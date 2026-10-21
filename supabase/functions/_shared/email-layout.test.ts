import { describe, expect, it } from 'vitest';
import {
  applicationsUrl,
  formatShortDate,
  normalizeAppUrl,
  reachedStageLine,
  renderCandidateEmail,
  subjectWithDue,
} from './email-layout.ts';

const BASE = {
  subject: 'Retorno sobre a sua candidatura: Dev',
  companyName: 'Acme',
  jobTitle: 'Dev',
  body: 'Olá, Ana!\n\nSeguimos com outros perfis.',
};

describe('normalizeAppUrl / applicationsUrl', () => {
  it('accepts https (and http only on localhost) and drops the trailing slash', () => {
    expect(normalizeAppUrl(' https://jobmatchrh.com/ ')).toBe('https://jobmatchrh.com');
    expect(normalizeAppUrl('http://localhost:5173')).toBe('http://localhost:5173');
    expect(applicationsUrl('https://jobmatchrh.com/')).toBe('https://jobmatchrh.com/?tela=candidaturas');
  });

  it('refuses anything unsafe or broken (the e-mail goes without the button)', () => {
    for (const value of [
      null,
      '',
      'jobmatchrh.com',
      'http://jobmatchrh.com',
      'javascript:alert(1)',
      'https://user:pass@jobmatchrh.com',
      'https://jobmatchrh.com/?x=1',
    ]) {
      expect(normalizeAppUrl(value)).toBeNull();
    }
    expect(applicationsUrl(undefined)).toBeNull();
  });
});

describe('formatShortDate / subjectWithDue', () => {
  it('shows dd/mm in Sao Paulo time', () => {
    expect(formatShortDate('2026-10-20T21:00:00Z')).toBe('20/10');
    expect(formatShortDate('2026-10-21T01:00:00Z')).toBe('20/10');
    expect(formatShortDate('nope')).toBeNull();
    expect(formatShortDate(null)).toBeNull();
  });

  it('adds the deadline to the subject only when there is one', () => {
    expect(subjectWithDue('Assunto', '2026-10-20T21:00:00Z')).toBe('Assunto · Próximo retorno até 20/10');
    expect(subjectWithDue('Assunto', null)).toBe('Assunto');
  });
});

describe('reachedStageLine', () => {
  it('names only stages beyond the first one', () => {
    expect(reachedStageLine('final_interview')).toBe('Você chegou à etapa Final');
    expect(reachedStageLine('new_application')).toBeNull();
    expect(reachedStageLine('rejected')).toBeNull();
    expect(reachedStageLine(null)).toBeNull();
  });
});

describe('renderCandidateEmail', () => {
  it('has the brand header with the company, max width 600px and the standard footer', () => {
    const email = renderCandidateEmail(BASE);
    expect(email.html).toContain('max-width:600px');
    expect(email.html).toContain('>Job Match</div>');
    expect(email.html).toContain('>Acme</div>');
    expect(email.html).toContain('<html lang="pt-BR">');
    expect(email.text.startsWith('Job Match · Acme\n\nOlá, Ana!')).toBe(true);
    expect(email.text).toContain(
      '--\nVocê recebeu este e-mail porque se candidatou à vaga "Dev" na empresa Acme, pelo Job Match. Para falar com a empresa, responda a este e-mail.',
    );
  });

  it('has no status block, quote or button when they are not given', () => {
    const email = renderCandidateEmail(BASE);
    expect(email.html).not.toContain('Próximo retorno');
    expect(email.html).not.toContain('<blockquote');
    expect(email.html).not.toContain('Ver minha candidatura');
    expect(email.html).not.toContain('display:none');
  });

  it('shows stage and deadline in their own block, in html and text', () => {
    const email = renderCandidateEmail({
      ...BASE,
      stageLine: 'Você chegou à etapa Entrevista',
      dueAt: '2026-10-20T21:00:00Z',
      appUrl: 'https://jobmatchrh.com',
    });
    expect(email.html).toContain('Você chegou à etapa Entrevista</div>');
    expect(email.html).toContain('Próximo retorno até <strong>20/10</strong>');
    expect(email.html).toContain('Você chegou à etapa Entrevista · Próximo retorno até 20/10');
    expect(email.text).toContain('Você chegou à etapa Entrevista\nPróximo retorno até 20/10');
    expect(email.text).toContain('Ver minha candidatura: https://jobmatchrh.com/?tela=candidaturas');
  });

  it('accepts an optional quote (manager sentence, N85) and escapes everything', () => {
    const email = renderCandidateEmail({
      ...BASE,
      companyName: '<script>',
      body: 'Oi <b>x</b>',
      quote: { text: 'Gostei da <i>conversa</i>', author: 'Carlos, gestor da vaga' },
    });
    expect(email.html).not.toContain('<script>');
    expect(email.html).not.toContain('<b>x</b>');
    expect(email.html).toContain('Gostei da &lt;i&gt;conversa&lt;/i&gt;');
    expect(email.html).toContain('Carlos, gestor da vaga');
    expect(email.text).toContain('"Gostei da <i>conversa</i>" (Carlos, gestor da vaga)');
  });

  it('falls back without company and never carries a score', () => {
    const email = renderCandidateEmail({ ...BASE, companyName: null });
    expect(email.text.startsWith('Job Match\n\n')).toBe(true);
    expect(email.text).toContain('se candidatou à vaga "Dev", pelo Job Match.');
    expect(email.text).not.toMatch(/score|pontos|%/i);
  });
});
