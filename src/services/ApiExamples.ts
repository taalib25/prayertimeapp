import PrayerAppAPI from './PrayerAppAPI';

/**
 * Example usage of the Prayer App API
 * This file demonstrates how to use the API service in your components
 */

const api = PrayerAppAPI.getInstance();

// ========== AUTHENTICATION EXAMPLES ==========

/**
 * Example: Login user
 */
export const loginUser = async (username: string, password: string) => {
  try {
    console.log('🔐 Attempting login...');

    const response = await api.login({
      username,
      password,
    });

    if (response.success) {
      console.log('✅ Login successful:', response.data?.user);

      // If requires phone verification
      if (response.data?.requiresPhoneVerification) {
        console.log('📱 Phone verification required');
        return {success: true, requiresOTP: true, user: response.data.user};
      }

      // If login complete with token
      if (response.data?.token) {
        await api.setAuthToken(response.data.token);
        console.log('🔑 Auth token saved');
      }

      return {success: true, requiresOTP: false, user: response.data?.user};
    } else {
      console.log('❌ Login failed:', response.error);
      return {success: false, error: response.error};
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return {success: false, error: 'Network error occurred'};
  }
};

/**
 * Example: Send OTP
 */
export const sendOTPCode = async (phoneNumber: string) => {
  try {
    console.log('📱 Sending OTP to:', phoneNumber);

    const response = await api.sendOTP({phoneNumber});

    if (response.success) {
      console.log('✅ OTP sent successfully');
      return {success: true, expiresIn: response.data?.expiresIn};
    } else {
      console.log('❌ OTP send failed:', response.error);
      return {success: false, error: response.error};
    }
  } catch (error) {
    console.error('❌ OTP send error:', error);
    return {success: false, error: 'Failed to send OTP'};
  }
};

/**
 * Example: Verify OTP
 */
export const verifyOTPCode = async (phoneNumber: string, otp: string) => {
  try {
    console.log('🔐 Verifying OTP...');

    const response = await api.verifyOTP({phoneNumber, otp});

    if (response.success && response.data?.token) {
      console.log('✅ OTP verified successfully');

      // Save the auth token
      await api.setAuthToken(response.data.token);
      console.log('🔑 Auth token saved');

      return {success: true, user: response.data.user};
    } else {
      console.log('❌ OTP verification failed:', response.error);
      return {success: false, error: response.error || 'Invalid OTP'};
    }
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    return {success: false, error: 'Verification failed'};
  }
};

// ========== PRAYER TIMES EXAMPLES ==========

/**
 * Example: Get prayer times for today
 */
export const getTodayPrayerTimes = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('🕌 Fetching prayer times for:', today);

    const response = await api.getPrayerTimes(today);

    if (response.success) {
      console.log('✅ Prayer times received:', response.data);
      return {success: true, prayerTimes: response.data};
    } else {
      console.log('❌ Failed to get prayer times:', response.error);
      return {success: false, error: response.error};
    }
  } catch (error) {
    console.error('❌ Prayer times error:', error);
    return {success: false, error: 'Failed to fetch prayer times'};
  }
};

/**
 * Example: Get prayer times for a week
 */
export const getWeeklyPrayerTimes = async () => {
  try {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const startDate = today.toISOString().split('T')[0];
    const endDate = weekFromNow.toISOString().split('T')[0];

    console.log('🕌 Fetching weekly prayer times:', startDate, 'to', endDate);

    const response = await api.getPrayerTimesRange(startDate, endDate, 7);

    if (response.success) {
      console.log(
        '✅ Weekly prayer times received:',
        response.data?.length,
        'days',
      );
      return {success: true, prayerTimes: response.data};
    } else {
      console.log('❌ Failed to get weekly prayer times:', response.error);
      return {success: false, error: response.error};
    }
  } catch (error) {
    console.error('❌ Weekly prayer times error:', error);
    return {success: false, error: 'Failed to fetch weekly prayer times'};
  }
};

/**
 * Example: Update a prayer record
 */
