import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import SvgIcon from './SvgIcon';
import {IconName} from './SvgIcon';

interface PrayerTime {
  name: string;
  displayName: string;
  time: string;
  isActive?: boolean;
}

interface PrayerTimeCardsProps {
  prayers: PrayerTime[];
}

const PrayerTimeCards: React.FC<PrayerTimeCardsProps> = ({prayers}) => (
  <View style={styles.container}>
    {prayers.map((prayer, index) => (
      <View
        key={index}
        style={[styles.prayerCard, prayer.isActive && styles.activeCard]}>
        <Text style={styles.prayerName}>{prayer.displayName}</Text>

        <View style={styles.iconContainer}>
          {' '}
          <SvgIcon
            name={prayer.name.toLowerCase() as IconName}
            size={22}
            color={colors.accent}
          />
        </View>

        <Text style={styles.prayerTime}>{prayer.time}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.surface,
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
    color: colors.primary,
    marginBottom: 13,
    textAlign: 'center',
  },
  prayerTime: {
    ...typography.prayerCard,
    color: colors.primary,
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
