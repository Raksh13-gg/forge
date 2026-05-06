import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function MainLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full bg-void overflow-hidden font-body text-primary selection:bg-accent-glow/30">
      <Sidebar isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-void/80 backdrop-blur-sm z-[45] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col relative h-full min-w-0">
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40 bg-mesh" />
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.15] dot-grid" />

        <TopBar onToggleMobile={() => setIsMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto z-10 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto w-full px-6 lg:px-12 py-10 lg:py-16">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
