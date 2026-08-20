import React from 'react';
import { cn } from '@/lib/utils';

interface DashRingProps {
  className?: string;
  size?: number;
}

export function DashRing({ className, size = 24 }: DashRingProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('animate-spin text-emerald-600 shrink-0', className)}
      style={{ animationDuration: '0.9s' }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        strokeOpacity="0.2"
        strokeDasharray="56.5"
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        strokeDasharray="14 42"
      />
    </svg>
  );
}
