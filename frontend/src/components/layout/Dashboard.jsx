import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}