import { cn } from '@/lib/utils';

export function Button({ children, variant = 'primary', size = 'md', className = '', disabled = false, ...props }) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-mint focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-r from-accent-mint to-emerald-600 text-bg-primary hover:from-emerald-600 hover:to-accent-mint hover:shadow-lg hover:shadow-accent-mint/20',
    secondary:
      'bg-bg-secondary text-text-primary border border-border-subtle hover:border-accent-mint hover:bg-bg-secondary/80',
    ghost: 'text-text-primary hover:bg-bg-secondary',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button className={cn(baseClasses, variants[variant], sizes[size], className)} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
