import React, { useState } from 'react';
import { Edit, Play, MoreHorizontal, Copy, Trash2, User, Plus } from 'lucide-react';
import { Button } from './Button';

// Simple Select component since we don't have shadcn/ui
const Select = ({ defaultValue, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  return (
    <div className={`relative ${className}`}>
      <button
        className="w-full px-3 py-2 bg-bg-secondary border border-border-subtle rounded-lg text-text-primary text-left flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Version: {value}</span>
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-400"></div>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-bg-secondary border border-border-subtle rounded-lg mt-1 z-10">
          <div
            className="px-3 py-2 hover:bg-accent-mint/10 cursor-pointer"
            onClick={() => {
              setValue('Original');
              setIsOpen(false);
            }}
          >
            Version: Original
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Dropdown component
const DropdownMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {React.Children.map(children, (child, index) => {
        if (index === 0) {
          return React.cloneElement(child, {
            onClick: () => setIsOpen(!isOpen),
          });
        }
        if (index === 1 && isOpen) {
          return React.cloneElement(child, {
            onItemClick: () => setIsOpen(false),
          });
        }
        return null;
      })}
    </div>
  );
};

const DropdownMenuTrigger = ({ children, onClick }) => {
  return React.cloneElement(children, { onClick });
};

const DropdownMenuContent = ({ children, onItemClick }) => {
  return (
    <div className="absolute right-0 top-full mt-1 bg-bg-secondary border border-border-subtle rounded-lg py-1 z-20 min-w-48">
      {React.Children.map(children, (child) => React.cloneElement(child, { onItemClick }))}
    </div>
  );
};

const DropdownMenuItem = ({ children, onClick, className = '', onItemClick }) => {
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

export function AvatarCard({ avatar, onEdit, onPlay, onDelete, onDuplicate, onUpdateName }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(avatar.name);

  const handleNameSubmit = () => {
    onUpdateName(avatar.id, tempName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setTempName(avatar.name);
      setIsEditingName(false);
    }
  };

  const copyCharacterId = () => {
    navigator.clipboard.writeText(avatar.id);
  };

  return (
    <div className="bg-bg-secondary backdrop-blur-sm border border-border-subtle rounded-xl transition-all duration-300 hover:border-accent-mint/50 hover:shadow-lg hover:shadow-accent-mint/10 hover:-translate-y-1 overflow-hidden">
      {/* Avatar Preview */}
      <div className="aspect-video relative bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
        {/* Placeholder for 3D avatar - could be replaced with actual 3D viewer */}
        <div className="w-24 h-24 bg-gradient-to-br from-accent-mint to-teal-400 rounded-full flex items-center justify-center">
          <User size={32} className="text-white" />
        </div>
        <div className="absolute top-2 right-2 bg-bg-secondary/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-text-secondary">
          3D
        </div>
      </div>

      {/* Avatar Info */}
      <div className="p-4">
        {/* Name */}
        {isEditingName ? (
          <input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyDown}
            className="w-full text-lg font-semibold mb-2 bg-bg-secondary border border-border-subtle rounded px-2 py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-mint"
            autoFocus
          />
        ) : (
          <h3
            className="text-lg font-semibold mb-2 cursor-pointer hover:text-accent-mint transition-colors text-text-primary"
            onClick={() => setIsEditingName(true)}
          >
            {avatar.name}
          </h3>
        )}

        {/* Version Selector */}
        <Select defaultValue="Original" className="mb-3" />

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(avatar)}>
            <Edit className="w-4 h-4 mr-1" />
            Embed
          </Button>
          <Button variant="primary" size="sm" className="flex-1" onClick={() => onPlay(avatar)}>
            <Play className="w-4 h-4 mr-1" />
            Launch
          </Button>

          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="secondary" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onDuplicate(avatar)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyCharacterId}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Character ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(avatar.id)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export function CreateAvatarCard({ onCreate }) {
  return (
    <div
      className="bg-bg-secondary backdrop-blur-sm border-2 border-dashed border-border-subtle rounded-xl cursor-pointer group hover:border-accent-mint transition-all duration-300 hover:shadow-lg hover:shadow-accent-mint/10 hover:-translate-y-1 overflow-hidden"
      onClick={onCreate}
    >
      <div className="aspect-video flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-mint/20 rounded-full flex items-center justify-center mb-3 mx-auto group-hover:bg-accent-mint/30 transition-colors">
            <User className="w-8 h-8 text-accent-mint" />
          </div>
          <p className="text-text-secondary font-medium">Create New Avatar</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-center text-sm text-text-secondary">Click to start creating your next 3D avatar</p>
      </div>
    </div>
  );
}
