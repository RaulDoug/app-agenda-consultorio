import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDb } from '../db/local-db.js';
import type { ConnectionState } from '../components/layout/TopBar.js';

export interface ConnectionStatusResult {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  connectionStatus: ConnectionState;
}

export function useConnectionStatus(isSyncing = false): ConnectionStatusResult {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitora reativamente a quantidade de mutações pendentes na outbox
  const pendingCount = useLiveQuery(
    async () => {
      try {
        return await localDb.sync_outbox.where('status').equals('PENDING').count();
      } catch {
        return 0;
      }
    },
    [],
    0
  );

  let connectionStatus: ConnectionState = 'ONLINE';
  if (!isOnline) {
    connectionStatus = 'OFFLINE';
  } else if (isSyncing) {
    connectionStatus = 'SYNCING';
  }

  return {
    isOnline,
    isSyncing,
    pendingCount,
    connectionStatus,
  };
}
