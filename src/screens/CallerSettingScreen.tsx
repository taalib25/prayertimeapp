import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SvgIcon from '../components/SvgIcon';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import {useUser} from '../hooks/useUser';
import UnifiedNotificationService from '../services/CallerServices';
import {getTomorrowDateString} from '../utils/helpers';
import UserService from '../services/UserService';

interface CallerSettingScreenProps {
  navigation: any;
}

const DURATION_OPTIONS = [
  {label: '5 minutes', value: 5},
  {label: '10 minutes', value: 10},
  {label: '15 minutes', value: 15},
  {label: '20 minutes', value: 20},
];

const TIMING_OPTIONS = [
  {label: 'Before', value: 'before'},
  {label: 'After', value: 'after'},
];

const CallerSettingScreen: React.FC<CallerSettingScreenProps> = ({
  navigation,
}) => {
  const {systemData, updateSystemData} = useUser();
  const userService = UserService.getInstance();
  const tommorrowDate = getTomorrowDateString();
  const fajr = userService.getPrayerTimesForDate(tommorrowDate!);

  // Consolidated state
  const [state, setState] = useState({
    fajrCallEnabled: false,
    isLoading: true,
    selectedDuration: DURATION_OPTIONS[1], // Default: 10 minutes
    selectedTiming: TIMING_OPTIONS[0], // Default: Before
    showDurationDropdown: false,
    showTimingDropdown: false,
    isAlarmSet: false,
    scheduledReminderTime: '',
    currentFajrTime: '04:30',
  });

  useEffect(() => {
    loadSettings();
    loadTodayFajrTime();
  }, [systemData]);

  const updateState = (updates: Partial<typeof state>) => {
    setState(prev => ({...prev, ...updates}));
  };

  const loadTodayFajrTime = async () => {
    try {
      const prayerTimesData = await userService.getPrayerTimesForDate(
        tommorrowDate!,
      );

      if (prayerTimesData) {
        if (prayerTimesData.fajr) {
          console.log('Fajr time for tomorrow:', prayerTimesData.fajr);
          updateState({currentFajrTime: prayerTimesData.fajr});
          return prayerTimesData.fajr;
        }
      }
    } catch (error) {
      console.error('Error loading Fajr time:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const isEnabled = Boolean(systemData?.callPreference);

      const duration =
        DURATION_OPTIONS.find(
          opt => opt.value === systemData?.fajrReminderDuration,
        ) || DURATION_OPTIONS[1];

      const timing =
        TIMING_OPTIONS.find(
          opt => opt.value === systemData?.fajrReminderTiming,
        ) || TIMING_OPTIONS[0];

      updateState({
        fajrCallEnabled: isEnabled,
        selectedDuration: duration,
        selectedTiming: timing,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading caller settings:', error);
      updateState({isLoading: false});
    }
  };

  const toggleFajrCall = async (value: boolean) => {
    try {
      updateState({fajrCallEnabled: value});
      await updateSystemData({callPreference: value});

      if (!value) {
        // Reset everything when disabling
        updateState({
          showDurationDropdown: false,
          showTimingDropdown: false,
          isAlarmSet: false,
          scheduledReminderTime: '',
        });

        const notificationService = UnifiedNotificationService.getInstance();
        await notificationService.cancelFajrFakeCalls();
      } else {
        // Use current state values when enabling
        await rescheduleAlarm();
      }
    } catch (error) {
      console.error('Error saving caller settings:', error);
      updateState({fajrCallEnabled: !value});
    }
  };

  const handleDropdownChange = async (
    type: 'duration' | 'timing',
    option: any,
  ) => {
    try {
      let newDuration = state.selectedDuration;
      let newTiming = state.selectedTiming;

      if (type === 'duration') {
        newDuration = option;
        updateState({
          selectedDuration: option,
          showDurationDropdown: false,
        });
        await updateSystemData({fajrReminderDuration: option.value});
      } else {
        newTiming = option;
        updateState({
          selectedTiming: option,
          showTimingDropdown: false,
        });
        await updateSystemData({fajrReminderTiming: option.value});
      }

      // If Fajr is enabled, reschedule with the new values immediately
      if (state.fajrCallEnabled) {
        await rescheduleAlarm(newDuration, newTiming);
      }
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
    }
  };

  const rescheduleAlarm = async (customDuration?: any, customTiming?: any) => {
    try {
      const notificationService = UnifiedNotificationService.getInstance();

      // Cancel existing alarm
      await notificationService.cancelFajrFakeCalls();

      if (!state.currentFajrTime) {
        console.error('No Fajr time available for rescheduling');
        return;
      }

      // Use custom values if provided, otherwise use current state
      const duration = customDuration || state.selectedDuration;
      const timing = customTiming || state.selectedTiming;

      // Calculate reminder time with the specified values
      const reminderTime = calculatePreviewTime(duration, timing);

      // Schedule new alarm
      const callId = await notificationService.scheduleFajrFakeCall(
        reminderTime,
        state.currentFajrTime,
      );

      if (callId) {
        updateState({
          isAlarmSet: true,
          scheduledReminderTime: reminderTime,
        });

        Alert.alert(
          'Wake-Up Call Updated ✅',
          `Your wake-up call has been rescheduled for ${reminderTime}`,
          [{text: 'OK', style: 'default'}],
        );
      }
    } catch (error) {
      console.error('Error rescheduling alarm:', error);
      Alert.alert('Error ❌', 'Failed to reschedule wake-up call.');
    }
  };

  const toggleDropdown = (type: 'duration' | 'timing') => {
    if (!state.fajrCallEnabled) return;

    if (type === 'duration') {
      updateState({
        showDurationDropdown: !state.showDurationDropdown,
        showTimingDropdown: false,
      });
    } else {
      updateState({
        showTimingDropdown: !state.showTimingDropdown,
        showDurationDropdown: false,
      });
    }
  };

  const calculatePreviewTime = (customDuration?: any, customTiming?: any) => {
    const [hours, minutes] = state.currentFajrTime.split(':').map(Number);
    const fajrMinutes = hours * 60 + minutes;

    // Use custom values if provided, otherwise use state
    const duration = customDuration || state.selectedDuration;
    const timing = customTiming || state.selectedTiming;

    let reminderMinutes =
      timing.value === 'before'
        ? fajrMinutes - duration.value
        : fajrMinutes + duration.value;

    // Handle day overflow/underflow properly
    if (reminderMinutes < 0) reminderMinutes += 24 * 60;
    else if (reminderMinutes >= 24 * 60) reminderMinutes -= 24 * 60;

    const reminderHours = Math.floor(reminderMinutes / 60);
    const reminderMins = reminderMinutes % 60;
    return `${reminderHours.toString().padStart(2, '0')}:${reminderMins
      .toString()
      .padStart(2, '0')}`;
  };

  const renderDropdown = (type: 'duration' | 'timing') => {
    const isDuration = type === 'duration';
    const options = isDuration ? DURATION_OPTIONS : TIMING_OPTIONS;
    const selected = isDuration ? state.selectedDuration : state.selectedTiming;
    const showDropdown = isDuration
      ? state.showDurationDropdown
      : state.showTimingDropdown;

    return (
      <View style={[styles.settingItem, {position: 'relative'}]}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>
            {isDuration ? 'Reminder Duration' : 'Timing'}
          </Text>
          <Text style={styles.settingDescription}>
            {isDuration
              ? 'How long before/after Fajr should the reminder be triggered'
              : 'When should the reminder be triggered relative to Fajr time'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.dropdown,
            !state.fajrCallEnabled && styles.dropdownDisabled,
          ]}
          onPress={() => toggleDropdown(type)}
          disabled={!state.fajrCallEnabled}>
          <Text
            style={[
              styles.dropdownText,
              !state.fajrCallEnabled && styles.dropdownTextDisabled,
            ]}>
            {selected.label}
          </Text>
          <Text
            style={[
              styles.dropdownArrow,
              !state.fajrCallEnabled && styles.dropdownTextDisabled,
              showDropdown && styles.dropdownArrowUp,
            ]}>
            ▼
          </Text>
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdownWrapper}>
            <View style={styles.dropdownOptions}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownOption,
                    selected.value === option.value && styles.selectedOption,
                    index === options.length - 1 && styles.lastDropdownOption,
                  ]}
                  onPress={() => handleDropdownChange(type, option)}>
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      selected.value === option.value &&
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
    );
  };

  const insets = useSafeAreaInsets();
  if (state.isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  const previewTime = calculatePreviewTime();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <SvgIcon name="backBtn" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Caller Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Call Time Info - Always show when Fajr is enabled */}
        {state.fajrCallEnabled && (
          <View style={styles.callInfoSection}>
            <View style={styles.callInfoCard}>
              <Text style={styles.callInfoTime}>{calculatePreviewTime()}</Text>
              <Text style={styles.callInfoDescription}>
                Your wake-up call is scheduled for this time
              </Text>
            </View>
          </View>
        )}

        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Prayer Call Settings</Text>

          {/* Fajr Call Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Fajr Call</Text>
              <Text style={styles.settingDescription}>
                Enable fake calls during Fajr prayer time to help you wake up
              </Text>
            </View>
            <Switch
              value={state.fajrCallEnabled}
              onValueChange={toggleFajrCall}
              trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
              thumbColor="#FFF"
              ios_backgroundColor="#E0E0E0"
            />
          </View>

          {/* Duration Dropdown */}
          {renderDropdown('duration')}

          {/* Timing Dropdown */}
          {renderDropdown('timing')}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 How Wake-Up Calls Work</Text>
            <Text style={styles.infoText}>
              {state.fajrCallEnabled
                ? `The app automatically schedules a fake incoming call to help you wake up for Fajr prayer. Current settings: ${
                    state.selectedDuration.label
                  } ${state.selectedTiming.label.toLowerCase()} Fajr - scheduled for ${calculatePreviewTime()}.`
                : 'Enable Fajr calls to receive a wake-up notification that looks like an incoming call. This helps ensure you wake up for the morning prayer, even in silent mode. The alarm will be automatically scheduled when you enable this feature.'}
            </Text>
          </View>
        </View>
      </View>
    </View>
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
    marginRight: 32,
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
    marginBottom: 80,
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

    marginBottom: 8,
    fontSize: 17,
  },
  callInfoTime: {
    ...typography.h1,
    color: '#FFF',
    fontSize: 52,
    paddingVertical: 14,
  },
  callInfoDescription: {
    ...typography.bodySmall,

    color: '#e4f4e4ff',
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

    marginBottom: 8,
  },
  infoText: {
    ...typography.bodySmall,
    color: '#1565C0',
    lineHeight: 18,
  },
});

export default CallerSettingScreen;
