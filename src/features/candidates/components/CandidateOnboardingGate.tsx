import type { PropsWithChildren } from 'react';
import { Logo } from '@/components/Logo';
import { isCandidateProfileComplete } from '../api';
import { useMyCandidateProfile, useSaveCandidateProfile } from '../hooks';
import { CandidateProfileForm } from './CandidateProfileForm';

export function CandidateOnboardingGate({ children }: PropsWithChildren) {
  const profileQuery = useMyCandidateProfile();
  const saveMutation = useSaveCandidateProfile();

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-destructive px-4 text-center">
        Não foi possível carregar seu perfil. Tente novamente.
      </div>
    );
  }

  const profile = profileQuery.data;

  if (profile && isCandidateProfileComplete(profile)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between">
        <Logo size={28} />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
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
      </main>
    </div>
  );
}
