import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';
import SvgIcon from '../components/SvgIcon';
import {colors, spacing, borderRadius} from '../utils/theme';
import {typography} from '../utils/typography';
import {useUnifiedUser, useAppUser} from '../hooks/useUnifiedUser';
import {UserUpdateData} from '../types/User';

interface InputWithLabelProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  error?: string;
}

const InputWithLabel: React.FC<InputWithLabelProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
  error,
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Custom date input component
interface DateInputProps {
  label: string;
  value: string;
  onPress: () => void;
}

const DateInput: React.FC<DateInputProps> = ({label, value, onPress}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Pressable
        style={({pressed}) => [
          styles.dateInput,
          pressed && styles.pressedState,
        ]}
        onPress={onPress}>
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {value || 'Select date'}
        </Text>
        <SvgIcon name="calendar" size={20} color={colors.text.muted} />
      </Pressable>
    </View>
  );
};

// Loading dots component
const LoadingDots: React.FC = () => {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(prev => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={styles.saveButtonText}>Saving{'.'.repeat(dotCount)}</Text>
  );
};

// Main EditProfileScreen component
const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    profile,
    updateProfile,
    displayName,
    isLoading: userLoading,
  } = useAppUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setdateOfBirth] = useState('');
  const [nearestMasjid, setNearestMasjid] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Validation states
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Load user data from unified user system
  useEffect(() => {
    if (profile) {
      setName(profile.username || '');
      setEmail(profile.email || '');
      setMobile(profile.phoneNumber || '');
      setAddress(profile.address || '');
      setdateOfBirth(profile.dateOfBirth || '');
      setNearestMasjid(profile.masjid || '');

      // Set initial date for picker if dateOfBirth exists
      if (profile.dateOfBirth) {
        const parsedDate = new Date(profile.dateOfBirth);
        if (!isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate);
        }
      }
    }
  }, [profile]);

  // Handle date picker change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');

    if (selectedDate) {
      setSelectedDate(selectedDate);
      // Format date as string for display
      const formattedDate = selectedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      setdateOfBirth(formattedDate);
    }
  }; // Show date picker
  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  // Handle profile picture update
  const handleProfilePictureUpdate = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => {
            // Future: Implement camera functionality
            Alert.alert('Camera', 'Camera functionality will be implemented');
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            // Future: Implement gallery functionality
            Alert.alert('Gallery', 'Gallery functionality will be implemented');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {cancelable: true},
    );
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile: string): boolean => {
    const mobileRegex = /^[+]?[0-9]{10,15}$/;
    return mobileRegex.test(mobile.replace(/\s/g, ''));
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Mobile validation
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!validateMobile(mobile)) {
      newErrors.mobile = 'Please enter a valid mobile number (10-15 digits)';
    }

    // Address validation
    if (!address.trim()) {
      newErrors.address = 'Address is required';
    } else if (address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters';
    }

    // Masjid validation
    if (!nearestMasjid.trim()) {
      newErrors.nearestMasjid = 'Nearest masjid is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSaveChanges = async () => {
    // Clear previous errors
    setErrors({});

    // Validate form before saving
    if (!validateForm()) {
      setIsLoading(false);
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }

    try {
      setIsLoading(true);

      // Create update data object
      const updateData: UserUpdateData = {
        username: name,
        email: email,
        phoneNumber: mobile,
        address: address,
        dateOfBirth: dateOfBirth,
        masjid: nearestMasjid,
      };

      // // Use unified user system to update profile
      // await updateProfile(updateData);

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      {/* Header with Back Button */}
      <View style={styles.header}>
        <Pressable
          style={({pressed}) => [
            styles.backButton,
            pressed && styles.pressedState,
          ]}
          onPress={() => navigation.goBack()}>
          <SvgIcon name="backBtn" size={28} color={colors.text.dark} />
        </Pressable>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                profile?.profileImage
                  ? {uri: profile.profileImage}
                  : require('../assets/images/profile.png')
              }
              style={styles.profileImage}
            />
            <Pressable
              style={({pressed}) => [
                styles.cameraButton,
                pressed && styles.pressedState,
              ]}
              onPress={handleProfilePictureUpdate}>
              <SvgIcon name="camera" size={30} color={colors.white} />
            </Pressable>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.memberSince}>
            Member Since {profile?.memberSince || 'Recently'}
          </Text>
        </View>
        {/* Form Fields */}
        <View style={styles.formContainer}>
          <InputWithLabel
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            error={errors.name}
          />
          <InputWithLabel
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            keyboardType="email-address"
            error={errors.email}
          />
          <InputWithLabel
            label="Mobile"
            value={mobile}
            onChangeText={setMobile}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
            error={errors.mobile}
          />
          <InputWithLabel
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your address"
            multiline={true}
            error={errors.address}
          />
          <DateInput
            label="Date Of Birth"
            value={dateOfBirth}
            onPress={showDatePickerModal}
          />
          {/* Date Picker Modal */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
          <InputWithLabel
            label="Nearest Masjid"
            value={nearestMasjid}
            onChangeText={setNearestMasjid}
            placeholder="Enter nearest masjid name"
            error={errors.nearestMasjid}
          />
        </View>
        {/* Save Button */}
        <Pressable
          style={({pressed}) => [
            styles.saveButton,
            isLoading && styles.saveButtonDisabled,
            pressed && !isLoading && styles.pressedState,
          ]}
          onPress={handleSaveChanges}
          disabled={isLoading}>
          <Text style={styles.saveButtonText}>
            {isLoading ? <LoadingDots /> : 'Save Changes'}
          </Text>
        </Pressable>
        <View style={{height: spacing.xl}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: colors.white,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.light,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.white,
  },
  profileName: {
    ...typography.headerProfile,
    color: colors.text.dark,
    marginBottom: 4,
  },
  memberSince: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  formContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.bodyMedium,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.dark,
    backgroundColor: colors.white,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  dateText: {
    ...typography.body,
    color: colors.text.dark,
  },
  placeholderText: {
    color: colors.text.muted,
  },
  saveButton: {
    backgroundColor: colors.text.muted,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.white,
  },
  pressedState: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
  inputError: {
    borderColor: colors.error || '#FF6B6B',
    borderWidth: 2,
  },
  errorText: {
    ...typography.bodyTiny,
    color: colors.error || '#FF6B6B',
    marginTop: 4,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 1,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 48,
    paddingTop: spacing.xxl,
    height: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderRadius: 24,
  },
});

export default EditProfileScreen;
