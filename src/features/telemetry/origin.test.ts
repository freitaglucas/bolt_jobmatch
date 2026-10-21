import { describe, expect, it } from 'vitest';
import {
  JOB_LINK_TTL_MS,
  buildJobLink,
  funnelSource,
  parseStoredOrigin,
  prioritizeJob,
  readJobLinkParam,
  stripJobLinkParam,
} from './origin';

const JOB = '0f0e0d0c-0b0a-4908-8706-050403020100';
const NOW = 1_800_000_000_000;

describe('readJobLinkParam / stripJobLinkParam / buildJobLink', () => {
  it('reads the job id from "?vaga=" and ignores anything else', () => {
    expect(readJobLinkParam(`?vaga=${JOB.toUpperCase()}`)).toBe(JOB);
    expect(readJobLinkParam('?vaga=123')).toBeNull();
    expect(readJobLinkParam('?tela=candidaturas')).toBeNull();
    expect(readJobLinkParam('')).toBeNull();
  });

  it('removes only the "vaga" parameter', () => {
    expect(stripJobLinkParam('/', `?vaga=${JOB}`, '')).toBe('/');
    expect(stripJobLinkParam('/', `?vaga=${JOB}&utm_source=linkedin`, '')).toBe('/?utm_source=linkedin');
  });

  it('builds the link the recruiter shares', () => {
    expect(buildJobLink('https://jobmatchrh.com/', JOB)).toBe(`https://jobmatchrh.com/?vaga=${JOB}`);
  });
});

describe('parseStoredOrigin', () => {
  it('keeps the origin for 7 days', () => {
    const raw = JSON.stringify({ jobId: JOB, at: NOW - 1000 });
    expect(parseStoredOrigin(raw, NOW)).toEqual({ jobId: JOB, at: NOW - 1000 });
    expect(parseStoredOrigin(JSON.stringify({ jobId: JOB, at: NOW - JOB_LINK_TTL_MS - 1 }), NOW)).toBeNull();
  });

  it('ignores broken or strange values', () => {
    expect(parseStoredOrigin(null, NOW)).toBeNull();
    expect(parseStoredOrigin('{', NOW)).toBeNull();
    expect(parseStoredOrigin(JSON.stringify({ jobId: 'x', at: NOW }), NOW)).toBeNull();
    expect(parseStoredOrigin(JSON.stringify({ jobId: JOB, at: NOW + 60_000 }), NOW)).toBeNull();
  });
});

describe('funnelSource', () => {
  it('tags events with the job link or "direct", never personal data', () => {
    expect(funnelSource({ jobId: JOB, at: NOW })).toEqual({ source: 'job_link', source_job_id: JOB });
    expect(funnelSource(null)).toEqual({ source: 'direct' });
  });
});

describe('prioritizeJob', () => {
  const jobs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('moves the linked job to the top of the deck', () => {
    expect(prioritizeJob(jobs, 'c').map((job) => job.id)).toEqual(['c', 'a', 'b']);
  });

  it('keeps the list when there is no link, the job is first or missing', () => {
    expect(prioritizeJob(jobs, null)).toBe(jobs);
    expect(prioritizeJob(jobs, 'a')).toBe(jobs);
    expect(prioritizeJob(jobs, 'z')).toBe(jobs);
  });
});
