import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors} from '../utils/theme';

interface PrayerChecklistItemProps {
  prayerName: string;
  isCompleted: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
  time?: string;
}

const PrayerChecklistItem: React.FC<PrayerChecklistItemProps> = ({
  prayerName,
  isCompleted,
  onToggle,
  onLongPress,
  time,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isCompleted && styles.completedContainer]}
      onPress={onToggle}
      onLongPress={onLongPress}
      activeOpacity={0.7}>
      <View style={styles.leftSection}>
        <View style={[styles.checkbox, isCompleted && styles.checkedBox]}>
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[styles.prayerName, isCompleted && styles.completedText]}>
            {prayerName}
          </Text>
          {time && (
            <Text style={[styles.time, isCompleted && styles.completedTime]}>
              {time}
            </Text>
          )}
        </View>
      </View>
      {isCompleted && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedBadgeText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completedContainer: {
    backgroundColor: colors.background.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkedBox: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  prayerName: {
    fontSize: 18,

    color: colors.text.dark,
  },
  completedText: {
    color: colors.success,
  },
  time: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 2,
  },
  completedTime: {
    color: colors.success,
  },
  completedBadge: {
    backgroundColor: colors.success,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadgeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PrayerChecklistItem;
