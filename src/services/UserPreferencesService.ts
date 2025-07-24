import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettings {
  notifications: boolean;
  reminder_minutes_before: number;
  dnd_bypass: boolean;
  notification_types: {
    standard: boolean;
    fullscreen: boolean;
    sound: boolean;
    vibration: boolean;
  };
  prayer_specific: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
  adhan_sound: string;
}

class UserPreferencesService {
  private static instance: UserPreferencesService;
  private cache = new Map<string, any>();

  private constructor() {}

  static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  private getKey(uid: number, setting: string): string {
    return `notification_settings_${uid}_${setting}`;
  }

  async getNotificationSettings(
  ): Promise<NotificationSettings | null> {
    const cacheKey = `settings_${1234}}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const settingsData = await AsyncStorage.getItem(
        `notification_settings_${1001}`,
      );

      if (settingsData) {
        const settings = JSON.parse(settingsData);
        this.cache.set(cacheKey, settings);
        return settings;
      }

      // Return default settings if none found
      const defaultSettings = this.getDefaultSettings();
      await this.saveNotificationSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return this.getDefaultSettings();
    }
  }

  async saveNotificationSettings(
    settings: NotificationSettings,
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `notification_settings_1001`,
        JSON.stringify(settings),
      );
      this.cache.set(`settings_1001`, settings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  async initializeDefaultSettings(uid: number): Promise<void> {
    const existing = await this.getNotificationSettings();
    if (!existing) {
      await this.saveNotificationSettings(this.getDefaultSettings());
    }
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      notifications: true,
      reminder_minutes_before: 10,
      dnd_bypass: true,
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
      adhan_sound: 'adhan',
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default UserPreferencesService;
