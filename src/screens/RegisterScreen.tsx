import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import CustomButton from '../components/CustomButton';
import AlertModal from '../components/AlertModel';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { typography } from '../utils/typography';
import { colors } from '../utils/theme';
import SvgIcon from '../components/SvgIcon';
import ApiTaskServices from '../services/apiHandler';
import { registrationSchema, RegistrationFormData } from '../utils/validation';
import { DropdownField } from '../components/EditProfile';


type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const DEFAULT_AREA_OPTIONS = [
  {label: 'Kawdana Jummah Masjid', value: 'Kawdana Jummah Masjid'},
  {label: 'Rathmalana Jummah Masjid', value: 'Rathmalana Jummah Masjid'},
  {label: 'Other', value: 'Other'},
];

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [AREA_OPTIONS, setAreaOptions] = useState<{ label: string; value: string }[]>([]);

  React.useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = (await apiService.getAreas()).data;
        if (Array.isArray(response) && response.length > 0) {
          const options = response.map((area: any) => ({
            label: area.area_name,
            value: area.area_name,
          }));
          setAreaOptions(options);
        } else {
          // fallback to default values
          setAreaOptions(DEFAULT_AREA_OPTIONS);
        }
      } catch (error) {
        console.error('Failed to fetch areas:', error);
        // fallback to default values
        setAreaOptions(DEFAULT_AREA_OPTIONS);
      }
    };
    fetchAreas();
  }, []);


  // Update formData structure here: fullName instead of firstName+lastName
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    contactNumber: '',
    area: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegistrationFormData, string>>
  >({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const apiService = ApiTaskServices.getInstance();

  const updateField = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    try {
      registrationSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const fieldErrors: Partial<Record<keyof RegistrationFormData, string>> = {};
      error.errors.forEach((err: any) => {
        const field = err.path[0] as keyof RegistrationFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      console.log('📝 Registration attempt...');

      // Split fullName into first and last names for API
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName; // fallback lastName = firstName

      const registerResponse = await apiService.registerUser({
        firstName,
        lastName,
        username: formData.username,
        phoneNumber: formData.contactNumber,
        area: formData.area,
        email: formData.email,
        password: formData.password,
      });

      if (registerResponse.success) {
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', registerResponse.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      Alert.alert('Error', 'Registration failed. Please try again.');
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
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <SvgIcon name="backBtn" size={24} color={colors.text.dark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <View style={styles.headerRight} />
          </View>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <View style={styles.container}>
              <View style={styles.formContainer}>
                <Text style={styles.subtitle}>Please fill in your details to create an account</Text>

                {/* Full Name */}
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder="Full Name"
                  placeholderTextColor={colors.text.muted}
                  value={formData.fullName}
                  onChangeText={value => updateField('fullName', value)}
                />
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

                {/* Username */}
                <TextInput
                  style={[styles.input, errors.username && styles.inputError]}
                  placeholder="Username"
                  placeholderTextColor={colors.text.muted}
                  value={formData.username}
                  onChangeText={value => updateField('username', value)}
                  autoCapitalize="none"
                />
                {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

                {/* Contact Number */}
                <TextInput
                  style={[styles.input, errors.contactNumber && styles.inputError]}
                  placeholder="Contact Number"
                  placeholderTextColor={colors.text.muted}
                  value={formData.contactNumber}
                  onChangeText={value => updateField('contactNumber', value)}
                  keyboardType="phone-pad"
                />
                {errors.contactNumber && <Text style={styles.errorText}>{errors.contactNumber}</Text>}

                {/* Area Dropdown */}
                <View style={styles.dropdownContainer}>
                  <DropdownField
                    label=""
                    value={formData.area}
                    onValueChange={(value: string) => updateField('area', value)}
                    options={AREA_OPTIONS}
                    placeholder="Select your area"
                    error={errors.area}
                  />
                </View>

                {/* Email */}
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Email Address"
                  placeholderTextColor={colors.text.muted}
                  value={formData.email}
                  onChangeText={value => updateField('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                {/* Password */}
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, errors.password && styles.inputError]}
                    placeholder="Password"
                    placeholderTextColor={colors.text.muted}
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={value => updateField('password', value)}
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
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                <CustomButton
                  title={isLoading ? 'Registering...' : 'Register'}
                  onPress={handleRegister}
                  disabled={isLoading}
                  style={styles.registerButton}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <AlertModal
        visible={showSuccessModal}
        title="Account Created"
        message="Your account has been created successfully and is under review. You will be notified once it's approved."
        onCancel={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
        onConfirm={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
        confirmText="OK"
        cancelText=""
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  headerRight: {
    width: 24,
  },
  backButton: {
    padding: 8,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  formContainer: {
    width: '100%',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.muted,
    marginBottom: 24,
    textAlign: 'left',
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
  dropdownContainer: {
    marginBottom: -4, // For consistent spacing with other fields
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
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 56,
    marginTop: 8,
  },
});

export default RegisterScreen;
