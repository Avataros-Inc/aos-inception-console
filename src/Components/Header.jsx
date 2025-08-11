import { Bell, Search, User, Key, Play } from 'lucide-react';
import { Button } from '@/Components/Button';
import { useAvatarSession } from '../contexts/AvatarSessionContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function Header() {
  const { activeSession } = useAvatarSession();
  const navigate = useNavigate();

  // Debug logging for session changes
  useEffect(() => {
    console.log('Header: activeSession changed:', activeSession?.avatar?.name || 'No active session');
  }, [activeSession]);

  const handleSessionClick = () => {
    if (activeSession) {
      navigate('/console/conversational-ai');
    }
  };

  return (
    <header className="bg-card/80 backdrop-blur-md h-16 flex items-center px-4 lg:px-6 fixed top-0 left-0 right-0 z-50 header-gradient">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <img src="/avataros-logo.png" alt="AVATAROS Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold text-white avataros-title">AVATAROS</h1>
        </div>
      </div>

      <div className="flex-1"></div>

      {/* Active Session Indicator - moved to right corner */}
      {activeSession && (
        <button
          onClick={handleSessionClick}
          className="flex items-center space-x-2 bg-accent-mint/20 border border-accent-mint/30 rounded-lg px-3 py-1 hover:bg-accent-mint/30 transition-colors cursor-pointer"
        >
          <div className="w-2 h-2 bg-accent-mint rounded-full animate-pulse"></div>
          <Play size={14} className="text-accent-mint" />
          <span className="text-accent-mint text-sm font-medium">{activeSession.avatar.name}</span>
        </button>
      )}

      {/* <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm">
          <Search size={18} />
        </Button>
        <Button variant="ghost" size="sm">
          <Bell size={18} />
        </Button>
        <Button variant="ghost" size="sm">
          <User size={18} />
        </Button>
      </div> */}
    </header>
  );
}
