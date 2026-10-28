import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: { from: mocks.from },
}));

import { listRequirementOptions, listSkills } from './api';

describe('listSkills', () => {
  beforeEach(() => {
    mocks.from.mockReset();
  });

  it('reads only scored items (competency and tool), ordered by name', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: '1', name: 'SQL', category: 'hard', kind: 'competency' }],
      error: null,
    });
    const inKind = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ in: inKind });
    mocks.from.mockReturnValue({ select });

    const result = await listSkills();

    expect(mocks.from).toHaveBeenCalledWith('skills');
    expect(select).toHaveBeenCalledWith('id, name, category, kind');
    expect(inKind).toHaveBeenCalledWith('kind', ['competency', 'tool']);
    expect(order).toHaveBeenCalledWith('name', { ascending: true });
    expect(result).toEqual([{ id: '1', name: 'SQL', category: 'hard', kind: 'competency' }]);
  });

  it('throws when the query fails', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'falhou' } });
    const select = vi.fn().mockReturnValue({ in: vi.fn().mockReturnValue({ order }) });
    mocks.from.mockReturnValue({ select });

    await expect(listSkills()).rejects.toMatchObject({ message: 'falhou' });
  });
});

describe('listRequirementOptions', () => {
  beforeEach(() => {
    mocks.from.mockReset();
  });

  it('reads the yes/no requirements with their question', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        { id: 'r1', name: 'CNH categoria B', description: 'Você tem CNH categoria B válida?' },
        { id: 'r2', name: 'Início imediato', description: null },
      ],
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ select });

    const result = await listRequirementOptions();

    expect(select).toHaveBeenCalledWith('id, name, description');
    expect(eq).toHaveBeenCalledWith('kind', 'requirement');
    expect(result).toEqual([
      { id: 'r1', name: 'CNH categoria B', question: 'Você tem CNH categoria B válida?' },
      { id: 'r2', name: 'Início imediato', question: 'A vaga pede: Início imediato. Você atende?' },
    ]);
  });
});
