import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  SkeletonLoader, 
  SkeletonCard, 
  SkeletonList, 
  SkeletonTable 
} from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders with default props', () => {
    const { container } = render(<SkeletonLoader />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200', 'w-full', 'h-4', 'rounded');
  });

  it('applies custom width and height', () => {
    const { container } = render(
      <SkeletonLoader width="w-1/2" height="h-8" />
    );
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('w-1/2', 'h-8');
  });

  it('applies rounded styling when rounded prop is true', () => {
    const { container } = render(<SkeletonLoader rounded />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('rounded-full');
    expect(skeleton).not.toHaveClass('rounded');
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonLoader className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('custom-class');
  });
});

describe('SkeletonCard', () => {
  it('renders card without image by default', () => {
    const { container } = render(<SkeletonCard />);
    
    expect(container.querySelector('.bg-white.rounded-lg.shadow-md')).toBeInTheDocument();
    // Should have 3 lines by default
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(6); // title + 3 lines + 2 button area elements
  });

  it('renders card with image when showImage is true', () => {
    const { container } = render(<SkeletonCard showImage />);
    
    // Should have additional skeleton for image
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(7); // image + title + 3 lines + 2 button area elements
  });

  it('renders custom number of lines', () => {
    const { container } = render(<SkeletonCard lines={5} />);
    
    // title + 5 lines + 2 button area elements = 8 skeletons
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(8);
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonCard className="custom-card" />);
    
    expect(container.firstChild).toHaveClass('custom-card');
  });

  it('renders button area with two skeleton elements', () => {
    const { container } = render(<SkeletonCard />);
    
    // Check for button area structure
    const buttonArea = container.querySelector('.flex.justify-between.items-center.mt-4');
    expect(buttonArea).toBeInTheDocument();
    expect(buttonArea?.querySelectorAll('.animate-pulse')).toHaveLength(2);
  });
});

describe('SkeletonList', () => {
  it('renders default number of items', () => {
    const { container } = render(<SkeletonList />);
    
    // Should render 3 cards by default
    expect(container.querySelectorAll('.bg-white.rounded-lg.shadow-md')).toHaveLength(3);
  });

  it('renders custom number of items', () => {
    const { container } = render(<SkeletonList items={5} />);
    
    expect(container.querySelectorAll('.bg-white.rounded-lg.shadow-md')).toHaveLength(5);
  });

  it('passes showImage prop to cards', () => {
    const { container } = render(<SkeletonList items={2} showImage />);
    
    // Each card should have an image skeleton (6 total skeletons per card)
    const cards = container.querySelectorAll('.bg-white.rounded-lg.shadow-md');
    expect(cards).toHaveLength(2);
    
    cards.forEach(card => {
      expect(card.querySelectorAll('.animate-pulse')).toHaveLength(6); // image + title + 2 lines + 2 button area elements
    });
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonList className="custom-list" />);
    
    expect(container.firstChild).toHaveClass('custom-list');
  });

  it('applies space-y-4 for spacing', () => {
    const { container } = render(<SkeletonList />);
    
    expect(container.firstChild).toHaveClass('space-y-4');
  });
});

describe('SkeletonTable', () => {
  it('renders with default rows and columns', () => {
    const { container } = render(<SkeletonTable />);
    
    // Should have header + 5 rows by default
    const rows = container.querySelectorAll('.px-6.py-4, .px-6.py-3');
    expect(rows).toHaveLength(6); // 1 header + 5 data rows
    
    // Each row should have 4 columns by default
    rows.forEach(row => {
      expect(row.querySelectorAll('.animate-pulse')).toHaveLength(4);
    });
  });

  it('renders custom number of rows and columns', () => {
    const { container } = render(<SkeletonTable rows={3} columns={6} />);
    
    // Should have header + 3 rows
    const rows = container.querySelectorAll('.px-6.py-4, .px-6.py-3');
    expect(rows).toHaveLength(4); // 1 header + 3 data rows
    
    // Each row should have 6 columns
    rows.forEach(row => {
      expect(row.querySelectorAll('.animate-pulse')).toHaveLength(6);
    });
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonTable className="custom-table" />);
    
    expect(container.firstChild).toHaveClass('custom-table');
  });

  it('has proper table structure', () => {
    const { container } = render(<SkeletonTable />);
    
    // Should have white background and shadow
    expect(container.firstChild).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'overflow-hidden');
    
    // Should have header with gray background
    const header = container.querySelector('.bg-gray-50.px-6.py-3.border-b');
    expect(header).toBeInTheDocument();
    
    // Should have divider between rows
    const rowContainer = container.querySelector('.divide-y.divide-gray-200');
    expect(rowContainer).toBeInTheDocument();
  });

  it('uses flex layout for columns', () => {
    const { container } = render(<SkeletonTable />);
    
    const flexContainers = container.querySelectorAll('.flex.space-x-4');
    expect(flexContainers.length).toBeGreaterThan(0);
    
    // Each skeleton in a row should have flex-1 class
    flexContainers.forEach(flexContainer => {
      const skeletons = flexContainer.querySelectorAll('.flex-1');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});