import React, {Component} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MeetingCard from './MeetingCard';
import {typography} from '../utils/typography';
import {borderRadius, colors, spacing} from '../utils/theme';

// Define MeetingMember type to match MeetingCard
interface MeetingMember {
  member_name: string;
  member_phone: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'excused';
  member_username: string;
  location?: string;
}

// Sample data for the meeting cards with enhanced statistic labels
const personalizedMeetingMembers: MeetingMember[] = [
  {
    member_name: 'Ahmed Al-Rashid',
    member_phone: '+94-77-123-4567',
    scheduled_date: '2024-12-25T00:00:00.000Z',
    scheduled_time: '15:00:00',
    status: 'scheduled',
    member_username: 'ahmedrashid',
    location: 'Colombo',
  },
  {
    member_name: 'Hassan Ibrahim',
    member_phone: '+94-77-123-4568',
    scheduled_date: '2024-12-25T00:00:00.000Z',
    scheduled_time: '16:00:00',
    status: 'completed',
    member_username: 'hassanibrahim',
    location: 'Kandy',
  },
  {
    member_name: 'Omar Abdullah',
    member_phone: '+94-77-123-4569',
    scheduled_date: '2024-12-25T00:00:00.000Z',
    scheduled_time: '17:00:00',
    status: 'excused',
    member_username: 'omarabdullah',
    location: 'Galle',
  },
];

const getStatsFromMembers = (members: MeetingMember[]) => {
  const scheduled = members.filter(m => m.status === 'scheduled').length;
  const completed = members.filter(m => m.status === 'completed').length;
  const excused = members.filter(m => m.status === 'excused').length;
  return [
    {label: 'Scheduled', value: scheduled},
    {label: 'Completed', value: completed},
    {label: 'Excused', value: excused},
  ];
};

const personalizedMeeting = {
  title: 'Personalized Meeting',
  subtitle: '3 Days Remaining',
  members: personalizedMeetingMembers,
  stats: getStatsFromMembers(personalizedMeetingMembers),
};

const meetingAttendance = {
  title: 'Meeting Attendance',
  subtitle: 'Last 5 meetings',
  stats: [
    {label: 'Completed', value: '1'},
    {label: 'Absent', value: '2'},
    {label: 'Assigned', value: '3'},
  ],
};

const handlePersonPress = (member: any, index: number) => {
  console.log(`Pressed member ${index + 1}: ${member.member_phone}`);
};

export class PersonalMeeting extends Component {
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <MeetingCard
          title={personalizedMeeting.title}
          subtitle={personalizedMeeting.subtitle}
          members={personalizedMeeting.members}
          stats={personalizedMeeting.stats}
          onMemberPress={handlePersonPress}
        />

        <MeetingCard
          title={meetingAttendance.title}
          subtitle={meetingAttendance.subtitle}
          stats={meetingAttendance.stats}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    // paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  testButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  standardButton: {
    backgroundColor: colors.primary,
  },
  fakeCallButton: {
    backgroundColor: '#FF6B35', // Orange color for fake call
  },
  infoButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
  },
  testButtonText: {
    ...typography.button,
    color: colors.white,
    marginBottom: 4,
  },
  testButtonSubtext: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  logoutText: {
    ...typography.button,
    color: colors.white,
  },
  bottomSpacing: {
    marginBottom: 80,
    height: spacing.xxl,
  },
});

export default PersonalMeeting;
