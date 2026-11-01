// @vitest-environment jsdom
// N33b: grupo de alternativas na criacao da vaga.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
}));

vi.mock('@/features/jobs/create-job.hooks', () => ({
  useCreateJob: () => ({ mutateAsync: mocks.mutateAsync, isPending: false, error: null }),
}));

vi.mock('@/features/recruiters/hooks', () => ({
  useRecruiterOnboarding: () => ({ data: { companyName: 'Acme' } }),
}));

vi.mock('@/features/skills/hooks', () => ({
  useSkillsCatalog: () => ({
    data: [
      { id: '11111111-1111-4111-8111-111111111111', name: 'AWS', category: 'hard', kind: 'tool' },
      { id: '22222222-2222-4222-8222-222222222222', name: 'GCP', category: 'hard', kind: 'tool' },
      { id: '33333333-3333-4333-8333-333333333333', name: 'SQL', category: 'hard', kind: 'competency' },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useRequirementOptions: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));

import { JobCreate } from './JobCreate';

async function fillStepZero() {
  fireEvent.change(screen.getByLabelText('Título da vaga *'), {
    target: { value: 'Engenharia de nuvem' },
  });
  fireEvent.change(screen.getByLabelText('Localização *'), { target: { value: 'São Paulo, SP' } });
  fireEvent.change(screen.getByLabelText('Descrição da vaga *'), {
    target: { value: 'Cuidar da infraestrutura em nuvem do time de produto.' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Próximo/ }));
  // A troca de passo e animada: espera o passo 2 aparecer.
  await screen.findByText('Competências exigidas');
}

function addSkill(name: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }));
}

beforeEach(() => {
  mocks.mutateAsync.mockReset().mockResolvedValue({ id: 'job-1' });
});

afterEach(() => {
  cleanup();
});

describe('JobCreate com grupo de alternativas', () => {
  it('pede pelo menos 2 itens no grupo e envia o grupo ao publicar', async () => {
    render(<JobCreate onBack={vi.fn()} onPublished={vi.fn()} />);
    await fillStepZero();

    addSkill('AWS');
    addSkill('GCP');
    addSkill('SQL');

    fireEvent.click(screen.getByRole('button', { name: /Novo grupo de alternativas/ }));
    expect(screen.getByText('Grupo de alternativas 1')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe(
      'O grupo de alternativas 1 precisa de pelo menos 2 itens.',
    );
    expect((screen.getByRole('button', { name: /Próximo/ }) as HTMLButtonElement).disabled).toBe(true);

    const group = screen.getByText('Toque nos itens equivalentes:').parentElement as HTMLElement;
    const chip = (name: string) =>
      Array.from(group.querySelectorAll('button')).find((button) => button.textContent === name) as HTMLButtonElement;
    fireEvent.click(chip('AWS'));
    fireEvent.click(chip('GCP'));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getAllByText(/Alternativa no grupo 1/)).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /Próximo/ }));
    expect(await screen.findAllByText(/Alternativa · Basta 1 de 2/)).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /Publicar vaga/ }));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalled());

    const input = mocks.mutateAsync.mock.calls[0]?.[0] as {
      skills: { groupKey?: string }[];
      groups: { key: string; minCount: number; role: string }[];
    };
    expect(input.groups).toEqual([{ key: 'g1', minCount: 1, role: 'required' }]);
    expect(input.skills.map((skill) => skill.groupKey)).toEqual(['g1', 'g1', undefined]);
  });
});
