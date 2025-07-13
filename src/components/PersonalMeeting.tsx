import React, {Component} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, FlatList} from 'react-native';
import {typography} from '../utils/typography';
import {borderRadius, colors, spacing} from '../utils/theme';
import SvgIcon from './SvgIcon';
import MeetingStatusModal from './MeetingStatusModal';

// Define MeetingMember type to match MeetingCard
interface MeetingMember {
  member_name: string;
  member_phone: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'excused' | 'absent';
  member_username: string;
  location?: string;
}

// Sample data for counseling meetings
const counselingMeetings: MeetingMember[] = [
  {
    member_name: 'Ahmed Al-Rashid',
    member_phone: '+94-77-123-4567',
    scheduled_date: '2025-07-03T00:00:00.000Z', // Today
    scheduled_time: '15:00',
    status: 'scheduled',
    member_username: 'ahmedrashid',
    location: 'Colombo Mosque',
  },
  {
    member_name: 'Omar Abdullah',
    member_phone: '+94-77-123-4569',
    scheduled_date: '2025-07-14T00:00:00.000Z', // Tomorrow
    scheduled_time: '10:00',
    status: 'scheduled',
    member_username: 'omarabdullah',
    location: 'Galle Office',
  },
  {
    member_name: 'Hassan Ibrahim',
    member_phone: '+94-77-123-4568',
    scheduled_date: '2025-07-13T00:00:00.000Z', // Today
    scheduled_time: '16:30',
    status: 'scheduled',
    member_username: 'hassanibrahim',
    location: 'Kandy Center',
  },

  {
    member_name: 'Bilal Khan',
    member_phone: '+94-77-123-4571',
    scheduled_date: '2025-07-15T00:00:00.000Z', // Day after tomorrow
    scheduled_time: '11:30',
    status: 'scheduled',
    member_username: 'bilalkhan',
    location: 'Matara Mosque',
  },
];

// Group meetings by date
const groupMeetingsByDate = (meetings: MeetingMember[]) => {
  const grouped: {[key: string]: MeetingMember[]} = {};

  meetings.forEach(meeting => {
    const date = meeting.scheduled_date.split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(meeting);
  });

  // Sort meetings within each date by time
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) =>
      a.scheduled_time.localeCompare(b.scheduled_time),
    );
  });

  return grouped;
};

// Format date for display
const formatDateDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

// Format time for display
const formatTimeDisplay = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour24 = parseInt(hours);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
};

interface PersonalMeetingState {
  modalVisible: boolean;
  selectedMember: MeetingMember | null;
}

