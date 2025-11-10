import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MetricsCard } from '../MetricsCard';

describe('MetricsCard', () => {
  const defaultProps = {
    title: 'Test Metric',
    value: 42,
    icon: <span data-testid="test-icon">📊</span>,
    color: 'blue' as const,
  };

  describe('Basic Rendering', () => {
    it('renders title and value correctly', () => {
      render(<MetricsCard {...defaultProps} />);

      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders icon correctly', () => {
      render(<MetricsCard {...defaultProps} />);

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<MetricsCard {...defaultProps} className="custom-class" />);

      const card = screen.getByText('Test Metric').closest('div');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Color Variants', () => {
    it('applies blue color classes correctly', () => {
      render(<MetricsCard {...defaultProps} color="blue" />);

      const card = screen.getByText('Test Metric').closest('div');
      expect(card).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');

      const iconContainer = screen.getByTestId('test-icon').closest('div');
      expect(iconContainer).toHaveClass('text-blue-600');
    });

    it('applies green color classes correctly', () => {
      render(<MetricsCard {...defaultProps} color="green" />);

      const card = screen.getByText('Test Metric').closest('div');
      expect(card).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');

      const iconContainer = screen.getByTestId('test-icon').closest('div');
      expect(iconContainer).toHaveClass('text-green-600');
    });

    it('applies yellow color classes correctly', () => {
      render(<MetricsCard {...defaultProps} color="yellow" />);

      const card = screen.getByText('Test Metric').closest('div');
      expect(card).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');

      const iconContainer = screen.getByTestId('test-icon').closest('div');
      expect(iconContainer).toHaveClass('text-yellow-600');
    });

    it('applies purple color classes correctly', () => {
      render(<MetricsCard {...defaultProps} color="purple" />);

      const card = screen.getByText('Test Metric').closest('div');
      expect(card).toHaveClass('bg-purple-50', 'border-purple-200', 'text-purple-800');

      const iconContainer = screen.getByTestId('test-icon').closest('div');
      expect(iconContainer).toHaveClass('text-purple-600');
    });
  });

  describe('Layout and Styling', () => {
    it('applies base styling classes', () => {
      render(<MetricsCard {...defaultProps} />);

      const card = screen.getByText('Test Metric').closest('div');
      expect(card).toHaveClass(
        'p-4',
        'rounded-lg',
        'border-2',
        'transition-all',
        'duration-200',
        'hover:shadow-md'
      );
    });

    it('has correct flex layout', () => {
      render(<MetricsCard {...defaultProps} />);

      const card = screen.getByText('Test Metric').closest('div');
      const flexContainer = card?.querySelector('.flex.items-center.justify-between');
      expect(flexContainer).toBeInTheDocument();
    });

    it('has correct text styling for title', () => {
      render(<MetricsCard {...defaultProps} />);

      const title = screen.getByText('Test Metric');
      expect(title).toHaveClass('text-sm', 'font-medium', 'opacity-80');
    });

    it('has correct text styling for value', () => {
      render(<MetricsCard {...defaultProps} />);

      const value = screen.getByText('42');
      expect(value).toHaveClass('text-2xl', 'font-bold', 'mt-1');
    });

    it('has correct icon styling', () => {
      render(<MetricsCard {...defaultProps} />);

      const iconContainer = screen.getByTestId('test-icon').closest('div');
      expect(iconContainer).toHaveClass('text-2xl');
    });
  });

  describe('Value Variations', () => {
    it('renders zero value correctly', () => {
      render(<MetricsCard {...defaultProps} value={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders large values correctly', () => {
      render(<MetricsCard {...defaultProps} value={9999} />);

      expect(screen.getByText('9999')).toBeInTheDocument();
    });

    it('renders negative values correctly', () => {
      render(<MetricsCard {...defaultProps} value={-5} />);

      expect(screen.getByText('-5')).toBeInTheDocument();
    });
  });

  describe('Title Variations', () => {
    it('renders long titles correctly', () => {
      const longTitle = 'This is a very long metric title that should wrap properly';
      render(<MetricsCard {...defaultProps} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('renders short titles correctly', () => {
      render(<MetricsCard {...defaultProps} title="Short" />);

      expect(screen.getByText('Short')).toBeInTheDocument();
    });

    it('renders titles with special characters', () => {
      const specialTitle = 'Metric & Count (%)';
      render(<MetricsCard {...defaultProps} title={specialTitle} />);

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });
  });

  describe('Icon Variations', () => {
    it('renders text icons correctly', () => {
      const textIcon = <span data-testid="text-icon">⏳</span>;
      render(<MetricsCard {...defaultProps} icon={textIcon} />);

      expect(screen.getByTestId('text-icon')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    it('renders SVG icons correctly', () => {
      const svgIcon = (
        <svg data-testid="svg-icon" width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
      render(<MetricsCard {...defaultProps} icon={svgIcon} />);

      expect(screen.getByTestId('svg-icon')).toBeInTheDocument();
    });

    it('renders complex icon components correctly', () => {
      const ComplexIcon = () => (
        <div data-testid="complex-icon" className="flex items-center">
          <span>📈</span>
          <span className="ml-1">+</span>
        </div>
      );
      render(<MetricsCard {...defaultProps} icon={<ComplexIcon />} />);

      expect(screen.getByTestId('complex-icon')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('maintains proper layout structure', () => {
      render(<MetricsCard {...defaultProps} />);

      const card = screen.getByText('Test Metric').closest('div');
      const contentContainer = card?.querySelector('.flex-1');
      expect(contentContainer).toBeInTheDocument();
    });

    it('has proper spacing between elements', () => {
      render(<MetricsCard {...defaultProps} />);

      const value = screen.getByText('42');
      expect(value).toHaveClass('mt-1');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<MetricsCard {...defaultProps} />);

      const title = screen.getByText('Test Metric');
      const value = screen.getByText('42');

      expect(title.tagName).toBe('P');
      expect(value.tagName).toBe('P');
    });

    it('maintains readable contrast with color variants', () => {
      const colors: Array<'blue' | 'green' | 'yellow' | 'purple'> = ['blue', 'green', 'yellow', 'purple'];
      
      colors.forEach(color => {
        const { unmount } = render(<MetricsCard {...defaultProps} color={color} />);
        
        const card = screen.getByText('Test Metric').closest('div');
        expect(card).toHaveClass(`text-${color}-800`);
        
        unmount();
      });
    });
  });

  describe('Hover Effects', () => {
    it('applies hover shadow effect', () => {
      render(<MetricsCard {...defaultProps} />);

      const card = screen.getByText('Test Metric').closest('div');
      expect(card).toHaveClass('hover:shadow-md');
    });

    it('applies transition effects', () => {
      render(<MetricsCard {...defaultProps} />);

      const card = screen.getByText('Test Metric').closest('div');
      expect(card).toHaveClass('transition-all', 'duration-200');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title gracefully', () => {
      render(<MetricsCard {...defaultProps} title="" />);

      const titleElement = screen.getByText('42').parentElement?.querySelector('p');
      expect(titleElement).toBeInTheDocument();
    });

    it('handles missing className prop', () => {
      const { title, value, icon, color } = defaultProps;
      render(<MetricsCard title={title} value={value} icon={icon} color={color} />);

      const card = screen.getByText('Test Metric').closest('div');
      expect(card).toBeInTheDocument();
    });

    it('handles very large numbers', () => {
      render(<MetricsCard {...defaultProps} value={999999999} />);

      expect(screen.getByText('999999999')).toBeInTheDocument();
    });
  });
});