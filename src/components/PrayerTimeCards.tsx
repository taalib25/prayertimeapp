import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {typography} from '../utils/typography';
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

const PrayerTimeCards: React.FC<PrayerTimeCardsProps> = ({prayers}) => {
  return (
    <View style={styles.container}>
      {prayers.map((prayer, index) => (
        <View
          key={index}
          style={[styles.prayerCard, prayer.isActive && styles.activeCard]}>
          <Text
            style={[styles.prayerName, prayer.isActive && styles.activeText]}>
            {prayer.displayName}
          </Text>

          <View style={styles.iconContainer}>
            <SvgIcon
              name={prayer.name.toLowerCase() as IconName}
              size={24}
              color={prayer.isActive ? '#3C4A9B' : '#42D0D3'}
            />
          </View>

          <Text
            style={[styles.prayerTime, prayer.isActive && styles.activeText]}>
            {prayer.time}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E7F8FC',
    borderRadius: 20,
    padding: 12,
    marginHorizontal: 16,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  prayerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 3,
  },
  activeCard: {
    backgroundColor: 'transparent',
    borderColor: '#3C4A9B',
    borderWidth: 1.5,
  },
  prayerName: {
    ...typography.prayerName,
    color: '#3C4A9B',
    marginBottom: 6,
    textAlign: 'center',
  },
  prayerTime: {
    ...typography.prayerTime,
    color: '#3C4A9B',
    marginTop: 6,
    textAlign: 'center',
  },
  activeText: {
    color: '#3C4A9B',
    fontWeight: '700',
  },
  iconContainer: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PrayerTimeCards;
