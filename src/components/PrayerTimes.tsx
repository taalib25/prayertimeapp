import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {typography} from '../utils/typography';
import {colors, borderRadius} from '../utils/theme';
import SvgIcon from './SvgIcon';

type Prayer = {
  name: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  displayName: string;
  time: string;
  isActive?: boolean;
};

interface PrayerTimesProps {
  prayers: Prayer[];
  onPrayerPress?: (prayer: Prayer) => void;
}

const PrayerTimes: React.FC<PrayerTimesProps> = ({prayers, onPrayerPress}) => {
  return (
    <View style={styles.container}>
      {prayers.map((prayer, index) => (
        <TouchableOpacity
          key={prayer.name}
          style={[
            styles.prayerItem,
            prayer.isActive && styles.activePrayer,
            index === prayers.length - 1 && {marginRight: 0},
          ]}
          onPress={() => onPrayerPress && onPrayerPress(prayer)}>
          <SvgIcon
            name={prayer.name}
            size={24}
            color={prayer.isActive ? '#fff' : colors.accentLight}
            style={styles.prayerIcon}
          />
          <Text
            style={[styles.prayerName, prayer.isActive && styles.activeText]}>
            {prayer.displayName}
          </Text>
          <Text
            style={[styles.prayerTime, prayer.isActive && styles.activeText]}>
            {prayer.time}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(235, 245, 255, 0.08)',
    borderRadius: borderRadius.lg,
    marginHorizontal: 16,
    marginTop: -20,
  },
  prayerItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  activePrayer: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  prayerIcon: {
    marginBottom: 6,
  },
  prayerName: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  prayerTime: {
    ...typography.prayerTime,
    color: colors.text.primary,
    fontWeight: '600',
  },
  activeText: {
    color: colors.white,
  },
});

export default PrayerTimes;