export const updatePrayerRecord = async (
  prayerType: string,
  prayerDate: string,
  status: string,
  location?: string,
  notes?: string,
) => {
  try {
    // Prepare the payload
    const payload: any = {
      prayer_type: prayerType,
      prayer_date: prayerDate,
      status,
    };
    if (location) payload.location = location;
    if (notes) payload.notes = notes; // Call the API's updatePrayer method
    const response = await api.updatePrayer(payload);

    if (response.success) {
      console.log('✅ Prayer record updated:', response.data);
      return {success: true, prayer: response.data};
    } else {
      console.log('❌ Failed to update prayer record:', response.error);
      return {success: false, error: response.error};
    }
  } catch (error) {
    console.error('❌ Update prayer record error:', error);
    return {success: false, error: 'Failed to update prayer record'};
  }
};
export const createPrayerTimesForDate = async (
  date: string,
  fajr: string,
  dhuhr: string,
  asr: string,
  maghrib: string,
  isha: string,
) => {
  try {
    console.log('🕌 Creating prayer times for:', date);

    const response = await api.createPrayerTimes({
      date,
      fajr,
      dhuhr,
      asr,
      maghrib,
      isha,
    });

    if (response.success) {
      console.log('✅ Prayer times created successfully');
      return {success: true, prayerTimes: response.data};
    } else {
      console.log('❌ Failed to create prayer times:', response.error);
      return {success: false, error: response.error};
    }
  } catch (error) {
    console.error('❌ Create prayer times error:', error);
    return {success: false, error: 'Failed to create prayer times'};
  }
};

// ========== USER PROFILE EXAMPLES ==========

/**
 * Example: Get user profile
 */
export const getUserProfile = async () => {
  try {
    console.log('👤 Fetching user profile...');

    const response = await api.getUserProfile();

    if (response.success) {
      console.log('✅ User profile received:', response.data);
      return {success: true, profile: response.data};
    } else {
      console.log('❌ Failed to get user profile:', response.error);
      return {success: false, error: response.error};
    }
  } catch (error) {
    console.error('❌ User profile error:', error);
    return {success: false, error: 'Failed to fetch user profile'};
  }
};

/**
 * Example: Update user profile
 */
export const updateUserProfile = async (
  name?: string,
  phoneNumber?: string,
) => {
  try {
    console.log('👤 Updating user profile...');

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    const response = await api.updateUserProfile(updateData);

    if (response.success) {
      console.log('✅ User profile updated successfully');
      return {success: true, profile: response.data};
    } else {
      console.log('❌ Failed to update user profile:', response.error);
      return {success: false, error: response.error};
    }
  } catch (error) {
    console.error('❌ Update profile error:', error);
    return {success: false, error: 'Failed to update profile'};
  }
};

// ========== UTILITY EXAMPLES ==========

/**
 * Example: Complete logout
 */
export const logoutUser = async () => {
  try {
    console.log('🚪 Logging out...');

    // Call logout endpoint
    const response = await api.logout();

    // Clear local auth token regardless of API response
    await api.clearAuthToken();

    if (response.success) {
      console.log('✅ Logout successful');
      return {success: true};
    } else {
      console.log('⚠️ Logout API failed but token cleared:', response.error);
      return {success: true}; // Still successful since token is cleared
    }
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Still clear token even if API fails
    await api.clearAuthToken();
    return {success: true};
  }
};

/**
 * Example: Check if user is authenticated
 */
export const checkAuthentication = async () => {
  try {
    // Try to get user profile - this will fail if not authenticated
    const response = await api.getUserProfile();

    if (response.success) {
      console.log('✅ User is authenticated');
      return {authenticated: true, user: response.data};
    } else {
      console.log('❌ User is not authenticated');
      return {authenticated: false};
    }
  } catch (error) {
    console.error('❌ Authentication check error:', error);
    return {authenticated: false};
  }
};

// ========== CONFIGURATION EXAMPLES ==========

/**
 * Example: Configure API for development/production
 */
export const configureAPI = (environment: 'development' | 'production') => {
  if (environment === 'development') {
    api.updateBaseURL('http://localhost:3000/api/v1');
    api.setLogging(true);
    console.log('🔧 API configured for development');
  } else {
    api.updateBaseURL('https://api.prayerapp.com/v1');
    api.setLogging(false);
    console.log('🔧 API configured for production');
  }
};
