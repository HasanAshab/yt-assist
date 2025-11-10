import { renderHook, act } from '@testing-library/react';
import { useOffline } from '../useOffline';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: mockAddEventListener,
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: mockRemoveEventListener,
});

describe('useOffline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigator.onLine = true;
  });

  it('initializes with online state when navigator.onLine is true', () => {
    const { result } = renderHook(() => useOffline());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
    expect(result.current.lastOnlineTime).toBeGreaterThan(0);
    expect(result.current.lastOfflineTime).toBeNull();
  });

  it('initializes with offline state when navigator.onLine is false', () => {
    navigator.onLine = false;
    
    const { result } = renderHook(() => useOffline());

    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(false);
    expect(result.current.lastOnlineTime).toBeNull();
    expect(result.current.lastOfflineTime).toBeGreaterThan(0);
  });

  it('sets up event listeners on mount', () => {
    renderHook(() => useOffline());

    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('removes event listeners on unmount', () => {
    const { unmount } = renderHook(() => useOffline());

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('updates state when going offline', () => {
    const { result } = renderHook(() => useOffline());

    // Simulate going offline
    act(() => {
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];
      offlineHandler?.();
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.lastOfflineTime).toBeGreaterThan(0);
  });

  it('updates state when going online', () => {
    navigator.onLine = false;
    const { result } = renderHook(() => useOffline());

    // Simulate going online
    act(() => {
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      onlineHandler?.();
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
    expect(result.current.lastOnlineTime).toBeGreaterThan(0);
  });

  it('adds pending operations', () => {
    const { result } = renderHook(() => useOffline());

    const mockOperation = jest.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.addPendingOperation(mockOperation);
    });

    expect(result.current.pendingOperationsCount).toBe(1);
  });

  it('syncs pending operations when online', async () => {
    const { result } = renderHook(() => useOffline());

    const mockOperation1 = jest.fn().mockResolvedValue(undefined);
    const mockOperation2 = jest.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.addPendingOperation(mockOperation1);
      result.current.addPendingOperation(mockOperation2);
    });

    expect(result.current.pendingOperationsCount).toBe(2);

    await act(async () => {
      await result.current.syncPendingOperations();
    });

    expect(mockOperation1).toHaveBeenCalled();
    expect(mockOperation2).toHaveBeenCalled();
    expect(result.current.pendingOperationsCount).toBe(0);
  });

  it('does not sync when offline', async () => {
    navigator.onLine = false;
    const { result } = renderHook(() => useOffline());

    const mockOperation = jest.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.addPendingOperation(mockOperation);
    });

    await act(async () => {
      await result.current.syncPendingOperations();
    });

    expect(mockOperation).not.toHaveBeenCalled();
    expect(result.current.pendingOperationsCount).toBe(1);
  });

  it('handles failed operations during sync', async () => {
    const { result } = renderHook(() => useOffline());

    const mockSuccessOperation = jest.fn().mockResolvedValue(undefined);
    const mockFailedOperation = jest.fn().mockRejectedValue(new Error('Sync failed'));

    act(() => {
      result.current.addPendingOperation(mockSuccessOperation);
      result.current.addPendingOperation(mockFailedOperation);
    });

    await act(async () => {
      await result.current.syncPendingOperations();
    });

    expect(mockSuccessOperation).toHaveBeenCalled();
    expect(mockFailedOperation).toHaveBeenCalled();
    
    // Failed operation should be re-added to pending list
    expect(result.current.pendingOperationsCount).toBe(1);
  });

  it('clears wasOffline flag', () => {
    navigator.onLine = false;
    const { result } = renderHook(() => useOffline());

    // Go online to set wasOffline flag
    act(() => {
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      onlineHandler?.();
    });

    expect(result.current.wasOffline).toBe(true);

    act(() => {
      result.current.clearWasOfflineFlag();
    });

    expect(result.current.wasOffline).toBe(false);
  });

  it('auto-syncs when coming back online after being offline', async () => {
    navigator.onLine = false;
    const { result } = renderHook(() => useOffline());

    const mockOperation = jest.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.addPendingOperation(mockOperation);
    });

    // Go online - should trigger auto-sync
    await act(async () => {
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      onlineHandler?.();
    });

    // Wait for auto-sync to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockOperation).toHaveBeenCalled();
    expect(result.current.pendingOperationsCount).toBe(0);
  });

  it('does not auto-sync when online but never was offline', async () => {
    const { result } = renderHook(() => useOffline());

    const mockOperation = jest.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.addPendingOperation(mockOperation);
    });

    // Trigger online event without ever being offline
    await act(async () => {
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      onlineHandler?.();
    });

    // Should not auto-sync because wasOffline is false
    expect(result.current.pendingOperationsCount).toBe(1);
  });
});