import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {spacing} from '../utils/theme';
import {typography} from '../utils/typography';
import {pickupRequestSchema} from '../utils/validation';
import SvgIcon from '../components/SvgIcon';
import UserService from '../services/UserService';
import ApiTaskServices from '../services/apiHandler';
import {PickupSettings} from '../types/User';

// Request status types
type RequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

interface PickupRequest extends PickupSettings {
  status: RequestStatus;
  requestDate?: string;
  reviewDate?: string;
  reviewNotes?: string;
}

const PickupSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const userService = UserService.getInstance();
  const apiService = ApiTaskServices.getInstance();

  const [settings, setSettings] = useState<PickupRequest>({
    enabled: false,
    preferredTime: '05:00',
    emergencyContact: '',
    specificLocation: '',
    notes: '',
    availableDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
    status: 'none',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    [key: string]: string | null;
  }>({
    emergencyContact: null,
    specificLocation: null,
    notes: null,
  });

  // Validation helper function for real-time feedback
  const validateField = useCallback((field: string, value: any) => {
    try {
      switch (field) {
        case 'emergencyContact':
          pickupRequestSchema.shape.emergencyContact.parse(value);
          return null;
        case 'specificLocation':
          pickupRequestSchema.shape.specificLocation.parse(value);
          return null;
        case 'notes':
          pickupRequestSchema.shape.notes.parse(value);
          return null;
        case 'availableDays':
          pickupRequestSchema.shape.availableDays.parse(value);
          return null;
        default:
          return null;
      }
    } catch (error: any) {
      return error.errors?.[0]?.message || 'Invalid value';
    }
  }, []);

  // Clear all field errors
  const clearFieldErrors = useCallback(() => {
    setFieldErrors({
      emergencyContact: null,
      specificLocation: null,
      notes: null,
    });
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);

      // Try to load from API first
      const apiResponse = await apiService.getPickupRequests();

      if (
        apiResponse.success &&
        apiResponse.data &&
        apiResponse.data.data &&
        apiResponse.data.data.length > 0
      ) {
        // Convert API response to local format
        const latestRequest = apiResponse.data.data[0]; // Get the most recent request

        // Convert available days array back to object
        const availableDaysObject = {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        };
        latestRequest.days.forEach((day: string) => {
          if (day in availableDaysObject) {
            (availableDaysObject as any)[day] = true;
          }
        });

        setSettings({
          enabled: true,
          preferredTime: '05:00', // Default as this isn't in the API response
          emergencyContact: latestRequest.contact_number,
          specificLocation: latestRequest.pickup_location,
          notes: latestRequest.special_instructions || '',
          availableDays: availableDaysObject,
          status: latestRequest.status,
          requestDate: latestRequest.created_at,
          reviewDate: latestRequest.updated_at,
          reviewNotes: undefined, // Not provided by API
        });
      } else {
        // Fallback to local storage
        const systemData = await userService.getSystemData();

        if (systemData.pickupSettings) {
          // Convert existing settings to request format
          setSettings({
            ...systemData.pickupSettings,
            status: (systemData.pickupSettings as any).status || 'none',
            requestDate: (systemData.pickupSettings as any).requestDate,
            reviewDate: (systemData.pickupSettings as any).reviewDate,
            reviewNotes: (systemData.pickupSettings as any).reviewNotes,
          });
        }
      }
    } catch (error) {
      console.error('Error loading pickup settings:', error);

      // Fallback to local storage on error
      try {
        const systemData = await userService.getSystemData();
        if (systemData.pickupSettings) {
          setSettings({
            ...systemData.pickupSettings,
            status: (systemData.pickupSettings as any).status || 'none',
            requestDate: (systemData.pickupSettings as any).requestDate,
            reviewDate: (systemData.pickupSettings as any).reviewDate,
            reviewNotes: (systemData.pickupSettings as any).reviewNotes,
          });
        }
      } catch (localError) {
        console.error('Error loading local pickup settings:', localError);
      }
    } finally {
      setIsLoading(false);
      clearFieldErrors(); // Clear any validation errors when loading new settings
    }
  }, [apiService, userService, clearFieldErrors]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const submitRequest = async () => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (!settings.enabled) {
        Alert.alert(
          'Enable Pickup Request',
          'Please enable pickup assistance to submit a request.',
          [{text: 'OK', style: 'default'}],
        );
        return;
      }

      // Use Zod validation for robust field validation
      try {
        pickupRequestSchema.parse({
          specificLocation: settings.specificLocation,
          emergencyContact: settings.emergencyContact,
          notes: settings.notes,
          availableDays: settings.availableDays,
        });
      } catch (validationError: any) {
        // Handle validation errors with user-friendly messages
        const errors = validationError.errors || [];
        let errorMessage = 'Please fix the following issues:\n\n';

        errors.forEach((error: any) => {
          const message = error.message || 'Invalid value';
          errorMessage += `• ${message}\n`;
        });

        Alert.alert('Validation Error', errorMessage.trim(), [
          {text: 'OK', style: 'default'},
        ]);
        return;
      }

      // Convert available days object to array after validation
      const availableDaysArray = Object.entries(settings.availableDays)
        .filter(([_, isAvailable]) => isAvailable)
        .map(([day, _]) => day);

      // Submit to API
      const response = await apiService.submitPickupRequest(
        settings.specificLocation,
        availableDaysArray,
        settings.emergencyContact,
        settings.notes,
        ['fajr'], // Default prayers - you can make this configurable later
      );

      if (response.success) {
        // Update local settings with API response
        const updatedSettings = {
          ...settings,
          status: 'pending' as RequestStatus,
          requestDate: new Date().toISOString(),
          reviewDate: undefined,
          reviewNotes: undefined,
        };

        // Also save to local storage as backup
        await userService.updateSystemData({
          pickupSettings: updatedSettings,
        });

        setSettings(updatedSettings);

        Alert.alert(
          'Request Submitted ✅',
          'Your pickup assistance request has been sent to the mosque committee for review. You will be notified once it has been reviewed.',
          [{text: 'OK', style: 'default'}],
        );
      } else {
        // Handle specific API errors
        const errorMessage = response.error || 'Failed to submit request';
        console.error('API Error:', errorMessage);

        Alert.alert(
          'Submission Failed ❌',
          `Unable to submit your pickup request: ${errorMessage}. Please check your internet connection and try again.`,
          [{text: 'OK', style: 'default'}],
        );
      }
    } catch (error) {
      console.error('Error submitting pickup request:', error);

      // Handle network errors and other exceptions
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      Alert.alert(
        'Network Error ❌',
        `Failed to submit pickup request due to a network error: ${errorMessage}. Please check your internet connection and try again.`,
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Retry', style: 'default', onPress: () => submitRequest()},
        ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const updateDayAvailability = (
    day: keyof typeof settings.availableDays,
    value: boolean,
  ) => {
    if (!canEditRequest()) {
      return;
    }
    setSettings(prev => ({
      ...prev,
      availableDays: {
        ...prev.availableDays,
        [day]: value,
      },
    }));
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Needs Revision';
      default:
        return 'Draft';
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '📝';
    }
  };
  const canEditRequest = () => {
    // For form fields, require both enabled and proper status
    return (
      settings.enabled &&
      (settings.status === 'none' || settings.status === 'rejected')
    );
  };
  const canEditMainToggle = () => {
    // Main toggle can always be turned ON
    // Main toggle can only be turned OFF if status is none or rejected
    return true; // We handle the logic in the onValueChange callback
  };
  const getButtonText = () => {
    if (!settings.enabled) {
      return 'Enable Pickup Request First';
    }
    if (isLoading) {
      return 'Submitting...';
    }
    if (settings.status === 'pending') {
      return 'Request Under Review';
    }
    if (settings.status === 'approved') {
      return 'Request Approved';
    }
    if (settings.status === 'rejected') {
      return 'Resubmit Request';
    }
    return 'Submit Request to Committee';
  };

  const StatusCard: React.FC = () => (
    <View
      style={[
        styles.statusCard,
        {borderLeftColor: getStatusColor(settings.status)},
      ]}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusIcon}>{getStatusIcon(settings.status)}</Text>
        <Text
          style={[
            styles.statusTitle,
            {color: getStatusColor(settings.status)},
          ]}>
          {getStatusText(settings.status)}
        </Text>
      </View>
      <Text style={styles.statusDescription}>
        {settings.status === 'none' &&
          'Complete the form below and submit your pickup assistance request to the mosque committee for review.'}
        {settings.status === 'pending' &&
          `Request submitted on ${
            settings.requestDate
              ? new Date(settings.requestDate).toLocaleDateString()
              : 'Unknown date'
          }. The committee will review and respond soon.`}
        {settings.status === 'approved' &&
          `Your request was approved on ${
            settings.reviewDate
              ? new Date(settings.reviewDate).toLocaleDateString()
              : 'Unknown date'
          }. Community members can now see your request and coordinate pickup times.`}
        {settings.status === 'rejected' &&
          `Your request needs revision. ${
            settings.reviewNotes ||
            'Please update the information and resubmit.'
          }`}
      </Text>
    </View>
  );
  const SettingItem: React.FC<{
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    isMainToggle?: boolean; // Optional prop for the main toggle
  }> = ({title, description, value, onValueChange, isMainToggle = false}) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
        thumbColor={value ? '#FFF' : '#FFF'}
        ios_backgroundColor="#E0E0E0"
        disabled={isMainToggle ? !canEditMainToggle() : !canEditRequest()}
      />
    </View>
  );

  const DaySelector: React.FC = () => (
    <View style={styles.daysContainer}>
      <Text style={styles.sectionTitle}>Available Days</Text>
      <View style={styles.daysGrid}>
        {Object.entries(settings.availableDays).map(([day, isEnabled]) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              isEnabled && styles.dayButtonActive,
              !canEditRequest() && styles.dayButtonDisabled,
            ]}
            onPress={() =>
              updateDayAvailability(
                day as keyof typeof settings.availableDays,
                !isEnabled,
              )
            }
            disabled={!canEditRequest()}>
            <Text
              style={[
                styles.dayButtonText,
                isEnabled && styles.dayButtonTextActive,
              ]}>
              {day.charAt(0).toUpperCase() + day.slice(1, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Add status bar height for Android */}
      {Platform.OS === 'android' && <View style={styles.statusBarSpacer} />}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <SvgIcon name="backBtn" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pickup Assistance Request</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <StatusCard />
        <View style={styles.settingSection}>
          <SettingItem
            title="Request Pickup Assistance"
            description="Request help with transportation to and from mosque"
            value={settings.enabled}
            onValueChange={value => {
              // If trying to disable while request is pending/approved, show warning
              if (
                !value &&
                (settings.status === 'pending' ||
                  settings.status === 'approved')
              ) {
                Alert.alert(
                  'Cannot Disable',
                  `You cannot disable pickup assistance while your request is ${settings.status}. Please contact the mosque committee if you need to cancel your request.`,
                  [{text: 'OK', style: 'default'}],
                );
                return;
              }
              setSettings(prev => ({...prev, enabled: value}));
            }}
            isMainToggle={true} // Special flag for the main toggle
          />
        </View>
        {/* Detailed Settings - Only show when enabled */}
        {settings.enabled && (
          <>
            {/* Time Settings */}
            {/* <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Preferred Pickup Time</Text>
              <View style={styles.timeContainer}>
                <Text style={styles.timeLabel}>
                  Preferred time before prayer:
                </Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    !canEditRequest() && styles.inputDisabled,
                  ]}
                  value={settings.preferredTime}
                  onChangeText={value =>
                    setSettings(prev => ({...prev, preferredTime: value}))
                  }
                  placeholder="05:00"
                  keyboardType="default"
                  editable={canEditRequest()}
                />
              </View>
            </View> */}

            {/* Days Selector */}
            <View style={styles.settingSection}>
              <DaySelector />
            </View>

            {/* Contact Information */}
            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Emergency Contact Number</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    !canEditRequest() && styles.inputDisabled,
                    fieldErrors.emergencyContact && styles.textInputError,
                  ]}
                  value={settings.emergencyContact}
                  onChangeText={value => {
                    setSettings(prev => ({...prev, emergencyContact: value}));
                    // Validate and show error if any
                    const error = validateField('emergencyContact', value);
                    setFieldErrors(prev => ({
                      ...prev,
                      emergencyContact: error,
                    }));
                  }}
                  placeholder="Enter emergency contact number"
                  keyboardType="phone-pad"
                  editable={canEditRequest()}
                />
                {fieldErrors.emergencyContact && (
                  <Text style={styles.errorText}>
                    {fieldErrors.emergencyContact}
                  </Text>
                )}
              </View>
            </View>

            {/* Location Details */}
            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Location Details</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Specific Pickup Location</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    !canEditRequest() && styles.inputDisabled,
                    fieldErrors.specificLocation && styles.textInputError,
                  ]}
                  value={settings.specificLocation}
                  onChangeText={value => {
                    setSettings(prev => ({...prev, specificLocation: value}));
                    // Validate and show error if any
                    const error = validateField('specificLocation', value);
                    setFieldErrors(prev => ({
                      ...prev,
                      specificLocation: error,
                    }));
                  }}
                  placeholder="Enter specific pickup address or landmark"
                  multiline={true}
                  numberOfLines={3}
                  editable={canEditRequest()}
                />
                {fieldErrors.specificLocation && (
                  <Text style={styles.errorText}>
                    {fieldErrors.specificLocation}
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Additional Notes</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    !canEditRequest() && styles.inputDisabled,
                    fieldErrors.notes && styles.textInputError,
                  ]}
                  value={settings.notes}
                  onChangeText={value => {
                    setSettings(prev => ({...prev, notes: value}));
                    // Validate and show error if any
                    const error = validateField('notes', value);
                    setFieldErrors(prev => ({...prev, notes: error}));
                  }}
                  placeholder="Any additional information for pickup assistance"
                  multiline={true}
                  numberOfLines={3}
                  editable={canEditRequest()}
                />
                {fieldErrors.notes && (
                  <Text style={styles.errorText}>{fieldErrors.notes}</Text>
                )}
              </View>
            </View>
          </>
        )}
        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 How Pickup Request Works</Text>
            <Text style={styles.infoText}>
              {settings.enabled
                ? 'Your pickup request will be reviewed by the mosque committee. Once approved, community members who offer transportation assistance will be able to see your request and coordinate pickup times with you.'
                : 'Submit a pickup assistance request to coordinate transportation help from community members. This is especially useful if you usually walk to mosque but sometimes need a ride due to weather, health, or other circumstances.'}
            </Text>
          </View>
        </View>
        {/* Submit Button - Only show when pickup is enabled */}
        {settings.enabled && (
          <View style={styles.saveSection}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (isLoading ||
                  settings.status === 'pending' ||
                  settings.status === 'approved' ||
                  !settings.enabled) &&
                  styles.saveButtonDisabled,
              ]}
              onPress={submitRequest}
              disabled={
                isLoading ||
                settings.status === 'pending' ||
                settings.status === 'approved' ||
                !settings.enabled
              }>
              <Text style={styles.saveButtonText}>{getButtonText()}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  statusBarSpacer: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing.xl, // Add extra top padding for status bar
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 18,
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: spacing.lg,
    margin: spacing.lg,
    borderLeftWidth: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  statusTitle: {
    ...typography.h3,
    fontSize: 16,
  },
  statusDescription: {
    ...typography.body,
    color: '#666',
    lineHeight: 20,
  },
  settingSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.h3,
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    ...typography.body,
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    color: '#333',
    marginBottom: spacing.md,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    ...typography.body,
    color: '#666',
    flex: 1,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: spacing.sm,
    minWidth: 80,
    textAlign: 'center',
    ...typography.body,
  },
  daysContainer: {
    marginTop: spacing.md,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dayButtonDisabled: {
    opacity: 0.5,
  },
  dayButtonText: {
    ...typography.body,
    fontSize: 12,
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.body,
    color: '#333',
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: '#F44336',
    borderWidth: 1.5,
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  errorText: {
    ...typography.body,
    fontSize: 12,
    color: '#F44336',
    marginTop: spacing.xs,
    marginLeft: 2,
  },
  infoSection: {
    margin: spacing.lg,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoTitle: {
    ...typography.h3,
    fontSize: 16,
    color: '#1976D2',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: '#1565C0',
    lineHeight: 20,
  },
  saveSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A5A5A5',
  },
  saveButtonText: {
    ...typography.h3,
    color: '#FFF',
    fontSize: 16,
  },
});

export default PickupSettingsScreen;
