import { useState, useEffect, useCallback } from 'react';

export interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: number | null;
  lastOfflineTime: number | null;
}

export const useOffline = () => {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    wasOffline: false,
    lastOnlineTime: navigator.onLine ? Date.now() : null,
    lastOfflineTime: navigator.onLine ? null : Date.now(),
  });

  const [pendingOperations, setPendingOperations] = useState<Array<() => Promise<void>>>([]);

  const handleOnline = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnline: true,
      wasOffline: prev.wasOffline || !prev.isOnline,
      lastOnlineTime: Date.now(),
    }));
  }, []);

  const handleOffline = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnline: false,
      lastOfflineTime: Date.now(),
    }));
  }, []);

  const addPendingOperation = useCallback((operation: () => Promise<void>) => {
    setPendingOperations(prev => [...prev, operation]);
  }, []);

  const syncPendingOperations = useCallback(async () => {
    if (!state.isOnline || pendingOperations.length === 0) {
      return;
    }

    const operations = [...pendingOperations];
    setPendingOperations([]);

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('Failed to sync pending operation:', error);
        // Re-add failed operation to pending list
        setPendingOperations(prev => [...prev, operation]);
      }
    }
  }, [state.isOnline, pendingOperations]);

  const clearWasOfflineFlag = useCallback(() => {
    setState(prev => ({
      ...prev,
      wasOffline: false,
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (state.isOnline && state.wasOffline) {
      syncPendingOperations();
    }
  }, [state.isOnline, state.wasOffline, syncPendingOperations]);

  return {
    ...state,
    pendingOperationsCount: pendingOperations.length,
    addPendingOperation,
    syncPendingOperations,
    clearWasOfflineFlag,
  };
};