import { cn } from '@/lib/utils';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border-subtle bg-bg-secondary/50 backdrop-blur-sm p-6 shadow-lg transition-all duration-200 hover:border-accent-mint/30 hover:shadow-xl hover:shadow-accent-mint/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={cn('font-semibold leading-none tracking-tight text-text-primary', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={cn('text-sm text-text-secondary', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}
