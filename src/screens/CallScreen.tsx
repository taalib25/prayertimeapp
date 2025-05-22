import React, {useState} from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import notifee, {
  TimestampTrigger,
  TriggerType,
  AndroidImportance,
  AndroidStyle,
  AndroidCategory,
  AndroidVisibility,
} from '@notifee/react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker'; // Import for Android

const CallScreen: React.FC = () => {
  const [date, setDate] = useState(new Date(Date.now() + 60000)); // Default to 1 minute in future
  const [showPicker, setShowPicker] = useState(false); // Used for iOS picker visibility
  const [reminderText, setReminderText] = useState('Time for prayer!');

  // onChange handler for iOS DateTimePicker component
  const onIOSChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false); // Always hide picker after interaction on iOS
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
    }
    // If dismissed, picker is hidden, date remains unchanged.
  };

  // Function to show Android date picker then time picker
  const showAndroidDateTimePicker = () => {
    DateTimePickerAndroid.open({
      value: date,
      onChange: (event, selectedDateValue) => {
        if (event.type === 'set' && selectedDateValue) {
          const datePart = selectedDateValue;
          // Now open time picker
          DateTimePickerAndroid.open({
            value: datePart, // Use selected date to initialize time picker
            mode: 'time',
            is24Hour: true, // You can set this based on preference or locale
            display: 'default',
            onChange: (timeEvent, selectedTimeValue) => {
              if (timeEvent.type === 'set' && selectedTimeValue) {
                // selectedTimeValue will have the date from datePart and the new time
                setDate(selectedTimeValue);
              }
            },
          });
        }
      },
      mode: 'date',
      display: 'default',
      minimumDate: new Date(), // Minimum date for the date picker
    });
  };

  // Main handler for the "Select Time" button
  const pickerButtonHandler = () => {
    if (Platform.OS === 'android') {
      showAndroidDateTimePicker();
    } else {
      setShowPicker(true); // Show iOS picker component
    }
  };

  async function scheduleFakeCallNotification() {
    if (date.getTime() <= Date.now()) {
      Alert.alert(
        'Invalid Time',
        'Please select a future time for the reminder.',
      );
      return;
    }

    try {
      // Create a channel (required for Android)
      const channelId = await notifee.createChannel({
        id: 'fake-call-channel',
        name: 'Fake Call Channel',
        importance: AndroidImportance.HIGH,
        sound: 'ringtone', 
        visibility: AndroidVisibility.PUBLIC,
      });

      // Create a trigger notification
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
        // repeatFrequency: RepeatFrequency.DAILY, // Optional: for repeating
      };

      // Display a notification
      await notifee.createTriggerNotification(
        {
          title: 'Incoming Call',
          body: reminderText || 'Prayer Reminder',
          data: {screen: 'FakeCallScreen'}, // Custom data to identify the notification
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            style: {
              type: AndroidStyle.BIGTEXT,
              text: reminderText || 'Prayer Reminder. Tap to answer.',
            },
            category: AndroidCategory.CALL, // Important for call-like appearance
            pressAction: {
              id: 'default',
              // On Android, this will launch FakeCallActivity if configured correctly
              // For full screen intent, the mainComponent in FakeCallActivity will be launched
              launchActivity: 'com.prayer_app.FakeCallActivity',
            },
            fullScreenAction: {
              id: 'default',
              launchActivity: 'com.prayer_app.FakeCallActivity',
            },
            sound: 'ringtone', // Make sure this matches your sound file name without extension
            visibility: AndroidVisibility.PUBLIC,
            // actions: [
            //   {
            //     title: 'Accept',
            //     pressAction: { id: 'accept-call' }, // Handle this in your background/foreground event listeners
            //   },
            //   {
            //     title: 'Decline',
            //     pressAction: { id: 'decline-call' },
            //   },
            // ],
          },
          ios: {
            sound: 'ringtone.caf', // Ensure you have ringtone.caf in your iOS project bundle
            // On iOS, you'll handle the notification press in App.tsx and navigate
            categoryId: 'reminder',
            interruptionLevel: 'timeSensitive', // Ensures the notification is delivered immediately
          },
        },
        trigger,
      );

      Alert.alert(
        'Reminder Set',
        `You will receive a fake call reminder at ${date.toLocaleTimeString()} on ${date.toLocaleDateString()}`,
      );
    } catch (e) {
      console.error('Error scheduling notification:', e);
      Alert.alert('Error', 'Could not schedule the reminder.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule Prayer Reminder</Text>

      <TextInput
        style={styles.input}
        placeholder="Reminder message (optional)"
        value={reminderText}
        onChangeText={setReminderText}
      />

      <View style={styles.pickerContainer}>
        <Button onPress={pickerButtonHandler} title="Select Time" />
        <Text
          style={
            styles.dateText
          }>{`Selected: ${date.toLocaleTimeString()} on ${date.toLocaleDateString()}`}</Text>
      </View>

      {/* Conditional rendering for iOS picker */}
      {showPicker && Platform.OS === 'ios' && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={'datetime'} // 'datetime' is appropriate for iOS to pick both date and time
          display="default" // Or "spinner" etc. as per your preference for iOS
          onChange={onIOSChange} // Use the new iOS-specific handler
          minimumDate={new Date()} // Prevent selecting past dates/times
        />
      )}

      <Button
        title="Schedule Fake Call Reminder"
        onPress={scheduleFakeCallNotification}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
  },
});

export default CallScreen;
