import AsyncStorage from '@react-native-async-storage/async-storage';
import {PrayerNotificationSettings} from '../utils/types';

class UserPreferencesService {
  private static instance: UserPreferencesService;

  static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  private getPreferencesKey(uid: number): string {
    return `user_${uid}_preferences`;
  }

  async getNotificationSettings(
    uid: number,
  ): Promise<PrayerNotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(this.getPreferencesKey(uid));
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...this.getDefaultSettings(),
          ...parsed.notifications,
        };
      }
      return this.getDefaultSettings();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return this.getDefaultSettings();
    }
  }

  async updateNotificationSettings(
    uid: number,
    settings: Partial<PrayerNotificationSettings>,
  ): Promise<void> {
    try {
      const current = await this.getNotificationSettings(uid);
      const updated = {...current, ...settings};

      const allPrefs = await this.getAllPreferences(uid);
      allPrefs.notifications = updated;

      await AsyncStorage.setItem(
        this.getPreferencesKey(uid),
        JSON.stringify(allPrefs),
      );

      // Trigger notification reschedule via UnifiedNotificationService
      const UnifiedNotificationService =
        require('./UnifiedNotificationService').default;
      const notificationService = UnifiedNotificationService.getInstance();
      const today = new Date().toISOString().split('T')[0];
      await notificationService.scheduleDailyPrayerNotifications(uid, today);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  private async getAllPreferences(uid: number): Promise<any> {
    try {
      const stored = await AsyncStorage.getItem(this.getPreferencesKey(uid));
      return stored
        ? JSON.parse(stored)
        : {notifications: this.getDefaultSettings()};
    } catch {
      return {notifications: this.getDefaultSettings()};
    }
  }

  private getDefaultSettings(): PrayerNotificationSettings {
    return {
      notifications: true,
      adhan_sound: 'default',
      calculation_method: 'MWL',
      reminder_minutes_before: 10,
      notification_types: {
        standard: true,
        fullscreen: false,
        sound: true,
        vibration: true,
      },
      prayer_specific: {
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true,
      },
      dnd_bypass: false,
    };
  }

  // Utility method to check if prayer notifications should be sent
  async shouldNotifyForPrayer(
    uid: number,
    prayerName: string,
  ): Promise<boolean> {
    const settings = await this.getNotificationSettings(uid);
    return (
      settings.notifications &&
      settings.prayer_specific[
        prayerName.toLowerCase() as keyof typeof settings.prayer_specific
      ]
    );
  }
}

export default UserPreferencesService;
