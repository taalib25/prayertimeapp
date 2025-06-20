import React, {createContext, useContext, useState, useEffect} from 'react';
import {User} from '../types/User';
import UserService from '../services/UserService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userService = UserService.getInstance();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Check if user is authenticated
      const isAuth = await userService.isAuthenticated();

      if (isAuth) {
        // Load user data
        const userData = await userService.getUser();
        setUser(userData);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking auth state:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, phoneNumber: string) => {
    try {
      // Create user data
      const userData = await userService.createUser({
        username: email.split('@')[0],
        email,
        phoneNumber,
        location: 'Colombo, LK',
        masjid: 'Masjid Ul Jabbar Jumma Masjid, Gothatuwa',
      });

      // Set auth token
      await userService.setAuthToken('user_authenticated');

      setUser(userData);
    } catch (error) {
      console.error('Error during login:', error);
      throw new Error('Failed to login');
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout process...');

      // Clear all data
      await userService.clearAllData();

      setUser(null);
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, we should still set user to null
      setUser(null);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      try {
        const updatedUser = await userService.updateUser(userData);
        setUser(updatedUser);
      } catch (error) {
        console.error('Error updating user:', error);
        throw new Error('Failed to update user data');
      }
    }
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuthState,
        updateUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
