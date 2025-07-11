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
  ToastAndroid,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import CustomButton from '../components/CustomButton';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import {loginSchema, LoginFormData} from '../utils/validation';
import {useAuth} from '../contexts/AuthContext';
import SvgIcon from '../components/SvgIcon';
import ApiTaskServices from '../services/apiHandler';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const apiService = ApiTaskServices.getInstance();
  const [errors, setErrors] = useState<{username?: string; password?: string}>(
    {},
  );
  const {login} = useAuth();
  const validateForm = (): boolean => {
    try {
      loginSchema.parse({username, password});
      setErrors({});
      return true;
    } catch (error: any) {
      const fieldErrors: {username?: string; password?: string} = {};
      error.errors.forEach((err: any) => {
        const field = err.path[0] as keyof LoginFormData;
        if (field === 'username' || field === 'password') {
          fieldErrors[field] = err.message;
        }
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
      console.log('🔐 Initial login attempt to trigger OTP...');
      // Call the initial login to trigger OTP sending
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();
      const loginResponse = await apiService.loginUser(trimmedUsername, trimmedPassword);

      if (!loginResponse.success) {
        setIsLoading(false);
        ToastAndroid.show(
          'Login failed. Please check your credentials.',
          ToastAndroid.LONG,
        );
        return;
      }

      // If initial login is successful, navigate to OTP screen
      console.log('✅ Initial login successful, OTP should be sent to email');
      ToastAndroid.show('OTP sent to your email!', ToastAndroid.SHORT);
      navigation.navigate('OTP', {
        email: username,
        username: username,
        password: password,
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          style={styles.keyboardAvoidingView}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.container}>
                <View style={styles.formContainer}>
                  {/* <Image
                source={require('../assets/icons/fajrLogo.png')}
                style={styles.logo}
                resizeMode="contain"
              /> */}
                  <SvgIcon name="fajrlogo" size={160} style={styles.logo} />
                  <Text style={styles.title}>Assalamu Alaikum!</Text>
                  <Text style={styles.subtitle}>
                    Please login to access your account
                  </Text>
                  {/* <Text style={styles.inputLabel}>Username</Text> */}
                  <TextInput
                    style={[styles.input, errors.username && styles.inputError]}
                    placeholder="Username"
                    placeholderTextColor={colors.text.muted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                  {errors.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                  )}
                  {/* <Text style={styles.inputLabel}>Password</Text> */}
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        errors.password && styles.inputError,
                      ]}
                      placeholder="Password"
                      placeholderTextColor={colors.text.muted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}>
                      <SvgIcon
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={colors.text.muted}
                      />
                    </TouchableOpacity>
                  </View>
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
                    Don't have an account?
                    <Text
                      style={styles.registerLink}
                      onPress={() => navigation.navigate('Register')}>
                      {' '}
                      Register Now
                    </Text>
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
    marginLeft: -35,
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
  passwordContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    height: 56,
    backgroundColor: colors.background.light,
    borderColor: colors.text.muted,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    ...typography.body,
    color: '#333',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 4,
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
    backgroundColor: colors.text.lightDark,
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
