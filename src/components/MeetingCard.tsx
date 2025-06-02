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
          <Text style={styles.personText}>
            Person {index + 1} - {person.phone}
          </Text>
          <View
            style={[styles.circle, person.completed && styles.circleActive]}
          />
        </TouchableOpacity>
      ))}

      {stats.length > 0 && (
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statText}>
                {stat.label} - {stat.value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    ...typography.body,
    color: colors.error,
    fontWeight: 'bold',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 50,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  personText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
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
    marginTop: spacing.xs,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    ...typography.body,
    color: colors.primary,
  },
});

export default MeetingCard;
