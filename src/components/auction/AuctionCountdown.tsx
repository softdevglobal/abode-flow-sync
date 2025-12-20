import { useState, useEffect } from 'react';
import { Clock, TimerOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuctionCountdownProps {
  endTime: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(endTime: string): TimeLeft {
  const difference = new Date(endTime).getTime() - Date.now();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
}

export function AuctionCountdown({ 
  endTime, 
  className, 
  size = 'md',
  showIcon = true,
  onExpire 
}: AuctionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(endTime));
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endTime);
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.total <= 0 && !hasExpired) {
        setHasExpired(true);
        onExpire?.();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, hasExpired, onExpire]);

  const isUrgent = timeLeft.total > 0 && timeLeft.total < 5 * 60 * 1000; // Less than 5 minutes

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-2',
    lg: 'text-lg gap-3',
  };

  const unitClasses = {
    sm: 'min-w-[32px] px-1 py-0.5 text-xs',
    md: 'min-w-[44px] px-2 py-1 text-sm',
    lg: 'min-w-[56px] px-3 py-2 text-base',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (timeLeft.total <= 0) {
    return (
      <div className={cn(
        'flex items-center font-medium text-muted-foreground',
        sizeClasses[size],
        className
      )}>
        {showIcon && <TimerOff className={iconSize[size]} />}
        <span>Auction ended</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center font-medium',
      sizeClasses[size],
      isUrgent && 'text-destructive',
      className
    )}>
      {showIcon && (
        <Clock className={cn(iconSize[size], isUrgent && 'animate-pulse')} />
      )}
      <div className="flex items-center gap-1">
        {timeLeft.days > 0 && (
          <div className={cn(
            'bg-muted rounded text-center font-mono font-bold',
            unitClasses[size],
            isUrgent && 'bg-destructive/10 text-destructive'
          )}>
            {timeLeft.days}d
          </div>
        )}
        <div className={cn(
          'bg-muted rounded text-center font-mono font-bold',
          unitClasses[size],
          isUrgent && 'bg-destructive/10 text-destructive'
        )}>
          {String(timeLeft.hours).padStart(2, '0')}h
        </div>
        <div className={cn(
          'bg-muted rounded text-center font-mono font-bold',
          unitClasses[size],
          isUrgent && 'bg-destructive/10 text-destructive'
        )}>
          {String(timeLeft.minutes).padStart(2, '0')}m
        </div>
        <div className={cn(
          'bg-muted rounded text-center font-mono font-bold',
          unitClasses[size],
          isUrgent && 'bg-destructive/10 text-destructive animate-pulse'
        )}>
          {String(timeLeft.seconds).padStart(2, '0')}s
        </div>
      </div>
    </div>
  );
}
