import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  // Mobile: drawer open/close
  const [mobileOpen, setMobileOpen] = useState(false);
  // Desktop: sidebar collapsed (icons only)
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Track screen size
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar
        onMenuClick={() => setMobileOpen(!mobileOpen)}
        isCollapsed={isCollapsed}
        isMobile={isMobile}
      />

      <div className="flex relative">
        {/* Sidebar */}
        <Sidebar
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isMobile={isMobile}
        />

        {/* Mobile Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main Content */}
        <main
          className={`
            flex-1 min-h-screen 
            main-content-transition
            ${!isMobile ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-72') : 'ml-0'}
          `}
        >
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}