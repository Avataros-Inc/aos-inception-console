import { Bell, Search, User, Key, Play, LogOut } from 'lucide-react';
import { Button } from '@/Components/Button';
import { logout } from '../postgrestAPI';

export function Header() {
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
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

      <div className="flex items-center space-x-4">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
