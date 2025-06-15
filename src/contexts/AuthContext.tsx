import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  phoneNumber: string;
  isVerified: boolean;
  name?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
  checkAuthState: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@prayer_app_user';

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking auth state:', error);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, phoneNumber: string) => {
    try {
      // Use consistent user ID (1001) for API compatibility
      const userId = '1001';

      const userData: User = {
        id: userId,
        email,
        phoneNumber,
        isVerified: true,
        name: email.split('@')[0],
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      
      // This part will be replaced by API call that returns user profile data
      // For now, create dummy data with consistent UID
      const uid = parseInt(userId);
      await createUserProfileData(uid, userData);
    } catch (error) {
      console.error('Error during login:', error);
      throw new Error('Failed to save user data');
    }
  };

  // Separate function to handle user profile creation (will be replaced by API response handling)
  const createUserProfileData = async (uid: number, userData: User) => {
    const userProfileKey = `user_${uid}_profile`;
    const userGoalsKey = `user_${uid}_goals`;
    const userSettingsKey = `user_${uid}_settings`;

    const existingProfile = await AsyncStorage.getItem(userProfileKey);

    if (!existingProfile) {
      // This data structure should match your API response
      const profile = {
        username: userData.name || userData.email.split('@')[0],
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        createdAt: userData.createdAt,
      };

      const defaultGoals = {
        monthlyZikrGoal: 1000,
        monthlyQuranPagesGoal: 30,
        monthlyCharityGoal: 100,
        monthlyFastingDaysGoal: 15,
      };

      const defaultSettings = {
        prayerSettings: 'standard',
        preferredMadhab: 'hanafi',
        appLanguage: 'en',
        theme: 'light',
        location: 'Cairo, Egypt',
        masjid: 'Al-Azhar Mosque',
      };

      await Promise.all([
        AsyncStorage.setItem(userProfileKey, JSON.stringify(profile)),
        AsyncStorage.setItem(userGoalsKey, JSON.stringify(defaultGoals)),
        AsyncStorage.setItem(userSettingsKey, JSON.stringify(defaultSettings)),
      ]);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.clear();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      setUser(null);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      try {
        const updatedUser = {...user, ...userData};
        await AsyncStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify(updatedUser),
        );
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
