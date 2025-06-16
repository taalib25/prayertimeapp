import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Switch} from 'react-native';

interface NotificationSettingsScreenProps {
  navigation: any;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  navigation,
}) => {
  const [prayerReminders, setPrayerReminders] = useState(true);
  const [qurianReminders, setQurianReminders] = useState(true);
  const [zikriReminders, setZikriReminders] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const SettingItem = ({title, description, value, onValueChange}: any) => (
    <View style={styles.settingItem}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
        thumbColor={value ? '#FFF' : '#FFF'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prayer Notifications</Text>
        <SettingItem
          title="Prayer Time Reminders"
          description="Get notified before each prayer time"
          value={prayerReminders}
          onValueChange={setPrayerReminders}
        />
        <SettingItem
          title="Quran Reading Reminders"
          description="Daily reminders to read Quran"
          value={qurianReminders}
          onValueChange={setQurianReminders}
        />
        <SettingItem
          title="Zikr Reminders"
          description="Reminders for daily zikr and dhikr"
          value={zikriReminders}
          onValueChange={setZikriReminders}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        <SettingItem
          title="Sound"
          description="Play sound with notifications"
          value={soundEnabled}
          onValueChange={setSoundEnabled}
        />
        <SettingItem
          title="Vibration"
          description="Vibrate on notifications"
          value={vibrationEnabled}
          onValueChange={setVibrationEnabled}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#FFF',
    marginBottom: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default NotificationSettingsScreen;
