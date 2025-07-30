import { Platform, Alert, Linking } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  TriggerType,
  EventType,
  AuthorizationStatus,
  RepeatFrequency,
  NotificationSettings,
} from '@notifee/react-native';

class NotifeeIOSOptimizedPrayerCallService {
  private static instance: NotifeeIOSOptimizedPrayerCallService;
  private isInitialized = false;
  private permissionsGranted = false;
  private callKeepInitialized = false;

  private callKeepOptions = {
    ios: {
      appName: 'PrayerApp',
      imageName: 'CallKitIcon',
      ringtoneSound: 'ringtone.wav',
      maximumCallGroups: '1',
      maximumCallsPerCallGroup: '1',
      supportsVideo: false,
      includesCallsInRecents: true,
      handleType: 'generic',
      supportsHolding: false,
      supportsDTMF: false,
      supportsGrouping: false,
      supportsUngrouping: false,
    },
    android: {
      alertTitle: 'Permissions Required',
      alertDescription: 'This app needs phone account access to display prayer calls.',
      cancelButton: 'Cancel',
      okButton: 'OK',
      additionalPermissions: [],
      selfManaged: false,
    },
  };

  private channels = {
    prayerCall: {
      id: 'prayer-call-notifications',
      name: 'Prayer Call Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'ringtone',
      vibration: true,
      vibrationPattern: [300, 500, 300, 500, 300, 500],
      visibility: AndroidVisibility.PUBLIC,
    },
  };

  private scheduledNotifications: Map<string, string> = new Map();

  static getInstance(): NotifeeIOSOptimizedPrayerCallService {
    if (!NotifeeIOSOptimizedPrayerCallService.instance) {
      NotifeeIOSOptimizedPrayerCallService.instance = new NotifeeIOSOptimizedPrayerCallService();
    }
    return NotifeeIOSOptimizedPrayerCallService.instance;
  }

  private generateSimpleId(): string {
    return `prayer-call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserBasedId(userId: string): string {
    return `${userId}-prayer-call-${Date.now()}`;
  }

  private generateNotificationId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  private async initializeCallKeep(): Promise<void> {
    try {
      if (this.callKeepInitialized) {
        return;
      }

      console.log('🔄 Initializing CallKeep...');

      RNCallKeep.setup(this.callKeepOptions);

      if (Platform.OS === 'android') {
        const isSupported = await RNCallKeep.supportConnectionService();
        if (!isSupported) {
          console.warn('⚠️ Device does not support ConnectionService');
          return;
        }

        const hasPhoneAccount = await RNCallKeep.hasPhoneAccount();
        if (!hasPhoneAccount) {
          Alert.alert(
            'Phone Account Required',
            'Please enable phone account for this app in system settings to receive prayer call notifications.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          console.log('✅ Phone account is available');
          // No setActive() call needed
        }
      }

      this.callKeepInitialized = true;
      console.log('✅ CallKeep initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize CallKeep:', this.safeErrorMessage(error));
      throw error;
    }
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('📱 PrayerCallService already initialized');
      return;
    }

    try {
      console.log('🔄 Initializing prayer call service...');

      await this.initializeCallKeep();

      await this.requestNotifeePermissions();

      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      this.setupNotifeeBackgroundHandler();

      this.isInitialized = true;
      console.log('✅ Prayer call service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize prayer call service:', this.safeErrorMessage(error));
      throw error;
    }
  }

  private async requestNotifeePermissions(): Promise<void> {
    try {
      const settings: NotificationSettings = await notifee.requestPermission();

      this.permissionsGranted = settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;

      console.log('📱 Notifee permissions:', settings);

      if (!this.permissionsGranted) {
        Alert.alert(
          'Notification Permissions Required',
          'To receive prayer call reminders, please enable notifications in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error requesting notifee permissions:', this.safeErrorMessage(error));
    }
  }

  private async createNotificationChannels(): Promise<void> {
    await notifee.createChannel({
      id: this.channels.prayerCall.id,
      name: this.channels.prayerCall.name,
      importance: this.channels.prayerCall.importance,
      sound: this.channels.prayerCall.sound,
      vibration: this.channels.prayerCall.vibration,
      vibrationPattern: this.channels.prayerCall.vibrationPattern,
      visibility: this.channels.prayerCall.visibility,
    });
  }

  private setupNotifeeBackgroundHandler(): void {
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      console.log('📞 Background event received:', type, detail);

      const data = detail.notification?.data;
      if (data?.type === 'prayer-fake-call') {
        const callId = typeof data.callId === 'string' ? data.callId : String(data.callId);
        const prayerName = typeof data.prayerName === 'string' ? data.prayerName : 'Prayer Reminder';

        switch (type) {
          case EventType.PRESS:
          case EventType.ACTION_PRESS:
          case EventType.DELIVERED:
            this.displayCallKeepUI(callId, prayerName);
            break;
        }
      }
    });

    notifee.onForegroundEvent(({ type, detail }) => {
      console.log('📞 Foreground event received:', type, detail);

      const data = detail.notification?.data;
      if (data?.type === 'prayer-fake-call') {
        const callId = typeof data.callId === 'string' ? data.callId : String(data.callId);
        const prayerName = typeof data.prayerName === 'string' ? data.prayerName : 'Prayer Reminder';

        if (type === EventType.PRESS || type === EventType.DELIVERED) {
          this.displayCallKeepUI(callId, prayerName);
        }
      }
    });
  }

  private displayCallKeepUI(callId: string, prayerName: string): void {
    try {
      if (!this.callKeepInitialized) {
        console.warn('⚠️ CallKeep not initialized, initializing now...');
        this.initializeCallKeep().then(() => {
          this.showIncomingCall(callId, prayerName);
        });
        return;
      }

      this.showIncomingCall(callId, prayerName);
    } catch (error) {
      console.error('❌ Error displaying CallKeep UI:', this.safeErrorMessage(error));
    }
  }

  private showIncomingCall(callId: string, prayerName: string): void {
    console.log(`📞 Displaying CallKeep UI for ${prayerName} with callId: ${callId}`);

    RNCallKeep.displayIncomingCall(
      callId,
      prayerName || 'Prayer Reminder',
      prayerName || 'Prayer Reminder',
      'generic',
      false,
    );
  }

  private setupCallKeepListeners(): void {
    RNCallKeep.removeEventListener('answerCall');
    RNCallKeep.removeEventListener('endCall');

    RNCallKeep.addEventListener('answerCall', async ({ callUUID }) => {
      console.log('📞 User answered prayer call:', callUUID);

      try {
        // Your API call or logic here

        setTimeout(() => {
          RNCallKeep.endCall(callUUID);
        }, 1000);

        this.handleCallAnswered(callUUID);
      } catch (error) {
        console.error('❌ Error in answerCall:', this.safeErrorMessage(error));
      }
    });

    RNCallKeep.addEventListener('endCall', async ({ callUUID }) => {
      console.log('📞 Prayer call ended:', callUUID);

      try {
        // Your API call or logic here

        this.handleCallEnded(callUUID);
      } catch (error) {
        console.error('❌ Error in endCall:', this.safeErrorMessage(error));
      }
    });
  }

  private handleCallAnswered(callUUID: string): void {
    console.log('🙏 User acknowledged prayer call');
  }

  private handleCallEnded(callUUID: string): void {
    console.log('📱 Prayer call session ended');
  }

  // ... rest of your scheduling and other methods ...

  private safeErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error';
  }
}

export default NotifeeIOSOptimizedPrayerCallService;
