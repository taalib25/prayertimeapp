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

// NEW: Combined prayer request interface for the unified endpoint
export interface CombinedPrayerRequest {
  prayer_date: string;
  // Prayer fields - can set any of the 5 daily prayers
  fajr?: boolean;
  dhuhr?: boolean;
  asr?: boolean;
  maghrib?: boolean;
  isha?: boolean;
  // Daily activity fields
  zikr_count?: number;
  quran_minutes?: number;
}

// Legacy interfaces maintained for compatibility
export interface UpdatePrayerRequest {
  prayer_type: string;
  prayer_date: string;
  status: boolean;
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
  image_url?: string | null;
  youtube_url?: string | null;
  priority: string;
  created_at: string;
  expires_at?: string | null;
  author_name: string;
  mosque_name: string;
}

export interface FeedsResponse {
  data: FeedItem[];
}

export interface CreateMemberRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  area?: string;
}

export interface CreateMemberResponse {
  id: string;
  memberId: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  area?: string;
  status: string;
  createdAt: string;
}

export interface PickupRequest {
  pickup_location: string;
  days: string[];
  contact_number: string;
  special_instructions?: string;
  prayers?: string[];
}

export interface PickupRequestResponse {
  id: string;
  pickup_location: string;
  days: string[];
  contact_number: string;
  special_instructions?: string;
  prayers: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface WakeUpCallRequest {
  username: string;
  call_response: 'accepted' | 'declined';
  response_time: string;
  call_date: string;
  call_time: string;
}

export interface WakeUpCallResponse {
  id: string;
  username: string;
  call_response: 'accepted' | 'declined';
  response_time: string;
  call_date: string;
  call_time: string;
  created_at: string;
}

export interface UpdateCounsellingSessionRequest {
  session_id: string | number;
  status: 'scheduled' | 'completed' | 'excused' | 'absent';
  session_notes?: string;
  actual_start_time?: string;
  actual_end_time?: string;
}

export interface UpdateCounsellingSessionResponse {
  id: string | number;
  status: string;
  session_notes: string;
  updated_at: string;
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

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.apiService.post<LoginResponse>('/login', data);
  }

  async sendOTP(
    data: SendOTPRequest,
  ): Promise<ApiResponse<{expiresIn: number}>> {
    return this.apiService.post('/auth/send-otp', data);
  }

  async verifyOTP(
    data: VerifyOTPRequest,
  ): Promise<ApiResponse<VerifyOTPResponse>> {
    return this.apiService.post<VerifyOTPResponse>('/auth/verify-otp', data);
  }

  async logout(): Promise<ApiResponse<{message: string}>> {
    return this.apiService.post('/auth/logout');
  }

