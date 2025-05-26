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
  Dimensions,
  Image,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {typography} from '../utils/typography';
import CustomButton from '../components/CustomButton';

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
  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const phoneInputRef = useRef<TextInput>(null);

  // Start with focus on phone input
  useEffect(() => {
    setTimeout(() => phoneInputRef.current?.focus(), 300);
  }, []);

  const handlePhoneSubmit = () => {
    if (phoneNumber && phoneNumber.length >= 10) {
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
    }
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

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, accept any complete OTP
      navigation.replace('MainApp');
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
                style={styles.phoneInput}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your mobile number"
              />

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

              <Text style={styles.title}>Enter verification code</Text>
              <Text style={styles.subtitle}>
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
                    style={styles.otpInput}
                    keyboardType="numeric"
                    maxLength={1}
                    value={otp[index]}
                    onChangeText={value => handleOtpChange(index, value)}
                  />
                ))}
              </View>

              <CustomButton
                title="Verify"
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
    fontSize: 24,
    fontWeight: '600',
    color: '#3C4A9B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  phoneInput: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#E1E3E8',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
  },
  phoneNumberText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3C4A9B',
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
    borderColor: '#E1E3E8',
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    color: '#3C4A9B',
    backgroundColor: '#fff',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#3C4A9B',
    borderRadius: 8,
    height: 56,
    marginBottom: 24,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  resendText: {
    fontSize: 16,
    color: '#666',
  },
  resendLink: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3C4A9B',
  },
});

export default OTPScreen;
