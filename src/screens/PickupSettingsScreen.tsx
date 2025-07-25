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
  TextInput,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {spacing} from '../utils/theme';
import {typography} from '../utils/typography';
import {pickupRequestSchema} from '../utils/validation';
import SvgIcon from '../components/SvgIcon';
import UserService from '../services/UserService';
import ApiTaskServices from '../services/apiHandler';
import {PickupSettings} from '../types/User';
import AlertModal from '../components/AlertModel';

// Request status types
type RequestStatus = 'none' | 'pending' | 'approved' | 'rejected';
type UserRole = 'driver' | 'member' | null;

interface PickupRequest extends PickupSettings {
  status: RequestStatus;
  requestDate?: string;
  reviewDate?: string;
  reviewNotes?: string;
}

// New interfaces for approved request data
interface MemberInfo {
  name: string;
  phone: string;
  pickupLocation: string;
  userId: string;
}

interface DriverInfo {
  name: string;
  phone: string;
  vehicle: string;
  userId: string;
}

interface RideMatchPayload {
  member: MemberInfo;
  driver: DriverInfo | null;
}

const PickupSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const userService = UserService.getInstance();
  const apiService = ApiTaskServices.getInstance();

  // Existing state
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{
    [key: string]: string | null;
  }>({
    emergencyContact: null,
    specificLocation: null,
    notes: null,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmDestructive?: boolean;
  }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // New state for approved request flow
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [rideMatch, setRideMatch] = useState<RideMatchPayload | null>(null);
  const [isLoadingRoleData, setIsLoadingRoleData] = useState(false);

  // 🧪 TEMPORARY: Role simulation for testing
  const [isTestMode, setIsTestMode] = useState(true); // Toggle this for testing

  // Existing validation helper
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

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({
      emergencyContact: null,
      specificLocation: null,
      notes: null,
    });
  }, []);

  // 🧪 TEMPORARY: Simulate role switching for testing
  const simulateRoleSwitch = (role: 'driver' | 'member') => {
    setUserRole(role);
    
    // Simulate different ride match data based on role
    if (role === 'driver') {
      setRideMatch({
        member: {
          name: 'Fatima Ali',
          phone: '+1 555 123 456',
          pickupLocation: '1600 Amphitheatre Pkwy, Mountain View, CA',
          userId: 'member123',
        },
        driver: {
          name: 'Ahmed Khan (You)',
          phone: '+1 555 987 654',
          vehicle: 'Honda Civic – AB-123-CD',
          userId: 'driver456',
        },
      });
    } else {
      setRideMatch({
        member: {
          name: 'Fatima Ali (You)',
          phone: '+1 555 123 456',
          pickupLocation: '1600 Amphitheatre Pkwy, Mountain View, CA',
          userId: 'member123',
        },
        driver: {
          name: 'Ahmed Khan',
          phone: '+1 555 987 654',
          vehicle: 'Honda Civic – AB-123-CD',
          userId: 'driver456',
        },
      });
    }
  };

  // 🧪 TEMPORARY: Simulate approval for testing
  const simulateApproval = () => {
    setSettings(prev => ({
      ...prev,
      status: 'approved',
      reviewDate: new Date().toISOString(),
    }));
    // Automatically set a default role for testing
    simulateRoleSwitch('driver'); // Change to 'member' to test member view
  };

  // New function to check user role and load ride data
  const checkUserRoleAndLoadRideData = useCallback(async () => {
    try {
      setIsLoadingRoleData(true);
      
      if (isTestMode) {
        // 🧪 TEMPORARY: Use simulated data
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        // Default to driver for testing - you can change this
        simulateRoleSwitch('driver');
        return;
      }
      
      // Real API calls (implement these in your ApiTaskServices)
      const roleResponse = await apiService.getUserRole();
      
      if (roleResponse.success) {
        const role = roleResponse.data.role;
        setUserRole(role);
        
        const rideMatchResponse = await apiService.getRideMatch();
        
        if (rideMatchResponse.success) {
          setRideMatch(rideMatchResponse.data);
        }
      }
    } catch (error) {
      console.error('Error checking user role and ride data:', error);
      // Fallback to simulated data on error
      simulateRoleSwitch('driver');
    } finally {
      setIsLoadingRoleData(false);
    }
  }, [apiService, isTestMode]);

  // Existing loadSettings function with fixed TypeScript logic
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 150));

      const apiResponse = await apiService.getPickupRequests();

      if (
        apiResponse.success &&
        apiResponse.data &&
        apiResponse.data.data &&
        apiResponse.data.data.length > 0
      ) {
        const latestRequest = apiResponse.data.data[0];

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

        const newSettings: PickupRequest = {
          enabled: true,
          preferredTime: '05:00',
          emergencyContact: latestRequest.contact_number,
          specificLocation: latestRequest.pickup_location,
          notes: latestRequest.special_instructions || '',
          availableDays: availableDaysObject,
          status: latestRequest.status as RequestStatus, // Type assertion to fix TS error
          requestDate: latestRequest.created_at,
          reviewDate: latestRequest.updated_at,
          reviewNotes: undefined,
        };

        setSettings(newSettings);

        // Fixed TypeScript comparison - check string equality properly
        if (newSettings.status === 'approved') {
          await checkUserRoleAndLoadRideData();
        }
      } else {
        const systemData = await userService.getSystemData();
        if (systemData.pickupSettings) {
          const loadedSettings: PickupRequest = {
            ...systemData.pickupSettings,
            status: ((systemData.pickupSettings as any).status as RequestStatus) || 'none',
            requestDate: (systemData.pickupSettings as any).requestDate,
            reviewDate: (systemData.pickupSettings as any).reviewDate,
            reviewNotes: (systemData.pickupSettings as any).reviewNotes,
          };
          setSettings(loadedSettings);

          // Fixed TypeScript comparison
          if (loadedSettings.status === 'approved') {
            await checkUserRoleAndLoadRideData();
          }
        }
      }
    } catch (error) {
      console.error('Error loading pickup settings:', error);
      try {
        const systemData = await userService.getSystemData();
        if (systemData.pickupSettings) {
          setSettings({
            ...systemData.pickupSettings,
            status: ((systemData.pickupSettings as any).status as RequestStatus) || 'none',
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
      setIsInitialLoad(false);
      clearFieldErrors();
    }
  }, [apiService, userService, clearFieldErrors, checkUserRoleAndLoadRideData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSettings();
    }, 100);
    return () => clearTimeout(timer);
  }, [loadSettings]);

  // New function to open Google Maps
