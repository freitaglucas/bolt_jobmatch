import { useEffect, useRef, useState } from 'react';
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
import { ReturnGoal } from '@/screens/ReturnGoal';
import { Company } from './screens/Company';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import type { Role, Job } from '@/lib/types';
import { useAuth } from '@/features/auth/hooks';
import { TcleConsentGate } from '@/features/consents/components/TcleConsentGate';
import { CandidateOnboardingGate } from '@/features/candidates/components/CandidateOnboardingGate';
import { RecruiterOnboardingGate } from '@/features/recruiters/components/RecruiterOnboardingGate';
import { createApplication } from '@/features/applications/api';
import { APP_NAME, screenTitle } from '@/lib/screen-title';
import { trackApplicationSubmitted, trackJobViewed } from '@/features/telemetry/api';
import {
  clearJobLinkOrigin,
  loadJobLinkOrigin,
  readJobLinkParam,
  saveJobLinkOrigin,
  stripJobLinkParam,
} from '@/features/telemetry/origin';
import { readDeepLinkScreen, stripDeepLinkParam } from '@/lib/deep-link';
import { resolveAppState, type AppState } from '@/lib/app-state';
import { SessionSplash } from '@/components/GateShell';

function App() {
  // Comeca em "loading" (N76): quem ja tem sessao nao ve a Landing piscar.
  const [appState, setAppState] = useState<AppState>('loading');
  const [role, setRole] = useState<Role>('candidate');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [screen, setScreen] = useState<Screen>('swipe');
  const [darkMode, setDarkMode] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const auth = useAuth();
  const isResetPasswordRoute = window.location.pathname === '/reset-password';
  // Link do e-mail ao candidato (N74): "?tela=candidaturas" abre Candidaturas apos o login.
  const deepLinkRef = useRef<Screen | null>(readDeepLinkScreen(window.location.search));
  // Link da vaga (N84): "?vaga=<id>" fica guardado neste navegador ate a candidatura.
  const [linkedJobId, setLinkedJobId] = useState<string | null>(() => {
    const fromUrl = readJobLinkParam(window.location.search);
    if (fromUrl) {
      saveJobLinkOrigin(fromUrl);
      return fromUrl;
    }
    return loadJobLinkOrigin()?.jobId ?? null;
  });

  useEffect(() => {
    const { pathname, search, hash } = window.location;
    let next = stripDeepLinkParam(pathname, search, hash);
    if (readJobLinkParam(search)) {
      const url = new URL(next, window.location.origin);
      next = stripJobLinkParam(url.pathname, url.search, url.hash);
    }
    if (next !== `${pathname}${search}${hash}`) {
      window.history.replaceState(null, '', next);
    }
  }, []);

  const startScreen = (r: Role): Screen =>
    r === 'recruiter' ? 'dashboard' : (deepLinkRef.current ?? 'swipe');

  useEffect(() => {
    document.title = appState === 'app' ? screenTitle(screen) : APP_NAME;
  }, [appState, screen]);

  useEffect(() => {
    if (isResetPasswordRoute) {
      return;
    }
    const user = auth.user ?? null;
    if (!auth.isLoading && user?.role) {
      setRole(user.role);
      setScreen(startScreen(user.role));
    }
    setAppState((current) =>
      resolveAppState(current, {
        isLoading: auth.isLoading,
        hasUser: user !== null,
        hasRole: Boolean(user?.role),
      }),
    );
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
    setScreen(startScreen(r));
    setAppState('app');
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      deepLinkRef.current = null;
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
      const fromJobLink = linkedJobId === job.id;
      if (fromJobLink) {
        clearJobLinkOrigin();
        setLinkedJobId(null);
      }
      if (result.created) {
        void trackApplicationSubmitted(
          job.id,
          result.application.match_score,
          undefined,
          fromJobLink ? 'job_link' : 'direct',
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
    void trackJobViewed(job.id, 'detail').catch(() => undefined);
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

  // Sessao carregando: splash neutro (N76)
  if (appState === 'loading') {
    return (
      <div className={darkMode ? '' : 'light'}>
        <SessionSplash />
      </div>
    );
  }

  // Landing
  if (appState === 'landing') {
    return (
      <div className={darkMode ? '' : 'light'}>
        <Landing
          onAuth={(r, m) => {
            setRole(r);
            setAuthMode(m);
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
          initialRole={role}
          initialMode={authMode}
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
            <Swipe
              onApply={handleApply}
              onDetail={handleDetail}
              priorityJobId={linkedJobId}
            />
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
          {screen === 'return-goal' && <ReturnGoal onNavigate={setScreen} />}
          {screen === 'company' && <Company />}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );

  return (
    <div className={darkMode ? '' : 'light'}>
      <TcleConsentGate userId={auth.user?.id ?? null} onLogout={handleLogout}>
        {role === 'candidate' ? (
          <CandidateOnboardingGate onLogout={handleLogout}>{appContent}</CandidateOnboardingGate>
        ) : (
          <RecruiterOnboardingGate onLogout={handleLogout}>
            {appContent}
          </RecruiterOnboardingGate>
        )}
      </TcleConsentGate>
      <Toaster />
    </div>
  );
}

export default App;
