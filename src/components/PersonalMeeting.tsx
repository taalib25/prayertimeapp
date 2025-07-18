import React, {Component} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, FlatList} from 'react-native';
import {typography} from '../utils/typography';
import {borderRadius, colors, spacing} from '../utils/theme';
import SvgIcon from './SvgIcon';
import MeetingStatusModal from './MeetingStatusModal';
import PrayerAppAPI from '../services/PrayerAppAPI';

// Define MeetingMember type to match MeetingCard
interface MeetingMember {
  member_name: string;
  member_phone: string;
  scheduled_date: string;
  scheduled_time: string;
  session_notes: string;
  status: 'scheduled' | 'completed' | 'excused' | 'absent';
  member_username: string;
  location?: string;
  id?: string | number; // Add ID for API data
}

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
  counselingMeetings: MeetingMember[];
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean; // Add loading state for updates
}

export class PersonalMeeting extends Component<{}, PersonalMeetingState> {
  private api: PrayerAppAPI;

  constructor(props: {}) {
    super(props);
    this.api = PrayerAppAPI.getInstance();
    this.state = {
      modalVisible: false,
      selectedMember: null,
      counselingMeetings: [],
      isLoading: true,
      error: null,
      isUpdating: false,
    };
  }

  componentDidMount() {
    this.fetchCouncilSessions();
  }

