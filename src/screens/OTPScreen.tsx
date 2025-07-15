import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import CustomButton from '../components/CustomButton';
import {otpVerificationSchema} from '../utils/validation';
import {useAuth} from '../contexts/AuthContext';
import SvgIcon from '../components/SvgIcon';
import PrayerAppAPI from '../services/PrayerAppAPI';
import UserService from '../services/UserService';
import {User} from '../types/User';
import {getTodayDateString} from '../utils/helpers';

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

const OTPScreen: React.FC<Props> = ({route, navigation}) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{otp?: string}>({});
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  // Get route params
  const {checkAuthState} = useAuth();
  const email = route.params?.email || '';
  const username = route.params?.username?.trim() || '';
  const password = route.params?.password?.trim() || '';
  // Services
  const api = PrayerAppAPI.getInstance();
  const userService = UserService.getInstance();

  // Start with focus on first OTP input
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  // Timer effect for resend cooldown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Toast notification helper
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message);
    }
  };

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
  }; // Simple login function for the exact response format
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
        return {
          success: true,
          user: apiResponse.user,
          token: apiResponse.token,
          message: apiResponse.message,
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
        console.log('User Details >>>>>>>> ', response?.user); // Store auth token
        if (response.token) {
          await userService.setAuthToken(response.token);
        } // Create simplified user data from real API response only
        const userData: Partial<User> = {
          id: response.user.id || 21,
          memberId: response.user.memberId || 'GE0021',
          username:
            response.user.name || response.user.username || email.split('@')[0],
          email: response.user.email || email,
          phone: response.user.phoneNumber || response.user.phone || '',
          // Remove hardcoded mock values - use API data only
          address: response.user.location || response.user.address || undefined,
          mosqueName:
            response.user.mosqueName || response.user.masjid || undefined,
          mosqueId: response.user.mosqueId || 1,
          role: response.user.role || 'Member',
          status: response.user.status || 'active',
          onRent: response.user.onRent || false,
          zakathEligible: response.user.zakathEligible || false,
          differentlyAbled: response.user.differentlyAbled || false,
          MuallafathilQuloob: response.user.MuallafathilQuloob || false,
          zikriGoal: response.user.zikriGoal || 600,
          quranGoal: response.user.quranGoal || 30,
          theme: 'light',
          language: 'en',
          // Use API data for important fields
          joinedDate:
            response.user.joinedDate ||
            response.user.createdAt ||
            new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        // Create the user
        await userService.createUser(userData);

        // Trigger auth state check to update UI
        await checkAuthState();

        // Navigate to main app (this should happen automatically after auth state update)
        console.log('User successfully authenticated', userData);
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
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(60);
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
        showToast('New OTP sent successfully!');
      } else {
        setErrors(prev => ({
          ...prev,
          otp: apiResponse.message || 'Failed to resend OTP. Please try again.',
        }));
        showToast('Failed to resend OTP. Please try again.');
        setCanResend(true);
        setResendTimer(0);
      }
    } catch (error) {
      console.error('❌ Error resending OTP:', error);
      setErrors(prev => ({
        ...prev,
        otp: 'Failed to resend OTP. Please try again.',
      }));
      showToast('Failed to resend OTP. Please try again.');
      setCanResend(true);
      setResendTimer(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <View style={styles.content}>
            <View>
              <SvgIcon name="fajrlogo" size={160} style={styles.logo} />
              <Text style={styles.title}>OTP Verification</Text>
              <Text style={styles.subtitle}>
                We've sent a verification code to your email{'\n'}
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
                  <Text
                    onPress={handleResendOTP}
                    style={[
                      styles.resendLink,
                      !canResend && styles.resendDisabled,
                    ]}>
                    {canResend ? 'Resend' : `Resend (${resendTimer}s)`}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
  resendDisabled: {
    color: colors.text.muted,
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
