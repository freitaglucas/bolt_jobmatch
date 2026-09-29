import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout, type Screen } from '@/components/Layout';
import { Landing } from '@/screens/Landing';
import { Auth } from '@/screens/Auth';
import { Swipe } from '@/screens/Swipe';
import { JobDetail } from '@/screens/JobDetail';
import { Applications } from '@/screens/Applications';
import { Profile } from '@/screens/Profile';
import { Dashboard } from '@/screens/Dashboard';
import { JobsManagement } from '@/screens/JobsManagement';
import { JobCreate } from '@/screens/JobCreate';
import { Pipeline } from '@/screens/Pipeline';
import { Tokens } from '@/screens/Tokens';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import type { Role, Job, PipelineCandidate } from '@/lib/types';
import { mockJobs, mockRecruiterJobs, mockJobCandidates } from '@/lib/mock-data';

type AppState = 'landing' | 'auth' | 'app';

function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [role, setRole] = useState<Role>('candidate');
  const [screen, setScreen] = useState<Screen>('swipe');
  const [darkMode, setDarkMode] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Recruiter state
  const [recruiterJobs, setRecruiterJobs] = useState<Job[]>(mockRecruiterJobs);
  const [jobCandidates, setJobCandidates] = useState<Record<string, PipelineCandidate[]>>(mockJobCandidates);

  const { toast } = useToast();

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

  const handleLogout = () => {
    setAppState('landing');
    setSelectedJob(null);
    setAppliedJobIds(new Set());
    setRecruiterJobs(mockRecruiterJobs);
    setJobCandidates(mockJobCandidates);
  };

  const handleApply = (job: Job) => {
    setAppliedJobIds((prev) => new Set(prev).add(job.id));
    toast({
      title: 'Candidatura enviada!',
      description: `Você se candidatou para ${job.title} na ${job.company}.`,
    });
    setScreen('applications');
  };

  const handleDetail = (job: Job) => {
    setSelectedJob(job);
    setScreen('job-detail');
  };

  const handlePublishJob = (job: Job) => {
    setRecruiterJobs((prev) => [job, ...prev]);
    setJobCandidates((prev) => ({ ...prev, [job.id]: [] }));
    toast({
      title: 'Vaga publicada!',
      description: `${job.title} está agora visível para candidatos no swipe.`,
    });
    setScreen('jobs');
  };

  const handleToggleJobStatus = (jobId: string) => {
    setRecruiterJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, status: j.status === 'Ativa' ? 'Pausada' : 'Ativa' }
          : j
      )
    );
  };

  const handleDeleteJob = (jobId: string) => {
    setRecruiterJobs((prev) => prev.filter((j) => j.id !== jobId));
    toast({
      title: 'Vaga excluída',
      description: 'A vaga foi removida da sua lista.',
    });
  };

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
  return (
    <div className={darkMode ? '' : 'light'}>
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
            {screen === 'applications' && <Applications />}
            {screen === 'profile' && <Profile />}
            {screen === 'dashboard' && <Dashboard onNavigate={setScreen} />}
            {screen === 'jobs' && (
              <JobsManagement
                jobs={recruiterJobs}
                jobCandidates={jobCandidates}
                onNewJob={() => setScreen('job-create')}
                onNavigate={setScreen}
                onToggleJobStatus={handleToggleJobStatus}
                onDeleteJob={handleDeleteJob}
              />
            )}
            {screen === 'job-create' && (
              <JobCreate
                onBack={() => setScreen('jobs')}
                onPublish={handlePublishJob}
              />
            )}
            {screen === 'pipeline' && <Pipeline />}
            {screen === 'tokens' && <Tokens />}
          </motion.div>
        </AnimatePresence>
      </Layout>
      <Toaster />
    </div>
  );
}

export default App;
