/**
 * Root component: wraps the app with Auth context, Redux (cart), and navigation.
 * - Auth: login state and JWT live in Context (see Context/Store/Auth.js).
 * - Redux: cart state (see Redux/store.js).
 * - DrawerNavigator contains the main bottom tabs (Home, Cart, Admin, User).
 */
import { StyleSheet, Platform } from 'react-native';
import React, { useContext, useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
// Navigation ref for global navigation (for notification taps)
export const navigationRef = createNavigationContainerRef();
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider, useDispatch } from 'react-redux';
import store from './Redux/store';
import Toast from 'react-native-toast-message';
import Auth from './Context/Store/Auth';
import DrawerNavigator from './Navigators/DrawerNavigator';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getJwt } from './assets/common/jwtStore';
import baseURL from './assets/common/baseurl';
import AuthGlobal from './Context/Store/AuthGlobal';
import { loadCartFromDB } from './Redux/Actions/cartActions';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { setActiveDB, CART_SCHEMA } from './Redux/cartDatabase';

async function migrateDatabase(db) {
  await db.execAsync(CART_SCHEMA);
  console.log('[CartDB] Schema ready via SQLiteProvider');
}

import Constants from 'expo-constants';

const IS_EXPO_GO =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

// Only set the notification handler in real builds — Expo Go removed remote push in SDK 53
if (!IS_EXPO_GO) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Component to load cart from SQLite for the current user (must be inside Redux Provider + SQLiteProvider)
import { useContext as useReactContext } from 'react';
function CartLoader({ children }) {
  const db = useSQLiteContext();
  const dispatch = useDispatch();
  const authContext = useReactContext(AuthGlobal);
  const userEmail = authContext?.stateUser?.user?.email;

  useEffect(() => {
    setActiveDB(db);
    dispatch(loadCartFromDB(userEmail));
  }, [db, dispatch, userEmail]);

  return children;
}

// Inner component that can access Auth context (it's INSIDE the <Auth> provider)

import { useNavigation } from '@react-navigation/native';
function AppInner() {
  const context = useContext(AuthGlobal);

  useEffect(() => {
    if (IS_EXPO_GO || Platform.OS !== 'android') return;
    Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (IS_EXPO_GO) return;
    // Persist every incoming notification so NotificationCenter can show them
    // even after they are dismissed from the system tray.
    const sub = Notifications.addNotificationReceivedListener(async (notification) => {
      try {
        const item = {
          id: notification.request.identifier,
          title: notification.request.content.title || "Notification",
          body: notification.request.content.body || "",
          date: new Date().toISOString(),
          orderId: notification.request.content.data?.orderId || null,
          type: notification.request.content.data?.type || null,
          reviewReason: notification.request.content.data?.reason || null,
          promoTitle: notification.request.content.data?.title || null,
          promoBody: notification.request.content.data?.body || null,
          promoDetails: notification.request.content.data?.details || null,
        };
        const existing = await AsyncStorage.getItem("notificationHistory");
        const arr = existing ? JSON.parse(existing) : [];
        const updated = [item, ...arr.filter((n) => n.id !== item.id)].slice(0, 100);
        await AsyncStorage.setItem("notificationHistory", JSON.stringify(updated));
      } catch (_) {}
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const registerPushToken = async () => {
      try {
        console.log('[Push] === Starting push token registration ===');

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        console.log('[Push] Current permission status:', existingStatus);
        if (finalStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('[Push] PERMISSION DENIED:', finalStatus);
          return;
        }
        console.log('[Push] Permission granted!');

        // Try FCM device token first (works on real APK builds)
        // Fall back to Expo Push Token (works on Expo Go)
        let pushToken = null;
        let tokenType = 'unknown';

        try {
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          pushToken = deviceToken?.data;
          tokenType = 'fcm';
          console.log('[Push] Got FCM device token:', pushToken ? pushToken.substring(0, 40) + '...' : 'null');
        } catch (fcmError) {
          console.log('[Push] FCM token failed:', fcmError.message);
          console.log('[Push] Trying Expo Push Token...');
          try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId
              || Constants.manifest?.extra?.eas?.projectId
              || '6f747b51-b33e-4c6e-9d11-89bf760ec81a';
            console.log('[Push] Using projectId:', projectId);
            const expoToken = await Notifications.getExpoPushTokenAsync({ projectId });
            pushToken = expoToken?.data;
            tokenType = 'expo';
            console.log('[Push] Got Expo push token:', pushToken ? pushToken.substring(0, 40) + '...' : 'null');
          } catch (expoError) {
            console.log('[Push] Expo token also failed:', expoError.message);
            return;
          }
        }

        if (!pushToken) {
          console.log('[Push] ERROR: No push token received');
          return;
        }

        // Always clear old cached token to force re-registration
        await AsyncStorage.removeItem('pushToken');

        const jwt = await getJwt();
        if (!jwt) {
          console.log('[Push] No JWT found, skipping backend registration');
          return;
        }

        console.log(`[Push] Sending ${tokenType} token to backend...`);
        const response = await fetch(`${baseURL}users/push-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ token: pushToken, type: tokenType }),
        });

        const responseText = await response.text();
        console.log(`[Push] Backend response (${response.status}):`, responseText);

        if (response.ok) {
          console.log('[Push] === Token registered successfully! ===');
          await AsyncStorage.setItem('pushToken', pushToken);
        } else {
          console.log('[Push] FAILED to register token');
        }
      } catch (error) {
        console.error('[Push] Registration error:', error.message, error.stack);
      }
    };

    if (context?.stateUser?.isAuthenticated) {
      console.log('[Push] User is authenticated, registering...');
      if (!IS_EXPO_GO) registerPushToken();
    }
  }, [context?.stateUser?.isAuthenticated]);

  // Notification tap handler: navigate to Order Detail if orderId is present, else MyOrders
  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.orderId && navigationRef.isReady()) {
        navigationRef.navigate('Order Detail', { orderId: data.orderId });
      } else if (data?.screen === "MyOrders" && navigationRef.isReady()) {
        navigationRef.navigate('MyOrders');
      }
    });
    return () => responseListener.remove();
  }, []);

  return (
    <Provider store={store}>
      <SQLiteProvider databaseName="blindly_cart.db" onInit={migrateDatabase}>
        <CartLoader>
        <NavigationContainer ref={navigationRef}>
          <PaperProvider>
            <DrawerNavigator />
          </PaperProvider>
        </NavigationContainer>
        <Toast />
        </CartLoader>
      </SQLiteProvider>
    </Provider>
  );
}

// Outer component provides Auth context - AppInner can consume it
export default function App() {
  return (
    <Auth>
      <AppInner />
    </Auth>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
