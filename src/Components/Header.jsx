import { Bell, Search, User, Key } from 'lucide-react';
import { Button } from '@/Components/Button';

export function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-md h-16 flex items-center px-4 lg:px-6 fixed top-0 left-0 right-0 z-50 header-gradient">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <img src="/avataros-logo.png" alt="AVATAROS Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold text-white avataros-title">AVATAROS</h1>
        </div>
      </div>

      <div className="flex-1"></div>

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
