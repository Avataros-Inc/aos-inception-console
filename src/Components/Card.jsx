import React from 'react';
import { cn } from '../lib/utils';

/**
 * Reusable Card component with consistent styling across the application
 * Used by AvatarCard, FileCard, and other card-based components
 */
const Card = React.forwardRef(({ className, hover = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-bg-secondary backdrop-blur-sm border border-border-subtle rounded-xl transition-all duration-300 overflow-hidden',
      hover && 'hover:border-accent-mint/50 hover:shadow-lg hover:shadow-accent-mint/10 hover:-translate-y-1',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

/**
 * Card header/preview section with aspect ratio
 */
const CardPreview = React.forwardRef(({ className, aspectRatio = 'aspect-video', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden',
      aspectRatio,
      className
    )}
    {...props}
  />
));
CardPreview.displayName = 'CardPreview';

/**
 * Card header for text content
 */
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-4', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

/**
 * Card title component
 */
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold text-text-primary', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/**
 * Card description/subtitle component
 */
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-text-secondary', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/**
 * Card content section with consistent padding
 */
const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-4', className)}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

/**
 * Card badge/tag component for status indicators
 */
const CardBadge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-bg-secondary/80 backdrop-blur-sm text-text-secondary',
    success: 'bg-green-500 text-green-100',
    warning: 'bg-yellow-500 text-yellow-100',
    error: 'bg-red-500 text-red-100',
    info: 'bg-blue-500 text-blue-100',
    primary: 'bg-accent-mint text-white',
  };

  return (
    <div
      ref={ref}
      className={cn('px-2 py-1 rounded text-xs font-medium', variants[variant], className)}
      {...props}
    />
  );
});
CardBadge.displayName = 'CardBadge';

/**
 * Card actions section for buttons
 */
const CardActions = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-2', className)}
    {...props}
  />
));
CardActions.displayName = 'CardActions';

export {
  Card,
  CardPreview,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardBadge,
  CardActions,
};