  fetchCouncilSessions = async () => {
    try {
      this.setState({isLoading: true, error: null});

      console.log('📡 PersonalMeeting: Fetching council sessions...');

      // Fetch data from API
      const response = await this.api.getCouncilSessions();

      if (response.success && response.data) {
        console.log(
          '✅ PersonalMeeting: Council sessions fetched successfully',
        );

        // Transform API response to match our MeetingMember interface
        const transformedMeetings = this.transformApiData(response.data);

        this.setState({
          counselingMeetings: transformedMeetings,
          isLoading: false,
        });
      } else {
        console.log(
          '❌ PersonalMeeting: Failed to fetch council sessions:',
          response.error,
        );
        this.setState({
          error: response.error || 'Failed to fetch meetings',
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error(
        '❌ PersonalMeeting: Error fetching council sessions:',
        error,
      );
      this.setState({
        error: error.message || 'An error occurred while fetching meetings',
        isLoading: false,
      });
    }
  };

  transformApiData = (apiData: any): MeetingMember[] => {
    try {
      // Handle different possible API response structures
      const sessions = apiData.data || apiData.sessions || apiData || [];

      if (!Array.isArray(sessions)) {
        console.warn('⚠️ PersonalMeeting: API data is not an array:', sessions);
        return [];
      }

      return sessions.map((session: any) => {
        // Map API fields to our MeetingMember interface based on actual response
        const meeting: MeetingMember = {
          id: session.id,
          member_name: session.member_name || 'Unknown Member',
          member_phone: session.member_phone || '',
          scheduled_date: session.scheduled_date || new Date().toISOString(),
          scheduled_time: session.scheduled_time || '00:00',
          status: this.mapApiStatus(session.status),
          member_username: session.member_username || '',
          location:
            session.session_type === 'phone_call'
              ? 'Phone Call'
              : session.location || 'TBD',
          // Add session notes to the interface
          session_notes: session.session_notes || '',
        };

        return meeting;
      });
    } catch (error) {
      console.error('❌ PersonalMeeting: Error transforming API data:', error);
      return [];
    }
  };

  mapApiStatus = (
    apiStatus: string,
  ): 'scheduled' | 'completed' | 'excused' | 'absent' => {
    // Map API status values to our component's status values
    const statusMap: {
      [key: string]: 'scheduled' | 'completed' | 'excused' | 'absent';
    } = {
      scheduled: 'scheduled',
      pending: 'scheduled',
      confirmed: 'scheduled',
      completed: 'completed',
      finished: 'completed',
      done: 'completed',
      excused: 'excused',
      cancelled: 'excused',
      absent: 'absent',
      'no-show': 'absent',
      missed: 'absent',
    };

    return statusMap[apiStatus?.toLowerCase()] || 'scheduled';
  };

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

  handleStatusUpdate = async (
    status: 'completed' | 'excused' | 'absent',
    note: string,
  ) => {
    const {selectedMember} = this.state;
    if (!selectedMember) return;

    try {
      this.setState({isUpdating: true});

      console.log('🔄 PersonalMeeting: Updating status for member:', {
        memberId: selectedMember.id,
        memberName: selectedMember.member_name,
        newStatus: status,
        note: note,
      });

      // Update via API
      const response = await this.api.updateCounsellingSession({
        session_id: selectedMember.id!,
        status: status,
        session_notes: note,
        actual_start_time:
          status === 'completed' ? new Date().toISOString() : undefined,
        actual_end_time:
          status === 'completed' ? new Date().toISOString() : undefined,
      });

      if (response.success) {
        console.log('✅ PersonalMeeting: Status updated successfully via API');

        // Update local state to reflect the change immediately (optimistic update)
        const updatedMeetings = this.state.counselingMeetings.map(meeting => {
          if (
            meeting.id === selectedMember.id ||
            (meeting.member_username === selectedMember.member_username &&
              meeting.scheduled_date === selectedMember.scheduled_date)
          ) {
            return {
              ...meeting,
              status,
              session_notes: note,
            };
          }
          return meeting;
        });

        this.setState({
          counselingMeetings: updatedMeetings,
        });

        // Optionally refresh data from server to ensure consistency
        // await this.fetchCouncilSessions();
      } else {
        console.error('❌ PersonalMeeting: API update failed:', response.error);
        // Show error to user
        this.setState({
          error: response.error || 'Failed to update meeting status',
        });
      }
    } catch (error: any) {
      console.error('❌ PersonalMeeting: Error updating status:', error);
      this.setState({
        error: error.message || 'Failed to update meeting status',
      });
    } finally {
      this.setState({isUpdating: false});
      this.handleModalClose();
    }
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
                {/* Show existing session notes if any */}
                {item.session_notes && (
                  <Text style={styles.sessionNotes} numberOfLines={2}>
                    Notes: {item.session_notes}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.markButton,
                  {
                    backgroundColor: statusInfo.backgroundColor,
                    borderColor: statusInfo.borderColor,
                  },
                  this.state.isUpdating && styles.disabledButton,
                ]}
                onPress={() => this.handleMarkPress(item)}
                disabled={this.state.isUpdating}>
                <SvgIcon
                  name={statusInfo.icon}
                  size={16}
                  color={statusInfo.color}
                />
                <Text
                  style={[styles.markButtonText, {color: statusInfo.color}]}>
                  {this.state.isUpdating ? 'Updating...' : statusInfo.text}
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
          <View key={`${item.date}-${meeting.id || index}`}>
            {this.renderMeetingItem({item: meeting})}
          </View>
        ))}
      </View>
    );
  };

  renderEmptyState = () => {
    if (this.state.isLoading) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Loading meetings...</Text>
        </View>
      );
    }

    if (this.state.error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Error: {this.state.error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.fetchCouncilSessions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No meetings scheduled</Text>
      </View>
    );
  };

  render() {
    const {counselingMeetings, isLoading, error} = this.state;

    // Show empty state if loading, error, or no data
    if (isLoading || error || counselingMeetings.length === 0) {
      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Counseling Meetings</Text>
            <Text style={styles.headerSubtitle}>
              {isLoading
                ? 'Loading...'
                : error
                ? 'Error loading meetings'
                : 'No meetings scheduled'}
            </Text>
          </View>
          {this.renderEmptyState()}
        </View>
      );
    }

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
            isLoading={this.state.isUpdating}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    ...typography.bodyLarge,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    ...typography.bodyMedium,
    color: colors.white,
    fontWeight: '600',
  },
  sessionNotes: {
    ...typography.caption,
    color: colors.text.muted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: spacing.xs / 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default PersonalMeeting;
