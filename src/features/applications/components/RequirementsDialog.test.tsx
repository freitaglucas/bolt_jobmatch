// @vitest-environment jsdom
// N31b: perguntas sim/nao ao candidatar e aviso de recusa na hora.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { JobRequirementView } from '@/lib/types';
import { rejectionNotice } from '../requirement-answers';
import { ApplicationRejectedDialog } from './ApplicationRejectedDialog';
import { RequirementsDialog } from './RequirementsDialog';

const REQUIREMENTS: JobRequirementView[] = [
  { id: 'r1', name: 'CNH categoria B', question: 'Você tem CNH categoria B válida?', detail: null },
  {
    id: 'r2',
    name: 'Trabalho presencial',
    question: 'Você pode trabalhar presencialmente no local da vaga?',
    detail: 'Vila Olímpia, São Paulo',
  },
];

afterEach(() => {
  cleanup();
});

describe('RequirementsDialog', () => {
  it('mostra cada pergunta e o detalhe da vaga', () => {
    render(
      <RequirementsDialog
        jobTitle="Motorista"
        requirements={REQUIREMENTS}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Você tem CNH categoria B válida?')).toBeTruthy();
    expect(screen.getByText('Vila Olímpia, São Paulo')).toBeTruthy();
    expect(screen.getByText('0 de 2 respondidos')).toBeTruthy();
  });

  it('so envia com todas as respostas, na ordem da vaga', () => {
    const onSubmit = vi.fn();
    render(
      <RequirementsDialog
        jobTitle="Motorista"
        requirements={REQUIREMENTS}
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );
    const send = screen.getByRole('button', { name: 'Enviar candidatura' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);

    const cnh = screen.getByRole('group', { name: 'CNH categoria B' });
    const presencial = screen.getByRole('group', { name: 'Trabalho presencial' });
    fireEvent.click(presencial.querySelectorAll('button')[1] as HTMLButtonElement);
    expect(send.disabled).toBe(true);
    fireEvent.click(cnh.querySelectorAll('button')[0] as HTMLButtonElement);
    expect(send.disabled).toBe(false);

    fireEvent.click(send);
    expect(onSubmit).toHaveBeenCalledWith([
      { requirementId: 'r1', meets: true },
      { requirementId: 'r2', meets: false },
    ]);
  });

  it('cancelar nao envia', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(
      <RequirementsDialog
        jobTitle="Motorista"
        requirements={REQUIREMENTS}
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('ApplicationRejectedDialog', () => {
  it('mostra o motivo ligado a vaga e leva as candidaturas', () => {
    const onSeeApplications = vi.fn();
    render(
      <ApplicationRejectedDialog
        notice={rejectionNotice('Motorista', ['CNH categoria B (moto não serve)'])}
        onClose={vi.fn()}
        onSeeApplications={onSeeApplications}
      />,
    );
    expect(screen.getByText('Sua candidatura não seguiu')).toBeTruthy();
    expect(screen.getByText(/A vaga Motorista exige: CNH categoria B \(moto não serve\)/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ver minhas candidaturas' }));
    expect(onSeeApplications).toHaveBeenCalled();
  });
});
