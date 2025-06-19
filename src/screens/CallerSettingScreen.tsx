import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SvgIcon from '../components/SvgIcon';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import {USER_STORAGE_KEYS} from '../types/User';

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
  const [fajrCallEnabled, setFajrCallEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]); // Default: 10 minutes
  const [selectedTiming, setSelectedTiming] = useState(TIMING_OPTIONS[0]); // Default: Before
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showTimingDropdown, setShowTimingDropdown] = useState(false);
  const [showSetAlarmButton, setShowSetAlarmButton] = useState(false);

  // Dummy Fajr time for preview
  const DUMMY_FAJR_TIME = '05:30';
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(
        USER_STORAGE_KEYS.CALL_PREFERENCE,
      );
      if (saved !== null) {
        setFajrCallEnabled(JSON.parse(saved));
      }

      // Load duration and timing settings
      const savedDuration = await AsyncStorage.getItem(
        'fajr_reminder_duration',
      );
      if (savedDuration) {
        const duration = JSON.parse(savedDuration);
        setSelectedDuration(duration);
      }

      const savedTiming = await AsyncStorage.getItem('fajr_reminder_timing');
      if (savedTiming) {
        const timing = JSON.parse(savedTiming);
        setSelectedTiming(timing);
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
      await AsyncStorage.setItem(
        USER_STORAGE_KEYS.CALL_PREFERENCE,
        JSON.stringify(value),
      ); // Close dropdowns when disabling Fajr call
      if (!value) {
        setShowDurationDropdown(false);
        setShowTimingDropdown(false);
        setShowSetAlarmButton(false); // Hide set alarm button when disabled
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
      await AsyncStorage.setItem(
        'fajr_reminder_duration',
        JSON.stringify(duration),
      );
      toggleDurationDropdown();
      setShowSetAlarmButton(true); // Show set alarm button after change
    } catch (error) {
      console.error('Error saving duration:', error);
    }
  };

  const saveTiming = async (timing: (typeof TIMING_OPTIONS)[0]) => {
    try {
      setSelectedTiming(timing);
      await AsyncStorage.setItem(
        'fajr_reminder_timing',
        JSON.stringify(timing),
      );
      toggleTimingDropdown();
      setShowSetAlarmButton(true); // Show set alarm button after change
    } catch (error) {
      console.error('Error saving timing:', error);
    }
  };
  const toggleDurationDropdown = () => {
    if (!fajrCallEnabled) return;
    setShowDurationDropdown(!showDurationDropdown);
    // Close timing dropdown if it's open
    if (showTimingDropdown) {
      setShowTimingDropdown(false);
    }
  };

  const toggleTimingDropdown = () => {
    if (!fajrCallEnabled) return;
    setShowTimingDropdown(!showTimingDropdown);
    // Close duration dropdown if it's open
    if (showDurationDropdown) {
      setShowDurationDropdown(false);
    }
  };

  // Calculate reminder time for preview
  const calculateReminderTime = () => {
    const [hours, minutes] = DUMMY_FAJR_TIME.split(':').map(Number);
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
  };
  const handleBack = () => {
    navigation.goBack();
  };

  const handleSetCallAlarm = () => {
    // Here you can implement the actual alarm setting logic
    // For now, we'll just hide the button to show it was "set"
    setShowSetAlarmButton(false);
    console.log('Call alarm set for:', calculateReminderTime());
    // You could show a toast notification here
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
        {/* Call Time Info - Green Box */}
        {fajrCallEnabled && (
          <View style={styles.callInfoSection}>
            <View style={styles.callInfoCard}>
              <Text style={styles.callInfoTitle}>📞 Call Scheduled</Text>
              <Text style={styles.callInfoTime}>{calculateReminderTime()}</Text>
              <Text style={styles.callInfoDescription}>
                You'll receive a wake-up call at this time for Fajr prayer
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
              <Text style={styles.setAlarmButtonText}>⏰ Set Call Alarm</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              When enabled, the app will simulate an incoming call during Fajr
              prayer time to help you wake up for the morning prayer. This is a
              gentle way to ensure you don't miss your prayers.
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  dropdownOptionsContainer: {
    overflow: 'hidden',
    // marginLeft: 'auto',
    // width: 150, // Reduced width for dropdown options
  },
  dropdownWrapper: {
    position: 'absolute',
    right: 0,
    top: '100%',
    zIndex: 1000,
    minWidth: 140,
    maxWidth: 200,
    marginTop: 4,
  },
  dropdownOptions: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
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
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  setAlarmButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setAlarmButtonText: {
    ...typography.bodyMedium,
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  previewSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    ...typography.bodySmall,
    color: '#666',
    marginBottom: 4,
  },
  previewTime: {
    ...typography.bodyMedium,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  previewDescription: {
    ...typography.bodySmall,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
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