  async createMember(
    data: CreateMemberRequest,
  ): Promise<ApiResponse<CreateMemberResponse>> {
    try {
      console.log('📝 API: Creating new member:', {
        email: data.email,
        fullName: data.fullName,
        username: data.username,
      });

      const response = await this.apiService.post<CreateMemberResponse>(
        '/register',
        data,
      );

      if (response.success) {
        console.log('✅ API: Member created successfully:', response.data);
      } else {
        console.log('❌ API: Member creation failed:', response.error);
      }

      return response;
    } catch (error: any) {
      console.error('❌ API: Error creating member:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }

  // ========== PRAYER TIMES ENDPOINTS ==========

  async getPrayerTimes(
    date: string,
  ): Promise<ApiResponse<PrayerTimesResponse>> {
    return this.apiService.get<PrayerTimesResponse>(`/prayer-times/${date}`);
  }

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

  async getCouncilSessions(
    params?: Record<string, any>,
  ): Promise<ApiResponse<any>> {
    try {
      console.log('📡 API: Fetching council sessions with params:', params);

      const response = await this.apiService.get<any>(
        '/counselling-sessions',
        params,
      );

      if (response.success) {
        console.log('✅ API: Council sessions fetched successfully');
      } else {
        console.log(
          '❌ API: Fetching council sessions failed:',
          response.error,
        );
      }

      return response;
    } catch (error: any) {
      console.error('❌ API: Error fetching council sessions:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }

  async createPrayerTimes(
    data: Omit<PrayerTimesResponse, 'sunrise'>,
  ): Promise<ApiResponse<PrayerTimesResponse>> {
    return this.apiService.post<PrayerTimesResponse>('/prayer-times', data);
  }

  async bulkImportPrayerTimes(
    prayerTimes: Omit<PrayerTimesResponse, 'sunrise'>[],
  ): Promise<ApiResponse<{imported: number; failed: number; errors: any[]}>> {
    return this.apiService.post('/prayer-times/bulk-import', {prayerTimes});
  }

  // ========== USER MANAGEMENT ENDPOINTS ==========

  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.apiService.get<UserProfile>('/user/profile');
  }

  async updateUserProfile(
    data: UpdateProfileRequest,
  ): Promise<ApiResponse<UserProfile>> {
    return this.apiService.put<UserProfile>('/users/profile', data);
  }

  // ========== CORE UNIFIED PRAYER/ACTIVITY METHOD ==========

  /**
   * Core method that calls the new unified /prayer endpoint
   */
  private async callUnifiedPrayerEndpoint(
    data: CombinedPrayerRequest,
  ): Promise<ApiResponse<any>> {
    this.apiService.setLogging(true);

    try {
      console.log('🔐 Checking auth token via UserService...');
      
      const token = await this.userService.getAuthToken();
      console.log('🔐 Auth token exists:', !!token);

      console.log('🌐 Making API call to /prayer with data:', data);

      const response = await this.apiService.post<any>('/prayers', data);
      
      console.log('✅ Unified prayer endpoint called successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Unified prayer endpoint error:');
      console.error('   Status:', error.response?.status);
      console.error('   Response data:', error.response?.data);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }

  // ========== LEGACY METHOD IMPLEMENTATIONS (using new endpoint) ==========

  /**
   * Update prayer record - COMPLETELY REPLACED with new implementation
   */
  async updatePrayer(
    data: UpdatePrayerRequest,
  ): Promise<ApiResponse<PrayerRecord>> {
    try {
      // Convert legacy prayer request to new unified format
      const prayerType = data.prayer_type.toLowerCase() as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
      const completed = data.status;
      
      const unifiedRequest: CombinedPrayerRequest = {
        prayer_date: data.prayer_date,
        [prayerType]: completed,
      };

      console.log(`📡 Converting legacy prayer request to unified format:`, {
        legacy: data,
        unified: unifiedRequest
      });

      // Call the new unified endpoint
      const response = await this.callUnifiedPrayerEndpoint(unifiedRequest);
      
      if (response.success) {
        // Convert response back to legacy format for compatibility
        const legacyResponse: PrayerRecord = {
          id: response.data?.id || 'unified-prayer-id',
          prayer_type: data.prayer_type,
          prayer_date: data.prayer_date,
          status: data.status.toString(),
          location: data.location,
          notes: data.notes,
          userId: response.data?.userId,
          createdAt: response.data?.createdAt || new Date().toISOString(),
          updatedAt: response.data?.updatedAt || new Date().toISOString(),
        };
        
        return {
          success: true,
          data: legacyResponse,
          error: undefined,
        };
      }
      
      return {
        success: false,
        error: response.error,
        data: undefined,
      };
    } catch (error: any) {
      console.error('❌ updatePrayer legacy method error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update prayer',
        data: undefined,
      };
    }
  }

  /**
   * Update daily activity - COMPLETELY REPLACED with new implementation
   */
  async updateDailyActivity(
    date: string,
    activityType: 'quran' | 'zikr',
    value: number,
  ): Promise<ApiResponse<{message: string}>> {
    try {
      let unifiedRequest: CombinedPrayerRequest;
      
      if (activityType === 'quran') {
        unifiedRequest = {
          prayer_date: date,
          quran_minutes: value,
        };
      } else {
        unifiedRequest = {
          prayer_date: date,
          zikr_count: value,
        };
      }

      console.log(`📡 Converting legacy ${activityType} request to unified format:`, {
        activityType,
        value,
        unified: unifiedRequest
      });

      // Call the new unified endpoint
      const response = await this.callUnifiedPrayerEndpoint(unifiedRequest);
      
      if (response.success) {
        return {
          success: true,
          data: {message: `${activityType} updated successfully`},
          error: undefined,
        };
      }
      
      return {
        success: false,
        error: response.error,
        data: undefined,
      };
    } catch (error: any) {
      console.error(`❌ updateDailyActivity legacy method error for ${activityType}:`, error);
      return {
        success: false,
        error: error.message || `Failed to update ${activityType}`,
        data: undefined,
      };
    }
  }

  /**
   * Update Quran minutes - COMPLETELY REPLACED with new implementation
   */
  async updateQuranMinutes(
    date: string,
    minutes: number,
  ): Promise<ApiResponse<{message: string}>> {
    const unifiedRequest: CombinedPrayerRequest = {
      prayer_date: date,
      quran_minutes: minutes,
    };

    console.log(`📡 Updating Quran minutes via unified endpoint for ${date}:`, minutes);
    
    const response = await this.callUnifiedPrayerEndpoint(unifiedRequest);
    
    if (response.success) {
      return {
        success: true,
        data: {message: 'Quran minutes updated successfully'},
        error: undefined,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: undefined,
    };
  }

  /**
   * Update Zikr count - COMPLETELY REPLACED with new implementation
   */
  async updateZikrCount(
    date: string,
    count: number,
  ): Promise<ApiResponse<{message: string}>> {
    const unifiedRequest: CombinedPrayerRequest = {
      prayer_date: date,
      zikr_count: count,
    };

    console.log(`📡 Updating Zikr count via unified endpoint for ${date}:`, count);
    
    const response = await this.callUnifiedPrayerEndpoint(unifiedRequest);
    
    if (response.success) {
      return {
        success: true,
        data: {message: 'Zikr count updated successfully'},
        error: undefined,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: undefined,
    };
  }

  // ========== NEW CONVENIENT METHODS ==========

  /**
   * Update specific daily prayer using unified endpoint
   */
  async updateDailyPrayer(
    date: string,
    prayerType: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
    completed: boolean = true,
  ): Promise<ApiResponse<any>> {
    const unifiedRequest: CombinedPrayerRequest = {
      prayer_date: date,
      [prayerType]: completed,
    };

    console.log(`📡 Updating ${prayerType} prayer via unified endpoint for ${date}:`, completed);
    return this.callUnifiedPrayerEndpoint(unifiedRequest);
  }

  /**
   * Update multiple prayers and activities in one call
   */
  async updateMultipleActivities(
    data: CombinedPrayerRequest,
  ): Promise<ApiResponse<any>> {
    console.log('📡 Updating multiple activities via unified endpoint:', data);
    return this.callUnifiedPrayerEndpoint(data);
  }

  // ========== FEEDS ENDPOINTS ==========

  async fetchFeeds(): Promise<ApiResponse<FeedsResponse>> {
    try {
      const response = await this.apiService.get<FeedsResponse>('/feeds');
      if (response.success && response.data) {
        const feedsArray = response.data.data || response.data;
        const cleanedFeeds = feedsArray.map((item: any) => {
          const cleanItem: FeedItem = {
            id: item.id,
            title: item.title,
            content: item.content,
            image_url: item.image_url,
            youtube_url: item.video_url || null,
            priority: item.priority,
            created_at: item.created_at,
            expires_at: item.expires_at,
            author_name: item.author_name,
            mosque_name: item.mosque_name,
          };
          return cleanItem;
        });

        return {
          success: true,
          data: {data: cleanedFeeds},
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

  async getFeeds(): Promise<ApiResponse<FeedsResponse>> {
    return this.fetchFeeds();
  }

  // ========== PICKUP REQUESTS ENDPOINTS ==========

  async submitPickupRequest(
    data: PickupRequest,
  ): Promise<ApiResponse<PickupRequest>> {
    try {
      console.log('📡 API: Submitting pickup request with data:', data);

      const response = await this.apiService.post<PickupRequest>(
        '/pickup-requests',
        data,
      );

      if (response.success) {
        console.log('✅ API: Pickup request submitted successfully');
      } else {
        console.log(
          '❌ API: Pickup request submission failed:',
          response.error,
        );
      }

      return response;
    } catch (error: any) {
      console.error('❌ API: Error submitting pickup request:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }

  async getPickupRequests(): Promise<ApiResponse<any>> {
    try {
      console.log('📡 API: Fetching pickup requests...');

      const response = await this.apiService.get<any>('/pickup-requests/all');

      if (response.success) {
        console.log('✅ API: Pickup requests fetched successfully');
      } else {
        console.log('❌ API: Failed to fetch pickup requests:', response.error);
      }

      return response;
    } catch (error: any) {
      console.error('❌ API: Error fetching pickup requests:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }

  async updatePickupRequest(
    requestId: string,
    data: Partial<PickupRequest>,
  ): Promise<ApiResponse<PickupRequestResponse>> {
    try {
      console.log(
        `📡 API: Updating pickup request ${requestId} with data:`,
        data,
      );

      const response = await this.apiService.put<PickupRequestResponse>(
        `/pickup-requests/${requestId}`,
        data,
      );

      if (response.success) {
        console.log('✅ API: Pickup request updated successfully');
      } else {
        console.log('❌ API: Pickup request update failed:', response.error);
      }

      return response;
    } catch (error: any) {
      console.error('❌ API: Error updating pickup request:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }

  async deletePickupRequest(
    requestId: string,
  ): Promise<ApiResponse<{message: string}>> {
    try {
      console.log(`📡 API: Deleting pickup request ${requestId}`);

      const response = await this.apiService.delete<{message: string}>(
        `/pickup-requests/${requestId}`,
      );

      if (response.success) {
        console.log('✅ API: Pickup request deleted successfully');
      } else {
        console.log('❌ API: Pickup request deletion failed:', response.error);
      }

      return response;
    } catch (error: any) {
      console.error('❌ API: Error deleting pickup request:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }

  // ========== WAKE-UP CALL ENDPOINTS ==========

  async recordWakeUpCallResponse(
    data: WakeUpCallRequest,
  ): Promise<ApiResponse<WakeUpCallResponse>> {
    try {
      console.log('📡 API: Recording wake-up call response...', {
        username: data.username,
        response: data.call_response,
        date: data.call_date,
        time: data.call_time,
      });

      const response = await this.apiService.post<WakeUpCallResponse>(
        '/wake-up-calls',
        data,
      );

      return response;
    } catch (error: any) {
      console.error('❌ API: Error recording wake-up call response:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }

  async getCounsellingSessions(
    params?: Record<string, any>,
  ): Promise<ApiResponse<any>> {
    try {
      console.log('📡 API: Fetching counselling sessions with params:', params);

      const response = await this.apiService.get<any>(
        '/counselling-sessions',
        params,
      );

      if (response.success) {
        console.log('✅ API: Counselling sessions fetched successfully');
      } else {
        console.log(
          '❌ API: Fetching counselling sessions failed:',
          response.error,
        );
      }

      return response;
    } catch (error: any) {
      console.error('❌ API: Error fetching counselling sessions:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }

  async updateCounsellingSession(
    data: UpdateCounsellingSessionRequest,
  ): Promise<ApiResponse<UpdateCounsellingSessionResponse>> {
    try {
      console.log('📡 API: Updating counselling session:', {
        sessionId: data.session_id,
        status: data.status,
        hasNotes: !!data.session_notes,
      });

      const response =
        await this.apiService.put<UpdateCounsellingSessionResponse>(
          `/counselling-sessions/${data.session_id}`,
          {
            status: data.status,
            sessionNotes: data.session_notes || '',
          },
        );

      if (response.success) {
        console.log('✅ API: Counselling session updated successfully');
      } else {
        console.log(
          '❌ API: Counselling session update failed:',
          response.error,
        );
      }

      return response;
    } catch (error: any) {
      console.error('❌ API: Error updating counselling session:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }

  // ========== HELPER METHODS ==========

  async setAuthToken(token: string): Promise<void> {
    await this.userService.setAuthToken(token);
    return this.apiService.setAuthToken(token);
  }

  async clearAuthToken(): Promise<void> {
    await this.userService.clearAuthToken();
    return this.apiService.clearAuthToken();
  }

  updateBaseURL(baseURL: string): void {
    this.apiService.updateBaseURL(baseURL);
  }

  setLogging(enabled: boolean): void {
    this.apiService.setLogging(enabled);
  }

  async getAreas(): Promise<ApiResponse<{data: string[]}>> {
    try {
      const response = await this.apiService.get<{data: string[]}>('/areas');
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: undefined,
      };
    }
  }
}

export default PrayerAppAPI;
