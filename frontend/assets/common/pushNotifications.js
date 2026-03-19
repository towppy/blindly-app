import Constants from 'expo-constants';
import axios from 'axios';
import { Platform } from 'react-native';
import baseURL from './baseurl';

export async function registerPushTokenForUser(userId, jwtToken) {
  if (!userId || !jwtToken) return null;
  if (Platform.OS === 'web') return null;

  const { executionEnvironment, appOwnership } = Constants;
  if (
    executionEnvironment === 'storeClient' ||
    appOwnership === 'expo'
  ) {
    console.log('Expo Go/Store client detected. Push token registration skipped.');
    return null;
  }

  let Notifications;
  try {
    Notifications = (await import('expo-notifications')).default;
  } catch (err) {
    console.log('expo-notifications import failed:', err);
    return null;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    status = newStatus;
  }
  if (status !== 'granted') return null;

  // Resolve EAS projectId
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;

  let tokenResponse;
  try {
    tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
  } catch (err) {
    console.log('Failed to get Expo push token:', err);
    return null;
  }

  const pushToken = tokenResponse?.data;
  if (!pushToken) return null;

  try {
    await axios.put(
      `${baseURL}notifications/user/${userId}/push-token`,
      { pushToken },
      { headers: { Authorization: `Bearer ${jwtToken}` } }
    );
    return pushToken;
  } catch (err) {
    console.log('Push token registration failed (non-fatal):', err?.response?.data || err?.message);
    return null;
  }
}

export async function removePushTokenForUser(userId, jwtToken) {
  if (!userId || !jwtToken) return null;
  try {
    await axios.delete(
      `${baseURL}notifications/user/${userId}/push-token`,
      { headers: { Authorization: `Bearer ${jwtToken}` } }
    );
    return true;
  } catch (err) {
    console.log('Push token removal failed (non-fatal):', err?.response?.data || err?.message);
    return null;
  }
}
