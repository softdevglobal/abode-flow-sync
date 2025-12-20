import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  endTime: string;
  className?: string;
  variant?: 'default' | 'compact';
  showIcon?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownTimer({ 
  endTime, 
  className, 
  variant = 'default',
  showIcon = true 
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    const calculateTimeRemaining = (): TimeRemaining => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const total = end - now;

      if (total <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        days: Math.floor(total / (1000 * 60 * 60 * 24)),
        hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((total % (1000 * 60)) / 1000),
        total,
      };
    };

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  if (!timeRemaining) return null;

  const isEnded = timeRemaining.total <= 0;
  const isUrgent = timeRemaining.total > 0 && timeRemaining.total < 5 * 60 * 1000; // Less than 5 minutes

  if (variant === 'compact') {
    if (isEnded) {
      return (
        <span className={cn("text-muted-foreground", className)}>
          Ended
        </span>
      );
    }

    const parts = [];
    if (timeRemaining.days > 0) parts.push(`${timeRemaining.days}d`);
    if (timeRemaining.hours > 0) parts.push(`${timeRemaining.hours}h`);
    parts.push(`${timeRemaining.minutes}m`);
    parts.push(`${String(timeRemaining.seconds).padStart(2, '0')}s`);

    return (
      <span className={cn(
        "font-mono tabular-nums",
        isUrgent && "text-red-600 dark:text-red-400",
        className
      )}>
        {showIcon && <Clock className="w-3 h-3 inline mr-1" />}
        {parts.join(' ')}
      </span>
    );
  }

  // Default variant - full display
  if (isEnded) {
    return (
      <div className={cn("text-center", className)}>
        <p className="text-sm text-muted-foreground">Auction time ended</p>
      </div>
    );
  }

  return (
    <div className={cn("text-center", className)}>
      {showIcon && (
        <Clock className={cn(
          "w-5 h-5 mx-auto mb-2",
          isUrgent ? "text-red-500 animate-pulse" : "text-muted-foreground"
        )} />
      )}
      <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
      <div className="flex items-center justify-center gap-1 font-mono">
        {timeRemaining.days > 0 && (
          <>
            <TimeUnit value={timeRemaining.days} label="d" isUrgent={isUrgent} />
            <span className="text-muted-foreground">:</span>
          </>
        )}
        <TimeUnit value={timeRemaining.hours} label="h" isUrgent={isUrgent} />
        <span className="text-muted-foreground">:</span>
        <TimeUnit value={timeRemaining.minutes} label="m" isUrgent={isUrgent} />
        <span className="text-muted-foreground">:</span>
        <TimeUnit value={timeRemaining.seconds} label="s" isUrgent={isUrgent} />
      </div>
    </div>
  );
}

interface TimeUnitProps {
  value: number;
  label: string;
  isUrgent: boolean;
}

function TimeUnit({ value, label, isUrgent }: TimeUnitProps) {
  return (
    <div className="flex items-baseline">
      <span className={cn(
        "text-xl font-bold tabular-nums",
        isUrgent ? "text-red-600 dark:text-red-400" : "text-foreground"
      )}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs text-muted-foreground ml-0.5">{label}</span>
    </div>
  );
}
