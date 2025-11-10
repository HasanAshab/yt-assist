import React from 'react';
import { Navigation } from '../navigation/Navigation';
import { Breadcrumb } from '../navigation/Breadcrumb';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-0">
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {/* Breadcrumb Navigation */}
          <Breadcrumb />
          
          {/* Page Content */}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};