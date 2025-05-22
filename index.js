/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import FakeCallScreen from './src/screens/FakeCallScreen'; // Import FakeCallScreen
import notifee, { EventType } from '@notifee/react-native';

// Handle background notification events
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  console.log('[BACKGROUND EVENT]', EventType[type], detail);

  if (notification && type === EventType.PRESS && notification.data && notification.data.screen === 'FakeCallScreen') {
    console.log('[BACKGROUND EVENT] FakeCallScreen notification pressed.');
    // IMPORTANT: Deep linking or a global navigation service is typically needed here
    // to navigate to the FakeCallScreen when the app opens from a background press.
    // For now, this log confirms the event is caught.
    // You might set a flag in AsyncStorage that App.tsx reads on launch.
  }

  // Handle background actions (if you add them to notifications later)
  if (type === EventType.ACTION_PRESS && pressAction && pressAction.id === 'accept-call') {
    console.log('[BACKGROUND ACTION] Accept call action pressed');
    // Perform task... e.g., clear notification, navigate
    if (notification && notification.id) {
      await notifee.cancelNotification(notification.id); // Clear the notification
    }
  }

  if (type === EventType.ACTION_PRESS && pressAction && pressAction.id === 'decline-call') {
    console.log('[BACKGROUND ACTION] Decline call action pressed');
    if (notification && notification.id) {
      await notifee.cancelNotification(notification.id); // Clear the notification
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
// Register the FakeCallScreen component
AppRegistry.registerComponent('FakeCallScreen', () => FakeCallScreen);
