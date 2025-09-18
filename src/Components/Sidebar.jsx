import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Camera, Code, ChevronRight, Settings, CreditCard, LogOut, Video, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/Components/Button';

const navItems = [
  {
    key: 'characters',
    label: 'Characters',
    icon: User,
    path: '/console/characters', // Now shows My Avatars
    subsections: [
      { key: 'agent-window', label: 'Avatar Editor', path: '/console/conversational-ai' }, // Now shows interactive agent window
      { key: 'avatar-trainer', label: 'Avatar Trainer', path: '/console/trainer' },
    ],
  },
  {
    key: 'scenes',
    label: 'Scenes',
    icon: Camera,
    subsections: [
      { key: 'my-scenes', label: 'My Scenes', path: '/console/scenes' },
      { key: 'scene-editor', label: 'Scene Editor', path: '/console/scene-editor' },
    ],
  },
  {
    key: 'developer',
    label: 'Developer',
    icon: Code,
    subsections: [
      { key: 'live-sessions', label: 'Live Sessions', path: '/console/renders' },
      { key: 'videos', label: 'Videos', path: '/console/videos' },
      { key: 'api-keys', label: 'API Keys', path: '/console/apikeys' },
      { key: 'billing', label: 'Billing', path: '/console/billing' },
    ],
  },
];

const settingsItems = [{ key: 'account', label: 'Account', icon: LogOut, path: '/console/account' }];

export const Sidebar = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  const handleSectionClick = (item) => {
    // If item has a direct path, navigate to it
    if (item.path) {
      navigate(item.path);
    }

    // If item has subsections, toggle expansion
    if (item.subsections) {
      setExpandedSections((prev) => ({
        ...prev,
        [item.key]: !prev[item.key],
      }));
    }
  };

  // Helper function to check if a section is active
  const isSectionActive = (item) => {
    if (item.path && location.pathname === item.path) return true;
    if (item.subsections) {
      return item.subsections.some((sub) => location.pathname === sub.path);
    }
    return false;
  };

  const handleSubsectionClick = (path) => {
    navigate(path);
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 z-50 sidebar-glass border-border-subtle bg-none">
      <div className="flex flex-col h-full">
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = isSectionActive(item);
            return (
              <div key={item.key} className="space-y-1">
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 text-left rounded-xl py-3 px-4 transition-all duration-300',
                    'hover:bg-accent-mint/10 hover:text-white',
                    isActive
                      ? 'bg-accent-mint/20 text-accent-mint border-l-4 border-l-accent-mint'
                      : 'text-slate-300 border-l-4 border-transparent'
                  )}
                  onClick={() => handleSectionClick(item)}
                >
                  <item.icon size={20} className={cn(isActive ? 'text-accent-mint' : 'text-slate-300')} />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.subsections && (
                    <ChevronRight
                      size={16}
                      className={cn(
                        'transition-transform duration-300',
                        expandedSections[item.key] && 'rotate-90',
                        isActive ? 'text-accent-mint' : 'text-slate-300'
                      )}
                    />
                  )}
                </Button>

                {/* Subsections */}
                {item.subsections && expandedSections[item.key] && (
                  <div className="ml-4 mt-1 space-y-1 pl-2">
                    {item.subsections.map((sub) => (
                      <Button
                        key={sub.key}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'w-full justify-start text-sm rounded-lg py-2 px-3 transition-all duration-300',
                          'hover:bg-accent-mint/10 hover:text-white',
                          location.pathname === sub.path ? 'text-accent-mint bg-accent-mint/20' : 'text-slate-400'
                        )}
                        onClick={() => handleSubsectionClick(sub.path)}
                      >
                        {sub.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Settings section */}
        <div className="p-4 border-t border-border-subtle space-y-2">
          {settingsItems.map((item) => (
            <Button
              key={item.key}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 rounded-xl py-3 px-4 transition-all duration-300',
                'hover:bg-accent-mint/10 hover:text-white',
                location.pathname === item.path
                  ? 'bg-accent-mint/20 text-accent-mint border-l-4 border-l-accent-mint'
                  : 'text-slate-300 border-l-4 border-transparent'
              )}
              onClick={() => handleSubsectionClick(item.path)}
            >
              <item.icon
                size={20}
                className={cn(location.pathname === item.path ? 'text-accent-mint' : 'text-slate-300')}
              />
              <span className="font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
};
