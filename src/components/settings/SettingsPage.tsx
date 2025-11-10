import React from 'react';
import DefaultFinalChecks from './DefaultFinalChecks';

interface SettingsPageProps {
  className?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ className = '' }) => {
  return (
    <div className={`max-w-4xl mx-auto p-4 ${className}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your application preferences and defaults.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DefaultFinalChecks />
      </div>
    </div>
  );
};

export default SettingsPage;