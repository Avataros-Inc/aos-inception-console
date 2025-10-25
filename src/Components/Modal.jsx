import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Modal component with backdrop and close functionality
 */
export const Modal = ({ isOpen, onClose, children, className = '', closeOnBackdrop = true }) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'bg-bg-secondary border border-border-subtle rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Modal header with title and close button
 */
export const ModalHeader = ({ children, onClose, className = '' }) => {
  return (
    <div className={cn('flex items-center justify-between p-6 border-b border-border-subtle', className)}>
      <h2 className="text-xl font-semibold text-text-primary">{children}</h2>
      {onClose && (
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-slate-700/50"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};

/**
 * Modal content/body section
 */
export const ModalContent = ({ children, className = '' }) => {
  return (
    <div className={cn('p-6 overflow-y-auto flex-1', className)}>
      {children}
    </div>
  );
};

/**
 * Modal footer for actions
 */
export const ModalFooter = ({ children, className = '' }) => {
  return (
    <div className={cn('flex items-center justify-end gap-2 p-6 border-t border-border-subtle', className)}>
      {children}
    </div>
  );
};
