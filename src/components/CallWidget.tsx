import React, {useState, useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated, Alert} from 'react-native';
import SvgIcon from './SvgIcon';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import UserService from '../services/UserService';
import {getTomorrowDateString} from '../utils/helpers';
import UnifiedNotificationService from '../services/notifications/CallerServices';

interface CallWidgetProps {
  onCallPreferenceSet: (needsCall: boolean) => void;
}

const CallWidget: React.FC<CallWidgetProps> = ({onCallPreferenceSet}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const userService = UserService.getInstance();

  // Default settings for first-time users
  const DEFAULT_DURATION = 10; // 10 minutes
  const DEFAULT_TIMING = 'before'; // before Fajr

  useEffect(() => {
    checkIfFirstTimeUser();
  }, []);

  const checkIfFirstTimeUser = async () => {
    try {
      const systemData = await userService.getSystemData();
   if (systemData.callPreference === null) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error checking first time user status:', error);
    }
  };

  const setupInitialFajrCall = async () => {
    try {
      // Get tomorrow's Fajr time
      const tomorrowDate = getTomorrowDateString();
      const prayerTimesData = await userService.getPrayerTimesForDate(tomorrowDate!);
      
      if (!prayerTimesData?.fajr) {
        console.error('No Fajr time available for scheduling');
        return false;
      }

      const fajrTime = prayerTimesData.fajr;
      console.log('Setting up initial Fajr call for:', fajrTime);

      // Calculate reminder time (10 minutes before Fajr by default)
      const reminderTime = calculateReminderTime(fajrTime, DEFAULT_DURATION, DEFAULT_TIMING);
      
      // Schedule the fake call
      const notificationService = UnifiedNotificationService.getInstance();
      const callId = await notificationService.scheduleFajrFakeCall(reminderTime, fajrTime);

      if (callId) {
        console.log('Initial Fajr call scheduled successfully for:', reminderTime);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error setting up initial Fajr call:', error);
      return false;
    }
  };

  const calculateReminderTime = (fajrTime: string, duration: number, timing: string) => {
    const [hours, minutes] = fajrTime.split(':').map(Number);
    const fajrMinutes = hours * 60 + minutes;

    let reminderMinutes = timing === 'before' 
      ? fajrMinutes - duration 
      : fajrMinutes + duration;

    // Handle day overflow/underflow
    if (reminderMinutes < 0) reminderMinutes += 24 * 60;
    else if (reminderMinutes >= 24 * 60) reminderMinutes -= 24 * 60;

    const reminderHours = Math.floor(reminderMinutes / 60);
    const reminderMins = reminderMinutes % 60;
    
    return `${reminderHours.toString().padStart(2, '0')}:${reminderMins.toString().padStart(2, '0')}`;
  };

  const handlePreference = async (needsCall: boolean) => {
    try {
      // Start fade-out animation immediately
      setIsFadingOut(true);

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(async () => {
        try {
          // Save preference and default settings
          await userService.updateSystemData({
            callPreference: needsCall,
            fajrReminderDuration: needsCall ? DEFAULT_DURATION : null,
            fajrReminderTiming: needsCall ? DEFAULT_TIMING : null,
          });

          // If user wants calls, automatically set up the first one
          if (needsCall) {
            const setupSuccess = await setupInitialFajrCall();
            
            if (setupSuccess) {
              // Show success message
              setTimeout(() => {
                Alert.alert(
                  'Wake-Up Call Enabled ✅',
                  `Great! Your Fajr wake-up call has been automatically scheduled.\n\n• Default: 10 minutes before Fajr\n• You can customize this in Settings anytime`,
                  [{text: 'Got it!', style: 'default'}],
                );
              }, 600);
            } else {
              // Show warning if scheduling failed
              setTimeout(() => {
                Alert.alert(
                  'Setup Incomplete ⚠️',
                  'Your preference has been saved, but please visit Caller Settings to complete the setup.',
                  [{text: 'OK', style: 'default'}],
                );
              }, 600);
            }
          }

          setIsVisible(false);
          onCallPreferenceSet(needsCall);
        } catch (error) {
          console.error('Error in handlePreference completion:', error);
          setIsVisible(false);
          onCallPreferenceSet(needsCall);
        }
      });
    } catch (error) {
      console.error('Error saving call preference:', error);
      // Reset animation on error
      fadeAnim.setValue(1);
      setIsFadingOut(false);
      
      Alert.alert(
        'Error ❌', 
        'Failed to save your preference. Please try again.',
        [{text: 'OK', style: 'default'}]
      );
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
      {/* Header row with moon icon and title */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          Do you want a wake-up call for daily Fajr prayer?
        </Text>
        <View style={styles.iconContainer}>
          <SvgIcon name="callMoon" size={78} color="#FFD700" />
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.yesButton}
          onPress={() => handlePreference(true)}
          disabled={isFadingOut}>
          <Text style={styles.yesButtonText}>Yes, I need a call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.noButton}
          onPress={() => handlePreference(false)}
          disabled={isFadingOut}>
          <Text style={styles.yesButtonText}>No, I'll wake up myself</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
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
  infoText: {
    ...typography.bodySmall,
    color: '#B8C5D1',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 16,
  },
  yesButton: {
    backgroundColor: colors.primary,
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
});

export default CallWidget;
