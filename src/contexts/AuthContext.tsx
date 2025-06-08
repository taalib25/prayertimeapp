import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createUser, getUserById} from '../services/db/UserServices';

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
      // Clear invalid stored data
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, phoneNumber: string) => {
    try {
      const userData: User = {
        id: Date.now().toString(),
        email,
        phoneNumber,
        isVerified: true,
        name: email.split('@')[0], // Use part before @ as default name
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);

      // Initialize user profile in the separate user storage system
      const uid = parseInt(userData.id) || 1001;
      const existingUser = await getUserById(uid);

      if (!existingUser) {
        await createUser(uid, {
          username: userData.name || email.split('@')[0],
          email: userData.email,
          phoneNumber: userData.phoneNumber,
        });
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw new Error('Failed to save user data');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear user state even if storage removal fails
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
