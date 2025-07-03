import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, spacing, borderRadius} from '../utils/theme';
import {typography} from '../utils/typography';
import SvgIcon from './SvgIcon';

interface MeetingMember {
  member_name: string;
  member_phone: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'excused';
  member_username: string;
  location?: string;
}

interface MeetingCardProps {
  title: string;
  subtitle?: string;
  members?: MeetingMember[];
  stats?: {
    label: string;
    value: string | number;
  }[];
  onMemberPress?: (member: MeetingMember, index: number) => void;
}

const statusIcon = (status: MeetingMember['status']) => {
  switch (status) {
    case 'scheduled':
      return <SvgIcon name="assigned" size={16} color="#2982D5" />;
    case 'completed':
      return <SvgIcon name="attended" size={16} color="#20B83F" />;
    case 'excused':
      return <SvgIcon name="absent" size={16} color="#F57C00" />;
    default:
      return null;
  }
};

const MeetingCard: React.FC<MeetingCardProps> = ({
  title,
  subtitle,
  members = [],
  stats = [],
  onMemberPress,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {members.map((member, index) => (
        <TouchableOpacity
          key={index}
          style={styles.personRow}
          onPress={() => onMemberPress?.(member, index)}>
          <View style={styles.personInfo}>
            {/* First row: name & phone */}
            <View style={styles.personTopRow}>
              <Text style={styles.personText}>{member.member_name}</Text>
              <Text style={styles.personPhone}>{member.member_phone}</Text>
            </View>
            {/* Second row: location, date/time, status */}
            <View style={styles.personBottomRow}>
              {member.location && (
                <Text style={styles.personLocation}>{member.location}</Text>
              )}
              <Text style={styles.personDateTime}>
                {new Date(member.scheduled_date).toLocaleDateString()}{' | '}
                {member.scheduled_time}
              </Text>
              {/* <View style={styles.statusMark}>
                {statusIcon(member.status)}
                <Text style={styles.statusText}>{member.status}</Text>
              </View> */}
            </View>
          </View>
        </TouchableOpacity>
      ))}
      {stats.length > 0 && (
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => {
            // Use icon name based on stat label
            let iconName: 'assigned' | 'attended' | 'absent' | undefined;
            let iconColor = colors.text.muted;
            const label = stat.label.toLowerCase();
            if (label.includes('assigned') || label.includes('scheduled')) {
              iconName = 'assigned';
              iconColor = '#2982D5';
            } else if (
              label.includes('completed') ||
              label.includes('attended')
            ) {
              iconName = 'attended';
              iconColor = '#20B83F';
            } else if (label.includes('absent') || label.includes('excused')) {
              iconName = 'absent';
              iconColor = '#FF2626';
            }
            return (
              <View key={index} style={styles.statItem}>
                <View style={styles.statRowContainer}>
                  {iconName && (
                    <SvgIcon name={iconName} size={20} color={iconColor} />
                  )}
                  <Text
                    style={[
                      styles.statValue,
                      iconName === 'assigned' && {color: '#2982D5'},
                      iconName === 'attended' && {color: '#20B83F'},
                      iconName === 'absent' && {color: '#FF2626'},
                    ]}>
                    {' '}
                    - {stat.value}
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
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  personInfo: {
    flex: 1,
  },
  personTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  personBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
    gap: 12,
  },
  personText: {
    ...typography.bodyMedium,
    color: colors.text.dark,
    marginRight: 8,
  },
  personPhone: {
    ...typography.caption,
    color: colors.text.muted,
    fontSize: 14,
    opacity: 0.8,
  },
  personLocation: {
    ...typography.caption,
    color: colors.text.lightDark,
    fontSize: 13,
    opacity: 0.8,
    marginRight: 8,
  },
  personDateTime: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 13,
     backgroundColor: '#F2F6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D9EC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
  },
  statusMark: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.7,
    marginLeft: 4,
  },
  statusText: {
    ...typography.caption,
    marginLeft: 4,
    color: colors.text.muted,
    textTransform: 'capitalize',
    fontSize: 13,
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
  statLabel: {
    ...typography.bodyMedium,
    color: colors.text.dark,
    marginRight: 6,
  },
  statValue: {
    ...typography.h2,
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
