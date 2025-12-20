import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DOORBELL_SOUND_URL = '/sounds/doorbell.mp3';

export function useNotificationSound(userId: string | undefined) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNotificationId = useRef<string | null>(null);

  useEffect(() => {
    // Preload the audio
    audioRef.current = new Audio(DOORBELL_SOUND_URL);
    audioRef.current.volume = 0.6;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new notifications
    const channel = supabase
      .channel('notification-sound')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as { id: string; type: string };
          
          // Avoid playing sound for duplicate notifications
          if (lastNotificationId.current === newNotification.id) return;
          lastNotificationId.current = newNotification.id;
          
          // Play doorbell sound for high-priority notifications
          if (
            newNotification.type === 'appraisal_interest' ||
            newNotification.type === 'viewing_request'
          ) {
            playDoorbellSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const playDoorbellSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.warn('Could not play notification sound:', error);
      });
    }
  };

  return { playDoorbellSound };
}
