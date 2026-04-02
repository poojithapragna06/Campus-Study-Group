import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`rounded-xl animate-pulse ${className}`}
    style={{ background: 'linear-gradient(90deg, #1E2A3A 25%, #243040 50%, #1E2A3A 75%)', backgroundSize: '200% 100%' }}
  />
);

// ─── LoadingGrid ──────────────────────────────────────────────────────────────
export const LoadingGrid: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
        <Skeleton className="h-20 rounded-none" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    ))}
  </div>
);

// ─── LoadingRows ──────────────────────────────────────────────────────────────
export const LoadingRows: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-5 rounded-2xl" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
        <Skeleton className="w-14 h-14 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
);

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <Loader2 size={28} className="animate-spin" style={{ color: '#FFB800' }} />
    <span className="text-sm" style={{ color: '#4A5A70' }}>{label}</span>
  </div>
);

// ─── ErrorState ───────────────────────────────────────────────────────────────
export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Something went wrong.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
      <AlertCircle size={22} style={{ color: '#EF4444' }} />
    </div>
    <p className="text-sm" style={{ color: '#6B7A8D' }}>{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
        style={{ background: '#1E2A3A', color: '#E8EDF4' }}
      >
        Retry
      </button>
    )}
  </div>
);

// ─── MutationButton ───────────────────────────────────────────────────────────
interface MutationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isPending: boolean;
  label: string;
  pendingLabel?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const MutationButton: React.FC<MutationButtonProps> = ({
  isPending,
  label,
  pendingLabel = 'Saving…',
  style,
  className = '',
  ...props
}) => (
  <button
    disabled={isPending}
    className={`flex items-center justify-center gap-2 transition-opacity ${isPending ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
    style={style}
    {...props}
  >
    {isPending && <Loader2 size={13} className="animate-spin" />}
    {isPending ? pendingLabel : label}
  </button>
);
