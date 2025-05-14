import { Platform, Linking, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

// Define permission types our app might need
export enum PermissionType {
  LOCATION = 'location',
//   NOTIFICATIONS = 'notifications',
  MOTION = 'motion',
}

// Map permission types to actual permission constants
const PERMISSION_MAP = {
  [PermissionType.LOCATION]: Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    default: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  }),

  [PermissionType.MOTION]: Platform.select({
    ios: PERMISSIONS.IOS.MOTION,
    android: PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION,
    default: PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION,
  }),
};

// Messages for permissions
const PERMISSION_MESSAGES = {
  [PermissionType.LOCATION]: {
    title: 'Location Permission Required',
    message: 'Prayer times and Qibla direction require your location to be accurate.',
    settingsMessage: 'Location permission is required for accurate prayer times and Qibla direction. Please enable it in your device settings.',
  },
  [PermissionType.MOTION]: {
    title: 'Motion Permission Required',
    message: 'Motion data is needed to show Qibla direction accurately.',
    settingsMessage: 'Motion permission is required for Qibla direction. Please enable it in your device settings.',
  }
};

/**
 * Check the status of a permission
 */
export const checkPermission = async (type: PermissionType): Promise<string> => {
  try {
    const permission = PERMISSION_MAP[type] as Permission;
    const status = await check(permission);
    return status;
  } catch (error) {
    console.error(`Error checking ${type} permission:`, error);
    return RESULTS.UNAVAILABLE;
  }
};

/**
 * Request a permission
 */
export const requestPermission = async (type: PermissionType): Promise<string> => {
  try {
    const permission = PERMISSION_MAP[type] as Permission;
    const status = await request(permission);
    
    if (status === RESULTS.DENIED) {
      showPermissionAlert(type);
    } else if (status === RESULTS.BLOCKED) {
      showSettingsAlert(type);
    }
    
    return status;
  } catch (error) {
    console.error(`Error requesting ${type} permission:`, error);
    return RESULTS.UNAVAILABLE;
  }
};

/**
 * Show an alert explaining why the permission is needed
 */
const showPermissionAlert = (type: PermissionType): void => {
  const { title, message } = PERMISSION_MESSAGES[type];
  Alert.alert(
    title,
    message,
    [{ text: 'OK' }]
  );
};

/**
 * Show an alert prompting the user to open settings
 */
export const showSettingsAlert = (type: PermissionType): void => {
  const { title, settingsMessage } = PERMISSION_MESSAGES[type];
  Alert.alert(
    title,
    settingsMessage,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: openSettings }
    ]
  );
};

/**
 * Open device settings
 */
export const openSettings = (): void => {
  Linking.openSettings().catch(() => {
    Alert.alert('Unable to open settings');
  });
};