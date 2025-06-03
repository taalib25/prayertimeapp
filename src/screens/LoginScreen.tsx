import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  SafeAreaView,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import CustomButton from '../components/CustomButton';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import {loginSchema, LoginFormData} from '../utils/validation';
import {useAuth} from '../contexts/AuthContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const {login} = useAuth();

  const validateForm = (): boolean => {
    try {
      loginSchema.parse({email, password});
      setErrors({});
      return true;
    } catch (error: any) {
      const fieldErrors: {email?: string; password?: string} = {};
      error.errors.forEach((err: any) => {
        const field = err.path[0] as keyof LoginFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
  };

  const handleLoginPress = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Navigate to OTP for verification
      // We'll complete the login process after OTP is verified
      navigation.navigate('OTP', {email});
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <View style={styles.formContainer}>
              <Image
                source={require('../assets/icons/fajr-council.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Assalamu Alaikum!</Text>
              <Text style={styles.subtitle}>
                Please login to access your account
              </Text>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Enter your email address"
                placeholderTextColor={colors.text.muted}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Enter your password"
                placeholderTextColor={colors.text.muted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <Text style={styles.forgotPassword}>Forgot Password?</Text>
              <CustomButton
                title={isLoading ? 'Logging in...' : 'Login'}
                onPress={handleLoginPress}
                disabled={isLoading}
                style={styles.loginButton}
              />
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerLink}>Register Now</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 40,
    alignSelf: 'flex-start',
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: 1,
    textAlign: 'left',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.muted,
    marginBottom: 40,
    textAlign: 'left',
  },
  formContainer: {
    width: '100%',
    // backgroundColor: 'white',
    // padding: 24,
    // borderRadius: 16,
    // elevation: 3,
  },
  inputLabel: {
    ...typography.bodyMedium,
    color: colors.primary,
    marginBottom: 8,
  },
  input: {
    height: 56,
    backgroundColor: colors.background.light,
    borderColor: colors.text.muted,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    ...typography.body,
    color: '#333',
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: -16,
    marginBottom: 16,
    marginLeft: 4,
  },
  forgotPassword: {
    ...typography.bodyMedium,
    color: colors.primary,
    textAlign: 'right',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 56,
    marginBottom: 24,
  },
  registerText: {
    ...typography.body,
    color: '#666',
    textAlign: 'center',
  },
  registerLink: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
});

export default LoginScreen;
