import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';

interface LogoutButtonProps {
  onLogout?: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({onLogout}) => {
  const {logout} = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={handleLogout}
      disabled={isLoading}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.logoutText}>Logout</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  logoutText: {
    ...typography.button,
    color: colors.white,
  },
});

export default LogoutButton;
