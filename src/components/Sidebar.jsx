import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Home,
  User,
  Camera,
  Play,
  Code,
  ChevronRight,
  Settings,
  CreditCard,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  {
    key: 'home',
    label: 'Home',
    icon: Home,
    path: '/',
  },
  {
    key: 'characters',
    label: 'Characters',
    icon: User,
    subsections: [
      { key: 'my-avatars', label: 'My Avatars', path: '/characters' },
      { key: 'avatar-editor', label: 'Avatar Editor', path: '/avatar-editor' },
    ],
  },
  {
    key: 'scenes',
    label: 'Scenes',
    icon: Camera,
    subsections: [
      { key: 'my-scenes', label: 'My Scenes', path: '/scenes' },
      { key: 'scene-editor', label: 'Scene Editor', path: '/scene-editor' },
    ],
  },
  {
    key: 'playground',
    label: 'Playground',
    icon: Play,
    subsections: [
      { key: 'text-to-avatar', label: 'Text to Avatar', path: '/text-to-avatar' },
      { key: 'audio-to-avatar', label: 'Audio to Avatar', path: '/audio-to-avatar' },
      { key: 'interactive-agent', label: 'Interactive Agent', path: '/conversational-ai' },
    ],
  },
  {
    key: 'developer',
    label: 'Developer',
    icon: Code,
    subsections: [
      { key: 'api-access', label: 'API Access', path: '/apikeys' },
      { key: 'character-ids', label: 'Character IDs', path: '/characters' },
    ],
  },
];

const settingsItems = [
  { key: 'settings', label: 'Settings', icon: Settings, path: '/account' },
  { key: 'billing', label: 'Billing', icon: CreditCard, path: '/billing' },
  { key: 'help', label: 'Help & Support', icon: HelpCircle, path: '/help' },
  { key: 'logout', label: 'Logout', icon: LogOut, path: '/logout' },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    playground: true,
  });

  const handleSectionClick = (item) => {
    if (item.subsections) {
      setExpandedSections((prev) => ({
        ...prev,
        [item.key]: !prev[item.key],
      }));
    } else {
      setLocation(item.path);
      setSidebarOpen(false);
    }
  };

  const handleSubsectionClick = (path) => {
    setLocation(path);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 w-64 bg-bg-sidebar border-r border-border-subtle z-40 transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-border-subtle">
            <h2 className="text-xl font-bold text-accent-mint">AVATAROS</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <div key={item.key}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 text-left',
                    location === item.path && 'bg-bg-secondary text-accent-mint'
                  )}
                  onClick={() => handleSectionClick(item)}
                >
                  <item.icon size={20} />
                  <span className="flex-1">{item.label}</span>
                  {item.subsections && (
                    <ChevronRight
                      size={16}
                      className={cn('transition-transform', expandedSections[item.key] && 'rotate-90')}
                    />
                  )}
                </Button>

                {/* Subsections */}
                {item.subsections && expandedSections[item.key] && (
                  <div className="ml-8 mt-2 space-y-1">
                    {item.subsections.map((sub) => (
                      <Button
                        key={sub.key}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'w-full justify-start text-text-secondary hover:text-text-primary',
                          location === sub.path && 'text-accent-mint bg-bg-secondary'
                        )}
                        onClick={() => handleSubsectionClick(sub.path)}
                      >
                        {sub.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Settings section */}
          <div className="p-4 border-t border-border-subtle space-y-2">
            {settingsItems.map((item) => (
              <Button
                key={item.key}
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3',
                  location === item.path && 'bg-bg-secondary text-accent-mint'
                )}
                onClick={() => handleSubsectionClick(item.path)}
              >
                <item.icon size={20} />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
