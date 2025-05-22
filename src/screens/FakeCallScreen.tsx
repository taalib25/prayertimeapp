import React, {useEffect, useRef} from 'react'; // Added useRef
import {View, Text, Button, StyleSheet, BackHandler} from 'react-native';
import Sound from 'react-native-sound';
import Tts from 'react-native-tts';

// Initialize Sound for playback
Sound.setCategory('Playback');

// Require the sound file
const ringtone = require('../assets/ringtone.mp3');

const FakeCallScreen = () => {
  // Use useRef to hold the sound instance
  const callSoundRef = useRef<Sound | null>(null);

  useEffect(() => {
    // Clear previous sound instance if any
    if (callSoundRef.current) {
      callSoundRef.current.release();
      callSoundRef.current = null;
    }

    callSoundRef.current = new Sound(ringtone, (error: any) => {
      if (error) {
        console.log('Failed to load the sound', error);
        // Fallback or error handling
        Tts.speak('Incoming call'); // Speak as a fallback
        return;
      }
      // Loaded successfully
      if (callSoundRef.current) {
        callSoundRef.current.setNumberOfLoops(-1); // Loop indefinitely
        callSoundRef.current.play(success => {
          if (!success) {
            console.log('Sound playback failed during play');
          }
        });
      }
    });

    // Optional: Speak a message after a delay
    const ttsTimeout = setTimeout(() => {
      Tts.speak('This is your prayer reminder. Please answer the call.');
    }, 5000); // Speak after 5 seconds

    // Handle Android back button to prevent easily dismissing
    const backAction = () => {
      // You might want to make it harder to dismiss or navigate elsewhere
      console.log('Back button pressed on fake call screen');
      return true; // Prevents default behavior (exiting app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => {
      clearTimeout(ttsTimeout);
      if (callSoundRef.current) {
        callSoundRef.current.stop(() => {
          if (callSoundRef.current) {
            callSoundRef.current.release();
            callSoundRef.current = null; // Clear the ref
          }
        });
      }
      Tts.stop();
      backHandler.remove();
    };
  }, []);

  const handleAcceptCall = () => {
    console.log('Call accepted');
    if (callSoundRef.current) {
      callSoundRef.current.stop();
    }
    Tts.stop();
    // Navigate to prayer screen or close this screen
    // This depends on your app's navigation structure
    // For now, just closes the app or the current activity if it's on top
    BackHandler.exitApp(); // Or use navigation to go to a specific screen
  };

  const handleRejectCall = () => {
    console.log('Call rejected');
    if (callSoundRef.current) {
      callSoundRef.current.stop();
    }
    Tts.stop();
    // Navigate away or close
    BackHandler.exitApp(); // Or use navigation
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incoming Call</Text>
      <Text style={styles.callerName}>Prayer Reminder</Text>
      {/* Add icons or images for a more realistic call screen */}
      <View style={styles.buttonContainer}>
        <Button title="Accept" onPress={handleAcceptCall} color="green" />
        <Button title="Reject" onPress={handleRejectCall} color="red" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00796b', // A teal-like color for call screen
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  callerName: {
    fontSize: 24,
    color: 'white',
    marginBottom: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 50,
  },
});

export default FakeCallScreen;
