import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  },
}));

import {
  getRecruiterGateState,
  getRecruiterOnboarding,
  saveRecruiterOnboarding,
} from './api';
import type { RecruiterOnboardingProfile } from './types';

type MockFn = ReturnType<typeof vi.fn>;

interface MockBuilder {
  select: MockFn;
  eq: MockFn;
  maybeSingle: MockFn;
  single: MockFn;
  update: MockFn;
  insert: MockFn;
  then: (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
}

const chainMethods = [
  'select',
  'eq',
  'maybeSingle',
  'single',
  'update',
  'insert',
] as const;

function buildChain(result: unknown): MockBuilder {
  const builder = {} as MockBuilder;
  for (const name of chainMethods) {
    builder[name] = vi.fn();
  }
  for (const name of chainMethods) {
    builder[name].mockReturnValue(builder);
  }
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return builder;
}

function makeProfile(
  overrides: Partial<RecruiterOnboardingProfile> = {},
): RecruiterOnboardingProfile {
  return {
    companyId: null,
    companyName: null,
    position: '',
    phone: '',
    approvedAt: null,
    ...overrides,
  };
}

describe('getRecruiterGateState', () => {
  it('returns approved when approved_at is set and a company is linked', () => {
    expect(
      getRecruiterGateState(
        makeProfile({ approvedAt: '2026-01-01T00:00:00Z', companyId: 'company-1' }),
      ),
    ).toBe('approved');
  });

  it('returns company when approved but without a company', () => {
    expect(
      getRecruiterGateState(makeProfile({ approvedAt: '2026-01-01T00:00:00Z' })),
    ).toBe('company');
  });

  it('returns form when not approved and missing company', () => {
    expect(getRecruiterGateState(makeProfile())).toBe('form');
  });

  it('returns form when not approved and position is empty', () => {
    expect(
      getRecruiterGateState(
        makeProfile({ companyId: 'company-1', position: '   ' }),
      ),
    ).toBe('form');
  });

  it('returns pending when not approved with company and position', () => {
    expect(
      getRecruiterGateState(
        makeProfile({ companyId: 'company-1', position: 'Tech Recruiter' }),
      ),
    ).toBe('pending');
  });
});

describe('getRecruiterOnboarding', () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.from.mockReset();
  });

  it('reads the own recruiter profile and company name', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mocks.from.mockImplementation((table: string) => {
      if (table === 'recruiter_profiles') {
        return buildChain({
          data: {
            company_id: 'company-1',
            position: 'Tech Recruiter',
            phone: '11987654321',
            approved_at: '2026-01-01T00:00:00Z',
          },
          error: null,
        });
      }
      if (table === 'companies') {
        return buildChain({ data: { name: 'Acme' }, error: null });
      }
      return buildChain({ data: null, error: null });
    });

    const profile = await getRecruiterOnboarding();

    expect(profile).toEqual({
      companyId: 'company-1',
      companyName: 'Acme',
      position: 'Tech Recruiter',
      phone: '11987654321',
      approvedAt: '2026-01-01T00:00:00Z',
    });
  });

  it('returns null company name when company_id is null', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mocks.from.mockImplementation((table: string) => {
      if (table === 'recruiter_profiles') {
        return buildChain({
          data: {
            company_id: null,
            position: null,
            phone: null,
            approved_at: null,
          },
          error: null,
        });
      }
      return buildChain({ data: null, error: null });
    });

    const profile = await getRecruiterOnboarding();

    expect(profile.companyId).toBeNull();
    expect(profile.companyName).toBeNull();
    expect(profile.position).toBe('');
    expect(profile.phone).toBe('');
    expect(profile.approvedAt).toBeNull();
  });
});

describe('saveRecruiterOnboarding', () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.from.mockReset();
  });

  it('creates a company when none exists and only updates allowed fields', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const profileChains = [
      buildChain({ data: { company_id: null }, error: null }),
      buildChain({ error: null }),
    ];
    const companiesChain = buildChain({
      data: { id: 'company-new' },
      error: null,
    });

    let profileCall = 0;
    mocks.from.mockImplementation((table: string) => {
      if (table === 'recruiter_profiles') {
        const chain = profileChains[profileCall] ?? buildChain({ error: null });
        profileCall += 1;
        return chain;
      }
      if (table === 'companies') {
        return companiesChain;
      }
      return buildChain({ error: null });
    });

    await saveRecruiterOnboarding({
      companyName: 'Acme',
      position: 'Tech Recruiter',
      phone: '(11) 98765-4321',
    });

    expect(companiesChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ created_by: 'user-1', name: 'Acme' }),
    );

    expect(profileChains[1].update).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: 'company-new',
        position: 'Tech Recruiter',
        phone: '(11) 98765-4321',
      }),
    );
    expect(profileChains[1].update.mock.calls[0][0]).not.toHaveProperty(
      'approved_at',
    );
  });

  it('updates the existing company and never sends approved_at', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const profileChains = [
      buildChain({ data: { company_id: 'company-1' }, error: null }),
      buildChain({ error: null }),
    ];
    const companiesChain = buildChain({ error: null });

    let profileCall = 0;
    mocks.from.mockImplementation((table: string) => {
      if (table === 'recruiter_profiles') {
        const chain = profileChains[profileCall] ?? buildChain({ error: null });
        profileCall += 1;
        return chain;
      }
      if (table === 'companies') {
        return companiesChain;
      }
      return buildChain({ error: null });
    });

    await saveRecruiterOnboarding({
      companyName: 'Acme Nova',
      position: 'Head de Talent Acquisition',
      phone: '',
    });

    expect(companiesChain.update).toHaveBeenCalledWith({ name: 'Acme Nova' });

    expect(profileChains[1].update).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: 'company-1',
        position: 'Head de Talent Acquisition',
        phone: null,
      }),
    );

    const payload = profileChains[1].update.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(payload).not.toHaveProperty('approved_at');
    expect(Object.keys(payload).sort()).toEqual([
      'company_id',
      'phone',
      'position',
    ]);
  });
});
