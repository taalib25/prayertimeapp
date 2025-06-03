import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import CustomButton from '../components/CustomButton';
import {
  phoneVerificationSchema,
  otpVerificationSchema,
} from '../utils/validation';
import {useAuth} from '../contexts/AuthContext';

type OTPScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OTP'
>;

interface Props {
  navigation: OTPScreenNavigationProp;
  route: {
    params?: {
      email?: string;
    };
  };
}

const OTPScreen: React.FC<Props> = ({navigation, route}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Phone verification, 2: OTP verification
  const [errors, setErrors] = useState<{phoneNumber?: string; otp?: string}>(
    {},
  );
  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const phoneInputRef = useRef<TextInput>(null);

  // Start with focus on phone input
  useEffect(() => {
    setTimeout(() => phoneInputRef.current?.focus(), 300);
  }, []);

  const validatePhoneNumber = (): boolean => {
    try {
      phoneVerificationSchema.parse({phoneNumber});
      setErrors(prev => ({...prev, phoneNumber: undefined}));
      return true;
    } catch (error: any) {
      const phoneError = error.errors.find(
        (err: any) => err.path[0] === 'phoneNumber',
      );
      setErrors(prev => ({...prev, phoneNumber: phoneError?.message}));
      return false;
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

  const handlePhoneSubmit = () => {
    if (!validatePhoneNumber()) {
      return;
    }

    setIsLoading(true);

    // Simulate API request
    setTimeout(() => {
      setIsLoading(false);
      // Simply change step without complex animation
      setStep(2);
      // Focus on first OTP input after a short delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // If pasting multiple digits, only take the first one
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

  const {login} = useAuth();
  const email = route.params?.email || '';

  const handleVerifyOTP = async () => {
    if (!validateOTP()) {
      return;
    }

    setIsLoading(true);

    try {
      // For demo purposes, accept any complete OTP
      // In a real app, verify with your backend

      // Complete the login process
      await login(email, phoneNumber);

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{name: 'MainApp'}],
      });
    } catch (error) {
      // Error handling would go here
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    setOtp(['', '', '', '']);
    // Resend logic would go here
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <View style={styles.content}>
          {/* Phone Verification Step */}
          {step === 1 && (
            <View>
              <Image
                source={require('../assets/icons/fajr-council.png')}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.title}>Verify your phone number</Text>
              <Text style={styles.subtitle}>
                Enter your phone number to receive a verification code
              </Text>

              <Text style={styles.inputLabel}>Phone number</Text>
              <TextInput
                ref={phoneInputRef}
                style={[
                  styles.phoneInput,
                  errors.phoneNumber && styles.inputError,
                ]}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your mobile number"
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}

              <CustomButton
                title="Request OTP"
                onPress={handlePhoneSubmit}
                style={styles.submitButton}
                loading={isLoading}
              />
            </View>
          )}

          {/* OTP Verification Step */}
          {step === 2 && (
            <View>
              <Image
                source={require('../assets/icons/fajr-council.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>OTP Verification</Text>{' '}
              <Text
                style={[
                  styles.phoneNumberText,
                  {
                    marginTop: 80,
                    marginBottom: 24,
                    ...typography.body,
                    color: colors.accent,
                  },
                ]}>
                We've sent a code to{' '}
                <Text style={styles.phoneNumberText}>{phoneNumber}</Text>
              </Text>
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3].map(index => (
                  <TextInput
                    key={index}
                    ref={ref => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[styles.otpInput, errors.otp && styles.inputError]}
                    keyboardType="numeric"
                    maxLength={1}
                    value={otp[index]}
                    onChangeText={value => handleOtpChange(index, value)}
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
          )}
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
    marginBottom: 24,
  },
  inputLabel: {
    ...typography.bodyMedium,
    color: colors.primary,
    marginBottom: 8,
  },
  phoneInput: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: colors.text.muted,
    borderRadius: 8,
    paddingHorizontal: 16,
    ...typography.body,
    color: '#333',
    marginBottom: 24,
  },
  phoneNumberText: {
    ...typography.bodyMedium,
    color: colors.primary,
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
    backgroundColor: colors.primary,
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
