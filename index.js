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
    // The app will check for pending navigation when it launches
    await notifee.cancelNotification(notification.id);
  }

  // Handle action presses
  if (type === EventType.ACTION_PRESS && pressAction) {
    if (pressAction.id === 'answer-call' && notification) {
      console.log('[BACKGROUND ACTION] Accept call action pressed');
      await notifee.cancelNotification(notification.id);
      
      // Create a new notification that will launch the app with deep link info
      await notifee.displayNotification({
        title: 'Connecting call...',
        body: 'Opening prayer call screen',
        data: {
          screen: 'FakeCallScreen',
          launchReason: 'answer-call',
          timestamp: Date.now()
        },
        android: {
          channelId: 'fake-call-channel',
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          fullScreenAction: {
            id: 'default',
            launchActivity: 'com.prayer_app.FakeCallActivity',
          },
        }
      });
    }

    if (pressAction.id === 'decline-call' && notification) {
      console.log('[BACKGROUND ACTION] Decline call action pressed');
      await notifee.cancelNotification(notification.id);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('FakeCallScreen', () => FakeCallScreen);
