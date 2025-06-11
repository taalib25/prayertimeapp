import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Vibration,
  Platform,
} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {RootStackParamList} from '../../App';
import notifee from '@notifee/react-native';
import SoundPlayer from 'react-native-sound-player';
import SvgIcon from '../components/SvgIcon';
import {colors, spacing} from '../utils/theme';
import {typography} from '../utils/typography';

const FakeCallScreen = () => {
  // Use a ref to store if we've tried to initialize navigation
  const navigationInitialized = useRef(false);

  // Try to get navigation from useNavigation hook
  let navigation: NavigationProp<RootStackParamList>;
  try {
    navigation = useNavigation<NavigationProp<RootStackParamList>>();
    navigationInitialized.current = true;
  } catch (error) {
    // If useNavigation fails, we'll use the global navigationRef instead
    console.log('Navigation hook failed, will use global ref');
  }

  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<
    'ringing' | 'connected' | 'ended'
  >('ringing');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const endedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('FakeCallScreen mounted');

    // Immediately dismiss all notifications to prevent conflicts
    dismissAllNotifications();

    // Request system alert window permission for Android
    if (Platform.OS === 'android') {
      // Request overlay permission for showing over DND
      const {NativeModules} = require('react-native');
      if (NativeModules.SystemOverlay) {
        NativeModules.SystemOverlay.requestPermission();
      }
    }

    // Cancel all notifications related to fake calls when screen opens
    dismissAllNotifications();

    // Configure audio to bypass DND mode aggressively
    try {
      // Play ringtone immediately with maximum volume
      SoundPlayer.setVolume(1.0);
      SoundPlayer.playSoundFile('ringtone', 'mp3');
    } catch (error) {
      console.log('Error configuring audio:', error);
    }

    // Start very aggressive vibration pattern for DND bypass - ensure even number of elements
    const vibrationPattern = [0, 200, 400, 200, 400, 200];
    Vibration.vibrate(vibrationPattern, true);

    // Auto timeout the call after 20 seconds if not answered
    timeoutRef.current = setTimeout(() => {
      console.log('Call auto-timeout after 20 seconds');
      handleAutoTimeout();
    }, 20000); // 20 seconds timeout

    // Handle Android back button to prevent easily dismissing
    const backAction = () => {
      console.log('Back button pressed on fake call screen');
      return true; // Prevents default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => {
      console.log('FakeCallScreen cleanup');

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (endedTimeoutRef.current) {
        clearTimeout(endedTimeoutRef.current);
      }

      // Stop vibration and sound
      Vibration.cancel();
      try {
        SoundPlayer.stop();
      } catch (error) {
        console.log('Error stopping sound in cleanup:', error);
      }

      // Final cleanup of notifications
      dismissAllNotifications();

      backHandler.remove();
    };
  }, []);

  // Add effect to handle automatic navigation when call ends
  useEffect(() => {
    if (callStatus === 'ended') {
      // Set a timeout to navigate after showing "Call Ended" message
      endedTimeoutRef.current = setTimeout(() => {
        cleanupAndExit();
      }, 2000); // Show "Call Ended" for 2 seconds
    }

    return () => {
      if (endedTimeoutRef.current) {
        clearTimeout(endedTimeoutRef.current);
      }
    };
  }, [callStatus]);

  /**
   * Comprehensive notification dismissal
   */
  const dismissAllNotifications = async () => {
    try {
      console.log('🧹 Starting comprehensive notification dismissal...');

      // Cancel ALL notifications first
      await notifee.cancelAllNotifications();

      // Get and cancel all trigger notifications
      const triggerNotifications = await notifee.getTriggerNotifications();
      for (const trigger of triggerNotifications) {
        if (trigger.notification.id) {
          await notifee.cancelTriggerNotification(trigger.notification.id);
        }
      }

      // Get and cancel all displayed notifications
      const displayedNotifications = await notifee.getDisplayedNotifications();
      for (const notification of displayedNotifications) {
        if (notification.notification.id) {
          await notifee.cancelNotification(notification.notification.id);
        }
      }

      // Cancel by specific channels
      await notifee.cancelAllNotifications(['prayer-notifications-fullscreen']);
      await notifee.cancelAllNotifications(['prayer-notifications-standard']);

      console.log('✅ All notifications dismissed');
    } catch (error) {
      console.error('❌ Error dismissing notifications:', error);
    }
  };

  const handleAutoTimeout = () => {
    console.log('Call auto-timeout');
    setCallStatus('ended');
    // Timeout will be handled by useEffect
  };

  const cleanupAndExit = () => {
    console.log('Starting cleanup and exit process...');

    // Stop vibration and sound immediately
    Vibration.cancel();
    try {
      SoundPlayer.stop();
    } catch (error) {
      console.log('Error stopping sound:', error);
    }

    // Clear all timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (endedTimeoutRef.current) {
      clearTimeout(endedTimeoutRef.current);
    }

    // Dismiss notifications one final time
    dismissAllNotifications();

    // Navigate with multiple fallback strategies
    const navigateToMain = () => {
      try {
        if (navigationInitialized.current && navigation) {
          console.log('Using navigation hook to reset to MainApp');
          navigation.reset({
            index: 0,
            routes: [{name: 'MainApp'}],
          });
        } else {
          const {navigationRef} = require('../../App');
          if (navigationRef.current) {
            console.log('Using global navigationRef to reset to MainApp');
            navigationRef.current.reset({
              index: 0,
              routes: [{name: 'MainApp'}],
            });
          } else {
            console.log('No navigation available, attempting goBack');
            const {goBack} = require('../../App');
            goBack();
          }
        }
      } catch (error) {
        console.error('Navigation failed:', error);
        // Last resort - exit app
        BackHandler.exitApp();
      }
    };

    // Add a small delay to ensure cleanup completes
    setTimeout(navigateToMain, 200);
  };

  const handleAcceptCall = async () => {
    console.log('Call accepted');

    // Stop the ringing sound and vibration immediately
    try {
      SoundPlayer.stop();
    } catch (error) {
      console.log('Error stopping ringing sound:', error);
    }

    Vibration.cancel();

    // Dismiss all notifications
    await dismissAllNotifications();

    setCallStatus('connected');

    // Clear the timeout since call was answered
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Play the fajr sound in loop mode
    try {
      SoundPlayer.playSoundFile('fajr', 'mp3');
      SoundPlayer.setVolume(1.0);
      SoundPlayer.setNumberOfLoops(-1);
      SoundPlayer.play();
    } catch (error) {
      console.log('Error playing answer sound in loop:', error);
    }

    // Start call duration timer
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const handleRejectCall = async () => {
    console.log('Call rejected');

    // Stop everything immediately
    try {
      SoundPlayer.stop();
    } catch (error) {
      console.log('Error stopping sound:', error);
    }

    Vibration.cancel();
    await dismissAllNotifications();

    setCallStatus('ended');
    // Timeout will be handled by useEffect
  };

  const handleEndCall = async () => {
    console.log('Call ended');

    // Stop everything
    try {
      SoundPlayer.stop();
    } catch (error) {
      console.log('Error stopping sound:', error);
    }

    Vibration.cancel();
    await dismissAllNotifications();

    setCallStatus('ended');
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    // Timeout will be handled by useEffect
  };

  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const renderCallInterface = () => {
    if (callStatus === 'ringing') {
      return (
        <>
          <View style={styles.callerInfo}>
            <SvgIcon name="fajrlogo" size={160} />
            <Text style={styles.callerName}>Prayer Reminder</Text>
            <Text style={styles.callerSubtitle}>Time for prayer</Text>
            <Text style={styles.incomingText}>Incoming call...</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleRejectCall}>
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAcceptCall}>
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    } else if (callStatus === 'connected') {
      return (
        <>
          <View style={styles.callerInfo}>
            <SvgIcon name="fajrlogo" size={160} />
            <Text style={styles.callerName}>Prayer Reminder</Text>
            <Text style={styles.callerSubtitle}>Connected</Text>
            <Text style={styles.callDuration}>
              {formatCallDuration(callDuration)}
            </Text>
          </View>

          <View style={styles.connectedButtonContainer}>
            <TouchableOpacity
              style={styles.endCallButton}
              onPress={handleEndCall}>
              <Text style={styles.endCallButtonText}>End Call</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    } else {
      // Call ended state - show very brief message
      return (
        <View style={styles.callerInfo}>
          <SvgIcon name="fajrlogo" size={100} color={colors.text.secondary} />
          <Text style={styles.callEndedText}>Call Ended</Text>
        </View>
      );
    }
  };

  return <View style={styles.container}>{renderCallInterface()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 50,
    backgroundColor: '#ffffff', // White background
  },
  callerInfo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  callerName: {
    ...typography.h2,
    color: colors.primary,
    marginTop: 30,
    marginBottom: 8,
    textAlign: 'center',
  },
  callerSubtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    marginBottom: 15,
    textAlign: 'center',
  },
  incomingText: {
    ...typography.bodyMedium,
    color: '#4CAF50', // Green color for incoming text
    marginTop: 20,
    textAlign: 'center',
  },
  callDuration: {
    ...typography.h3,
    color: '#4CAF50', // Green color for duration
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    alignItems: 'center',
  },
  connectedButtonContainer: {
    alignItems: 'center',
    width: '80%',
  },
  acceptButton: {
    width: 150,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50', // Green accept button
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  rejectButton: {
    width: 150,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F44336', // Red reject button
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  endCallButton: {
    width: 180,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    ...typography.button,
    color: 'white',
    fontWeight: '600',
  },
  endCallButtonText: {
    ...typography.button,
    color: 'white',
    fontWeight: '600',
  },
  callEndedText: {
    ...typography.h3,
    color: colors.text.secondary,
    marginTop: 20,
    textAlign: 'center',
  },
});

export default FakeCallScreen;