// Replace the existing openMaps function with this improved version
const openMaps = useCallback(async (placeName: string) => {
  const encodedPlace = encodeURIComponent(placeName);
  
  try {
    if (Platform.OS === 'ios') {
      // iOS: Try Apple Maps first, then Google Maps, then web fallback
      const appleMapsUrl = `maps://maps.apple.com/?q=${encodedPlace}`;
      const googleMapsUrl = `comgooglemaps://?q=${encodedPlace}`;
      const webUrl = `https://maps.apple.com/?q=${encodedPlace}`;
      
      // Try Apple Maps (native)
      const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
      if (canOpenAppleMaps) {
        await Linking.openURL(appleMapsUrl);
        return;
      }
      
      // Try Google Maps app
      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
      if (canOpenGoogleMaps) {
        await Linking.openURL(googleMapsUrl);
        return;
      }
      
      // Fallback to web Apple Maps
      await Linking.openURL(webUrl);
      
    } else {
      // Android: Try Google Maps app first, then web fallback
      const googleMapsUrl = `geo:0,0?q=${encodedPlace}`;
      const googleMapsPackageUrl = `https://maps.google.com/?q=${encodedPlace}`;
      
      // Try native Google Maps with geo: scheme
      const canOpenGeo = await Linking.canOpenURL(googleMapsUrl);
      if (canOpenGeo) {
        await Linking.openURL(googleMapsUrl);
        return;
      }
      
      // Try to open Google Maps through intent (Android specific)
      const intentUrl = `intent://maps.google.com/maps?q=${encodedPlace}#Intent;scheme=https;package=com.google.android.apps.maps;end`;
      const canOpenIntent = await Linking.canOpenURL(intentUrl);
      if (canOpenIntent) {
        await Linking.openURL(intentUrl);
        return;
      }
      
      // Fallback to web Google Maps
      await Linking.openURL(googleMapsPackageUrl);
    }
    
  } catch (error) {
    console.log('Maps opening error:', error);
    
    // Final fallback - open in web browser
    try {
      const webFallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodedPlace}`;
      await Linking.openURL(webFallbackUrl);
    } catch (finalError) {
      console.log('Final fallback failed:', finalError);
      Alert.alert(
        'Unable to Open Maps',
        'Could not open maps application. Please install Google Maps or Apple Maps and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  }
}, []);


  // Existing submitRequest function
  const submitRequest = async () => {
    try {
      setIsLoading(true);

      if (!settings.enabled) {
        setModalConfig({
          title: 'Enable Pickup Request',
          message: 'Please enable pickup assistance to submit a request.',
          onConfirm: () => setModalVisible(false),
          confirmText: 'OK',
        });
        setModalVisible(true);
        return;
      }

      try {
        pickupRequestSchema.parse({
          specificLocation: settings.specificLocation,
          emergencyContact: settings.emergencyContact,
          notes: settings.notes,
          availableDays: settings.availableDays,
        });
      } catch (validationError: any) {
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

      const availableDaysArray = Object.entries(settings.availableDays)
        .filter(([_, isAvailable]) => isAvailable)
        .map(([day, _]) => day);

      const response = await apiService.submitPickupRequest(
        settings.specificLocation,
        availableDaysArray,
        settings.emergencyContact,
        settings.notes,
        ['fajr'],
      );

      if (response.success) {
        const updatedSettings: PickupRequest = {
          ...settings,
          status: 'pending',
          requestDate: new Date().toISOString(),
          reviewDate: undefined,
          reviewNotes: undefined,
        };

        await userService.updateSystemData({
          pickupSettings: updatedSettings,
        });

        setSettings(updatedSettings);

        setModalConfig({
          title: 'Request Submitted ✅',
          message:
            'Your pickup assistance request has been sent to the mosque committee for review. You will be notified once it has been reviewed.',
          onConfirm: () => setModalVisible(false),
          confirmText: 'OK',
        });
        setModalVisible(true);
      } else {
        const errorMessage = response.error || 'Failed to submit request';
        console.error('API Error:', errorMessage);

        setModalConfig({
          title: 'Submission Failed',
          message: `Unable to submit your pickup request: ${errorMessage}. Please check your internet connection and try again.`,
          onConfirm: () => setModalVisible(false),
          confirmText: 'OK',
        });
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error submitting pickup request:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      setModalConfig({
        title: 'Network Error ❌',
        message: `Failed to submit pickup request due to a network error: ${errorMessage}. Please check your internet connection and try again.`,
        onConfirm: () => submitRequest(),
        onCancel: () => setModalVisible(false),
        confirmText: 'Retry',
        cancelText: 'Cancel',
      });
      setModalVisible(true);
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

  // Fixed helper functions with proper TypeScript handling
  const getStatusColor = (status: RequestStatus): string => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'none':
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: RequestStatus): string => {
    switch (status) {
      case 'pending':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Needs Revision';
      case 'none':
      default:
        return 'Draft';
    }
  };

  const getStatusIcon = (status: RequestStatus): string => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'none':
      default:
        return '📝';
    }
  };

  const canEditRequest = (): boolean => {
    return (
      settings.enabled &&
      (settings.status === 'none' || settings.status === 'rejected')
    );
  };

  const canEditMainToggle = (): boolean => {
    return true;
  };

  const getButtonText = (): string => {
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

  // New components for approved request views
  const InfoRow: React.FC<{label: string; value: string}> = ({label, value}) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  // INLINE Test Controls inside approved views
  const InlineTestControls: React.FC = () => {
    if (!isTestMode) return null;

    return (
      <View style={styles.inlineTestControls}>
        <Text style={styles.inlineTestTitle}>🧪 Test Controls</Text>
        <View style={styles.inlineTestButtons}>
          <TouchableOpacity
            style={[styles.inlineTestButton, styles.driverButton]}
            onPress={() => simulateRoleSwitch('driver')}
            activeOpacity={0.6}>
            <Text style={styles.inlineTestButtonText}>Driver</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.inlineTestButton, styles.memberButton]}
            onPress={() => simulateRoleSwitch('member')}
            activeOpacity={0.6}>
            <Text style={styles.inlineTestButtonText}>Member</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // REDUCED Driver View
  const DriverView: React.FC = () => {
    if (!rideMatch?.member) return null;

    return (
      <View style={styles.approvedContent}>
        <Text style={styles.approvedTitle}>Member Pickup Details</Text>
        
        {/* Test Controls inside view */}
        <InlineTestControls />
        
        <View style={styles.detailsCard}>
          <InfoRow label="Member Name" value={rideMatch.member.name} />
          <InfoRow label="Phone Number" value={rideMatch.member.phone} />
          <InfoRow label="Pickup Location" value={rideMatch.member.pickupLocation} />
        </View>

        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => openMaps(rideMatch.member.pickupLocation)}
          activeOpacity={0.7}>
          <Text style={styles.navigateButtonText}>Navigate with Google Maps</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🚗 Driver Instructions</Text>
          <Text style={styles.infoText}>
            • Arrive 5-10 minutes before scheduled time{'\n'}
            • Call if running late or can't find location{'\n'}
            • Contact mosque emergency: +1 (555) 123-4567
          </Text>
        </View>
      </View>
    );
  };

  // REDUCED Member View
  const MemberView: React.FC = () => {
    if (!rideMatch) return null;

    return (
      <View style={styles.approvedContent}>
        <Text style={styles.approvedTitle}>Your Driver Details</Text>
        
        {/* Test Controls inside view */}
        <InlineTestControls />
        
        {rideMatch.driver ? (
          <>
            <View style={styles.detailsCard}>
              <InfoRow label="Driver Name" value={rideMatch.driver.name} />
              <InfoRow label="Phone Number" value={rideMatch.driver.phone} />
              <InfoRow label="Vehicle" value={rideMatch.driver.vehicle} />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📱 Pickup Instructions</Text>
              <Text style={styles.infoText}>
                • Be ready 5 minutes before pickup time{'\n'}
                • Wait at your specified location{'\n'}
                • Verify driver's name and vehicle before getting in{'\n'}
                • Emergency contact: +1 (555) 123-4567
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🔍 Finding Driver</Text>
            <Text style={styles.infoText}>
              We are looking for an available driver in your area. You'll see their contact details here once someone accepts your request.
            </Text>
          </View>
        )}
      </View>
    );
  };

  // StatusCard component with fixed TypeScript
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
          }. ${userRole ? 'See details below.' : 'Loading driver/member information...'}`}
        {settings.status === 'rejected' &&
          `Your request needs revision. ${
            settings.reviewNotes ||
            'Please update the information and resubmit.'
          }`}
      </Text>
    </View>
  );

  // Main Test Controls (top level)
  const MainTestControls: React.FC = () => {
    if (!isTestMode || settings.status === 'approved') return null;

    return (
      <View style={styles.testControls}>
        <Text style={styles.testTitle}>🧪 Test Controls</Text>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={simulateApproval}
          activeOpacity={0.7}>
          <Text style={styles.testButtonText}>Simulate Approval</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Rest of existing components with improved touch sensitivity
  const SettingItem: React.FC<{
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    isMainToggle?: boolean;
  }> = ({title, description, value, onValueChange, isMainToggle = false}) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={value => {
          const isPendingOrApproved = settings.status === 'pending' || settings.status === 'approved';
          
          if (!value && isPendingOrApproved) {
            setModalConfig({
              title: 'Cannot Disable',
              message: `You cannot disable pickup assistance while your request is ${settings.status}. Please contact the mosque committee if you need to cancel your request.`,
              onConfirm: () => setModalVisible(false),
              confirmText: 'OK',
            });
            setModalVisible(true);
            return;
          }
          setSettings(prev => ({...prev, enabled: value}));
        }}
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
            disabled={!canEditRequest()}
            activeOpacity={0.7}>
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

  // SINGLE SCROLLABLE VIEW - Main render
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

        {Platform.OS === 'android' && <View style={styles.statusBarSpacer} />}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <SvgIcon name="backBtn" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pickup Assistance Request</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Show loading during initial render */}
        {isInitialLoad ? (
          <View style={styles.initialLoadingContainer}>
            <View style={styles.contentSkeleton}>
              <View style={styles.skeletonCard} />
              <View style={styles.skeletonSection} />
              <View style={styles.skeletonSection} />
            </View>
          </View>
        ) : (
          /* SINGLE MAIN SCROLLVIEW FOR EVERYTHING */
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}>
            
            {/* Main Test Controls */}
            <MainTestControls />
            
            {/* Status Card - Always show */}
            <StatusCard />

            {/* If request is approved, show role-specific view */}
            {settings.status === 'approved' && userRole && rideMatch && !isLoadingRoleData && (
              <>
                {userRole === 'driver' && <DriverView />}
                {userRole === 'member' && <MemberView />}
              </>
            )}

            {/* If request is approved but still loading role data */}
            {settings.status === 'approved' && isLoadingRoleData && (
              <View style={styles.loadingRoleContainer}>
                <Text style={styles.loadingRoleText}>Loading driver/member information...</Text>
              </View>
            )}

            {/* Original form - Only show when NOT approved */}
            {settings.status !== 'approved' && (
              <>
                <View style={styles.settingSection}>
                  <SettingItem
                    title="Request Pickup Assistance"
                    description="Request help with transportation to and from mosque"
                    value={settings.enabled}
                    onValueChange={value => {
                      const isPendingOrApproved = settings.status === 'pending' || settings.status === 'approved';
                      
                      if (!value && isPendingOrApproved) {
                        setModalConfig({
                          title: 'Cannot Disable',
                          message: `You cannot disable pickup assistance while your request is ${settings.status}. Please contact the mosque committee if you need to cancel your request.`,
                          onConfirm: () => setModalVisible(false),
                          confirmText: 'OK',
                        });
                        setModalVisible(true);
                        return;
                      }
                      setSettings(prev => ({...prev, enabled: value}));
                    }}
                    isMainToggle={true}
                  />
                </View>

                {/* Detailed Settings - Only show when enabled */}
                {settings.enabled && (
                  <>
                    {/* Days Selector */}
                    <View style={styles.settingSection}>
                      <DaySelector />
                    </View>

                    {/* Contact Information */}
                    <View style={styles.settingSection}>
                      <Text style={styles.sectionTitle}>Contact Information</Text>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>
                          Emergency Contact Number
                        </Text>
                        <TextInput
                          style={[
                            styles.textInput,
                            !canEditRequest() && styles.inputDisabled,
                            fieldErrors.emergencyContact && styles.textInputError,
                          ]}
                          value={settings.emergencyContact}
                          onChangeText={value => {
                            setSettings(prev => ({
                              ...prev,
                              emergencyContact: value,
                            }));
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
                        <Text style={styles.inputLabel}>
                          Specific Pickup Location
                        </Text>
                        <TextInput
                          style={[
                            styles.textInput,
                            !canEditRequest() && styles.inputDisabled,
                            fieldErrors.specificLocation && styles.textInputError,
                          ]}
                          value={settings.specificLocation}
                          onChangeText={value => {
                            setSettings(prev => ({
                              ...prev,
                              specificLocation: value,
                            }));
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
                    <Text style={styles.infoTitle}>
                      💡 How Pickup Request Works
                    </Text>
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
                      }
                      activeOpacity={0.8}>
                      <Text style={styles.saveButtonText}>{getButtonText()}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
            
            {/* Bottom padding */}
            <View style={{height: 60}} />
          </ScrollView>
        )}

        <AlertModal
          visible={modalVisible}
          title={modalConfig.title}
          message={modalConfig.message}
          onCancel={modalConfig.onCancel || (() => setModalVisible(false))}
          onConfirm={modalConfig.onConfirm}
          confirmText={modalConfig.confirmText}
          cancelText={modalConfig.cancelText}
          confirmDestructive={modalConfig.confirmDestructive}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

// Updated styles with improved touch targets and single scroll view
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
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: spacing.md, // Increased touch target
    marginLeft: -spacing.sm,
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
  scrollContentContainer: {
    paddingBottom: spacing.xl,
  },
  
  // IMPROVED Test Control Styles
  testControls: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  testTitle: {
    ...typography.h3,
    fontSize: 14,
    color: '#856404',
    marginBottom: spacing.sm,
  },
  testButton: {
    backgroundColor: '#6C757D',
    paddingVertical: spacing.md, // Increased touch target
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    minHeight: 44, // Minimum touch target
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // INLINE Test Controls (inside approved views)
  inlineTestControls: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  inlineTestTitle: {
    ...typography.h3,
    fontSize: 12,
    color: '#6C757D',
    marginBottom: spacing.sm,
  },
  inlineTestButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inlineTestButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    minHeight: 40, // Good touch target
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverButton: {
    backgroundColor: '#28A745',
  },
  memberButton: {
    backgroundColor: '#007BFF',
  },
  inlineTestButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  initialLoadingContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  contentSkeleton: {
    flex: 1,
  },
  skeletonCard: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    height: 80,
    marginBottom: spacing.lg,
  },
  skeletonSection: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    height: 560,
    marginBottom: spacing.md,
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
  
  // Approved views - NO NESTED SCROLLVIEW
  approvedContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  approvedTitle: {
    ...typography.h3,
    fontSize: 20,
    color: '#333',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  infoLabel: {
    ...typography.body,
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    ...typography.body,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  navigateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    minHeight: 50, // Better touch target
  },
  navigateButtonText: {
    ...typography.h3,
    color: '#FFF',
    fontSize: 16,
  },
  loadingRoleContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  loadingRoleText: {
    ...typography.body,
    color: '#666',
    fontSize: 16,
  },

  // All existing styles with improved touch targets
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
    minHeight: 60, // Better touch area
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
    paddingVertical: spacing.md, // Increased for better touch
    paddingHorizontal: spacing.md,
    minWidth: 60, // Larger touch target
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 44, // Better touch target for single line
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
    minHeight: 50, // Better touch target
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
