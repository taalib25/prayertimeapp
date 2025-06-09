import AsyncStorage from '@react-native-async-storage/async-storage';
import {PrayerNotificationSettings} from '../utils/types';

class UserPreferencesService {
  private static instance: UserPreferencesService;

  private constructor() {}

  static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  private getPreferencesKey(uid: number): string {
    return `user_preferences_${uid}`;
  }

  private getDefaultSettings(): PrayerNotificationSettings {
    return {
      notifications: true,
      adhan_sound: 'adhan',
      calculation_method: 'ISNA',
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

  async getNotificationSettings(
    uid: number,
  ): Promise<PrayerNotificationSettings> {
    try {
      const allPrefs = await this.getAllPreferences(uid);
      return allPrefs.notifications || this.getDefaultSettings();
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

      console.log(`✅ Updated notification settings for user ${uid}`);
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

  async initializeDefaultSettings(uid: number): Promise<void> {
    try {
      const existing = await this.getAllPreferences(uid);
      if (!existing.notifications) {
        existing.notifications = this.getDefaultSettings();
        await AsyncStorage.setItem(
          this.getPreferencesKey(uid),
          JSON.stringify(existing),
        );
        console.log(
          `✅ Initialized default notification settings for user ${uid}`,
        );
      }
    } catch (error) {
      console.error('Error initializing default settings:', error);
    }
  }

  async clearUserPreferences(uid: number): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getPreferencesKey(uid));
      console.log(`🧹 Cleared preferences for user ${uid}`);
    } catch (error) {
      console.error('Error clearing user preferences:', error);
    }
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
