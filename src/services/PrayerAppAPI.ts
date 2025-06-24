import ApiService, {ApiResponse} from './api/ApiService';
import UserService from './UserService';

// Type definitions for API requests/responses
export interface LoginRequest {
  username: string;
  password: string;
  otpCode?: string; // OTP code for verification step
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    phoneNumber: string;
    isVerified: boolean;
    name: string;
  };
  requiresPhoneVerification?: boolean;
  token?: string;
}

export interface SendOTPRequest {
  phoneNumber: string;
}

export interface VerifyOTPRequest {
  phoneNumber: string;
  otp: string;
}

export interface VerifyOTPResponse {
  token: string;
  user: {
    id: string;
    email: string;
    phoneNumber: string;
    isVerified: boolean;
    name: string;
    createdAt: string;
  };
}

export interface PrayerTimesResponse {
  date: string;
  fajr: string;
  sunrise?: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface UserProfile {
  id: string;
  email: string;
  phoneNumber: string;
  isVerified: boolean;
  name: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  phone?: string;
  address?: string;
  mobility?: string;
  dateOfBirth?: string;
  mosqueName?: string;
  onRent?: boolean;
  zakathEligible?: boolean;
  differentlyAbled?: boolean;
  MuallafathilQuloob?: boolean;
  // Legacy fields for backward compatibility
  name?: string;
  phoneNumber?: string;
}

export interface UpdatePrayerRequest {
  prayer_type: string;
  prayer_date: string;
  status: string;
  location?: string;
  notes?: string;
}

export interface PrayerRecord {
  id: string;
  prayer_type: string;
  prayer_date: string;
  status: string;
  location?: string;
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedItem {
  id: number;
  title: string;
  content: string;
  image_url?: string | null; // Can be local path or HTTP URL
  priority: string;
  created_at: string;
  expires_at?: string | null;
  author_name: string;
  mosque_name: string;
}

export interface FeedsResponse {
  data: FeedItem[];
}

/**
 * Prayer App API Endpoints
 * Uses the ApiService for consistent HTTP requests
 */
class PrayerAppAPI {
  private static instance: PrayerAppAPI;
  private apiService: ApiService;
  private userService: UserService;

  private constructor() {
    this.apiService = ApiService.getInstance();
    this.userService = UserService.getInstance();
  }

  static getInstance(): PrayerAppAPI {
    if (!PrayerAppAPI.instance) {
      PrayerAppAPI.instance = new PrayerAppAPI();
    }
    return PrayerAppAPI.instance;
  }

  // ========== AUTHENTICATION ENDPOINTS ==========

  /**
   * User Login
   */
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.apiService.post<LoginResponse>('/login', data);
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(
    data: SendOTPRequest,
  ): Promise<ApiResponse<{expiresIn: number}>> {
    return this.apiService.post('/auth/send-otp', data);
  }

