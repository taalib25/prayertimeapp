
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, spacing, borderRadius} from '../utils/theme';
import {typography} from '../utils/typography';
import SvgIcon from './SvgIcon';

interface Person {
  name: string;
  phone: string;
  completed?: boolean;
}

interface MeetingCardProps {
  title: string;
  subtitle?: string;
  persons?: Person[];
  stats?: {
    label: string;
    value: string | number;
  }[];
  onPersonPress?: (person: Person, index: number) => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({
  title,
  subtitle,
  persons = [],
  stats = [],
  onPersonPress,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {persons.map((person, index) => (
        <TouchableOpacity
          key={index}
          style={styles.personRow}
          onPress={() => onPersonPress?.(person, index)}>
          <View style={styles.personInfo}>
            <Text style={styles.personText}>{person.name}</Text>
            <Text style={styles.personPhone}>{person.phone}</Text>
          </View>
          <View
            style={[styles.circle, person.completed && styles.circleActive]}
          />
        </TouchableOpacity>
      ))}
      {stats.length > 0 && (
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => {
            const isCompleted = stat.label.toLowerCase().includes('completed');
            const isRemaining = stat.label.toLowerCase().includes('remaining');
            const isAssigned = stat.label.toLowerCase().includes('assigned');
            const isAttended = stat.label.toLowerCase().includes('attended');
            const isAbsent = stat.label.toLowerCase().includes('absent');
            const isExcused = stat.label.toLowerCase().includes('excused');
            const isPercent = String(stat.value).includes('%');

            // Get the appropriate icon and color based on the stat type
            let iconName: 'assigned' | 'attended' | 'absent' | undefined;
            let iconColor = colors.text.muted;

            if (isAssigned) {
              iconName = 'assigned';
              iconColor = '#2982D5';
            } else if (isCompleted || isAttended) {
              iconName = 'attended';
              iconColor = '#20B83F';
            } else if (isAbsent || isExcused) {
              iconName = 'absent';
              iconColor = '#FF2626';
            }

            return (
              <View key={index} style={styles.statItem}>
                <View style={styles.statRowContainer}>
                  {iconName && (
                    <SvgIcon name={iconName} size={28} color={iconColor} />
                  )}
                  <Text style={styles.dashSeparator}>-</Text>
                  <Text
                    style={[
                      styles.statValue,
                      isCompleted && styles.statValueCompleted,
                      isRemaining && styles.statValueRemaining,
                      isAssigned && styles.statValueAssigned,
                      (isAttended || isCompleted) && styles.statValueAttended,
                      (isAbsent || isExcused) && styles.statValueAbsent,
                      isPercent && styles.statValuePercent,
                    ]}>
                    {stat.value}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.prayerBlue,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.error,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  personInfo: {
    flex: 1,
  },
  personText: {
    ...typography.bodyMedium,
    color: colors.text.dark,
    fontWeight: '500',
  },
  personPhone: {
    ...typography.caption,
    color: colors.text.muted,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 1,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.text.secondary,
  },
  circleActive: {
    backgroundColor: colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    flex: 1,
    marginHorizontal: spacing.xs / 2,
    minHeight: 40, // Reduced for row layout
    justifyContent: 'center',
  },
  statRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashSeparator: {
    ...typography.h2,
    fontWeight: '700',
    fontSize: 18,
    marginHorizontal: spacing.xs,
    color: colors.text.muted,
  },
  statIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...typography.h2,
    fontWeight: '700',
    fontSize: 18,
  },
  statValueAssigned: {
    color: '#2982D5',
  },
  statValueCompleted: {
    color: '#20B83F',
  },
  statValueRemaining: {
    color: '#F57C00',
  },
  statValueAttended: {
    color: '#20B83F',
  },
  statValueAbsent: {
    color: '#FF2626',
  },
  statValuePercent: {
    color: '#7B1FA2',
  },
});

export default MeetingCard;
