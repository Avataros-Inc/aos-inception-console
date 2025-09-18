import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Header />
      <div className="flex mt-16">
        <Sidebar />
        <main className="flex-1 ml-0 lg:ml-64 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
