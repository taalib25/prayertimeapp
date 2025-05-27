import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Image,
  Vibration,
} from 'react-native';
import Tts from 'react-native-tts';
import {useNavigation} from '@react-navigation/native';

const FakeCallScreen = () => {
  const navigation = useNavigation();
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<
    'ringing' | 'connected' | 'ended'
  >('ringing');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ttsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ttsSpeakingRef = useRef<boolean>(false);

  useEffect(() => {
    console.log('FakeCallScreen mounted');

    // Start vibration pattern for incoming call
    const vibrationPattern = [1000, 1000, 1000, 1000, 1000, 1000];
    Vibration.vibrate(vibrationPattern, true);

    // Initialize TTS settings
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);

    // Speak prayer reminder after a few seconds
    ttsTimeoutRef.current = setTimeout(() => {
      if (callStatus === 'ringing') {
        ttsSpeakingRef.current = true;
        
        // Set up TTS finish event listener
        Tts.addEventListener('tts-finish', () => {
          ttsSpeakingRef.current = false;
          // After the initial announcement, repeat a shorter message every few seconds
          const repeatMessage = () => {
            if (callStatus === 'ringing') {
              Tts.speak('Prayer reminder call. Please answer.');
              setTimeout(() => {
                if (callStatus === 'ringing') {
                  setTimeout(repeatMessage, 5000); // Repeat every 5 seconds
                }
              }, 3000);
            }
          };
          setTimeout(repeatMessage, 3000);
        });
        
        Tts.speak(
          'Assalamu Alaikum. This is your prayer reminder. It is time for prayer. Please answer this call to acknowledge.',
        );
      }
    }, 3000); // Speak after 3 seconds

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

      if (ttsTimeoutRef.current) {
        clearTimeout(ttsTimeoutRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Stop vibration
      Vibration.cancel();

      // Stop TTS
      Tts.stop();
      backHandler.remove();
    };
  }, []); // Removed callStatus dependency to prevent re-initializing

  const handleAutoTimeout = () => {
    console.log('Call auto-timeout');
    setCallStatus('ended');
    cleanupAndExit();
  };

  const cleanupAndExit = () => {
    // Stop TTS and vibration
    Tts.stop();
    Vibration.cancel();

    // Clear timeouts
    if (ttsTimeoutRef.current) {
      clearTimeout(ttsTimeoutRef.current);
    }

    // Navigate back or close the app
    setTimeout(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        BackHandler.exitApp();
      }
    }, 1000);
  };

  const handleAcceptCall = () => {
    console.log('Call accepted');
    setCallStatus('connected');

    // Clear the timeout since call was answered
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Stop vibration and any ongoing TTS
    Vibration.cancel();
    Tts.stop();

    // Start call duration timer
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Speak prayer message when call is answered
    Tts.speak(
      'Assalamu Alaikum. This is your prayer reminder. May Allah bless you. It is time for your obligatory prayer. Please remember to perform your prayers on time. Barakallahu feeki.',
    );

    // End call automatically after TTS message (approximately 15 seconds)
    setTimeout(() => {
      handleEndCall();
    }, 15000);
  };

  const handleRejectCall = () => {
    console.log('Call rejected');
    setCallStatus('ended');
    cleanupAndExit();
  };

  const handleEndCall = () => {
    console.log('Call ended');
    setCallStatus('ended');
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    Tts.speak('Call ended. Jazakallahu khair.');

    // Wait a moment before closing
    setTimeout(() => {
      cleanupAndExit();
    }, 2000);
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
          <Text style={styles.callerSubtitle}>
            May Allah accept your prayers
          </Text>
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
