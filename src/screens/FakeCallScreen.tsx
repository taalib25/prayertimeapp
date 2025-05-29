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

  useEffect(() => {
    console.log('FakeCallScreen mounted');

    // Request system alert window permission for Android
    if (Platform.OS === 'android') {
      // Request overlay permission for showing over DND
      const {NativeModules} = require('react-native');
      if (NativeModules.SystemOverlay) {
        NativeModules.SystemOverlay.requestPermission();
      }
    }

    // Cancel all notifications related to fake calls when screen opens
    dismissAllCallNotifications();

    // Configure audio to bypass DND mode aggressively
    try {
      // Play ringtone immediately with maximum volume
      SoundPlayer.setVolume(1.0);
      SoundPlayer.playSoundFile('ringtone', 'mp3');
    } catch (error) {
      console.log('Error configuring audio:', error);
    }

    // Start very aggressive vibration pattern for DND bypass
    const vibrationPattern = [200, 300, 200, 300, 200, 300, 200, 300, 200, 300];
    Vibration.vibrate(vibrationPattern, true);

    // Auto timeout the call after 60 seconds (1 minute) if not answered
    timeoutRef.current = setTimeout(() => {
      console.log('Call auto-timeout after 1 minute');
      handleAutoTimeout();
    }, 60000); // 60 seconds timeout

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

      // Stop vibration and sound
      Vibration.cancel();
      try {
        SoundPlayer.stop();
      } catch (error) {
        console.log('Error stopping sound in cleanup:', error);
      }

      backHandler.remove();
    };
  }, []); // Removed callStatus dependency to prevent re-initializing

  /**
   * Dismiss all notifications related to fake calls
   */
  const dismissAllCallNotifications = async () => {
    try {
      // Get all displayed notifications
      const notifications = await notifee.getDisplayedNotifications();

      // Filter and cancel fake call notifications
      for (const notification of notifications) {
        if (
          notification.notification.data?.screen === 'FakeCallScreen' ||
          notification.notification.title === 'Incoming Call' ||
          notification.notification.title === 'Connecting call...'
        ) {
          if (notification.notification.id) {
            await notifee.cancelNotification(notification.notification.id);
            console.log(
              'Cancelled notification:',
              notification.notification.id,
            );
          }
        }
      }

      // Also cancel by channel ID as a fallback
      await notifee.cancelAllNotifications(['fake-call-channel']);
      console.log('Dismissed all call notifications');
    } catch (error) {
      console.error('Error dismissing notifications:', error);
    }
  };

  const handleAutoTimeout = () => {
    console.log('Call auto-timeout');
    setCallStatus('ended');
    cleanupAndExit();
  };

  const cleanupAndExit = () => {
    // Stop vibration
    Vibration.cancel();

    // Stop any playing sound
    try {
      SoundPlayer.stop();
    } catch (error) {
      console.log('Error stopping sound:', error);
    }

    // Dismiss any remaining notifications
    dismissAllCallNotifications();

    // Navigate back to main screen instead of closing app
    try {
      if (navigationInitialized.current && navigation) {
        navigation.navigate('MainApp'); // Navigate to home screen
      } else {
        // Fallback: Go back or exit app
        BackHandler.exitApp();
      }
    } catch (error) {
      console.error('Navigation error:', error);
      BackHandler.exitApp();
    }
  };

  const handleAcceptCall = async () => {
    console.log('Call accepted');

    // Stop the ringing sound first
    try {
      SoundPlayer.stop();
    } catch (error) {
      console.log('Error stopping ringing sound:', error);
    }

    // Dismiss notifications immediately when call is accepted
    await dismissAllCallNotifications();

    setCallStatus('connected');

    // Clear the timeout since call was answered
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Stop vibration
    Vibration.cancel();

    // Play a different sound when call is answered
    try {
      SoundPlayer.playSoundFile('ringtone', 'mp3');
    } catch (error) {
      console.log('Error playing answer sound:', error);
    }

    // Start call duration timer
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // End call automatically after 15 seconds
    setTimeout(() => {
      handleEndCall();
    }, 15000);
  };

  const handleRejectCall = async () => {
    console.log('Call rejected');

    // Stop ringing sound immediately
    try {
      SoundPlayer.stop();
    } catch (error) {
      console.log('Error stopping sound:', error);
    }

    // Dismiss notifications immediately when call is rejected
    await dismissAllCallNotifications();

    setCallStatus('ended');

    // Navigate away immediately when call is rejected
    try {
      if (navigationInitialized.current && navigation) {
        navigation.navigate('MainApp'); // Navigate back to home
      } else {
        BackHandler.exitApp();
      }
    } catch (error) {
      console.error('Navigation error:', error);
      BackHandler.exitApp();
    }
  };

  const handleEndCall = async () => {
    console.log('Call ended');

    // Stop any playing sound
    try {
      SoundPlayer.stop();
    } catch (error) {
      console.log('Error stopping sound:', error);
    }

    // Dismiss notifications when call is ended
    await dismissAllCallNotifications();

    setCallStatus('ended');
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Navigate away when call is ended
    try {
      if (navigationInitialized.current && navigation) {
        navigation.navigate('MainApp'); // Navigate back to home
      } else {
        BackHandler.exitApp();
      }
    } catch (error) {
      console.error('Navigation error:', error);
      BackHandler.exitApp();
    }
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
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>🕌</Text>
            </View>
            <Text style={styles.callerName}>Prayer Reminder</Text>
            <Text style={styles.callerSubtitle}>Islamic Prayer Call</Text>
            <Text style={styles.incomingText}>Incoming call...</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleRejectCall}>
              <Text style={styles.buttonText}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAcceptCall}>
              <Text style={styles.buttonText}>📞</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    } else if (callStatus === 'connected') {
      return (
        <>
          <View style={styles.callerInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>🕌</Text>
            </View>
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
      return (
        <View style={styles.callerInfo}>
          <Text style={styles.callerName}>Call Ended</Text>
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
    backgroundColor: '#000', // Black background like real call screen
    paddingTop: 80,
    paddingBottom: 50,
  },
  callerInfo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1abc9c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 60,
  },
  callerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  callerSubtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 15,
    textAlign: 'center',
  },
  incomingText: {
    fontSize: 16,
    color: '#1abc9c',
    marginTop: 20,
    textAlign: 'center',
  },
  callDuration: {
    fontSize: 18,
    color: '#1abc9c',
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    alignItems: 'center',
  },
  connectedButtonContainer: {
    alignItems: 'center',
    width: '80%',
  },
  acceptButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rejectButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  endCallButton: {
    width: 100,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 30,
    color: 'white',
  },
  endCallButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
});

export default FakeCallScreen;
