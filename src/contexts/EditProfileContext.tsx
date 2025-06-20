import React, {createContext, useContext, useState, useEffect} from 'react';
import {Alert} from 'react-native';
import {useUser} from '../hooks/useUser';
import {UserUpdate} from '../types/User';

interface FormData {
  name: string;
  email: string;
  mobile: string;
  address: string;
  mobility: string;
  mobilityOther: string;
  dateOfBirth: string;
  nearestMasjid: string;
  // Additional information flags
  livingOnRent: boolean;
  zakatEligible: boolean;
  differentlyAbled: boolean;
  muallafathiQuloob: boolean;
}

interface FormErrors {
  [key: string]: string;
}

interface EditProfileContextType {
  formData: FormData;
  errors: FormErrors;
  isLoading: boolean;
  updateField: (field: keyof FormData, value: string | boolean) => void;
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
  const {user, updateUser} = useUser();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    mobile: '',
    address: '',
    mobility: '',
    mobilityOther: '',
    dateOfBirth: '',
    nearestMasjid: '',
    livingOnRent: false,
    zakatEligible: false,
    differentlyAbled: false,
    muallafathiQuloob: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false); // Load user data from user
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.username || '',
        email: user.email || '',
        mobile: user.phoneNumber || '',
        address: user.location || '',
        mobility: user.mobility || '',
        mobilityOther: user.mobilityOther || '',
        dateOfBirth: '',
        nearestMasjid: user.masjid || '',
        livingOnRent: user.livingOnRent || false,
        zakatEligible: user.zakatEligible || false,
        differentlyAbled: user.differentlyAbled || false,
        muallafathiQuloob: user.muallafathiQuloob || false,
      });
    }
  }, [user]);
  const updateField = (field: keyof FormData, value: string | boolean) => {
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
      newErrors.name = 'Username is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Username must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Mobile validation
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Phone number is required';
    } else if (!validateMobile(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid phone number (10-15 digits)';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Location is required';
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Location must be at least 5 characters';
    }

    // Mobility validation
    if (!formData.mobility) {
      newErrors.mobility = 'Please select mobility option';
    } else if (
      formData.mobility === 'other' &&
      !formData.mobilityOther.trim()
    ) {
      newErrors.mobilityOther = 'Please specify your mobility option';
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
      return;
    }

    try {
      setIsLoading(true);
      const updateData: UserUpdate = {
        username: formData.name,
        email: formData.email,
        phoneNumber: formData.mobile,
        location: formData.address,
        mobility: formData.mobility,
        mobilityOther: formData.mobilityOther,
        masjid: formData.nearestMasjid,
        livingOnRent: formData.livingOnRent,
        zakatEligible: formData.zakatEligible,
        differentlyAbled: formData.differentlyAbled,
        muallafathiQuloob: formData.muallafathiQuloob,
      };

      // Update user data
      await updateUser(updateData);

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
