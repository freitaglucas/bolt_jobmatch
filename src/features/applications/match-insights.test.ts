import { describe, expect, it } from 'vitest';
import { buildInsightsByApplication } from './match-insights';

describe('buildInsightsByApplication', () => {
  const skills = [
    { id: 's1', name: 'SQL' },
    { id: 's2', name: 'Power BI' },
    { id: 's3', name: 'Python' },
  ];

  it('builds the gaps and strengths of each application from its job and candidate', () => {
    const result = buildInsightsByApplication({
      applications: [
        { id: 'app-1', job_id: 'job-1', candidate_id: 'cand-1' },
        { id: 'app-2', job_id: 'job-1', candidate_id: 'cand-2' },
      ],
      jobSkills: [
        { job_id: 'job-1', skill_id: 's1', required_level: 3, weight: '9.00', mandatory: true },
        { job_id: 'job-1', skill_id: 's2', required_level: 2, weight: 6, mandatory: true },
        { job_id: 'job-2', skill_id: 's3', required_level: 2, weight: 5, mandatory: true },
      ],
      candidateSkills: [
        { candidate_id: 'cand-1', skill_id: 's1', declared_level: 1 },
        { candidate_id: 'cand-1', skill_id: 's2', declared_level: 2 },
        { candidate_id: 'cand-2', skill_id: 's3', declared_level: 3 },
      ],
      skills,
    });

    expect(result['app-1']).toEqual({
      missing: [],
      below: [{ skill: 'SQL', required: 3, declared: 1 }],
      strengths: ['Power BI'],
    });
    expect(result['app-2']).toEqual({ missing: ['SQL', 'Power BI'], below: [], strengths: [] });
  });

  it('gives an application with no job skills empty insights and skips unknown skills', () => {
    const result = buildInsightsByApplication({
      applications: [{ id: 'app-1', job_id: 'job-9', candidate_id: 'cand-1' }],
      jobSkills: [
        { job_id: 'job-1', skill_id: 'ghost', required_level: 3, weight: 5, mandatory: true },
      ],
      candidateSkills: [],
      skills,
    });
    expect(result['app-1']).toEqual({ missing: [], below: [], strengths: [] });
  });
});

describe('buildInsightsByApplication com grupos (N33)', () => {
  it('le o minimo do grupo e conta o grupo como um item', () => {
    const result = buildInsightsByApplication({
      applications: [{ id: 'app-1', job_id: 'job-1', candidate_id: 'cand-1' }],
      jobSkills: [
        { job_id: 'job-1', skill_id: 'aws', required_level: 2, weight: 1, mandatory: true, group_id: 'g1' },
        { job_id: 'job-1', skill_id: 'gcp', required_level: 2, weight: 1, mandatory: true, group_id: 'g1' },
      ],
      candidateSkills: [],
      skills: [
        { id: 'aws', name: 'AWS' },
        { id: 'gcp', name: 'GCP' },
      ],
      groups: [{ id: 'g1', min_count: 1 }],
    });
    expect(result['app-1']?.missing).toEqual(['AWS ou GCP']);
  });
});
