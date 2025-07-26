// EditProfileContext.tsx - Updated with fullName and area
import React, {createContext, useContext, useState, useEffect} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useUser} from '../hooks/useUser';
import {UserUpdate} from '../types/User';
import ApiTaskServices from '../services/apiHandler';

// Updated FormData interface
interface FormData {
  fullName: string;  // Changed from firstName/lastName
  email: string;
  mobile: string;
  address: string;
  area: string;      // New field
  mobility: string;
  mobilityOther: string;
  dateOfBirth: string;
  // Additional information flags
  mosqueName: string;
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

  // Updated initial form data
  const [formData, setFormData] = useState<FormData>({
    fullName: '',       // Changed from firstName/lastName
    email: '',
    mobile: '',
    address: '',
    area: '',           // New field
    mobility: '',
    mosqueName: '',
    mobilityOther: '',
    dateOfBirth: '',
    livingOnRent: false,
    zakatEligible: false,
    differentlyAbled: false,
    muallafathiQuloob: false,
  });

  // Updated original data store
  const [originalData, setOriginalData] = useState<FormData>({
    fullName: '',       // Changed from firstName/lastName
    email: '',
    mobile: '',
    address: '',
    area: '',           // New field
    mosqueName: '',
    mobility: '',
    mobilityOther: '',
    dateOfBirth: '',
    livingOnRent: false,
    zakatEligible: false,
    differentlyAbled: false,
    muallafathiQuloob: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Updated useEffect to load user data
  useEffect(() => {
    if (user) {
      const userData = {
        fullName: user.fullName || '',        // Changed from firstName/lastName
        email: user.email || '',
        mobile: user.phone || '',
        address: user.address || '',
        area: user.area || '',                // New field
        mobility: user.mobility || '',
        mosqueName: user.mosqueName || '',
        mobilityOther: '', 
        dateOfBirth: user.dateOfBirth || '',
        livingOnRent: user.onRent || false,
        zakatEligible: user.zakathEligible || false,
        differentlyAbled: user.differentlyAbled || false,
        muallafathiQuloob: user.MuallafathilQuloob || false,
      };

      setFormData(userData);
      setOriginalData(userData);
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

  // Validation functions remain the same
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile: string): boolean => {
    const mobileRegex = /^[+]?[0-9]{10,15}$/;
    return mobileRegex.test(mobile.replace(/\s/g, ''));
  };

  // Updated validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full Name validation (replaces firstName/lastName)
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
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

    // Address validation - make optional for better UX
    if (formData.address.trim() && formData.address.trim().length < 5) {
      newErrors.address = 'Location must be at least 5 characters';
    }

  // Area validation - optional but validate if provided
  if (formData.area && formData.area.trim().length < 2) {
    newErrors.area = 'Please select a valid area';
  }

  // Mobility validation
  if (formData.mobility === 'other' && !formData.mobilityOther.trim()) {
    newErrors.mobilityOther = 'Please specify your mobility option';
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
  };

  // Updated API mapping function
  const mapToApiFields = (changedData: Record<string, string | boolean>) => {
    const apiData: any = {};

    // Map form fields to expected API field names
    if (changedData.fullName !== undefined) {
      apiData.fullName = changedData.fullName;
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
    if (changedData.area !== undefined) {
      apiData.area = changedData.area;
    }
    if (changedData.mobility !== undefined) {
      apiData.mobility = changedData.mobility;
    }
    if (changedData.mosqueName !== undefined) {
      apiData.mosqueName = changedData.mosqueName;
    }
    if (changedData.dateOfBirth !== undefined) {
      apiData.dateOfBirth = changedData.dateOfBirth;
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
          throw new Error(
            apiResponse.error || 'Failed to update profile via API',
          );
        }
        console.log('✅ EditProfile: API update successful');
      }

      // Updated local user data mapping
      const userUpdateData: UserUpdate = {
        fullName: formData.fullName,          // Changed from firstName/lastName
        email: formData.email,
        phone: formData.mobile,
        address: formData.address,
        area: formData.area,                  // New field
        mobility: formData.mobility,
        mosqueName: formData.mosqueName,
        dateOfBirth: formData.dateOfBirth,
        onRent: formData.livingOnRent,
        zakathEligible: formData.zakatEligible,
        differentlyAbled: formData.differentlyAbled,
        MuallafathilQuloob: formData.muallafathiQuloob,
      };

      // Update local storage
      await updateUser(userUpdateData);

      // Update original data to reflect the saved state
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
