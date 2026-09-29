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
import { Pipeline } from '@/screens/Pipeline';
import { Tokens } from '@/screens/Tokens';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import type { Role, Job } from '@/lib/types';
import { mockJobs } from '@/lib/mock-data';

type AppState = 'landing' | 'auth' | 'app';

function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [role, setRole] = useState<Role>('candidate');
  const [screen, setScreen] = useState<Screen>('swipe');
  const [darkMode, setDarkMode] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
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
