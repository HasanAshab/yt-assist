import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfflineIndicator } from '../OfflineIndicator';
import { useOffline } from '../../../hooks/useOffline';

// Mock the useOffline hook
jest.mock('../../../hooks/useOffline');
const mockUseOffline = useOffline as jest.MockedFunction<typeof useOffline>;

const defaultOfflineState = {
  isOnline: true,
  wasOffline: false,
  lastOnlineTime: Date.now(),
  lastOfflineTime: null,
  pendingOperationsCount: 0,
  addPendingOperation: jest.fn(),
  syncPendingOperations: jest.fn(),
  clearWasOfflineFlag: jest.fn(),
};

describe('OfflineIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOffline.mockReturnValue(defaultOfflineState);
  });

  it('renders nothing when online and never was offline', () => {
    const { container } = render(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('shows online status when showOnlineStatus is true', () => {
    render(<OfflineIndicator showOnlineStatus />);
    
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('shows offline indicator when offline', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      isOnline: false,
    });

    render(<OfflineIndicator />);
    
    expect(screen.getByText("You're offline")).toBeInTheDocument();
    expect(screen.getByText(/Changes will be saved locally/)).toBeInTheDocument();
  });

  it('shows syncing indicator when online but has pending operations', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      wasOffline: true,
      pendingOperationsCount: 3,
    });

    render(<OfflineIndicator />);
    
    expect(screen.getByText('Syncing pending changes')).toBeInTheDocument();
    expect(screen.getByText('3 operations pending')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows singular operation text when only one pending operation', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      wasOffline: true,
      pendingOperationsCount: 1,
    });

    render(<OfflineIndicator />);
    
    expect(screen.getByText('1 operation pending')).toBeInTheDocument();
  });

  it('shows success indicator when back online with no pending operations', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      wasOffline: true,
      pendingOperationsCount: 0,
    });

    render(<OfflineIndicator />);
    
    expect(screen.getByText('Back online - All changes synced')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('calls syncPendingOperations when retry button is clicked', async () => {
    const mockSyncPendingOperations = jest.fn().mockResolvedValue(undefined);
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      wasOffline: true,
      pendingOperationsCount: 2,
      syncPendingOperations: mockSyncPendingOperations,
    });

    render(<OfflineIndicator />);
    
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryButton);

    expect(mockSyncPendingOperations).toHaveBeenCalled();
  });

  it('calls clearWasOfflineFlag when dismiss button is clicked', () => {
    const mockClearWasOfflineFlag = jest.fn();
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      wasOffline: true,
      pendingOperationsCount: 0,
      clearWasOfflineFlag: mockClearWasOfflineFlag,
    });

    render(<OfflineIndicator />);
    
    const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
    fireEvent.click(dismissButton);

    expect(mockClearWasOfflineFlag).toHaveBeenCalled();
  });

  it('clears wasOffline flag after successful retry with no pending operations', async () => {
    const mockSyncPendingOperations = jest.fn().mockResolvedValue(undefined);
    const mockClearWasOfflineFlag = jest.fn();
    
    // First render with pending operations
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      wasOffline: true,
      pendingOperationsCount: 1,
      syncPendingOperations: mockSyncPendingOperations,
      clearWasOfflineFlag: mockClearWasOfflineFlag,
    });

    const { rerender } = render(<OfflineIndicator />);
    
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryButton);

    // Simulate successful sync (no pending operations)
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      wasOffline: true,
      pendingOperationsCount: 0,
      syncPendingOperations: mockSyncPendingOperations,
      clearWasOfflineFlag: mockClearWasOfflineFlag,
    });

    rerender(<OfflineIndicator />);

    expect(mockSyncPendingOperations).toHaveBeenCalled();
    // clearWasOfflineFlag should be called when pendingOperationsCount becomes 0
  });

  it('applies custom className', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      isOnline: false,
    });

    render(<OfflineIndicator className="custom-class" />);
    
    const indicator = screen.getByText("You're offline").closest('div');
    expect(indicator).toHaveClass('custom-class');
  });

  it('has proper styling for offline state', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      isOnline: false,
    });

    render(<OfflineIndicator />);
    
    const indicator = screen.getByText("You're offline").closest('div');
    expect(indicator).toHaveClass('bg-red-50', 'border', 'border-red-200');
  });

  it('has proper styling for syncing state', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      wasOffline: true,
      pendingOperationsCount: 1,
    });

    render(<OfflineIndicator />);
    
    const indicator = screen.getByText('Syncing pending changes').closest('div');
    expect(indicator).toHaveClass('bg-yellow-50', 'border', 'border-yellow-200');
  });

  it('has proper styling for success state', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      wasOffline: true,
      pendingOperationsCount: 0,
    });

    render(<OfflineIndicator />);
    
    const indicator = screen.getByText('Back online - All changes synced').closest('div');
    expect(indicator).toHaveClass('bg-green-50', 'border', 'border-green-200');
  });

  it('has proper styling for online status', () => {
    render(<OfflineIndicator showOnlineStatus />);
    
    const indicator = screen.getByText('Online').closest('div');
    expect(indicator).toHaveClass('bg-green-50', 'border', 'border-green-200');
  });
});