import PrayerAppAPI from './PrayerAppAPI';
import {PrayerStatus} from '../model/DailyTasks';

/**
 * API Service for task updates with error handling
 * Provides centralized API calls for prayer, Quran, and Zikr updates
 */
class ApiTaskServices {
  private static instance: ApiTaskServices;
  private api: PrayerAppAPI;

  private constructor() {
    this.api = PrayerAppAPI.getInstance();
  }

  static getInstance(): ApiTaskServices {
    if (!ApiTaskServices.instance) {
      ApiTaskServices.instance = new ApiTaskServices();
    }
    return ApiTaskServices.instance;
  }

  /**
   * Login user via API
   */
  async loginUser(
    username: string,
    password: string,
  ): Promise<{
    success: boolean;
    requiresOTP?: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      console.log('🔐 Attempting login...');

      const response = await this.api.login({
        username,
        password,
      });

      if (response.success) {
        console.log('✅ Login successful:', response.data?.user);

        return {success: true, requiresOTP: false, user: response.data?.user};
      } else {
        console.log('❌ Login failed:', response.error);
        return {success: false, error: response.error};
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return {success: false, error: 'Network error occurred'};
    }
  }

  /**
   * Update user profile via API
   */
  async updateUserProfile(profileData: Record<string, any>): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      console.log('🔄 API: Updating user profile with data:', profileData);

      const response = await this.api.updateUserProfile(profileData);

      if (response.success) {
        console.log(
          '✅ API: User profile updated successfully:',
          response.data,
        );

        return {success: true, user: response.data};
      } else {
        console.log('❌ API: Profile update failed:', response.error);
        return {success: false, error: response.error};
      }
    } catch (error) {
      console.error('❌ API: Error updating user profile:', error);
      return {
        success: false,
        error: 'Network error occurred while updating profile',
      };
    }
  }

  /**
   * Update prayer status via API
   */
  async updatePrayerStatus(
    date: string,
    prayerName: string,
    status: PrayerStatus,
  ): Promise<void> {
    try {
      console.log(`📡 API: Updating ${prayerName} to ${status} for ${date}`);

      // Convert internal status to API format
      const apiStatus = this.convertPrayerStatusToApi(status);
      const location = status === 'mosque' ? 'mosque' : 'home';

      const response = await this.api.updatePrayer({
        prayer_type:
          prayerName.charAt(0).toUpperCase() +
          prayerName.slice(1).toLowerCase(),
        prayer_date: date,
        status: apiStatus,
        location: location,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update prayer via API');
      }

      console.log(`✅ API: Prayer ${prayerName} updated successfully`);
    } catch (error) {
      console.error(`❌ API: Error updating prayer ${prayerName}:`, error);
      throw error;
    }
  }

  /**
   * Update Quran minutes via API
   * TODO: Replace this placeholder with actual API endpoint when available
   */
  async updateQuranMinutes(date: string, minutes: number): Promise<void> {
    try {
      console.log(`📡 API: Updating Quran to ${minutes} minutes for ${date}`);

      const response = await this.api.updateDailyActivity(
        date,
        'quran',
        minutes,
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to update Quran via API');
      }

      console.log('✅ API: Quran minutes updated successfully', response.data);
    } catch (error) {
      console.error('❌ API: Error updating Quran minutes:', error);
      throw error;
    }
  }

  /**
   * Update Zikr count via API
   */
  async updateZikrCount(date: string, count: number): Promise<void> {
    try {
      console.log(`📡 API: Updating Zikr to ${count} count for ${date}`);

      const response = await this.api.updateDailyActivity(date, 'zikr', count);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update Zikr via API');
      }

      console.log('✅ API: Zikr count updated successfully', response.data);
    } catch (error) {
      console.error('❌ API: Error updating Zikr count:', error);
      throw error;
    }
  }

  /**
   * Convert internal prayer status to API format
   */
  private convertPrayerStatusToApi(status: PrayerStatus): string {
    switch (status) {
      case 'mosque':
        return 'prayed';
      case 'home':
        return 'none';
      case 'none':
        return 'missed';
      default:
        return 'missed';
    }
  }

  /**
   * Batch update multiple tasks (for future use)
   */
  async batchUpdateTasks(
    updates: Array<{
      type: 'prayer' | 'quran' | 'zikr';
      date: string;
      data: any;
    }>,
  ): Promise<void> {
    try {
      console.log(`📡 API: Batch updating ${updates.length} tasks`);

      // Process updates in parallel for better performance
      const promises = updates.map(update => {
        switch (update.type) {
          case 'prayer':
            return this.updatePrayerStatus(
              update.date,
              update.data.prayerName,
              update.data.status,
            );
          case 'quran':
            return this.updateQuranMinutes(update.date, update.data.minutes);
          case 'zikr':
            return this.updateZikrCount(update.date, update.data.count);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      console.log('✅ API: Batch update completed successfully');
    } catch (error) {
      console.error('❌ API: Error in batch update:', error);
      throw error;
    }
  }
}

export default ApiTaskServices;
