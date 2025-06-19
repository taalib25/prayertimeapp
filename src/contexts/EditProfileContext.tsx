import React, {createContext, useContext, useState, useEffect} from 'react';
import {Alert} from 'react-native';
import {useAppUser} from '../hooks/useUnifiedUser';
import {UserUpdateData} from '../types/User';

interface FormData {
  name: string;
  email: string;
  mobile: string;
  address: string;
  dateOfBirth: string;
  nearestMasjid: string;
}

interface FormErrors {
  [key: string]: string;
}

interface EditProfileContextType {
  formData: FormData;
  errors: FormErrors;
  isLoading: boolean;
  updateField: (field: keyof FormData, value: string) => void;
  validateForm: () => boolean;
  handleSave: () => Promise<void>;
  clearErrors: () => void;
  setFieldError: (field: string, error: string) => void;
}

const EditProfileContext = createContext<EditProfileContextType | undefined>(
  undefined,
);

export const useEditProfile = () => {
  const context = useContext(EditProfileContext);
  if (!context) {
    throw new Error('useEditProfile must be used within EditProfileProvider');
  }
  return context;
};

interface EditProfileProviderProps {
  children: React.ReactNode;
}

export const EditProfileProvider: React.FC<EditProfileProviderProps> = ({
  children,
}) => {
  const {profile, updateProfile} = useAppUser();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    mobile: '',
    address: '',
    dateOfBirth: '',
    nearestMasjid: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load user data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.username || '',
        email: profile.email || '',
        mobile: profile.phoneNumber || '',
        address: profile.address || '',
        dateOfBirth: profile.dateOfBirth || '',
        nearestMasjid: profile.masjid || '',
      });
    }
  }, [profile]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: ''}));
    }
  };

  const clearErrors = () => {
    setErrors({});
  };

  const setFieldError = (field: string, error: string) => {
    setErrors(prev => ({...prev, [field]: error}));
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
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Mobile validation
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!validateMobile(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid mobile number (10-15 digits)';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters';
    }

    // Masjid validation
    if (!formData.nearestMasjid.trim()) {
      newErrors.nearestMasjid = 'Nearest masjid is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    clearErrors();

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }

    try {
      setIsLoading(true);

      const updateData: UserUpdateData = {
        username: formData.name,
        email: formData.email,
        phoneNumber: formData.mobile,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        masjid: formData.nearestMasjid,
      };

      // Uncomment when ready to save
      // await updateProfile(updateData);

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const value: EditProfileContextType = {
    formData,
    errors,
    isLoading,
    updateField,
    validateForm,
    handleSave,
    clearErrors,
    setFieldError,
  };

  return (
    <EditProfileContext.Provider value={value}>
      {children}
    </EditProfileContext.Provider>
  );
};
