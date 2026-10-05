import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getScoreColor, getScoreHex } from '../lib/score';

interface MatchScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
  animate?: boolean;
}

export function MatchScoreRing({
  score,
  size = 80,
  strokeWidth = 6,
  showLabel = true,
  className,
  animate = true,
}: MatchScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colorClass = getScoreColor(score);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getScoreHex(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animate ? { strokeDashoffset: circumference } : {}}
          animate={animate ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={animate ? {} : { strokeDashoffset: offset }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-lg font-bold', colorClass)}>{score}</span>
          <span className="text-[10px] text-muted-foreground -mt-1">match</span>
        </div>
      )}
    </div>
  );
}
