import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ContentList } from '../ContentList';

// Simple integration test to verify components render without errors
describe('ContentList Integration', () => {
  // Mock the useContent hook with minimal data
  vi.mock('../../../hooks/useContent', () => ({
    useContent: () => ({
      contents: [],
      filters: {},
      loading: false,
      filteredContents: [],
      setFilters: vi.fn()
    })
  }));

  it('renders without crashing', () => {
    render(<ContentList />);
    
    // Should render the empty state
    expect(screen.getByText('No content yet')).toBeInTheDocument();
  });

  it('renders with search and filters enabled', () => {
    render(<ContentList showSearch={true} showFilters={true} />);
    
    // Should render search input placeholder
    expect(screen.getByPlaceholderText('Search by topic or title...')).toBeInTheDocument();
  });
});