import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
    params: {
      email: string;
    };
  };
}

const OTPScreen: React.FC<Props> = ({navigation, route}) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null]);
  const {email} = route.params;

  // For demo, we'll display a phone number instead of email
  const phoneNumber = '07712312323';

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
          <Image 
            source={require('../assets/icons/fajr-council.png')} 
            style={styles.logo}
          />
          
          <Text style={styles.title}>OTP Verfication</Text>
          
          <Text style={styles.subtitle}>
            Enter the OTP sent to <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {[0, 1, 2, 3].map((index) => (
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
            title="Submit"
            onPress={handleVerifyOTP}
            style={styles.submitButton}
          />

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive the OPT ? <Text onPress={handleResendOTP} style={styles.resendLink}>Resend</Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: '20%',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 40,
  },
  title: {
    ...typography.h2,
    color: '#3C4A9B',
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  phoneNumber: {
    ...typography.bodyMedium,
    color: '#3C4A9B',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 20,
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
    ...typography.h2,
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#3C4A9B',
    borderRadius: 12,
    height: 56,
    marginBottom: 24,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    ...typography.body,
    color: '#666',
  },
  resendLink: {
    ...typography.bodyMedium,
    color: '#3C4A9B',
  },
});

export default OTPScreen;
