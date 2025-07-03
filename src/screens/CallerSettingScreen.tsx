import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import SvgIcon from '../components/SvgIcon';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import {useUser} from '../hooks/useUser';
import UnifiedNotificationService from '../services/UnifiedNotificationService';
import {getPrayerTimesForDate} from '../services/db/PrayerServices';
import {getTodayDateString} from '../utils/helpers';

interface CallerSettingScreenProps {
  navigation: any;
}

// Duration options for reminders
const DURATION_OPTIONS = [
  {label: '5 minutes', value: 5},
  {label: '10 minutes', value: 10},
  {label: '15 minutes', value: 15},
  {label: '20 minutes', value: 20},
];

// Before/After options
const TIMING_OPTIONS = [
  {label: 'Before', value: 'before'},
  {label: 'After', value: 'after'},
];

const CallerSettingScreen: React.FC<CallerSettingScreenProps> = ({
  navigation,
}) => {
  const {systemData, updateSystemData} = useUser();
  const [fajrCallEnabled, setFajrCallEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]); // Default: 10 minutes
  const [selectedTiming, setSelectedTiming] = useState(TIMING_OPTIONS[0]); // Default: Before
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showTimingDropdown, setShowTimingDropdown] = useState(false);
  const [showSetAlarmButton, setShowSetAlarmButton] = useState(false);
  const [isAlarmSet, setIsAlarmSet] = useState(false);
  const [scheduledReminderTime, setScheduledReminderTime] = useState('');
  const [currentFajrTime, setCurrentFajrTime] = useState('05:30'); // Default fallback

  useEffect(() => {
    loadSettings();
    loadTodayFajrTime();
  }, [systemData]);

  const loadTodayFajrTime = async () => {
    try {
      const todayDate = getTodayDateString();
      const prayerTimes = await getPrayerTimesForDate(todayDate);
      if (prayerTimes && prayerTimes.fajr) {
        setCurrentFajrTime(prayerTimes.fajr);
      }
    } catch (error) {
      console.error('Error loading Fajr time:', error);
    }
  };
  const loadSettings = async () => {
    try {
      if (
        systemData?.callPreference !== null &&
        systemData?.callPreference !== undefined
      ) {
        const isEnabled = Boolean(systemData.callPreference);
        setFajrCallEnabled(isEnabled);
        setShowSetAlarmButton(isEnabled);
      } else {
        // First time user or no preference set yet - default to false
        setFajrCallEnabled(false);
        setShowSetAlarmButton(false);
      }

      // Load duration and timing settings from system data with defaults
      if (
        systemData?.fajrReminderDuration !== null &&
        systemData?.fajrReminderDuration !== undefined
      ) {
        const duration =
          DURATION_OPTIONS.find(
            opt => opt.value === systemData.fajrReminderDuration,
          ) || DURATION_OPTIONS[1];
        setSelectedDuration(duration);
      } else {
        // Set default duration if not found
        setSelectedDuration(DURATION_OPTIONS[1]); // Default: 10 minutes
      }

      if (
        systemData?.fajrReminderTiming !== null &&
        systemData?.fajrReminderTiming !== undefined
      ) {
        const timing =
          TIMING_OPTIONS.find(
            opt => opt.value === systemData.fajrReminderTiming,
          ) || TIMING_OPTIONS[0];
        setSelectedTiming(timing);
      } else {
        // Set default timing if not found
        setSelectedTiming(TIMING_OPTIONS[0]); // Default: Before
      }
    } catch (error) {
      console.error('Error loading caller settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFajrCall = async (value: boolean) => {
    try {
      setFajrCallEnabled(value);
      await updateSystemData({callPreference: value}); // Close dropdowns when disabling Fajr call
      if (!value) {
        setShowDurationDropdown(false);
        setShowTimingDropdown(false);
        setShowSetAlarmButton(false); // Hide set alarm button when disabled
        setIsAlarmSet(false); // Reset alarm status
        setScheduledReminderTime(''); // Clear scheduled time

        // Cancel any existing Fajr fake calls when disabling
        const notificationService = UnifiedNotificationService.getInstance();
        await notificationService.cancelFajrFakeCalls();
        console.log(
          'Cancelled existing Fajr fake calls due to preference change',
        );
      } else {
        setShowSetAlarmButton(true); // Show set alarm button when enabled
      }
    } catch (error) {
      console.error('Error saving caller settings:', error);
      // Revert the UI state if save failed
      setFajrCallEnabled(!value);
    }
  };
  const saveDuration = async (duration: (typeof DURATION_OPTIONS)[0]) => {
    try {
      setSelectedDuration(duration);
      await updateSystemData({fajrReminderDuration: duration.value});
      toggleDurationDropdown();

      // Show set alarm button when user makes changes (even if alarm was previously set)
      setShowSetAlarmButton(true);

      // Reset alarm status since settings changed - user needs to set alarm again
      if (isAlarmSet) {
        setIsAlarmSet(false);
        setScheduledReminderTime('');
        // Cancel existing alarm since settings changed
        const notificationService = UnifiedNotificationService.getInstance();
        await notificationService.cancelFajrFakeCalls();
      }
    } catch (error) {
      console.error('Error saving duration:', error);
    }
  };

  const saveTiming = async (timing: (typeof TIMING_OPTIONS)[0]) => {
    try {
      setSelectedTiming(timing);
      await updateSystemData({
        fajrReminderTiming: timing.value as 'before' | 'after',
      });
      toggleTimingDropdown();

      // Show set alarm button when user makes changes (even if alarm was previously set)
      setShowSetAlarmButton(true);

      // Reset alarm status since settings changed - user needs to set alarm again
      if (isAlarmSet) {
        setIsAlarmSet(false);
        setScheduledReminderTime('');
        // Cancel existing alarm since settings changed
        const notificationService = UnifiedNotificationService.getInstance();
        await notificationService.cancelFajrFakeCalls();
      }
    } catch (error) {
      console.error('Error saving timing:', error);
    }
  };

  const toggleDurationDropdown = () => {
    if (!fajrCallEnabled) {return;}
    setShowDurationDropdown(!showDurationDropdown);
    // Close timing dropdown if it's open
    if (showTimingDropdown) {
      setShowTimingDropdown(false);
    }
  };

  const toggleTimingDropdown = () => {
    if (!fajrCallEnabled) {return;}
    setShowTimingDropdown(!showTimingDropdown);
    // Close duration dropdown if it's open
    if (showDurationDropdown) {
      setShowDurationDropdown(false);
    }
  }; // Calculate reminder time for preview using actual Fajr time
  const calculatePreviewTime = () => {
    const [hours, minutes] = currentFajrTime.split(':').map(Number);
    const fajrMinutes = hours * 60 + minutes;

    let reminderMinutes;
    if (selectedTiming.value === 'before') {
      reminderMinutes = fajrMinutes - selectedDuration.value;
    } else {
      reminderMinutes = fajrMinutes + selectedDuration.value;
    }

    // Handle day overflow/underflow
    if (reminderMinutes < 0) {
      reminderMinutes += 24 * 60;
    } else if (reminderMinutes >= 24 * 60) {
      reminderMinutes -= 24 * 60;
    }

    const reminderHours = Math.floor(reminderMinutes / 60);
    const reminderMins = reminderMinutes % 60;

    return `${reminderHours.toString().padStart(2, '0')}:${reminderMins
      .toString()
      .padStart(2, '0')}`;
  }; // Get button text with preview time
  const getSetAlarmButtonText = () => {
    const previewTime = calculatePreviewTime();
    return `Set Wake-Up Call to ${previewTime} 📞`;
  };

  const handleBack = () => {
    navigation.goBack();
  };
  const handleSetCallAlarm = async () => {
    try {
      const notificationService = UnifiedNotificationService.getInstance();

      // Cancel any existing Fajr fake calls first
      await notificationService.cancelFajrFakeCalls();

      // Use current Fajr time that's already loaded
      if (!currentFajrTime) {
        Alert.alert(
          'Error ❌',
          'Unable to get prayer times. Please try again.',
          [{text: 'OK', style: 'default'}],
        );
        return;
      }

      // Calculate reminder time using current Fajr time
      const reminderTime = calculatePreviewTime();

      // Schedule the wake-up call
      const callId = await notificationService.scheduleFajrFakeCall(
        1001,
        currentFajrTime,
        selectedDuration.value,
        selectedTiming.value as 'before' | 'after',
      );

      if (callId) {
        // Mark alarm as set and hide the button
        setIsAlarmSet(true);
        setShowSetAlarmButton(false);
        setScheduledReminderTime(reminderTime);

        Alert.alert(
          'Wake-Up Call Scheduled ✅',
          `Your wake-up call is set for ${reminderTime}!\n\nSettings: ${
            selectedDuration.label
          } ${selectedTiming.label.toLowerCase()} Fajr (${currentFajrTime})`,
          [{text: 'OK', style: 'default'}],
        );

        // Save settings
        await updateSystemData({
          fajrReminderDuration: selectedDuration.value,
          fajrReminderTiming: selectedTiming.value as 'before' | 'after',
        });

        console.log('Call alarm set for:', reminderTime);
      } else {
        throw new Error('Failed to schedule wake-up call');
      }
    } catch (error) {
      console.error('Error setting call alarm:', error);
      Alert.alert(
        'Error ❌',
        'Failed to schedule wake-up call. Please try again.',
        [{text: 'OK', style: 'default'}],
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <SvgIcon name="backBtn" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Caller Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Call Time Info - Green Box - Only show when alarm is actually set */}
        {fajrCallEnabled && isAlarmSet && scheduledReminderTime && (
          <View style={styles.callInfoSection}>
            <View style={styles.callInfoCard}>
              <Text style={styles.callInfoTitle}>✅ Wake-Up Call Active</Text>
              <Text style={styles.callInfoTime}>{scheduledReminderTime}</Text>
              <Text style={styles.callInfoDescription}>
                Your wake-up call is scheduled for this time
              </Text>
            </View>
          </View>
        )}
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Prayer Call Settings</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Fajr Call</Text>
              <Text style={styles.settingDescription}>
                Enable fake calls during Fajr prayer time to help you wake up
              </Text>
            </View>
            <Switch
              value={fajrCallEnabled}
              onValueChange={toggleFajrCall}
              trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
              thumbColor={fajrCallEnabled ? '#FFF' : '#FFF'}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
          {/* Reminder Duration Setting */}
          <View style={[styles.settingItem, {position: 'relative'}]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Reminder Duration</Text>
              <Text style={styles.settingDescription}>
                How long before/after Fajr should the reminder be triggered
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dropdown,
                !fajrCallEnabled && styles.dropdownDisabled,
              ]}
              onPress={toggleDurationDropdown}
              disabled={!fajrCallEnabled}>
              <Text
                style={[
                  styles.dropdownText,
                  !fajrCallEnabled && styles.dropdownTextDisabled,
                ]}>
                {selectedDuration.label}
              </Text>
              <Text
                style={[
                  styles.dropdownArrow,
                  !fajrCallEnabled && styles.dropdownTextDisabled,
                  showDurationDropdown && styles.dropdownArrowUp,
                ]}>
                ▼
              </Text>
            </TouchableOpacity>

            {/* Duration Options */}
            {showDurationDropdown && (
              <View style={styles.dropdownWrapper}>
                <View style={styles.dropdownOptions}>
                  {DURATION_OPTIONS.map((option, index) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownOption,
                        selectedDuration.value === option.value &&
                          styles.selectedOption,
                        index === DURATION_OPTIONS.length - 1 &&
                          styles.lastDropdownOption,
                      ]}
                      onPress={() => saveDuration(option)}>
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          selectedDuration.value === option.value &&
                            styles.selectedOptionText,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
          {/* Before/After Setting */}
          <View style={[styles.settingItem, {position: 'relative'}]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Timing</Text>
              <Text style={styles.settingDescription}>
                When should the reminder be triggered relative to Fajr time
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dropdown,
                !fajrCallEnabled && styles.dropdownDisabled,
              ]}
              onPress={toggleTimingDropdown}
              disabled={!fajrCallEnabled}>
              <Text
                style={[
                  styles.dropdownText,
                  !fajrCallEnabled && styles.dropdownTextDisabled,
                ]}>
                {selectedTiming.label}
              </Text>
              <Text
                style={[
                  styles.dropdownArrow,
                  !fajrCallEnabled && styles.dropdownTextDisabled,
                  showTimingDropdown && styles.dropdownArrowUp,
                ]}>
                ▼
              </Text>
            </TouchableOpacity>

            {/* Timing Options */}
            {showTimingDropdown && (
              <View style={styles.dropdownWrapper}>
                <View style={styles.dropdownOptions}>
                  {TIMING_OPTIONS.map((option, index) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownOption,
                        selectedTiming.value === option.value &&
                          styles.selectedOption,
                        index === TIMING_OPTIONS.length - 1 &&
                          styles.lastDropdownOption,
                      ]}
                      onPress={() => saveTiming(option)}>
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          selectedTiming.value === option.value &&
                            styles.selectedOptionText,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
        {/* Set Call Alarm Button */}
        {fajrCallEnabled && showSetAlarmButton && (
          <View style={styles.setAlarmSection}>
            <TouchableOpacity
              style={styles.setAlarmButton}
              onPress={handleSetCallAlarm}>
              <Text style={styles.setAlarmButtonText}>
                {getSetAlarmButtonText()}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 How Wake-Up Calls Work</Text>
            <Text style={styles.infoText}>
              {fajrCallEnabled
                ? `When enabled, the app will show a fake incoming call to help you wake up for Fajr prayer. The call will bypass silent mode and appear even when your phone is locked. Your current settings: ${
                    selectedDuration.label
                  } ${selectedTiming.label.toLowerCase()} Fajr.`
                : 'Enable Fajr calls to receive a wake-up notification that looks like an incoming call. This helps ensure you wake up for the morning prayer, even in silent mode.'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: StatusBar.currentHeight || 0,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    ...typography.h2,
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginRight: 32, // Compensate for back button width
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  settingSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 80, // Increased margin to provide space for dropdowns
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'visible',
    zIndex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    ...typography.bodyMedium,
    color: '#333',
    marginBottom: 4,
    fontWeight: '600',
  },
  settingDescription: {
    ...typography.bodySmall,
    color: '#666',
    lineHeight: 18,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
    justifyContent: 'space-between',
  },
  dropdownDisabled: {
    backgroundColor: '#F0F0F0',
    borderColor: '#D0D0D0',
    opacity: 0.6,
  },
  dropdownText: {
    ...typography.bodyMedium,
    color: '#333',
    marginRight: 8,
  },
  dropdownTextDisabled: {
    color: '#999',
  },
  dropdownArrow: {
    ...typography.bodyMedium,
    color: '#666',
    fontSize: 12,
    transform: [{rotate: '0deg'}],
  },
  dropdownArrowUp: {
    transform: [{rotate: '180deg'}],
  },
  dropdownWrapper: {
    position: 'absolute',
    right: 0,
    top: '100%',
    zIndex: 9999,
    minWidth: 140,
    maxWidth: 200,
    marginTop: 4,
  },
  dropdownOptions: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginTop: 4,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    zIndex: 9999,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    minHeight: 44,
    justifyContent: 'center',
  },
  lastDropdownOption: {
    borderBottomWidth: 0,
  },
  selectedOption: {
    backgroundColor: colors.primary,
  },
  dropdownOptionText: {
    ...typography.bodyMedium,
    color: '#333',
  },
  selectedOptionText: {
    color: '#FFF',
    fontWeight: '600',
  },
  callInfoSection: {
    backgroundColor: colors.emerald,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  callInfoCard: {
    alignItems: 'center',
  },
  callInfoTitle: {
    ...typography.bodyMedium,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
  },
  callInfoTime: {
    ...typography.h1,
    color: '#FFF',
    fontSize: 32,
    marginBottom: 8,
  },
  callInfoDescription: {
    ...typography.bodySmall,
    color: '#FFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  setAlarmSection: {
    padding: 16,
    marginBottom: 16,
  },
  setAlarmButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setAlarmButtonText: {
    ...typography.h3,
    color: '#FFF',
  },
  infoSection: {
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    ...typography.bodyMedium,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    ...typography.bodySmall,
    color: '#1565C0',
    lineHeight: 18,
  },
});

export default CallerSettingScreen;
