import { useEffect, useState } from 'react';

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('serviceWorker' in navigator && 'Notification' in window) {
      setIsSupported(true);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted' && 'serviceWorker' in navigator) {
        // Subscribe to push notifications
        const registration = await navigator.serviceWorker.ready;
        
        try {
          // This would require a VAPID public key and backend support
          // For now, we'll just track permission status
          console.log('Push notifications enabled');
        } catch (error) {
          console.log('Push subscription setup needed on backend');
        }
      }

      return result === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
    isGranted: permission === 'granted',
  };
}