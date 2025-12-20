import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'At least 12 characters', test: (p) => p.length >= 12 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { score, passedRequirements } = useMemo(() => {
    const passed = requirements.filter((req) => req.test(password));
    return {
      score: passed.length,
      passedRequirements: passed.map((req) => req.label),
    };
  }, [password]);

  const getStrengthLabel = () => {
    if (password.length === 0) return { label: '', color: '' };
    if (score <= 1) return { label: 'Weak', color: 'text-destructive' };
    if (score <= 2) return { label: 'Fair', color: 'text-orange-500' };
    if (score <= 3) return { label: 'Good', color: 'text-yellow-500' };
    if (score <= 4) return { label: 'Strong', color: 'text-emerald-500' };
    return { label: 'Very Strong', color: 'text-emerald-600' };
  };

  const getBarColor = (index: number) => {
    if (password.length === 0) return 'bg-muted';
    if (index >= score) return 'bg-muted';
    if (score <= 1) return 'bg-destructive';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-emerald-500';
    return 'bg-emerald-600';
  };

  const strength = getStrengthLabel();

  if (password.length === 0) return null;

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Password strength</span>
          <span className={cn('text-xs font-medium', strength.color)}>
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                getBarColor(index)
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="grid gap-1">
        {requirements.map((req) => {
          const isPassed = passedRequirements.includes(req.label);
          return (
            <div
              key={req.label}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors duration-200',
                isPassed ? 'text-emerald-600' : 'text-muted-foreground'
              )}
            >
              {isPassed ? (
                <Check className="h-3 w-3 flex-shrink-0" />
              ) : (
                <X className="h-3 w-3 flex-shrink-0" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function validatePasswordStrength(password: string): boolean {
  return requirements.every((req) => req.test(password));
}
