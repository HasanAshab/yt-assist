import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { Dashboard } from '../../components/dashboard/Dashboard';
import { ContentPage } from '../../pages/ContentPage';
import { TasksPage } from '../../pages/TasksPage';
import { MoralsList } from '../../components/morals/MoralsList';
import { PublicationSuggestions } from '../../components/suggestions/PublicationSuggestions';

// Placeholder Settings component
function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
      <p className="text-gray-600">Configure your application settings here.</p>
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
      <Route path={ROUTES.CONTENT} element={<ContentPage />} />
      <Route path={ROUTES.TASKS} element={<TasksPage />} />
      <Route path="/suggestions" element={<PublicationSuggestions />} />
      <Route path={ROUTES.MORALS} element={<MoralsList />} />
      <Route path={ROUTES.SETTINGS} element={<Settings />} />
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}