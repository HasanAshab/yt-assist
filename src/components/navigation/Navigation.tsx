import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

// Simple icons using Unicode symbols for lightweight implementation
const DashboardIcon = () => <span className="text-lg">📊</span>;
const ContentIcon = () => <span className="text-lg">📝</span>;
const TasksIcon = () => <span className="text-lg">✅</span>;
const MoralsIcon = () => <span className="text-lg">💭</span>;
const SuggestionsIcon = () => <span className="text-lg">🎯</span>;
const SettingsIcon = () => <span className="text-lg">⚙️</span>;
const MenuIcon = () => <span className="text-lg">☰</span>;
const CloseIcon = () => <span className="text-lg">✕</span>;

export const Navigation: React.FC = () => {
  const location = useLocation();
  const metrics = useDashboardMetrics();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const navigationItems: NavigationItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />
    },
    {
      path: '/content',
      label: 'Content',
      icon: <ContentIcon />,
      badge: metrics.pendingCount + metrics.inProgressCount
    },
    {
      path: '/tasks',
      label: 'Tasks',
      icon: <TasksIcon />,
      badge: metrics.remainingTasksCount
    },
    {
      path: '/suggestions',
      label: 'Suggestions',
      icon: <SuggestionsIcon />
    },
    {
      path: '/morals',
      label: 'Morals',
      icon: <MoralsIcon />
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <SettingsIcon />
    }
  ];

  const isActiveRoute = (path: string): boolean => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const NavLink: React.FC<{ item: NavigationItem; isMobile?: boolean }> = ({ item, isMobile = false }) => (
    <Link
      to={item.path}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${isActiveRoute(item.path)
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }
        ${isMobile ? 'w-full justify-start' : ''}
      `}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      <span className={isMobile ? 'block' : 'hidden sm:block'}>{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className={`
          ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center
          ${isMobile ? 'block' : 'hidden sm:block'}
        `}>
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </Link>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-white border-r border-gray-200 w-64 flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <span className="text-xl font-bold text-gray-900">YTAssist</span>
          </Link>
        </div>
        
        <div className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <span className="text-lg font-bold text-gray-900">YTAssist</span>
          </Link>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-button p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" />
        )}

        {/* Mobile Menu */}
        <div className={`
          mobile-menu fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded text-gray-600 hover:text-gray-900"
            >
              <CloseIcon />
            </button>
          </div>
          
          <div className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <NavLink key={item.path} item={item} isMobile />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-40 safe-area-pb">
        <div className="flex justify-around">
          {navigationItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors relative min-w-0 touch-target
                ${isActiveRoute(item.path)
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <span className="relative text-xl">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span className="truncate max-w-[60px] text-[11px] leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};