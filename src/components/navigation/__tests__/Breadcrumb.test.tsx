import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumb, useBreadcrumb } from '../Breadcrumb';
import { AppProvider } from '../../../contexts/AppContext';

import { vi } from 'vitest';

// Mock the content hook
vi.mock('../../../hooks/useContent', () => ({
  useContent: () => ({
    contents: [
      { id: '1', topic: 'Test Content 1', title: 'Test Title 1' },
      { id: '2', topic: 'Test Content 2', title: 'Test Title 2' }
    ]
  })
}));

const renderWithRouter = (initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProvider>
        <Breadcrumb />
      </AppProvider>
    </MemoryRouter>
  );
};

describe('Breadcrumb', () => {
  it('does not render breadcrumbs for dashboard route', () => {
    renderWithRouter(['/dashboard']);
    
    // Should not render any breadcrumb navigation
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('does not render breadcrumbs for root route', () => {
    renderWithRouter(['/']);
    
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('renders breadcrumbs for content route', () => {
    renderWithRouter(['/content']);
    
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders breadcrumbs for content edit route', () => {
    renderWithRouter(['/content/1/edit']);
    
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Content' })).toBeInTheDocument();
    expect(screen.getByText('Edit: Test Content 1')).toBeInTheDocument();
  });

  it('renders breadcrumbs for tasks route', () => {
    renderWithRouter(['/tasks']);
    
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('renders breadcrumbs for morals route', () => {
    renderWithRouter(['/morals']);
    
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Morals')).toBeInTheDocument();
  });

  it('renders breadcrumbs for suggestions route', () => {
    renderWithRouter(['/suggestions']);
    
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Publication Suggestions')).toBeInTheDocument();
  });

  it('renders breadcrumbs for settings route', () => {
    renderWithRouter(['/settings']);
    
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('handles unknown routes gracefully', () => {
    renderWithRouter(['/unknown']);
    
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('renders correct links for navigation', () => {
    renderWithRouter(['/content']);
    
    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('shows active state for current page', () => {
    renderWithRouter(['/content']);
    
    const contentText = screen.getByText('Content');
    expect(contentText).toHaveClass('text-gray-900', 'font-medium');
  });

  it('handles content edit with unknown content ID', () => {
    renderWithRouter(['/content/unknown/edit']);
    
    expect(screen.getByText('Edit Content')).toBeInTheDocument();
  });

  describe('Breadcrumb Icons', () => {
    it('renders chevron icons between breadcrumb items', () => {
      renderWithRouter(['/content']);
      
      // Should have chevron icon (rendered as SVG) - look for the SVG element directly
      const chevronIcon = document.querySelector('svg');
      expect(chevronIcon).toBeInTheDocument();
      expect(chevronIcon).toHaveClass('w-4', 'h-4', 'text-gray-400');
    });
  });
});

// Test the useBreadcrumb hook
describe('useBreadcrumb hook', () => {
  const TestComponent: React.FC = () => {
    const { isContentEditPage, getContentIdFromPath, currentPath } = useBreadcrumb();
    
    return (
      <div>
        <div data-testid="is-content-edit">{isContentEditPage().toString()}</div>
        <div data-testid="content-id">{getContentIdFromPath() || 'null'}</div>
        <div data-testid="current-path">{currentPath}</div>
      </div>
    );
  };

  const renderHookWithRouter = (initialEntries: string[] = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <TestComponent />
      </MemoryRouter>
    );
  };

  it('detects content edit page correctly', () => {
    renderHookWithRouter(['/content/123/edit']);
    
    expect(screen.getByTestId('is-content-edit')).toHaveTextContent('true');
    expect(screen.getByTestId('content-id')).toHaveTextContent('123');
    expect(screen.getByTestId('current-path')).toHaveTextContent('/content/123/edit');
  });

  it('returns false for non-content-edit pages', () => {
    renderHookWithRouter(['/content']);
    
    expect(screen.getByTestId('is-content-edit')).toHaveTextContent('false');
    expect(screen.getByTestId('content-id')).toHaveTextContent('null');
  });

  it('handles dashboard route', () => {
    renderHookWithRouter(['/dashboard']);
    
    expect(screen.getByTestId('is-content-edit')).toHaveTextContent('false');
    expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
  });
});