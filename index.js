/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import FakeCallScreen from './src/screens/FakeCallScreen';
import notifee, { EventType } from '@notifee/react-native';

// Handle background notification events
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  console.log('[BACKGROUND EVENT]', EventType[type], detail);

  // Handle notification press
  if (notification && type === EventType.PRESS && notification.data && notification.data.screen === 'FakeCallScreen') {
    console.log('[BACKGROUND EVENT] FakeCallScreen notification pressed.');
    await notifee.cancelNotification(notification.id);
  }

  // Handle action presses
  if (type === EventType.ACTION_PRESS && pressAction) {
    if (pressAction.id === 'answer-call' && notification) {
      console.log('[BACKGROUND ACTION] Accept call action pressed');
      await notifee.cancelNotification(notification.id);
    }

    if (pressAction.id === 'decline-call' && notification) {
      console.log('[BACKGROUND ACTION] Decline call action pressed');
      await notifee.cancelNotification(notification.id);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('FakeCallScreen', () => FakeCallScreen);
