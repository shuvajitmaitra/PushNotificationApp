import {useEffect, useState} from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';
import axios from 'axios';
import {Platform} from 'react-native';

const usePushNotifications = () => {
  const [error, setError] = useState('');
  const [isTokenSent, setIsTokenSent] = useState(false);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Request permission for notifications
        await requestNotificationPermission();

        // Get FCM token
        const token = await messaging().getToken();
        console.log('Device token:', token);

        if (!isTokenSent) {
          sendTokenToBackend(token);
          setIsTokenSent(true);
        }

        // Create notification channel for Android
        await createNotificationChannel();

        // Set up notification handlers
        messaging().onMessage(handleNotification); // Foreground notifications
        messaging().onNotificationOpenedApp(handleNotification); // Background notifications

        // Check if the app was opened from a notification (app killed state)
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
          handleNotification(initialNotification);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error during setup:', err);
      }
    };

    setupNotifications();

    return () => {
      console.log('Cleanup for notifications');
    };
  }, [isTokenSent]);

  const requestNotificationPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted!');
    } else {
      console.log('Notification permission denied');
    }
  };

  const createNotificationChannel = async () => {
    if (Platform.OS === 'android') {
      const channelId = 'default';
      const channelExists = await notifee.getChannels();

      if (!channelExists.find(channel => channel.id === channelId)) {
        await notifee.createChannel({
          id: channelId,
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });
      } else {
        console.log('Notification channel already exists.');
      }
    }
  };

  const handleNotification = async remoteMessage => {
    try {
      if (remoteMessage.notification) {
        await notifee.displayNotification({
          title: remoteMessage.notification.title || 'Default Title',
          body: remoteMessage.notification.body || 'Default Body',
          android: {
            channelId: 'default', // Android-specific
          },
          ios: {
            sound: 'default', // iOS-specific sound setting
            badge: 1, // Add a badge to the app icon
          },
        });
      }
    } catch (err) {
      console.error('Error displaying notification:', err);
    }
  };

  const sendTokenToBackend = async token => {
    try {
      const response = await axios.post('http://10.0.2.2:3000/save-token', {
        token,
      });
      console.log('Device token sent to backend successfully:', response);
    } catch (err) {
      console.error('Error sending token to backend:', err);
      setError('Network error while sending token');
    }
  };

  return {error, isTokenSent};
};

export default usePushNotifications;
