import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {DayPrayerStatus} from '../services/db/prayer_tracking_services';

interface CalendarDayProps {
  date: Date;
  dayStatus?: DayPrayerStatus;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  dayStatus,
  isSelected,
  isToday,
  onPress,
}) => {
  const day = date.getDate();
  const completionRate = dayStatus
    ? dayStatus.completedCount / dayStatus.totalCount
    : 0;

  const getBackgroundColor = () => {
    if (isSelected) return '#1a5276';
    if (completionRate === 1) return '#4BB543';
    if (completionRate > 0.6) return '#FFA500';
    if (completionRate > 0) return '#FFD700';
    return 'transparent';
  };

  const getTextColor = () => {
    if (isSelected || completionRate > 0.6) return 'white';
    if (isToday) return '#1a5276';
    return '#333';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {backgroundColor: getBackgroundColor()},
        isToday && !isSelected && styles.todayBorder,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={[styles.dayText, {color: getTextColor()}]}>{day}</Text>
      {dayStatus && dayStatus.completedCount > 0 && (
        <View style={styles.progressDots}>
          {Array.from({length: 5}).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index < dayStatus.completedCount && styles.completedDot,
              ]}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: '#1a5276',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressDots: {
    flexDirection: 'row',
    marginTop: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 0.5,
  },
  completedDot: {
    backgroundColor: 'white',
  },
});

export default CalendarDay;
