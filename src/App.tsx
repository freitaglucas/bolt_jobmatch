import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout, type Screen } from '@/components/Layout';
import { Landing } from '@/screens/Landing';
import { Auth } from '@/screens/Auth';
import { ResetPassword } from '@/screens/ResetPassword';
import { Swipe } from '@/screens/Swipe';
import { JobDetail } from '@/screens/JobDetail';
import { Applications } from '@/screens/Applications';
import { Profile } from '@/screens/Profile';
import { Dashboard } from '@/screens/Dashboard';
import { RecruiterJobs } from '@/screens/RecruiterJobs';
import { JobCreate } from '@/screens/JobCreate';
import { Pipeline } from '@/screens/Pipeline';
import { PostHire } from '@/screens/PostHire';
import { Tokens } from '@/screens/Tokens';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import type { Role, Job } from '@/lib/types';
import { useAuth } from '@/features/auth/hooks';
import { TcleConsentGate } from '@/features/consents/components/TcleConsentGate';
import { CandidateOnboardingGate } from '@/features/candidates/components/CandidateOnboardingGate';
import { createApplication } from '@/features/applications/api';
import { trackApplicationSubmitted } from '@/features/telemetry/api';

type AppState = 'landing' | 'auth' | 'app';

function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [role, setRole] = useState<Role>('candidate');
  const [screen, setScreen] = useState<Screen>('swipe');
  const [darkMode, setDarkMode] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const auth = useAuth();
  const isResetPasswordRoute = window.location.pathname === '/reset-password';

  useEffect(() => {
    if (isResetPasswordRoute) {
      return;
    }
    if (auth.isLoading || !auth.user) {
      return;
    }
    if (auth.user.role) {
      setRole(auth.user.role);
      setScreen(auth.user.role === 'recruiter' ? 'dashboard' : 'swipe');
      setAppState('app');
    } else {
      setAppState('auth');
    }
  }, [auth.isLoading, auth.user, isResetPasswordRoute]);

  const toggleDark = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
      }
      return next;
    });
  };

  const handleAuth = (r: Role) => {
    setRole(r);
    setScreen(r === 'candidate' ? 'swipe' : 'dashboard');
    setAppState('app');
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setAppState('landing');
      setSelectedJob(null);
      setAppliedJobIds(new Set());
    } catch {
      toast({
        title: 'Não foi possível sair',
        description: 'Tente novamente.',
      });
    }
  };

  const handleApply = async (job: Job): Promise<boolean> => {
    try {
      const result = await createApplication(job.id);
      setAppliedJobIds((previous) => new Set(previous).add(job.id));
      if (result.created) {
        void trackApplicationSubmitted(
          job.id,
          result.application.match_score,
        ).catch(() => undefined);
        toast({
          title: 'Candidatura enviada!',
          description: `Você se candidatou para ${job.title} na ${job.company}.`,
        });
      } else {
        toast({
          title: 'Você já se candidatou',
          description: `Sua candidatura para ${job.title} continua registrada.`,
        });
      }
      return true;
    } catch (error) {
      toast({
        title: 'Não foi possível enviar sua candidatura',
        description:
          error instanceof Error
            ? error.message
            : 'Verifique sua conexão e tente novamente.',
      });
      return false;
    }
  };

  const handleDetail = (job: Job) => {
    setSelectedJob(job);
    setScreen('job-detail');
  };

  const handleJobPublished = (title: string) => {
    toast({
      title: 'Vaga publicada!',
      description: `${title} está agora visível para candidatos no swipe.`,
    });
    setScreen('jobs');
  };

  if (isResetPasswordRoute) {
    return (
      <div className={darkMode ? '' : 'light'}>
        <ResetPassword
          onBackToLogin={() => {
            window.history.replaceState(null, '', '/');
            setAppState('auth');
          }}
        />
        <Toaster />
      </div>
    );
  }

  // Landing
  if (appState === 'landing') {
    return (
      <div className={darkMode ? '' : 'light'}>
        <Landing
          onAuth={(r) => {
            setRole(r);
            setAppState('auth');
          }}
          darkMode={darkMode}
          onToggleDark={toggleDark}
        />
        <Toaster />
      </div>
    );
  }

  // Auth
  if (appState === 'auth') {
    return (
      <div className={darkMode ? '' : 'light'}>
        <Auth
          onLogin={handleAuth}
          onBack={() => setAppState('landing')}
          darkMode={darkMode}
        />
        <Toaster />
      </div>
    );
  }

  // App screens
  const appContent = (
    <Layout
      role={role}
      screen={screen}
      onNavigate={setScreen}
      onLogout={handleLogout}
      darkMode={darkMode}
      onToggleDark={toggleDark}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {screen === 'swipe' && (
            <Swipe onApply={handleApply} onDetail={handleDetail} />
          )}
          {screen === 'job-detail' && selectedJob && (
            <JobDetail
              job={selectedJob}
              onBack={() => setScreen('swipe')}
              onApply={handleApply}
              alreadyApplied={appliedJobIds.has(selectedJob.id)}
            />
          )}
          {screen === 'applications' && <Applications onNavigate={setScreen} />}
          {screen === 'profile' && <Profile />}
          {screen === 'dashboard' && <Dashboard onNavigate={setScreen} />}
          {screen === 'jobs' && (
            <RecruiterJobs
              onNewJob={() => setScreen('job-create')}
              onNavigate={setScreen}
            />
          )}
          {screen === 'job-create' && (
            <JobCreate
              onBack={() => setScreen('jobs')}
              onPublished={handleJobPublished}
            />
          )}
          {screen === 'pipeline' && <Pipeline />}
          {screen === 'post-hire' && <PostHire onBack={() => setScreen('jobs')} />}
          {screen === 'tokens' && <Tokens />}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );

  return (
    <div className={darkMode ? '' : 'light'}>
      <TcleConsentGate userId={auth.user?.id ?? null}>
        {role === 'candidate' ? (
          <CandidateOnboardingGate>{appContent}</CandidateOnboardingGate>
        ) : (
          appContent
        )}
      </TcleConsentGate>
      <Toaster />
    </div>
  );
}

export default App;
