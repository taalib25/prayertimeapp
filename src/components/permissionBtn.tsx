import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { RESULTS } from 'react-native-permissions';
import { PermissionType, checkPermission, requestPermission } from '../services/permissions/initPermissions';


interface PermissionButtonProps {
  permissionType: PermissionType;
  onPermissionGranted?: () => void;
  buttonText?: string;
  style?: object;
  textStyle?: object;
}

const PermissionButton: React.FC<PermissionButtonProps> = ({
  permissionType,
  onPermissionGranted,
  buttonText = 'Enable Permission',
  style,
  textStyle,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    setLoading(true);
    try {
      const status = await checkPermission(permissionType);
      setPermissionStatus(status);
      
      if (status === RESULTS.GRANTED && onPermissionGranted) {
        onPermissionGranted();
      }
    } catch (error) {
      console.error(`Error checking ${permissionType} permission:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    
    try {
      const status = await requestPermission(permissionType);
      setPermissionStatus(status);
      
      if (status === RESULTS.GRANTED && onPermissionGranted) {
        onPermissionGranted();
      }
    } catch (error) {
      console.error(`Error requesting ${permissionType} permission:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Determine button text based on permission status
  const getButtonText = () => {
    if (loading) return 'Checking...';
    
    switch (permissionStatus) {
      case RESULTS.GRANTED:
        return `${permissionType} Enabled`;
      case RESULTS.DENIED:
      case RESULTS.BLOCKED:
        return buttonText;
      default:
        return `Check ${permissionType} Permission`;
    }
  };

  // Determine if button should be disabled
  const isDisabled = permissionStatus === RESULTS.GRANTED;

  return (
    <TouchableOpacity 
      style={[
        styles.button,
        isDisabled ? styles.buttonDisabled : styles.buttonEnabled,
        style
      ]}
      onPress={handleRequestPermission}
      disabled={isDisabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>
          {getButtonText()}
        </Text>
      )}
      {permissionStatus === RESULTS.GRANTED && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonEnabled: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  checkmark: {
    marginLeft: 8,
    backgroundColor: 'white',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  }
});

export default PermissionButton;