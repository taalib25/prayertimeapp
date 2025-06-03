import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {colors, spacing, borderRadius} from '../utils/theme';
import {typography} from '../utils/typography';
import MeetingCard from '../components/MeetingCard';

const ProfileScreen: React.FC = () => {
  // Sample data for the meeting cards
  const personalizedMeeting = {
    title: 'Personalized Meeting',
    subtitle: '3 Days Remaining',
    persons: [
      {name: 'Person 1', phone: '07712345698', completed: false},
      {name: 'Person 2', phone: '07712345698', completed: true},
      {name: 'Person 3', phone: '07712345698', completed: false},
    ],
    stats: [
      {label: 'Assigned', value: '3'},
      {label: 'Completed', value: '2'},
      {label: 'Remaining', value: '1'},
    ],
  };

  const meetingAttendance = {
    title: 'Meeting Attendance',
    subtitle: 'Last 5 meetings',
    stats: [
      {label: 'Attended', value: '3'},
      {label: 'Absent', value: '1'},
      {label: 'Excused', value: '1'},
    ],
  };

  const handlePersonPress = (person: any, index: number) => {
    console.log(`Pressed person ${index + 1}: ${person.phone}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
    paddingTop: spacing.lg,
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
    height: spacing.xxl,
  },
});

export default ProfileScreen;
