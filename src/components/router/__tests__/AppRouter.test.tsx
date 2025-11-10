import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRouter } from '../AppRouter';
import { AppProvider } from '../../../contexts/AppContext';

import { vi } from 'vitest';

// Mock the lazy-loaded components
vi.mock('../../dashboard/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard-page">Dashboard Page</div>
}));

vi.mock('../../content/ContentList', () => ({
  ContentList: () => <div data-testid="content-page">Content Page</div>
}));

vi.mock('../../tasks/TaskManager', () => ({
  TaskManager: () => <div data-testid="tasks-page">Tasks Page</div>
}));

vi.mock('../../morals/MoralsList', () => ({
  MoralsList: () => <div data-testid="morals-page">Morals Page</div>
}));

vi.mock('../../suggestions/PublicationSuggestions', () => ({
  PublicationSuggestions: () => <div data-testid="suggestions-page">Suggestions Page</div>
}));

vi.mock('../../settings/DefaultFinalChecks', () => ({
  DefaultFinalChecks: () => <div data-testid="settings-page">Settings Page</div>
}));

const renderWithRouter = (initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </MemoryRouter>
  );
};

describe('AppRouter', () => {
  it('redirects root path to dashboard', async () => {
    renderWithRouter(['/']);
    
    expect(await screen.findByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('renders dashboard page for /dashboard route', async () => {
    renderWithRouter(['/dashboard']);
    
    expect(await screen.findByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('renders content page for /content route', async () => {
    renderWithRouter(['/content']);
    
    expect(await screen.findByTestId('content-page')).toBeInTheDocument();
  });

  it('renders content edit page for /content/:id/edit route', async () => {
    renderWithRouter(['/content/123/edit']);
    
    expect(await screen.findByText('Content Editor')).toBeInTheDocument();
  });

  it('renders tasks page for /tasks route', async () => {
    renderWithRouter(['/tasks']);
    
    expect(await screen.findByTestId('tasks-page')).toBeInTheDocument();
  });

  it('renders morals page for /morals route', async () => {
    renderWithRouter(['/morals']);
    
    expect(await screen.findByTestId('morals-page')).toBeInTheDocument();
  });

  it('renders suggestions page for /suggestions route', async () => {
    renderWithRouter(['/suggestions']);
    
    expect(await screen.findByTestId('suggestions-page')).toBeInTheDocument();
  });

  it('renders settings page for /settings route', async () => {
    renderWithRouter(['/settings']);
    
    expect(await screen.findByTestId('settings-page')).toBeInTheDocument();
  });

  it('redirects unknown routes to dashboard', async () => {
    renderWithRouter(['/unknown-route']);
    
    expect(await screen.findByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('shows loading spinner while components are loading', () => {
    renderWithRouter(['/dashboard']);
    
    // The loading spinner should be visible initially
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });
});