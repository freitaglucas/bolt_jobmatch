import type { PropsWithChildren } from 'react';
import { GateError, GatePage, SessionSplash } from '@/components/GateShell';
import { isCandidateProfileComplete } from '../api';
import { useMyCandidateProfile, useSaveCandidateProfile } from '../hooks';
import { CandidateProfileForm } from './CandidateProfileForm';

export function CandidateOnboardingGate({
  onLogout,
  children,
}: PropsWithChildren<{ onLogout?: () => void }>) {
  const profileQuery = useMyCandidateProfile();
  const saveMutation = useSaveCandidateProfile();

  if (profileQuery.isLoading) {
    return <SessionSplash label="Carregando seu perfil…" />;
  }

  if (profileQuery.isError) {
    return (
      <GateError
        message="Não foi possível carregar seu perfil."
        onRetry={() => void profileQuery.refetch()}
        onLogout={onLogout}
      />
    );
  }

  const profile = profileQuery.data;

  if (profile && isCandidateProfileComplete(profile)) {
    return <>{children}</>;
  }

  return (
    <GatePage onLogout={onLogout}>
      <div className="w-full max-w-xl">
        <CandidateProfileForm
          initialValues={profile}
          isSubmitting={saveMutation.isPending}
          submitError={
            saveMutation.error instanceof Error
              ? saveMutation.error.message
              : null
          }
          onSubmit={(input) => void saveMutation.mutate(input)}
        />
      </div>
    </GatePage>
  );
}
