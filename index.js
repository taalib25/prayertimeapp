

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import FakeCallScreen from './src/screens/FakeCallScreen';
import notifee, { EventType } from '@notifee/react-native';


// 🔗 CHAIN HANDLER - The magic happens here automatically
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED && detail.notification.id === 'prayer-refresh-trigger') {
    console.log('🎯 Chain trigger activated - refreshing silently');
    await PrayerTimeService.handleRefresh();
  }
});

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('FakeCallScreen', () => FakeCallScreen);
