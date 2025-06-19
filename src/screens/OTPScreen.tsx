import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import CustomButton from '../components/CustomButton';
import {otpVerificationSchema} from '../utils/validation';
import {useAuth} from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserPreferencesService from '../services/UserPreferencesService';
import {initializeUserBackgroundTasks} from '../services/backgroundTasks';
import SvgIcon from '../components/SvgIcon';
import PrayerAppAPI from '../services/PrayerAppAPI';

type OTPScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OTP'
>;

interface Props {
  navigation: OTPScreenNavigationProp;
  route: {
    params?: {
      email?: string;
      username?: string;
      password?: string;
    };
  };
}

const OTPScreen: React.FC<Props> = ({route}) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{otp?: string}>({});
  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  // Get route params
  const {login} = useAuth();
  const email = route.params?.email || '';
  const username = route.params?.username || '';
  const password = route.params?.password || '';

  // API instance
  const api = PrayerAppAPI.getInstance();

  // Start with focus on first OTP input
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const validateOTP = (): boolean => {
    const otpString = otp.join('');
    try {
      otpVerificationSchema.parse({otp: otpString});
      setErrors(prev => ({...prev, otp: undefined}));
      return true;
    } catch (error: any) {
      const otpError = error.errors.find((err: any) => err.path[0] === 'otp');
      setErrors(prev => ({...prev, otp: otpError?.message}));
      return false;
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  // Simple login function for the exact response format
  const loginUser = async (
    username: string,
    password: string,
    otpCode: string,
  ) => {
    try {
      const response = await api.login({
        username,
        password,
        otpCode,
      });

      console.log('📨 API Response:', response);

      // Cast to any to handle the flexible API response format
      const apiResponse = response as any;

      // Handle the exact response format: { success, message, token, user }
      if (apiResponse.success) {
        // Save auth token
        if (apiResponse.token) {
          await api.setAuthToken(apiResponse.token);
        }

        return {
          success: true,
          user: apiResponse.user,
          token: apiResponse.token,
        };
      } else {
        return {
          success: false,
          error: apiResponse.message || 'Login failed',
        };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return {success: false, error: 'Network error occurred'};
    }
  };

  // Create user data from API response
  const createUserDataFromAPI = async (apiUserData: any) => {
    try {
      const uid = 1001;

      const userProfile = {
        username: apiUserData.username || username,
        email: apiUserData.email || email,
        phoneNumber: '', // Not provided in the response
      };

      const defaultGoals = {
        monthlyZikrGoal: 600,
        monthlyQuranPagesGoal: 30,
        monthlyCharityGoal: 5,
        monthlyFastingDaysGoal: 6,
      };

      const defaultSettings = {
        prayerSettings: 'standard',
        preferredMadhab: 'hanafi',
        appLanguage: 'en',
        theme: 'light',
        location: 'Colombo, LK',
        masjid: 'Local Masjid',
      };

      // Store user data
      await Promise.all([
        AsyncStorage.setItem(
          `user_${uid}_profile`,
          JSON.stringify(userProfile),
        ),
        AsyncStorage.setItem(`user_${uid}_goals`, JSON.stringify(defaultGoals)),
        AsyncStorage.setItem(
          `user_${uid}_settings`,
          JSON.stringify(defaultSettings),
        ),
      ]);

      // Initialize services
      const preferencesService = UserPreferencesService.getInstance();
      await preferencesService.initializeDefaultSettings(uid);
      await initializeUserBackgroundTasks(uid);

      console.log('✅ User data created from API response');
    } catch (error) {
      console.error('❌ Error creating user data from API:', error);
    }
  };

  const handleVerifyOTP = async () => {
    if (!validateOTP()) {
      return;
    }

    setIsLoading(true);

    try {
      const otpCode = otp.join('');

      if (otpCode.length !== 4 || !/^\d{4}$/.test(otpCode)) {
        setErrors(prev => ({
          ...prev,
          otp: 'Please enter a valid 4-digit OTP code.',
        }));
        setIsLoading(false);
        return;
      }

      // Call the API with OTP
      const response = await loginUser(username, password, otpCode);

      if (response.success && response.user) {
        console.log('✅ OTP verified successfully');

        // Create user data from API response
        await createUserDataFromAPI(response.user);

        // Login user in context
        const userEmail = response.user.email || email;
        await login(userEmail, ''); // No phone number in response
      } else {
        console.log('❌ OTP verification failed:', response.error);
        setErrors(prev => ({
          ...prev,
          otp:
            response.error ||
            'Invalid OTP. Please check the code and try again.',
        }));
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      setIsLoading(false);
      setErrors(prev => ({
        ...prev,
        otp: 'Verification failed. Please try again.',
      }));
    }
  };
  const handleResendOTP = async () => {
    setOtp(['', '', '', '']);
    setErrors(prev => ({...prev, otp: undefined}));

    try {
      // Call login API without OTP to trigger new OTP
      const response = await api.login({
        username,
        password,
      });

      const apiResponse = response as any;

      if (apiResponse.success) {
        console.log('✅ New OTP sent');
      } else {
        setErrors(prev => ({
          ...prev,
          otp: apiResponse.message || 'Failed to resend OTP. Please try again.',
        }));
      }
    } catch (error) {
      console.error('❌ Error resending OTP:', error);
      setErrors(prev => ({
        ...prev,
        otp: 'Failed to resend OTP. Please try again.',
      }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <View style={styles.content}>
          <View>
            <SvgIcon name="fajrlogo" size={160} style={styles.logo} />
            <Text style={styles.title}>OTP Verification</Text>
            <Text style={styles.subtitle}>
              We've sent a verification code to your email{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <View style={styles.otpContainer}>
              {[0, 1, 2, 3].map(index => (
                <TextInput
                  key={index}
                  ref={(ref: any) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[styles.otpInput, errors.otp && styles.inputError]}
                  keyboardType="numeric"
                  maxLength={1}
                  value={otp[index]}
                  onChangeText={(value: any) => handleOtpChange(index, value)}
                />
              ))}
            </View>
            {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
            <CustomButton
              title="Submit"
              onPress={handleVerifyOTP}
              style={styles.submitButton}
              loading={isLoading}
            />
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive the code?{' '}
                <Text onPress={handleResendOTP} style={styles.resendLink}>
                  Resend
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 40,
    marginLeft: -35,
    alignSelf: 'flex-start',
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.muted,
    marginBottom: 32,
    textAlign: 'center',
  },
  emailText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: 'bold',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: colors.text.muted,
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    color: colors.primary,
    backgroundColor: '#fff',
  },
  submitButton: {
    width: '100%',
    backgroundColor: colors.text.lightDark,
    borderRadius: 8,
    height: 56,
    marginBottom: 24,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  resendText: {
    ...typography.body,
    color: colors.text.muted,
  },
  resendLink: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: 8,
    marginBottom: 16,
    marginLeft: 4,
  },
});

export default OTPScreen;
