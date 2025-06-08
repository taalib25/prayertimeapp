import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import SvgIcon from './SvgIcon';
import {IconName} from './SvgIcon';
import PrayerReminderModal from './PrayerReminderModal';

interface PrayerTime {
  name: string;
  displayName: string;
  time: string;
  isActive?: boolean;
}

interface PrayerTimeCardsProps {
  prayers: PrayerTime[];
}

const PrayerTimeCards: React.FC<PrayerTimeCardsProps> = ({prayers}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerTime | null>(null);
  const [reminderType, setReminderType] = useState<'notification' | 'alarm'>(
    'notification',
  );

  const handleLongPress = (prayer: PrayerTime) => {
    setSelectedPrayer(prayer);
    setReminderType('notification');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPrayer(null);
  };

  return (
    <View style={styles.container}>
      {prayers.map((prayer, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.prayerCard, prayer.isActive && styles.activeCard]}
          onLongPress={() => handleLongPress(prayer)}
          delayLongPress={800}
          activeOpacity={0.7}>
          <Text style={styles.prayerName}>{prayer.displayName}</Text>

          <View style={styles.iconContainer}>
            <SvgIcon
              name={prayer.name.toLowerCase() as IconName}
              size={22}
              color={colors.accent}
            />
          </View>

          <Text style={styles.prayerTime}>{prayer.time}</Text>
        </TouchableOpacity>
      ))}

      {selectedPrayer && (
        <PrayerReminderModal
          visible={modalVisible}
          onClose={closeModal}
          prayerName={selectedPrayer.displayName}
          prayerTime={selectedPrayer.time}
          isNotification={reminderType === 'notification'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.prayerCard,
    borderRadius: 20,
    padding: 8,
    marginHorizontal: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  prayerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    flex: 1,
  },
  activeCard: {
    borderRadius: 12,
    borderColor: colors.accent,
    borderWidth: 2,
  },
  prayerName: {
    ...typography.prayerCard,
    color: colors.text.prayerBlue,
    marginBottom: 13,
    textAlign: 'center',
  },
  prayerTime: {
    ...typography.prayerCard,
    color: colors.text.prayerBlue,
    marginTop: 15,
    textAlign: 'center',
  },
  iconContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PrayerTimeCards;
