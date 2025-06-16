import React, {Component} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MeetingCard from './MeetingCard';
import {typography} from '../utils/typography';
import {borderRadius, colors, spacing} from '../utils/theme';

// Sample data for the meeting cards with enhanced statistic labels
const personalizedMeeting = {
  title: 'Personalized Meeting',
  subtitle: '3 Days Remaining',
  persons: [
    {name: 'Ahmed Al-Rashid', phone: '07712345698', completed: false},
    {name: 'Hassan Ibrahim', phone: '07712345699', completed: true},
    {name: 'Omar Abdullah', phone: '07712345700', completed: false},
  ],
  stats: [
    {label: 'Assigned', value: '3'},
    {label: 'Completed', value: '1'},
    {label: 'Absent', value: '2'},
  ],
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

const handlePersonPress = (person: any, index: number) => {
  console.log(`Pressed person ${index + 1}: ${person.phone}`);
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
          persons={personalizedMeeting.persons}
          stats={personalizedMeeting.stats}
          onPersonPress={handlePersonPress}
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
    // marginHorizontal: spacing.md,
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
