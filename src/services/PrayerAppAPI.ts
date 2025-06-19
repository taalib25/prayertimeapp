import ApiService, {ApiResponse} from './api/ApiService';
import UnifiedUserService from './UnifiedUserService';

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

/**
 * Prayer App API Endpoints
 * Uses the ApiService for consistent HTTP requests
 */
class PrayerAppAPI {
  private static instance: PrayerAppAPI;
  private apiService: ApiService;
  private userService: UnifiedUserService;

  private constructor() {
    this.apiService = ApiService.getInstance();
    this.userService = UnifiedUserService.getInstance();
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
    return this.apiService.post<LoginResponse>('/api/login', data);
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
    return this.apiService.put<UserProfile>('/user/profile', data);
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
