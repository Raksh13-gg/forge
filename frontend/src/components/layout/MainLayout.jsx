import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function MainLayout() {
  return (
    <div className="flex h-screen w-full bg-void overflow-hidden font-body text-primary selection:bg-accent-glow/30">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative h-full min-w-0">
        {/* Mesh Gradient Background */}
        <div 
          className="absolute inset-0 pointer-events-none z-0 opacity-40 bg-mesh"
        />
        
        {/* Refined Dot Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-0 opacity-[0.15] dot-grid"
        />

        <TopBar />

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto z-10 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto w-full px-6 lg:px-12 py-10 lg:py-16">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
