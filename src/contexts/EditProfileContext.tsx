import React, {createContext, useContext, useState, useEffect} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useUser} from '../hooks/useUser';
import {UserUpdate} from '../types/User';
import ApiTaskServices from '../services/apiHandler';

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
  const {user, updateUser, refresh} = useUser();
  const navigation = useNavigation();
  const apiService = ApiTaskServices.getInstance();

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

  // Store original user data to track changes
  const [originalData, setOriginalData] = useState<FormData>({
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
      const userData = {
        name: user.username || '',
        email: user.email || '',
        mobile: user.phone || '',
        address: user.address || '',
        mobility: user.mobility || '',
        mobilityOther: '', // This field doesn't exist in User type, set to empty
        dateOfBirth: user.dateOfBirth || '',
        nearestMasjid: user.mosqueName || '',
        livingOnRent: user.onRent || false,
        zakatEligible: user.zakathEligible || false,
        differentlyAbled: user.differentlyAbled || false,
        muallafathiQuloob: user.MuallafathilQuloob || false,
      };

      setFormData(userData);
      setOriginalData(userData); // Store original data for comparison
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
  // Helper function to get only changed fields
  const getChangedFields = (): Record<string, string | boolean> => {
    const changes: Record<string, string | boolean> = {};

    // Compare each field with original data
    Object.keys(formData).forEach(key => {
      const fieldKey = key as keyof FormData;
      if (formData[fieldKey] !== originalData[fieldKey]) {
        changes[fieldKey] = formData[fieldKey];
      }
    });

    return changes;
  }; // Map form fields to API field names for profile update
  const mapToApiFields = (changedData: Record<string, string | boolean>) => {
    const apiData: any = {};

    // Map form fields to expected API field names
    if (changedData.name !== undefined) {
      apiData.username = changedData.name;
    }
    if (changedData.email !== undefined) {
      apiData.email = changedData.email;
    }
    if (changedData.mobile !== undefined) {
      apiData.phone = changedData.mobile;
    }
    if (changedData.address !== undefined) {
      apiData.address = changedData.address;
    }
    if (changedData.mobility !== undefined) {
      apiData.mobility = changedData.mobility;
    }
    if (changedData.dateOfBirth !== undefined) {
      apiData.dateOfBirth = changedData.dateOfBirth;
    }
    if (changedData.nearestMasjid !== undefined) {
      apiData.mosqueName = changedData.nearestMasjid;
    }
    if (changedData.livingOnRent !== undefined) {
      apiData.onRent = changedData.livingOnRent;
    }
    if (changedData.zakatEligible !== undefined) {
      apiData.zakathEligible = changedData.zakatEligible;
    }
    if (changedData.differentlyAbled !== undefined) {
      apiData.differentlyAbled = changedData.differentlyAbled;
    }
    if (changedData.muallafathiQuloob !== undefined) {
      apiData.MuallafathilQuloob = changedData.muallafathiQuloob;
    }

    return apiData;
  };
  const handleSave = async () => {
    clearErrors();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Get only the fields that have changed
      const changedFields = getChangedFields();
    
      if (Object.keys(changedFields).length > 0) {
        // Map form fields to API field names and update
        const apiUpdateData = mapToApiFields(changedFields);
        const apiResponse = await apiService.updateUserProfile(apiUpdateData);

        if (!apiResponse.success) {
          throw new Error(apiResponse.error || 'Failed to update profile via API');
        }
        console.log('✅ EditProfile: API update successful');
      }

      console.log('✅ EditProfile: API update successful'); // Update local user data with the same changes
      const userUpdateData: UserUpdate = {
        username: formData.name,
        email: formData.email,
        phone: formData.mobile,
        address: formData.address,
        mobility: formData.mobility,
        dateOfBirth: formData.dateOfBirth,
        mosqueName: formData.nearestMasjid,
        onRent: formData.livingOnRent,
        zakathEligible: formData.zakatEligible,
        differentlyAbled: formData.differentlyAbled,
        MuallafathilQuloob: formData.muallafathiQuloob,
      };

      // Update local storage
      await updateUser(userUpdateData); // Update original data to reflect the saved state
      setOriginalData({...formData});

      // Refresh global user context to propagate changes everywhere
      if (typeof refresh === 'function') {
        await refresh();
      }

      navigation.goBack();
    } catch (error) {
      console.error('❌ EditProfile: Error saving profile:', error);
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