  /**
   * Verify OTP and complete authentication
   */
  async verifyOTP(
    data: VerifyOTPRequest,
  ): Promise<ApiResponse<VerifyOTPResponse>> {
    return this.apiService.post<VerifyOTPResponse>('/auth/verify-otp', data);
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<{message: string}>> {
    return this.apiService.post('/auth/logout');
  }

  // ========== PRAYER TIMES ENDPOINTS ==========

  /**
   * Get prayer times for a specific date
   */
  async getPrayerTimes(
    date: string,
  ): Promise<ApiResponse<PrayerTimesResponse>> {
    return this.apiService.get<PrayerTimesResponse>(`/prayer-times/${date}`);
  }

  /**
   * Get prayer times for a date range
   */
  async getPrayerTimesRange(
    startDate: string,
    endDate: string,
    limit?: number,
  ): Promise<ApiResponse<PrayerTimesResponse[]>> {
    const params: Record<string, any> = {
      startDate,
      endDate,
    };
    if (limit) {
      params.limit = limit;
    }

    return this.apiService.get<PrayerTimesResponse[]>('/prayer-times', params);
  }

  /**
   * Create or update prayer times for a specific date
   */
  async createPrayerTimes(
    data: Omit<PrayerTimesResponse, 'sunrise'>,
  ): Promise<ApiResponse<PrayerTimesResponse>> {
    return this.apiService.post<PrayerTimesResponse>('/prayer-times', data);
  }

  /**
   * Bulk import prayer times
   */
  async bulkImportPrayerTimes(
    prayerTimes: Omit<PrayerTimesResponse, 'sunrise'>[],
  ): Promise<ApiResponse<{imported: number; failed: number; errors: any[]}>> {
    return this.apiService.post('/prayer-times/bulk-import', {prayerTimes});
  }

  // ========== USER MANAGEMENT ENDPOINTS ==========

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.apiService.get<UserProfile>('/user/profile');
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    data: UpdateProfileRequest,
  ): Promise<ApiResponse<UserProfile>> {
    return this.apiService.put<UserProfile>('/users/profile', data);
  }
  /**
   * Update prayer record
   */
  async updatePrayer(
    data: UpdatePrayerRequest,
  ): Promise<ApiResponse<PrayerRecord>> {
    // Force enable logging for debugging
    this.apiService.setLogging(true);

    try {
      console.log(
        '🔐 updatePrayer - Checking auth token via UnifiedUserService...',
      );

      // Check if auth token exists using UnifiedUserService
      const token = await this.userService.getAuthToken();
      console.log('🔐 Auth token exists:', !!token);

      console.log('🌐 Making API call to /prayers with data:', data);
      console.log(
        '🌐 Full URL will be:',
        this.apiService.getConfig().baseURL + '/prayers',
      );

      const response = await this.apiService.post<PrayerRecord>(
        '/prayers',
        data,
      );
      console.log('✅ Prayer updated successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ updatePrayer error details:');
      console.error('   Status:', error.response?.status);
      console.error('   URL:', error.config?.url);
      console.error('   Full URL:', error.config?.baseURL + error.config?.url);
      console.error('   Headers:', error.config?.headers);
      console.error('   Response data:', error.response?.data);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }

  // ========== DAILY ACTIVITIES ENDPOINTS ==========

  /**
   * Update daily activity (Quran or Zikr)
   */
  async updateDailyActivity(
    date: string,
    activityType: 'quran' | 'zikr',
    value: number,
  ): Promise<ApiResponse<{message: string}>> {
    try {
      // Prepare request body based on activity type
      const requestBody = {
        activity_date: date,
        activity_type: activityType,
        ...(activityType === 'quran'
          ? {minutes_value: value}
          : {count_value: value}),
      };

      console.log(
        `📡 API: Updating ${activityType} to ${value} ${
          activityType === 'quran' ? 'minutes' : 'count'
        } for ${date}`,
      );

      const response = await this.apiService.post<{message: string}>(
        '/daily-activities',
        requestBody,
      );

      console.log(
        `✅ API: ${activityType} ${
          activityType === 'quran' ? 'minutes' : 'count'
        } updated successfully`,
      );

      return response;
    } catch (error: any) {
      console.error(`❌ API: Error updating ${activityType}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }

  /**
   * Update Quran minutes via API
   */
  async updateQuranMinutes(
    date: string,
    minutes: number,
  ): Promise<ApiResponse<{message: string}>> {
    return this.updateDailyActivity(date, 'quran', minutes);
  }
  /**
   * Update Zikr count via API
   */
  async updateZikrCount(
    date: string,
    count: number,
  ): Promise<ApiResponse<{message: string}>> {
    return this.updateDailyActivity(date, 'zikr', count);
  }
  // ========== FEEDS ENDPOINTS ==========

  /**
   * Fetch feeds with mock items prepended
   * Returns real data from /feeds endpoint with 2 mock items at the start
   */
  async fetchFeeds(): Promise<ApiResponse<FeedsResponse>> {
    try {
      // Fetch real feeds from API
      const response = await this.apiService.get<FeedsResponse>('/feeds');
      if (response.success && response.data) {
        // Create mock items to prepend
        const mockItems: FeedItem[] = [
          {
            id: 213123, // Negative ID to avoid conflicts
            title: 'Welcome to Prayer App',
            content:
              'Stay connected with your spiritual journey. Get reminders for prayer times, track your daily activities, and stay updated with community announcements.',            image_url:
              'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=400&h=300&fit=crop&q=80', // Beautiful mosque architecture
            priority: 'high',
            created_at: new Date().toISOString(),
            expires_at: null,
            author_name: 'Prayer App Team',
            mosque_name: 'Community',
          },
          {
            id: 2132131, // Negative ID to avoid conflicts
            title: 'Daily Reminder',
            content:
              'Remember to maintain your daily prayers and spiritual activities. Every small step counts towards your spiritual growth.',
            image_url: null, // No image for this text-only card
            priority: 'medium',
            created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            expires_at: null,
            author_name: 'Islamic Center',
            mosque_name: 'Local Mosque',
          },
        ];

        // Handle the actual API response structure where feeds are at response.data (not response.data.data)
        const feedsArray = response.data.data || response.data; // Support both structures
        const cleanedFeeds = feedsArray.map((item: any) => {
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
        });

        // Prepend mock items to real data
        const combinedData: FeedItem[] = [...mockItems, ...cleanedFeeds];

        return {
          success: true,
          data: {data: combinedData},
          error: undefined,
        };
      }

      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch feeds',
        data: undefined,
      };
    }
  }

  /**
   * Get feeds from API (legacy method - use fetchFeeds instead)
   * @deprecated Use fetchFeeds() instead
   */
  async getFeeds(): Promise<ApiResponse<FeedsResponse>> {
    return this.fetchFeeds();
  }

  // ========== HELPER METHODS ==========
  /**
   * Set authentication token
   */
  async setAuthToken(token: string): Promise<void> {
    await this.userService.setAuthToken(token);
    return this.apiService.setAuthToken(token);
  }

  /**
   * Clear authentication token
   */
  async clearAuthToken(): Promise<void> {
    await this.userService.clearAuthToken();
    return this.apiService.clearAuthToken();
  }

  /**
   * Update API base URL
   */
  updateBaseURL(baseURL: string): void {
    this.apiService.updateBaseURL(baseURL);
  }

  /**
   * Enable/disable API logging
   */
  setLogging(enabled: boolean): void {
    this.apiService.setLogging(enabled);
  }
}

export default PrayerAppAPI;
