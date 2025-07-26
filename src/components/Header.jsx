import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-bg-secondary/95 backdrop-blur-sm border-b border-border-subtle z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - could add breadcrumbs or search */}
        <div className="flex items-center gap-4">
          <div className="lg:hidden">{/* Space for mobile menu button */}</div>
          <h1 className="text-lg font-semibold text-text-primary hidden lg:block">Welcome to AvatarOS Console</h1>
        </div>

        {/* Right side - user actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            <Search size={18} />
          </Button>
          <Button variant="ghost" size="sm">
            <Bell size={18} />
          </Button>
          <Button variant="ghost" size="sm">
            <User size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
}
