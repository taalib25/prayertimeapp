import React, {useState} from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
  Vibration,
} from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  AndroidStyle,
  AndroidCategory,
} from '@notifee/react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';

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
  // Internal function to schedule notification (used by both regular and test functions)
  const scheduleFakeCallNotificationInternal = async (
    targetDate: Date,
    message: string,
  ) => {
    if (targetDate.getTime() <= Date.now()) {
      throw new Error('Please select a future time for the reminder.');
    } // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: 'fake-call-channel',
      name: 'Fake Call Channel',
      importance: AndroidImportance.HIGH,
      sound: 'ringtone',
      vibrationPattern: [300, 500, 300, 500],
      visibility: AndroidVisibility.PUBLIC,
      bypassDnd: true, // Bypass Do Not Disturb
    }); // Create a trigger notification
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: targetDate.getTime(),
    } as const;

    // Display a notification
    await notifee.createTriggerNotification(
      {
        title: 'Incoming Call',
        body: message || 'Prayer Reminder',
        data: {screen: 'FakeCallScreen', message: message},
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: message || 'Prayer Reminder. Tap to answer.',
          },
          category: AndroidCategory.CALL,
          pressAction: {
            id: 'default',
          },
          fullScreenAction: {
            id: 'default',
          },
          sound: 'ringtone',
          visibility: AndroidVisibility.PUBLIC,
          vibrationPattern: [300, 500, 300, 500],
          ongoing: true, // Makes it harder to dismiss
          autoCancel: false,
          actions: [
            {
              title: 'Answer',
              pressAction: {
                id: 'answer-call',
              },
            },
            {
              title: 'Decline',
              pressAction: {
                id: 'decline-call',
              },
            },
          ],
        },
        ios: {
          sound: 'ringtone.caf',
          categoryId: 'reminder',
          interruptionLevel: 'timeSensitive',
          critical: true,
          criticalVolume: 1.0,
        },
      },
      trigger,
    );
  };

  // Quick test function for 1 minute timer
  const scheduleQuickTest = async () => {
    const testDate = new Date(Date.now() + 60000); // 1 minute from now
    setDate(testDate);

    try {
      await scheduleFakeCallNotificationInternal(
        testDate,
        'Test Prayer Reminder - This is a 1 minute test!',
      );

      // Add immediate vibration for feedback
      Vibration.vibrate([100, 200, 100]);

      Alert.alert(
        'Test Scheduled ✅',
        'Test fake call will trigger in 1 minute!\n\n🔒 Lock your phone now to test the full effect!\n📱 The call will appear even if phone is silent.',
        [
          {
            text: 'OK',
            onPress: () => console.log('Test scheduled'),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'Could not schedule test reminder.');
    }
  };

  // Regular schedule function
  async function scheduleFakeCallNotification() {
    try {
      await scheduleFakeCallNotificationInternal(date, reminderText);

      Alert.alert(
        'Reminder Set ✅',
        `You will receive a fake call reminder at ${date.toLocaleTimeString()} on ${date.toLocaleDateString()}`,
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Could not schedule the reminder.',
      );
    }
  }

  // Cancel all scheduled notifications
  const cancelAllNotifications = async () => {
    try {
      await notifee.cancelAllNotifications();
      Alert.alert(
        'Cancelled',
        'All scheduled fake call reminders have been cancelled.',
      );
    } catch (error) {
      Alert.alert('Error', 'Could not cancel notifications.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕌 Prayer Fake Call Setup</Text>
      <Text style={styles.subtitle}>
        Schedule a fake incoming call to remind you of prayer time
      </Text>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>🧪 Quick Test (1 Minute)</Text>
        <Button
          title="Start 1 Minute Test"
          onPress={scheduleQuickTest}
          color="#FF6B35"
        />
        <Text style={styles.testDescription}>
          Perfect for testing! Lock your phone after pressing this button.
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.customSection}>
        <Text style={styles.sectionTitle}>⏰ Custom Schedule</Text>

        <TextInput
          style={styles.input}
          placeholder="Custom reminder message"
          value={reminderText}
          onChangeText={setReminderText}
          multiline
        />

        <View style={styles.pickerContainer}>
          <Button
            onPress={pickerButtonHandler}
            title="Select Time"
            color="#4CAF50"
          />
          <Text style={styles.dateText}>
            {`${date.toLocaleTimeString()} on ${date.toLocaleDateString()}`}
          </Text>
        </View>

        {/* Conditional rendering for iOS picker */}
        {showPicker && Platform.OS === 'ios' && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode={'datetime'}
            display="default"
            onChange={onIOSChange}
            minimumDate={new Date()}
          />
        )}

        <Button
          title="Schedule Custom Reminder"
          onPress={scheduleFakeCallNotification}
          color="#2196F3"
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.controlSection}>
        <Button
          title="Cancel All Reminders"
          onPress={cancelAllNotifications}
          color="#F44336"
        />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ How it works:</Text>
        <Text style={styles.infoText}>
          • Works even when phone is locked/silent{'\n'}• Custom ringtone plays
          with vibration{'\n'}• Voice message speaks your reminder{'\n'}•
          Appears as realistic incoming call{'\n'}• Accept/Decline buttons to
          end call
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#1a5276',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  testSection: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  testDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  customSection: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  controlSection: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: 'white',
    fontSize: 16,
    minHeight: 50,
  },
  pickerContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  dateText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});

export default CallScreen;
