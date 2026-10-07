import { describe, expect, it } from 'vitest';
import {
  avatarColorFor,
  groupCandidatesByJob,
  mapRecruiterApplication,
  STAGE_LABELS,
  type RecruiterApplicationRow,
} from './recruiter-applications';

function makeRow(overrides: Partial<RecruiterApplicationRow> = {}): RecruiterApplicationRow {
  return {
    id: 'app-1',
    job_id: 'job-1',
    current_stage: 'new_application',
    match_score: 72.5,
    created_at: '2026-10-01T15:30:00Z',
    silver_medalist: false,
    last_stage_change_at: '2026-10-02T15:00:00Z',
    feedback_sent_at: null,
    jobs: { title: 'Analista de Inovação' },
    candidate_profiles: {
      current_position: 'Analista de Projetos',
      seniority_general: 'Pleno',
      location: 'São Paulo, SP',
      years_of_experience: 5,
      profiles: { full_name: 'Maria Souza' },
    },
    ...overrides,
  };
}

describe('STAGE_LABELS', () => {
  it('translates every active database stage to the screen label', () => {
    expect(STAGE_LABELS).toEqual({
      new_application: 'Em análise',
      screening: 'Triagem',
      interview: 'Entrevista',
      final_interview: 'Final',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
    });
  });
});

describe('mapRecruiterApplication', () => {
  it('maps a full row', () => {
    const candidate = mapRecruiterApplication(makeRow());

    expect(candidate).toMatchObject({
      id: 'app-1',
      name: 'Maria Souza',
      role: 'Analista de Projetos',
      seniority: 'Pleno',
      matchScore: 72.5,
      stage: 'Em análise',
      jobId: 'job-1',
      jobTitle: 'Analista de Inovação',
      location: 'São Paulo, SP',
      yearsOfExperience: 5,
      silverMedalist: false,
    });
    expect(candidate?.appliedDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('uses fallbacks when the candidate profile is missing or empty', () => {
    const candidate = mapRecruiterApplication(
      makeRow({ candidate_profiles: null, jobs: null }),
    );

    expect(candidate).toMatchObject({
      name: 'Candidato(a)',
      role: 'Cargo não informado',
      seniority: 'Senioridade não informada',
      location: null,
      yearsOfExperience: null,
    });
    expect(candidate?.jobTitle).toBeUndefined();
  });

  it('trims names and ignores blank text', () => {
    const candidate = mapRecruiterApplication(
      makeRow({
        candidate_profiles: {
          current_position: '   ',
          seniority_general: null,
          location: null,
          years_of_experience: null,
          profiles: { full_name: '  Joao Silva  ' },
        },
      }),
    );

    expect(candidate?.name).toBe('Joao Silva');
    expect(candidate?.role).toBe('Cargo não informado');
  });

  it('returns null when the candidate withdrew', () => {
    expect(mapRecruiterApplication(makeRow({ current_stage: 'withdrawn' }))).toBeNull();
  });

  it('keeps the talent-pool flag', () => {
    const candidate = mapRecruiterApplication(
      makeRow({ current_stage: 'rejected', silver_medalist: true }),
    );
    expect(candidate).toMatchObject({ stage: 'Rejeitado', silverMedalist: true });
  });
});

describe('avatarColorFor', () => {
  it('is stable for the same id and always returns a known color', () => {
    const colors = ['bg-jm-purple', 'bg-jm-teal', 'bg-jm-orange', 'bg-primary'];
    expect(avatarColorFor('app-1')).toBe(avatarColorFor('app-1'));
    expect(colors).toContain(avatarColorFor('app-1'));
    expect(colors).toContain(avatarColorFor('another-id'));
  });
});

describe('groupCandidatesByJob', () => {
  it('groups by job, keeps the order and drops withdrawn applications', () => {
    const grouped = groupCandidatesByJob([
      makeRow({ id: 'a1', job_id: 'job-1' }),
      makeRow({ id: 'a2', job_id: 'job-2' }),
      makeRow({ id: 'a3', job_id: 'job-1', current_stage: 'withdrawn' }),
      makeRow({ id: 'a4', job_id: 'job-1', current_stage: 'interview' }),
    ]);

    expect(Object.keys(grouped).sort()).toEqual(['job-1', 'job-2']);
    expect(grouped['job-1']?.map((candidate) => candidate.id)).toEqual(['a1', 'a4']);
    expect(grouped['job-2']?.map((candidate) => candidate.id)).toEqual(['a2']);
  });

  it('returns an empty object when there are no applications', () => {
    expect(groupCandidatesByJob([])).toEqual({});
  });
});
