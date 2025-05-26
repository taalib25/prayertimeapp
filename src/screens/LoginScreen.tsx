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
} from 'react-native';
import CustomButton from '../components/CustomButton';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {typography} from '../utils/typography';

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

  const handleLoginPress = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate login API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to OTP screen with email
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
              <Text style={styles.title}>Assalamu Alaikum!</Text>
              <Text style={styles.subtitle}>
                Please login to access your account
              </Text>

              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

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
  title: {
    ...typography.h1,
    color: '#3C4A9B',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    ...typography.bodyMedium,
    color: '#3C4A9B',
    marginBottom: 8,
  },
  input: {
    height: 56,
    backgroundColor: '#F8F9FA',
    borderColor: '#E1E3E8',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    ...typography.body,
    color: '#333',
  },
  forgotPassword: {
    ...typography.bodyMedium,
    color: '#3C4A9B',
    textAlign: 'right',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#3C4A9B',
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
    color: '#3C4A9B',
  },
});

export default LoginScreen;
