import PrayerAppAPI, {
  FeedItem,
  FeedsResponse,
  PickupRequest,
  PickupRequestResponse,
  WakeUpCallRequest,
  WakeUpCallResponse,
} from './PrayerAppAPI';
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
   */ private convertPrayerStatusToApi(status: PrayerStatus): string {
    switch (status) {
      case 'mosque':
        return 'prayed';
      case 'home':
        return 'none';
      case 'none':
        return 'missed';
      case null:
        return 'unset'; // Null represents unset status
      default:
        return 'unset';
    }
  }

  /**
   * Fetch feeds from API with fallback to mock data
   * Returns real API data if available, otherwise returns mock demo items
   */
  async fetchFeeds(): Promise<FeedItem[]> {
    try {
      console.log('📡 API: Fetching feeds from backend...');
      const response = await this.api.getFeeds();
      console.log('🔍 API Response structure:', {
        success: response.success,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
        sampleData: response.data,
      });

      if (response.success && response.data) {
        console.log('✅ API: Feeds fetched successfully from backend');

        // Handle the actual API response structure where feeds are at response.data (not response.data.data)
        const feedsArray = response.data.data || response.data; // Support both structures
        console.log(
          '🔍 Feeds array length:',
          Array.isArray(feedsArray) ? feedsArray.length : 'not an array',
        );

        const realFeeds = feedsArray.map((item: any) => {
          const cleanItem: FeedItem = {
            id: item.id,
            title: item.title,
            content: item.content,
            image_url: item.image_url,
            priority: item.priority,
            created_at: item.created_at,
            expires_at: item.expires_at,
            author_name: item.author_name,
            mosque_name: item.mosque_name,
          };
          return cleanItem;
        }); // Prepend 2 demo mock items as requested
        const mockFeeds: FeedItem[] = [
          {
            id: -2,
            title: 'Prayer Times & Daily Reminders',
            content:
              'Never miss a prayer with our automated reminders and accurate prayer time calculations based on your location.',
            image_url:
              'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&h=300&fit=crop&q=80', // Prayer beads and spiritual reflection
            priority: 'medium',
            created_at: new Date(
              Date.now() - 24 * 60 * 60 * 1000,
            ).toISOString(), // Yesterday
            expires_at: null,
            author_name: 'Prayer Admin',
            mosque_name: 'Demo Mosque',
          },
          {
            id: -3,
            title: 'Learn Five Daily Prayers',
            content:
              'Watch this tutorial on how to perform the five daily prayers correctly.',
            youtube_url: 'https://www.youtube.com/watch?v=rofORqYGFE4',
            priority: 'high',
            created_at: new Date(
              Date.now() - 12 * 60 * 60 * 1000,
            ).toISOString(), // 12 hours ago
            expires_at: null,
            author_name: 'Islamic Education',
            mosque_name: 'Community Center',
          },
        ];

        // Combine mock items with real feeds (mock items first)
        return [...mockFeeds, ...realFeeds];
      } else {
        console.log('⚠️ API: No feeds from backend, using mock data only');
        throw new Error('No real feeds available');
      }
    } catch (error) {
      console.error(
        '❌ API: Error fetching feeds, falling back to mock data:',
        error,
      ); // Return only mock demo items if API fails
      const mockFeeds: FeedItem[] = [
        {
          id: -4,
          title: 'Daily Duas for Muslims',
          content:
            'Collection of essential daily duas every Muslim should know.',
          youtube_url: 'https://www.youtube.com/watch?v=n5SJc4ROWZY',
          image_url: null,
          priority: 'medium',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          expires_at: null,
          author_name: 'Dua Collection',
          mosque_name: 'Islamic Center',
        },
        {
          id: -3,
          title: 'Understanding the Importance of Prayer',
          content:
            'Learn about the significance of prayer in Islam from this educational video. https://www.youtube.com/watch?v=RK1K2bCg4J8',
          youtube_url: 'https://www.youtube.com/watch?v=RK1K2bCg4J8',
          image_url: null,
          priority: 'high',
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          expires_at: null,
          author_name: 'Islamic Learning Channel',
          mosque_name: 'Global Islamic Center',
        },
        {
          id: -2,
          title: 'Prayer Times & Daily Reminders',
          content:
            'Never miss a prayer with our automated reminders and accurate prayer time calculations based on your location.',
          image_url:
            'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&h=300&fit=crop&q=80', // Prayer beads and spiritual reflection
          priority: 'medium',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
          expires_at: null,
          author_name: 'Prayer Admin',
          mosque_name: 'Demo Mosque',
        },
      ];

      return mockFeeds;
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
  /**
   * Submit pickup request via API
   */
  async submitPickupRequest(
    pickupLocation: string,
    availableDays: string[],
    contactNumber: string,
    specialInstructions?: string,
    prayers?: string[],
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('📡 API: Submitting pickup request...');

      const requestData = {
        pickup_location: pickupLocation,
        days: availableDays, // Changed from available_days to days
        contact_number: contactNumber,
        special_instructions: specialInstructions || '',
        prayers: prayers || ['fajr'], // Default to fajr if not provided
      };

      const response = await this.api.submitPickupRequest(requestData);

      if (response.success) {
        console.log(
          '✅ API: Pickup request submitted successfully:',
          response.data,
        );
        return {success: true, data: response.data};
      } else {
        console.log(
          '❌ API: Pickup request submission failed:',
          response.error,
        );
        return {success: false, error: response.error};
      }
    } catch (error) {
      console.error('❌ API: Error submitting pickup request:', error);
      return {success: false, error: 'Network error occurred'};
    }
  }

  /**
   * Get user's pickup requests via API
   */
  async getPickupRequests(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('📡 API: Fetching pickup requests...');

      const response = await this.api.getPickupRequests();
      if (response.success) {
        console.log('✅ API: Pickup requests fetched successfully');
        return {success: true, data: response.data};
      } else {
        console.log('❌ API: Failed to fetch pickup requests:', response.error);
        return {success: false, error: response.error};
      }
    } catch (error) {
      console.error('❌ API: Error fetching pickup requests:', error);
      return {success: false, error: 'Network error occurred'};
    }
  }

  // ========== WAKE-UP CALL METHODS ==========
  /**
   * Record wake-up call response via API
   */
  async recordWakeUpCallResponse(
    username: string,
    callResponse: 'accepted' | 'declined',
    callDate: string,
    callTime: string,
  ): Promise<{
    success: boolean;
    data?: WakeUpCallResponse;
    error?: string;
  }> {
    try {
      console.log('📞 API: Recording wake-up call response...', {
        username,
        response: callResponse,
        date: callDate,
        time: callTime,
      });

      const wakeUpCallData: WakeUpCallRequest = {
        username,
        call_response: callResponse,
        response_time: new Date().toISOString(),
        call_date: callDate,
        call_time: callTime,
      };

      const response = await this.api.recordWakeUpCallResponse(wakeUpCallData);

      if (response.success) {
        console.log('✅ API: Wake-up call response recorded successfully');
        return {success: true, data: response.data};
      } else {
        console.log(
          '❌ API: Failed to record wake-up call response:',
          response.error,
        );
        return {success: false, error: response.error};
      }
    } catch (error) {
      console.error('❌ API: Error recording wake-up call response:', error);
      return {success: false, error: 'Network error occurred'};
    }
  }

  async getCounsellingSessions(requestBody: {
    memberId: number;
    scheduledDate: string;
    scheduledTime: string;
    sessionType: string;
    priority: string;
    preSessionNotes: string;
  }): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      console.log('📡 API: Fetching counselling sessions...', requestBody);

      const response = await this.api.getCounsellingSessions(requestBody);

      if (response.success) {
        console.log('✅ API: Counselling sessions fetched successfully');
        return {success: true, data: response.data};
      } else {
        console.log(
          '❌ API: Failed to fetch counselling sessions:',
          response.error,
        );
        return {success: false, error: response.error};
      }
    } catch (error) {
      console.error('❌ API: Error fetching counselling sessions:', error);
      return {success: false, error: 'Network error occurred'};
    }
  }

  /**
   * Register new user via API
   */
  async registerUser(userData: {
    firstName: string;
    lastName: string;
    username: string;
    phoneNumber: string;
    area: string;
    email: string;
    password: string;
  }): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      console.log('📝 API: Registering new user:', {
        email: userData.email,
        username: userData.username,
        name: `${userData.firstName} ${userData.lastName}`,
      });

      // Use the real API endpoint
      const response = await this.api.createMember({
        fullName: `${userData.firstName} ${userData.lastName}`,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        phone: userData.phoneNumber,
        area: userData.area,
      });

      if (response.success) {
        console.log('✅ API: Member created successfully:', response.data);
        return {
          success: true,
          user: response.data,
        };
      } else {
        console.log('❌ API: Member creation failed:', response.error);
        return {
          success: false,
          error: response.error || 'Registration failed. Please try again.',
        };
      }
    } catch (error) {
      console.error('❌ API: Error registering user:', error);
      return {
        success: false,
        error: 'Network error occurred while registering',
      };
    }
  }
  /**
   * Get list of areas via API
   */
  async getAreas(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      console.log('📡 API: Fetching areas...');
      const response = await this.api.getAreas();
      if (response.success) {
        console.log('✅ API: Areas fetched successfully');
        return { success: true, data: response.data };
      } else {
        console.log('❌ API: Failed to fetch areas:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('❌ API: Error fetching areas:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }
  
}

export default ApiTaskServices;
