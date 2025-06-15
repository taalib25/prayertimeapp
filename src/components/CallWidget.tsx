import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SvgIcon from './SvgIcon';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';

interface CallWidgetProps {
  onCallPreferenceSet: (needsCall: boolean) => void;
}

const STORAGE_KEY = 'prayer_app_call_preference';

const CallWidget: React.FC<CallWidgetProps> = ({onCallPreferenceSet}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);

  useEffect(() => {
    checkIfFirstTimeUser();
  }, []);

  const checkIfFirstTimeUser = async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      if (value === null) {
        // First time user, show the widget
        setIsVisible(true);
      } else {
        // User has already responded, check if they wanted calls
        const preference = JSON.parse(value);
        setHasResponded(true);
        if (preference.needsCall) {
          setIsVisible(true); // Show section if user wants calls
        }
      }
    } catch (error) {
      console.error('Error checking first time user status:', error);
    }
  };

  const handlePreference = async (needsCall: boolean) => {
    try {
      // Save the user's preference
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({needsCall}));
      setHasResponded(true);

      if (needsCall) {
        setIsVisible(true); // Keep showing if they want calls
      } else {
        setIsVisible(false); // Hide if they don't want calls
      }

      // Call the callback function
      onCallPreferenceSet(needsCall);
    } catch (error) {
      console.error('Error saving call preference:', error);
    }
  };
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header row with moon icon and title */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>
         Do you want a wake-up call for daily Fajr prayer?
        </Text>
        <View style={styles.iconContainer}>
          <SvgIcon name="callMoon" size={78} color="#FFD700" />
        </View>
        
      </View>

      {!hasResponded ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.yesButton}
            onPress={() => handlePreference(true)}>
            <Text style={styles.yesButtonText}>Yes, I need a call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.noButton}
            onPress={() => handlePreference(false)}>
            <Text style={styles.yesButtonText}>No, I'll wake up myself</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.activeContainer}>
          <Text style={styles.activeText}>
            ✓ Wake-up call service is active
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setHasResponded(false)}>
            <Text style={styles.settingsButtonText}>Change Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2554',
    borderRadius: 12,
    padding: 20,
    paddingTop: 9,
    paddingBottom: 26,
    marginHorizontal: 5,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    // gap: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    color: '#FFFFFF',
    flex: 1,
  },
  buttonContainer: {
    gap: 16,
  },
  yesButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 120,
    padding: 12,
  },
  yesButtonText: {
    ...typography.headerProfile,
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 18,
  },
  noButton: {
    backgroundColor: '#3498db',
    borderRadius: 120,
    padding: 12,
  },
  noButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  activeContainer: {
    alignItems: 'center',
    gap: 12,
  },
  activeText: {
    ...typography.bodyLarge,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default CallWidget;
