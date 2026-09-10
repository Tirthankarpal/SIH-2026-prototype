import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useDoctorStore } from '../store/doctorStore';

/**
 * useRealtimeQueue — keeps the doctor's queue in sync in real time.
 * 
 * Strategy:
 *  • If Supabase is configured → subscribe to PostgreSQL changes via Realtime channel
 *  • If using mock backend   → listen to the `storage` event for cross-tab sync +
 *                               the custom `mock_db_updated` event for same-tab sync
 */
export function useRealtimeQueue() {
  const fetchQueue = useDoctorStore((s) => s.fetchQueue);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchQueue();

    if (isSupabaseConfigured && supabase) {
      /* ═══ REAL SUPABASE REALTIME ═══ */
      const channel = supabase
        .channel('encounters-realtime')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'encounters',
          },
          (_payload) => {
            // Re-fetch the entire queue on any change
            // (simpler and safer than trying to patch state)
            fetchQueue();
          }
        )
        .subscribe();

      channelRef.current = channel;

      return () => {
        channel.unsubscribe();
      };
    } else {
      /* ═══ MOCK: CROSS-TAB via `storage` event ═══ */
      // The `storage` event fires in OTHER tabs when localStorage changes.
      // The `mock_db_updated` custom event fires in the SAME tab.
      
      const handleCrossTab = (e: StorageEvent) => {
        if (e.key === 'swasthyalipi_mock_db') {
          fetchQueue();
        }
      };

      const handleSameTab = () => {
        fetchQueue();
      };

      window.addEventListener('storage', handleCrossTab);
      window.addEventListener('mock_db_updated', handleSameTab);

      return () => {
        window.removeEventListener('storage', handleCrossTab);
        window.removeEventListener('mock_db_updated', handleSameTab);
      };
    }
  }, [fetchQueue]);
}
