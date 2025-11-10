import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppLayout } from '../AppLayout';
import { AppProvider } from '../../../contexts/AppContext';

import { vi } from 'vitest';

// Mock the Navigation and Breadcrumb components
vi.mock('../../navigation/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation Component</div>
}));

vi.mock('../../navigation/Breadcrumb', () => ({
  Breadcrumb: () => <div data-testid="breadcrumb">Breadcrumb Component</div>
}));

// Mock the dashboard metrics hook
vi.mock('../../../hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({
    pendingCount: 0,
    inProgressCount: 0,
    remainingTasksCount: 0
  })
}));

const renderWithRouter = (children: React.ReactNode, initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProvider>
        <AppLayout>{children}</AppLayout>
      </AppProvider>
    </MemoryRouter>
  );
};

describe('AppLayout', () => {
  it('renders navigation component', () => {
    renderWithRouter(<div>Test Content</div>);
    
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  it('renders breadcrumb component', () => {
    renderWithRouter(<div>Test Content</div>);
    
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderWithRouter(<div data-testid="test-content">Test Content</div>);
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('has correct layout structure', () => {
    renderWithRouter(<div>Test Content</div>);
    
    // Check that main content area exists
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1', 'p-4', 'md:p-6', 'pb-20', 'md:pb-6');
  });

  it('applies responsive padding for mobile bottom navigation', () => {
    renderWithRouter(<div>Test Content</div>);
    
    const main = screen.getByRole('main');
    // Should have bottom padding for mobile navigation
    expect(main).toHaveClass('pb-20', 'md:pb-6');
  });

  it('contains max-width container for content', () => {
    renderWithRouter(<div data-testid="content">Content</div>);
    
    const contentContainer = screen.getByTestId('content').parentElement;
    expect(contentContainer).toHaveClass('max-w-7xl', 'mx-auto');
  });

  it('has proper flex layout structure', () => {
    const { container } = renderWithRouter(<div>Test Content</div>);
    
    // Root container should have flex layout
    const rootContainer = container.firstChild;
    expect(rootContainer).toHaveClass('min-h-screen', 'bg-gray-50', 'flex');
  });

  it('renders multiple children correctly', () => {
    renderWithRouter(
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </>
    );
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('handles empty children', () => {
    renderWithRouter(null);
    
    // Should still render navigation and breadcrumb
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
  });

  it('maintains layout with different content types', () => {
    renderWithRouter(
      <div className="custom-content">
        <h1>Custom Page</h1>
        <p>Custom content with different elements</p>
        <button>Custom Button</button>
      </div>
    );
    
    expect(screen.getByText('Custom Page')).toBeInTheDocument();
    expect(screen.getByText('Custom content with different elements')).toBeInTheDocument();
    expect(screen.getByText('Custom Button')).toBeInTheDocument();
    
    // Layout structure should remain intact
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
  });

  describe('Responsive Design', () => {
    it('applies correct responsive classes', () => {
      renderWithRouter(<div>Test Content</div>);
      
      const main = screen.getByRole('main');
      
      // Should have responsive padding
      expect(main).toHaveClass('p-4', 'md:p-6');
      
      // Should have responsive bottom padding for mobile nav
      expect(main).toHaveClass('pb-20', 'md:pb-6');
    });

    it('has responsive margin for desktop navigation', () => {
      const { container } = renderWithRouter(<div>Test Content</div>);
      
      const contentArea = container.querySelector('.flex-1');
      expect(contentArea).toHaveClass('md:ml-0');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      renderWithRouter(<div>Test Content</div>);
      
      // Should have main landmark
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains focus management structure', () => {
      renderWithRouter(
        <div>
          <button>Focusable Element</button>
          <input placeholder="Test input" />
        </div>
      );
      
      const button = screen.getByText('Focusable Element');
      const input = screen.getByPlaceholderText('Test input');
      
      expect(button).toBeVisible();
      expect(input).toBeVisible();
    });
  });
});