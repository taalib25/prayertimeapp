import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SvgIcon from '../components/SvgIcon';
import {colors, spacing, borderRadius} from '../utils/theme';

interface InputWithLabelProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
}

const InputWithLabel: React.FC<InputWithLabelProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
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
      <TouchableOpacity style={styles.dateInput} onPress={onPress}>
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {value || 'Select date'}
        </Text>
        <SvgIcon name="calendar" size={20} color={colors.text.muted} />
      </TouchableOpacity>
    </View>
  );
};

// Main EditProfileScreen component
const EditProfileScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState('');
  const [nearestMasjid, setNearestMasjid] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load user data from AsyncStorage
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const profileData = await AsyncStorage.getItem('userProfile');
      if (profileData) {
        const userData = JSON.parse(profileData);
        setName(userData.username || '');
        setEmail(userData.email || '');
        setMobile(userData.mobile || '');
        setAddress(userData.address || '');
        setBirthday(userData.birthday || '');
        setNearestMasjid(userData.masjid || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);

      // Get existing profile data
      const existingData = await AsyncStorage.getItem('userProfile');
      const currentData = existingData ? JSON.parse(existingData) : {};

      // Update with new data
      const updatedProfile = {
        ...currentData,
        username: name,
        email: email,
        mobile: mobile,
        address: address,
        birthday: birthday,
        masjid: nearestMasjid,
      };

      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));

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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require('../assets/images/profile.png')}
              style={styles.profileImage}
            />
            <View style={styles.statusIndicator} />
          </View>
          <Text style={styles.profileName}>Mohamed Hijaz</Text>
          <Text style={styles.memberSince}>Member Since Sep 2024</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <InputWithLabel
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
          />

          <InputWithLabel
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            keyboardType="email-address"
          />

          <InputWithLabel
            label="Mobile"
            value={mobile}
            onChangeText={setMobile}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
          />

          <InputWithLabel
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your address"
            multiline={true}
          />

          <DateInput
            label="Birthday"
            value={birthday}
            onPress={() => {
              // Future: Add date picker functionality
              Alert.alert(
                'Date Picker',
                'Date picker functionality will be added',
              );
            }}
          />

          <InputWithLabel
            label="Nearest Masjid"
            value={nearestMasjid}
            onChangeText={setNearestMasjid}
            placeholder="Enter nearest masjid name"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSaveChanges}
          disabled={isLoading}>
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.dark,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
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
    fontSize: 16,
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
    color: colors.white,
    fontSize: 16,
  },
});

export default EditProfileScreen;
