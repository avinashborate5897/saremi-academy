import { useState, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      alert('Push notifications are not supported in this browser.');
      return false;
    }

    try {
      triggerHaptic('medium');
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === 'granted') {
        triggerHaptic('success');
        // Register test class reminder
        sendLocalReminder(
          '🎵 Push Notifications Enabled!',
          'You will now receive instant reminders for your 1:1 live classes and guru feedback.'
        );
        return true;
      } else {
        triggerHaptic('warning');
        return false;
      }
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return false;
    }
  };

  const sendLocalReminder = async (title: string, body: string, url: string = '/app/classes') => {
    if (permission !== 'granted') return;

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        reg.showNotification(title, {
          body,
          icon: '/saremi-logo.png',
          badge: '/saremi-logo.png',
          vibrate: [200, 100, 200],
          tag: 'saremi-class-reminder',
          data: { url }
        } as any);
        return;
      }
    }

    // Fallback to standard Notification API
    new Notification(title, {
      body,
      icon: '/saremi-logo.png',
      data: { url }
    } as any);
  };

  return {
    isSupported,
    permission,
    isGranted: permission === 'granted',
    requestPermission,
    sendLocalReminder
  };
}
