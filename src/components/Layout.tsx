import { useState, useMemo } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Moon, Sun, LogOut } from 'lucide-react';
import type { Role } from '@/lib/types';
import { cn } from '@/lib/utils';

export type Screen =
  | 'landing'
  | 'auth'
  | 'swipe'
  | 'job-detail'
  | 'applications'
  | 'profile'
  | 'dashboard'
  | 'jobs'
  | 'job-create'
  | 'pipeline'
  | 'post-hire'
  | 'tokens'
  | 'company';

interface LayoutProps {
  children: React.ReactNode;
  role: Role;
  screen: Screen;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const candidateNav: { screen: Screen; label: string }[] = [
  { screen: 'swipe', label: 'Vagas' },
  { screen: 'applications', label: 'Candidaturas' },
  { screen: 'profile', label: 'Perfil' },
];

const recruiterNav: { screen: Screen; label: string }[] = [
  { screen: 'dashboard', label: 'Dashboard' },
  { screen: 'jobs', label: 'Vagas' },
  { screen: 'pipeline', label: 'Pipeline' },
  { screen: 'post-hire', label: 'Pós-contratação' },
  { screen: 'tokens', label: 'Jornada' },
  { screen: 'company', label: 'Minha empresa' },
]

export function Layout({
  children,
  role,
  screen,
  onNavigate,
  onLogout,
  darkMode,
  onToggleDark,
}: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = role === 'candidate' ? candidateNav : recruiterNav;

  const activeScreen = useMemo(() => {
    if (screen === 'job-detail') return 'swipe';
    if (screen === 'job-create') return 'jobs';
    return screen;
  }, [screen]);


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => onNavigate(role === 'candidate' ? 'swipe' : 'dashboard')}
            className="flex items-center"
          >
            <Logo size={32} />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.screen}
                onClick={() => onNavigate(item.screen)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeScreen === item.screen
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDark}
              className="rounded-lg"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="rounded-lg"
            >
              <LogOut className="h-5 w-5" />
            </Button>
            <button
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <div className="space-y-1.5 w-6">
                <div className={cn('h-0.5 w-full bg-foreground transition-all', mobileOpen && 'rotate-45 translate-y-2')} />
                <div className={cn('h-0.5 w-full bg-foreground transition-all', mobileOpen && 'opacity-0')} />
                <div className={cn('h-0.5 w-full bg-foreground transition-all', mobileOpen && '-rotate-45 -translate-y-2')} />
              </div>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden border-t border-border px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.screen}
                onClick={() => {
                  onNavigate(item.screen);
                  setMobileOpen(false);
                }}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors',
                  activeScreen === item.screen
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <Logo size={24} />
          <p>Protótipo visual - dados mockados - JobMatch 2026</p>
        </div>
      </footer>
    </div>
  );
}
