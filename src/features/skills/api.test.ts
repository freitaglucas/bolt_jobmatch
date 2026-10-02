import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: { from: mocks.from },
}));

import { listSkills } from './api';

describe('listSkills', () => {
  beforeEach(() => {
    mocks.from.mockReset();
  });

  it('reads the catalog ordered by name', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: '1', name: 'SQL', category: 'hard' }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    mocks.from.mockReturnValue({ select });

    const result = await listSkills();

    expect(mocks.from).toHaveBeenCalledWith('skills');
    expect(select).toHaveBeenCalledWith('id, name, category');
    expect(order).toHaveBeenCalledWith('name', { ascending: true });
    expect(result).toEqual([{ id: '1', name: 'SQL', category: 'hard' }]);
  });

  it('throws when the query fails', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'falhou' } });
    const select = vi.fn().mockReturnValue({ order });
    mocks.from.mockReturnValue({ select });

    await expect(listSkills()).rejects.toMatchObject({ message: 'falhou' });
  });
});
