import React, {useState, useEffect} from 'react';
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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {colors, spacing} from '../utils/theme';
import {typography} from '../utils/typography';
import SvgIcon from '../components/SvgIcon';
import UserService from '../services/UserService';
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

  useEffect(() => {
    loadSettings();
  }, []);
  const loadSettings = async () => {
    try {
      setIsLoading(true);
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
    } catch (error) {
      console.error('Error loading pickup settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitRequest = async () => {
    try {
      setIsLoading(true);

      const requestToSubmit = {
        ...settings,
        status: 'pending' as RequestStatus,
        requestDate: new Date().toISOString(),
        reviewDate: undefined,
        reviewNotes: undefined,
      };
      await userService.updateSystemData({
        pickupSettings: requestToSubmit,
      });

      setSettings(requestToSubmit);

      Alert.alert(
        'Request Submitted ✅',
        'Your pickup assistance request has been sent to the mosque committee for review. You will be notified once it has been reviewed.',
        [{text: 'OK', style: 'default'}],
      );
    } catch (error) {
      console.error('Error submitting pickup request:', error);
      Alert.alert(
        'Error ❌',
        'Failed to submit pickup request. Please try again.',
        [{text: 'OK', style: 'default'}],
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
    if (!canEditRequest()) return;
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
    return settings.status === 'none' || settings.status === 'rejected';
  };

  const getButtonText = () => {
    if (isLoading) return 'Submitting...';
    if (settings.status === 'pending') return 'Request Under Review';
    if (settings.status === 'approved') return 'Request Approved';
    if (settings.status === 'rejected') return 'Resubmit Request';
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
  }> = ({title, description, value, onValueChange}) => (
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
        disabled={!canEditRequest()}
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

        {/* Main Settings */}
        <View style={styles.settingSection}>
          <SettingItem
            title="Request Pickup Assistance"
            description="Request help with transportation to and from mosque"
            value={settings.enabled}
            onValueChange={value =>
              setSettings(prev => ({...prev, enabled: value}))
            }
          />
        </View>

        {/* Detailed Settings - Only show when enabled */}
        {settings.enabled && (
          <>
            {/* Time Settings */}
            <View style={styles.settingSection}>
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
            </View>

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
                  ]}
                  value={settings.emergencyContact}
                  onChangeText={value =>
                    setSettings(prev => ({...prev, emergencyContact: value}))
                  }
                  placeholder="Enter emergency contact number"
                  keyboardType="phone-pad"
                  editable={canEditRequest()}
                />
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
                  ]}
                  value={settings.specificLocation}
                  onChangeText={value =>
                    setSettings(prev => ({...prev, specificLocation: value}))
                  }
                  placeholder="Enter specific pickup address or landmark"
                  multiline={true}
                  numberOfLines={3}
                  editable={canEditRequest()}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Additional Notes</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    !canEditRequest() && styles.inputDisabled,
                  ]}
                  value={settings.notes}
                  onChangeText={value =>
                    setSettings(prev => ({...prev, notes: value}))
                  }
                  placeholder="Any additional information for pickup assistance"
                  multiline={true}
                  numberOfLines={3}
                  editable={canEditRequest()}
                />
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

        {/* Submit Button */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (isLoading ||
                settings.status === 'pending' ||
                settings.status === 'approved') &&
                styles.saveButtonDisabled,
            ]}
            onPress={submitRequest}
            disabled={
              isLoading ||
              settings.status === 'pending' ||
              settings.status === 'approved'
            }>
            <Text style={styles.saveButtonText}>{getButtonText()}</Text>
          </TouchableOpacity>
        </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999',
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
