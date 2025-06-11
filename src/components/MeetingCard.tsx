import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, spacing, borderRadius} from '../utils/theme';
import {typography} from '../utils/typography';

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
            const isPercent = String(stat.value).includes('%');

            return (
              <View
                key={index}
                style={[
                  styles.statItem,
                  isCompleted && styles.statCompleted,
                  isRemaining && styles.statRemaining,
                  isAssigned && styles.statAssigned,
                  isAttended && styles.statAttended,
                  isPercent && styles.statPercent,
                ]}>
                <Text
                  style={[
                    styles.statValue,
                    isCompleted && styles.statValueCompleted,
                    isRemaining && styles.statValueRemaining,
                    isAssigned && styles.statValueAssigned,
                    isAttended && styles.statValueAttended,
                    isPercent && styles.statValuePercent,
                  ]}>
                  {stat.value}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    isCompleted && styles.statLabelCompleted,
                    isRemaining && styles.statLabelRemaining,
                    isAssigned && styles.statLabelAssigned,
                    isAttended && styles.statLabelAttended,
                    isPercent && styles.statLabelPercent,
                  ]}>
                  {stat.label}
                </Text>
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
    borderWidth: 1.5,
    minHeight: 60,
    justifyContent: 'center',
  },
  statAssigned: {
    borderColor: '#2196F3',
  },
  statCompleted: {
    borderColor: '#4CAF50',
  },
  statRemaining: {
    borderColor: '#FF9800',
  },
  statAttended: {
    borderColor: '#4CAF50',
  },
  statPercent: {
    borderColor: '#9C27B0',
  },
  statValue: {
    ...typography.h2,
    // fontWeight: '800',
    marginBottom: spacing.xs / 3,
    fontSize: 18,
  },
  statValueAssigned: {
    color: '#1976D2',
  },
  statValueCompleted: {
    color: '#388E3C',
  },
  statValueRemaining: {
    color: '#F57C00',
  },
  statValueAttended: {
    color: '#388E3C',
  },
  statValuePercent: {
    color: '#7B1FA2',
  },
  statLabel: {
    ...typography.bodyMedium,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 15,
  },
  statLabelAssigned: {
    color: '#1565C0',
  },
  statLabelCompleted: {
    color: '#2E7D32',
  },
  statLabelRemaining: {
    color: '#EF6C00',
  },
  statLabelAttended: {
    color: '#2E7D32',
  },
  statLabelPercent: {
    color: '#6A1B9A',
  },
});

export default MeetingCard;
