import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Text as RNText,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import notifee, {
  TriggerType,
  RepeatFrequency,
  TimestampTrigger,
} from '@notifee/react-native';
import {colors} from '../utils/theme';

interface PrayerReminderModalProps {
  visible: boolean;
  onClose: () => void;
  prayerName: string;
  prayerTime: string;
  isNotification: boolean;
}

const PrayerReminderModal: React.FC<PrayerReminderModalProps> = ({
  visible,
  onClose,
  prayerName,
  prayerTime,
  isNotification,
}) => {
  const [enableSound, setEnableSound] = useState(true);
  const [enableVibration, setEnableVibration] = useState(true);
  const [minutesBefore, setMinutesBefore] = useState<number>(10);
  const [repeat, setRepeat] = useState(true);

  const handleSave = async () => {
    const timeData = prayerTime.split(' ');
    const [hours, minutes] = timeData[0].split(':');
    const isPM = timeData[1] === 'PM';

    // Convert to 24-hour format for calculations
    let hour24 = parseInt(hours);
    if (isPM && hour24 !== 12) {
      hour24 += 12;
    }
    if (!isPM && hour24 === 12) {
      hour24 = 0;
    }

    const today = new Date();
    const reminderDate = new Date();

    // Set hours and minutes
    reminderDate.setHours(hour24);
    reminderDate.setMinutes(parseInt(minutes));
    reminderDate.setSeconds(0);

    // Adjust for reminder minutes before
    reminderDate.setMinutes(
      reminderDate.getMinutes() - parseInt(minutesBefore.toString()),
    );

    // If time is in past, set for tomorrow
    if (reminderDate < today) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }

    console.log(
      `Setting reminder for ${prayerName} at ${reminderDate.toLocaleString()}`,
    );
    if (isNotification) {
      await createNotification(prayerName, reminderDate, repeat);
    } else {
      await createAlarm(
        prayerName,
        reminderDate,
        repeat,
        enableSound,
        enableVibration,
      );
    }

    onClose();
  };

  const createNotification = async (
    prayerName: string,
    date: Date,
    repeat: boolean,
  ) => {
    // Create channel for notifications
    const channelId = await notifee.createChannel({
      id: 'prayer-reminders',
      name: 'Prayer Reminders',
      sound: 'default',
      vibration: true,
    });

    // Create trigger based on timestamp
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      repeatFrequency: repeat ? RepeatFrequency.DAILY : undefined,
    };

    // Create the notification
    await notifee.createTriggerNotification(
      {
        title: `${prayerName} Prayer Reminder`,
        body: `It's almost time for ${prayerName} prayer.`,
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
          sound: 'default',
        },
        ios: {
          sound: 'default',
        },
      },
      trigger,
    );
  };

  const createAlarm = async (
    prayerName: string,
    date: Date,
    repeat: boolean,
    sound: boolean,
    vibration: boolean,
  ) => {
    // Create channel for alarms with different settings
    const channelId = await notifee.createChannel({
      id: 'prayer-alarms',
      name: 'Prayer Alarms',
      sound: sound ? 'alarm' : undefined, // You need to add alarm sound to the app resources
      vibration: vibration,
      importance: 4,
    });

    // Create trigger based on timestamp
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      repeatFrequency: repeat ? RepeatFrequency.DAILY : undefined,
      alarmManager: {
        allowWhileIdle: true, // Allow notification when device is in idle state
      },
    };

    // Create the notification (alarm)
    await notifee.createTriggerNotification(
      {
        title: `${prayerName} Prayer Alarm`,
        body: `It's time for ${prayerName} prayer.`,
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
          sound: sound ? 'alarm' : undefined,
          fullScreenAction: {
            id: 'alarm_screen',
            launchActivity: 'default',
          },
        },
        ios: {
          sound: sound ? 'alarm.mp3' : undefined,
          critical: true,
          criticalVolume: 1.0,
        },
      },
      trigger,
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {}} // Empty function to prevent back button dismiss
      statusBarTranslucent={true}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <View style={styles.centeredView}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalView}>
                <View style={styles.dragIndicator} />
                <Text style={styles.modalTitle}>
                  {isNotification ? 'Set Notification' : 'Set Alarm'} for
                  {prayerName}
                </Text>
                <Text style={styles.prayerTimeText}>
                  Prayer Time: {prayerTime}
                </Text>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Minutes before:</Text>
                  <View style={styles.minuteSelector}>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={() =>
                        setMinutesBefore(Math.max(0, minutesBefore - 5))
                      }>
                      <Text style={styles.arrowText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.minuteValue}>{minutesBefore}</Text>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={() =>
                        setMinutesBefore(Math.min(60, minutesBefore + 5))
                      }>
                      <Text style={styles.arrowText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Repeat daily</Text>
                  <Switch value={repeat} onValueChange={setRepeat} />
                </View>

                {!isNotification && (
                  <>
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>Enable sound</Text>
                      <Switch
                        value={enableSound}
                        onValueChange={setEnableSound}
                      />
                    </View>

                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>Enable vibration</Text>
                      <Switch
                        value={enableVibration}
                        onValueChange={setEnableVibration}
                      />
                    </View>
                  </>
                )}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button} onPress={onClose}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}>
                    <Text style={[styles.buttonText, styles.saveButtonText]}>
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalView: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dragIndicator: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.text.muted,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  prayerTimeText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  settingLabel: {
    fontSize: 16,
  },
  minuteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  minuteValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    minWidth: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
  },
  saveButtonText: {
    color: 'white',
  },
});
export default PrayerReminderModal;
