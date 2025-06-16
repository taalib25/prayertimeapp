import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthUser, USER_STORAGE_KEYS} from '../types/User';
import UnifiedUserService from '../services/UnifiedUserService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => void;
  isLoading: boolean;
  checkAuthState: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userService = UnifiedUserService.getInstance();

  useEffect(() => {
    checkAuthState();
  }, []);
  const checkAuthState = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEYS.AUTH_USER);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking auth state:', error);
      await AsyncStorage.removeItem(USER_STORAGE_KEYS.AUTH_USER);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  const login = async (email: string, phoneNumber: string) => {
    try {
      // Use consistent user ID (1001) for API compatibility
      const userId = '1001';

      const userData: AuthUser = {
        id: userId,
        email,
        phoneNumber,
        isVerified: true,
        name: email.split('@')[0],
        createdAt: new Date().toISOString(),
      };

      await userService.saveAuthUser(userData);
      setUser(userData);

      // Create/update user profile data using the unified service
      const uid = parseInt(userId);
      await createUserProfileData(uid, userData);
    } catch (error) {
      console.error('Error during login:', error);
      throw new Error('Failed to save user data');
    }
  };
  // Separate function to handle user profile creation using unified service
  const createUserProfileData = async (uid: number, userData: AuthUser) => {
    try {
      // Check if user profile already exists
      const existingUser = await userService.getUserById(uid);

      if (!existingUser) {
        // Create new user profile
        await userService.createUser(
          uid,
          {
            username: userData.name || userData.email.split('@')[0],
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            location: 'Cairo, Egypt',
            masjid: 'Al-Azhar Mosque',
          },
          {
            monthlyZikrGoal: 1000,
            monthlyQuranPagesGoal: 30,
            monthlyCharityGoal: 100,
            monthlyFastingDaysGoal: 15,
          },
          {
            prayerSettings: 'standard',
            preferredMadhab: 'hanafi',
            appLanguage: 'en',
            theme: 'light',
            location: 'Cairo, Egypt',
            masjid: 'Al-Azhar Mosque',
          },
        );
      }
    } catch (error) {
      console.error('Error creating user profile data:', error);
    }
  };
  const logout = async () => {
    try {
      console.log('Starting logout process...');

      // Remove auth user data
      await userService.removeAuthUser();
      console.log('Auth user data removed');

      // Reset call preference to allow CallWidget to show again for new user
      await AsyncStorage.removeItem(USER_STORAGE_KEYS.CALL_PREFERENCE);
      console.log('Call preference reset');

      setUser(null);
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, we should still set user to null
      setUser(null);
    }
  };

  const updateUser = async (userData: Partial<AuthUser>) => {
    if (user) {
      try {
        const updatedUser = {...user, ...userData};
        await userService.saveAuthUser(updatedUser);
        setUser(updatedUser);
      } catch (error) {
        console.error('Error updating user:', error);
        throw new Error('Failed to update user data');
      }
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    isLoading,
    checkAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
