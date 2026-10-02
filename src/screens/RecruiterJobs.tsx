import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Screen } from '@/components/Layout';
import { useRecruiterOnboarding } from '@/features/recruiters/hooks';
import {
  useDeleteJob,
  useRecruiterJobs,
  useSetJobStatus,
} from '@/features/jobs/recruiter-jobs.hooks';
import { isForeignKeyViolation, mapRecruiterJob } from '@/features/jobs/recruiter-jobs';
import { JobsManagement } from '@/screens/JobsManagement';

interface RecruiterJobsProps {
  onNewJob: () => void;
  onNavigate: (screen: Screen) => void;
}

// A lista real de candidatos por vaga chega no item 2.5 do backlog.
const NO_CANDIDATES: Record<string, never[]> = {};

export function RecruiterJobs({ onNewJob, onNavigate }: RecruiterJobsProps) {
  const { toast } = useToast();
  const onboarding = useRecruiterOnboarding();
  const jobsQuery = useRecruiterJobs();
  const setStatus = useSetJobStatus();
  const removeJob = useDeleteJob();

  const companyName = onboarding.data?.companyName ?? '';

  const jobs = useMemo(
    () => (jobsQuery.data ?? []).map((row) => mapRecruiterJob(row, companyName)),
    [jobsQuery.data, companyName],
  );

  const handleToggleStatus = (jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job || job.status === 'Fechada') return;

    const next = job.status === 'Ativa' ? 'paused' : 'active';
    setStatus.mutate(
      { jobId, status: next },
      {
        onSuccess: () =>
          toast({ title: next === 'active' ? 'Vaga ativada' : 'Vaga pausada' }),
        onError: () =>
          toast({
            title: 'Não foi possível atualizar a vaga',
            description: 'Tente novamente.',
          }),
      },
    );
  };

  const handleDelete = (jobId: string) => {
    if (!window.confirm('Excluir esta vaga? Essa ação não pode ser desfeita.')) return;

    removeJob.mutate(jobId, {
      onSuccess: () =>
        toast({
          title: 'Vaga excluída',
          description: 'A vaga foi removida da sua lista.',
        }),
      onError: (error) =>
        toast({
          title: 'Não foi possível excluir a vaga',
          description: isForeignKeyViolation(error)
            ? 'Esta vaga já recebeu candidaturas. Pause a vaga em vez de excluir.'
            : 'Tente novamente.',
        }),
    });
  };

  if (jobsQuery.isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-sm text-muted-foreground">
        Carregando vagas...
      </div>
    );
  }

  if (jobsQuery.isError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-3">
        <p className="text-sm text-destructive">Não foi possível carregar suas vagas.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void jobsQuery.refetch();
          }}
        >
          Tentar de novo
        </Button>
      </div>
    );
  }

  return (
    <JobsManagement
      jobs={jobs}
      jobCandidates={NO_CANDIDATES}
      onNewJob={onNewJob}
      onNavigate={onNavigate}
      onToggleJobStatus={handleToggleStatus}
      onDeleteJob={handleDelete}
    />
  );
}
