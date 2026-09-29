import { UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className, showText = true, size = 32 }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="bg-gradient-purple-teal flex items-center justify-center rounded-xl"
        style={{ width: size, height: size }}
      >
        <UserCheck className="text-white" style={{ width: size * 0.6, height: size * 0.6 }} />
      </div>
      {showText && (
        <span className="text-xl font-bold tracking-tight">
          Job<span className="text-gradient-purple-teal">Match</span>
        </span>
      )}
    </div>
  );
}
