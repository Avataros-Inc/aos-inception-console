import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable Dropdown Menu component with Portal for proper z-index
 * Used by AvatarCard, FileCard, and other components
 */
export const DropdownMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      // Check if click is outside both trigger and content
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        contentRef.current &&
        !contentRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    // Use mousedown for better UX (closes before click completes)
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={triggerRef}>
      {React.Children.map(children, (child, index) => {
        if (index === 0) {
          return React.cloneElement(child, {
            onClick: () => setIsOpen(!isOpen),
          });
        }
        if (index === 1 && isOpen) {
          return React.cloneElement(child, {
            onItemClick: () => setIsOpen(false),
            triggerRef: triggerRef,
            contentRef: contentRef,
          });
        }
        return null;
      })}
    </div>
  );
};

export const DropdownMenuTrigger = ({ children, onClick }) => {
  return React.cloneElement(children, { onClick });
};

export const DropdownMenuContent = ({ children, onItemClick, triggerRef, contentRef }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.right - 192, // 192px = min-w-48 (48 * 4)
      });
    }
  }, [triggerRef]);

  // Recursively process children to handle fragments and conditional rendering
  const processChildren = (children) => {
    return React.Children.map(children, (child) => {
      if (!child) return null;

      // Handle fragments by processing their children
      if (child.type === React.Fragment) {
        return processChildren(child.props.children);
      }

      // Clone the element with onItemClick prop
      return React.cloneElement(child, { onItemClick });
    });
  };

  const dropdown = (
    <div
      ref={contentRef}
      className="fixed bg-bg-secondary border border-border-subtle rounded-lg py-1 z-50 min-w-48 shadow-xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {processChildren(children)}
    </div>
  );

  return createPortal(dropdown, document.body);
};

export const DropdownMenuItem = ({ children, onClick, className = '', onItemClick }) => {
  const handleClick = () => {
    onClick && onClick();
    onItemClick && onItemClick();
  };

  return (
    <div
      className={`px-3 py-2 hover:bg-accent-mint/10 cursor-pointer text-sm flex items-center ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

export const DropdownMenuSeparator = () => {
  return <div className="h-px bg-border-subtle my-1" />;
};
