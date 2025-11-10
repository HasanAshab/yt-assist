import React from 'react';
import { Navigation } from '../navigation/Navigation';
import { Breadcrumb } from '../navigation/Breadcrumb';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 md:flex overflow-x-hidden">
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 pb-24 sm:pb-6 md:pb-6 overflow-x-hidden">
          {/* Breadcrumb Navigation */}
          <div className="mb-4 sm:mb-6">
            <Breadcrumb />
          </div>
          
          {/* Page Content */}
          <div className="w-full max-w-7xl mx-auto overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};