export class PersonalMeeting extends Component<{}, PersonalMeetingState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      modalVisible: false,
      selectedMember: null,
    };
  }

  handleMarkPress = (member: MeetingMember) => {
    this.setState({
      selectedMember: member,
      modalVisible: true,
    });
  };

  handleModalClose = () => {
    this.setState({
      modalVisible: false,
      selectedMember: null,
    });
  };

  handleStatusUpdate = (
    status: 'completed' | 'excused' | 'absent',
    note: string,
  ) => {
    const {selectedMember} = this.state;
    if (selectedMember) {
      // Update the member's status in the data
      // For now, just log it - in a real app, you'd update the backend
      console.log('Status updated:', status, 'Note:', note);

      // Update the member's status locally
      selectedMember.status = status;
    }
    this.handleModalClose();
  };

  renderMeetingItem = ({item}: {item: MeetingMember}) => {
    // Get status display info
    const getStatusInfo = (status: string) => {
      switch (status) {
        case 'completed':
          return {
            icon: 'attended' as const,
            text: 'Completed',
            color: colors.success,
            backgroundColor: colors.success + '10',
            borderColor: colors.success,
          };
        case 'excused':
          return {
            icon: 'absent' as const,
            text: 'Excused',
            color: '#F57C00',
            backgroundColor: '#F57C00' + '10',
            borderColor: '#F57C00',
          };
        case 'absent':
          return {
            icon: 'absent' as const,
            text: 'Absent',
            color: '#FF2626',
            backgroundColor: '#FF2626' + '10',
            borderColor: '#FF2626',
          };
        default:
          return {
            icon: 'attended' as const,
            text: 'Mark Status',
            color: colors.text.muted,
            backgroundColor: colors.background.light,
            borderColor: colors.background.dark,
          };
      }
    };

    const statusInfo = getStatusInfo(item.status);

    return (
      <View style={styles.meetingCard}>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <View style={styles.topRow}>
              <View style={styles.namePhoneContainer}>
                <Text style={styles.memberName}>{item.member_name}</Text>
                <Text style={styles.memberPhone}>{item.member_phone}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.markButton,
                  {
                    backgroundColor: statusInfo.backgroundColor,
                    borderColor: statusInfo.borderColor,
                  },
                ]}
                onPress={() => this.handleMarkPress(item)}>
                <SvgIcon
                  name={statusInfo.icon}
                  size={16}
                  color={statusInfo.color}
                />
                <Text
                  style={[styles.markButtonText, {color: statusInfo.color}]}>
                  {statusInfo.text}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Meeting Details and Action Section */}
        <View style={styles.meetingFooter}>
          <View style={styles.timeSection}>
            <Text style={styles.timeLabel}>Scheduled time:</Text>
            <Text style={styles.timeValue}>
              {formatTimeDisplay(item.scheduled_time)}
            </Text>
          </View>
          {item.location && (
            <View style={styles.locationContainer}>
              <SvgIcon name="map" size={14} color={colors.text.muted} />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  renderDateSection = ({
    item,
  }: {
    item: {date: string; meetings: MeetingMember[]};
  }) => {
    return (
      <View style={styles.dateSection}>
        <View style={styles.dateHeader}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>{formatDateDisplay(item.date)}</Text>
          <View style={styles.dateLine} />
        </View>

        {/* Replace FlatList with map to avoid nesting virtualized lists */}
        {item.meetings.map((meeting, index) => (
          <View key={`${item.date}-${index}`}>
            {this.renderMeetingItem({item: meeting})}
          </View>
        ))}
      </View>
    );
  };

  render() {
    const groupedMeetings = groupMeetingsByDate(counselingMeetings);
    const sortedDates = Object.keys(groupedMeetings).sort();

    // Convert to FlatList data format
    const flatListData = sortedDates.map(date => ({
      date,
      meetings: groupedMeetings[date],
    }));

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Counseling Meetings</Text>
          <Text style={styles.headerSubtitle}>
            {counselingMeetings.length} meetings scheduled
          </Text>
        </View>

        <View style={styles.flatListWrapper}>
          <FlatList
            data={flatListData}
            renderItem={this.renderDateSection}
            keyExtractor={item => item.date}
            style={styles.flatListContainer}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          />
        </View>

        {this.state.selectedMember && (
          <MeetingStatusModal
            visible={this.state.modalVisible}
            onClose={this.handleModalClose}
            onSave={this.handleStatusUpdate}
            member={this.state.selectedMember}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.light,
    marginBottom: spacing.lg,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.light,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.prayerBlue,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.muted,
  },
  flatListWrapper: {
    height: 400, // Fixed height for nested scrolling
    flex: 1,
  },
  flatListContainer: {
    flex: 1,
  },
  flatListContent: {
    paddingVertical: spacing.md,
  },
  dateSection: {
    marginBottom: spacing.xl,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.background.light,
  },
  dateText: {
    ...typography.bodyMedium,
    color: colors.text.muted,
    paddingHorizontal: spacing.md,
    fontWeight: '500',
  },
  meetingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  userSection: {
    marginBottom: spacing.md,
  },
  userInfo: {
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  namePhoneContainer: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  memberName: {
    ...typography.h3,
    color: colors.text.dark,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
  },
  memberPhone: {
    ...typography.bodyMedium,
    color: colors.text.muted,
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.text.muted,
    fontSize: 13,
  },
  meetingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.background.light,
  },
  timeSection: {
    flex: 1,
    marginRight: spacing.md,
  },
  timeLabel: {
    ...typography.bodySmall,
    color: colors.text.muted,
    fontSize: 12,
    marginBottom: spacing.xs / 2,
  },
  timeValue: {
    ...typography.bodyLarge,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  markButton: {
    backgroundColor: colors.text.muted + '10',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    minHeight: 36,
    borderWidth: 1,
    borderColor: colors.background.dark,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  markButtonText: {
    ...typography.bodySmall,
    fontSize: 13,
  },
});

export default PersonalMeeting;
