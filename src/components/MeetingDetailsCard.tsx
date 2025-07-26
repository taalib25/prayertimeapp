import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import SvgIcon from './SvgIcon';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import PrayerAppAPI from '../services/PrayerAppAPI';
import UserService from '../services/UserService';

interface MeetingDetails {
  title: string;
  isUrgent?: boolean;
  date: string;
  time: string;
  committeeMember: {
    name: string;
    phone: string;
  };
  session_notes?: string;
}

interface MeetingDetailsCardProps {
  onClose?: () => void;
}

const MeetingDetailsCard: React.FC<MeetingDetailsCardProps> = ({onClose}) => {
  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = PrayerAppAPI.getInstance();
  const userService = UserService.getInstance();

  useEffect(() => {
    fetchUserMeeting();
  }, []);

  const fetchUserMeeting = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user data
      const user = await userService.getUser();
      if (!user.memberId) {
        console.log('No member ID found for user');
        setMeeting(null);
        setIsLoading(false);
        return;
      }

      console.log(
        '🔍 MeetingDetailsCard: Fetching council sessions for member:',
        user.memberId,
      );

      // Fetch council sessions from API
      const response = await api.getCouncilSessions();

      if (response.success && response.data) {
        // Handle different possible API response structures
        const sessions =
          response.data.data || response.data.sessions || response.data || [];

        if (!Array.isArray(sessions)) {
          console.warn(
            '⚠️ MeetingDetailsCard: API data is not an array:',
            sessions,
          );
          setMeeting(null);
          setIsLoading(false);
          return;
        }

        // Filter sessions for the current user's member ID
        const userSession = sessions.find(
          (session: any) =>
            session.member_id === user.memberId ||
            session.member_username === user.username ||
            session.member_name === user.fullName ||
            session.member_name === user.username,
        );

        if (userSession) {
          console.log(
            '✅ MeetingDetailsCard: Found user session:',
            userSession,
          );

          // Transform to MeetingDetails format
          const meetingDetails: MeetingDetails = {
            title: userSession.session_title || 'Personal Meeting',
            isUrgent: userSession.is_urgent || false,
            date: userSession.scheduled_date || new Date().toISOString(),
            time: userSession.scheduled_time || '00:00',
            committeeMember: {
              name:
                userSession.counselor_name ||
                userSession.committee_member_name ||
                'Council Member',
              phone:
                userSession.counselor_phone ||
                userSession.committee_member_phone ||
                '',
            },
            session_notes: userSession.session_notes || '',
          };

          setMeeting(meetingDetails);
        } else {
          console.log('ℹ️ MeetingDetailsCard: No meeting found for user');
          setMeeting(null);
        }
      } else {
        console.error(
          '❌ MeetingDetailsCard: Failed to fetch council sessions:',
          response.error,
        );
        setError(response.error || 'Failed to fetch meeting details');
      }
    } catch (error: any) {
      console.error(
        '❌ MeetingDetailsCard: Error fetching user meeting:',
        error,
      );
      setError(
        error.message || 'An error occurred while fetching meeting details',
      );
    } finally {
      setIsLoading(false);
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString.includes(':')) return timeString;

    const [hoursStr, minutesStr] = timeString.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';

    // Convert hour to 12-hour clock
    hours = hours % 12 || 12;

    return `${hours}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading meeting details...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    console.warn(
      'MeetingDetailsCard: Error occurred, not showing card:',
      error,
    );
    return null; // Don't show the component if there's an error
  }

  if (!meeting) {
    console.log('MeetingDetailsCard: No meeting found, not showing card');
    return null; // Don't show the component if no meeting is found
  }

  return (
    <View style={styles.container}>
      {/* Single unified content */}
      <View style={styles.contentContainer}>
        {/* Primary Title */}
        <View style={styles.titleRow}>
          <SvgIcon name="calendar" size={20} color="#F59E0B" />
          <Text style={styles.meetingTitle}>{meeting.title}</Text>
          {meeting.isUrgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <View style={styles.contactRow}>
            <SvgIcon name="profile" size={18} color={colors.text.muted} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>
                {meeting.committeeMember.name}
              </Text>
              <Text style={styles.contactNumber}>
                {meeting.committeeMember.phone}
              </Text>
            </View>
          </View>
        </View>

        {/* Meeting Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailItem}>
            <SvgIcon name="calendar" size={16} color={colors.text.muted} />
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(meeting.date)}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.clockIcon}>🕐</Text>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{formatTime(meeting.time)}</Text>
          </View>

          {meeting.session_notes && (
            <View style={styles.detailItem}>
              <SvgIcon name="profile" size={16} color={colors.text.muted} />
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.notesValue}>{meeting.session_notes}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFDF0', // Subtle yellow background
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#FFF4C4', // Light yellow border
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.text.muted,
    marginTop: 8,
    fontSize: 13,
  },
  contentContainer: {
    padding: 20,
  },
  // PRIMARY LEVEL - Meeting Title
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF0B3', // Subtle yellow divider
  },
  meetingTitle: {
    ...typography.h3,
    color: colors.text.dark,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
    lineHeight: 24,
  },
  urgentBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  urgentText: {
    ...typography.bodySmall,
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // SECONDARY LEVEL - Contact Section
  contactSection: {
    marginBottom: 16,
    backgroundColor: '#FFFAEB',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contactName: {
    ...typography.bodyMedium,
    color: colors.text.dark,
    fontSize: 16,

    marginBottom: 2,
  },
  contactNumber: {
    ...typography.body,
    color: colors.text.blue,
    fontSize: 14,
    fontWeight: '500',
  },

  // TERTIARY LEVEL - Meeting Details
  detailsSection: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  clockIcon: {
    fontSize: 16,
    width: 16,
    textAlign: 'center',
    marginRight: 4,
  },
  detailLabel: {
    ...typography.body,
    color: colors.text.muted,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
    minWidth: 50,
  },
  detailValue: {
    ...typography.body,
    color: colors.text.dark,
    fontSize: 14,

    marginLeft: 8,
    flex: 1,
  },
  notesValue: {
    ...typography.body,
    color: colors.text.muted,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  addressRow: {
    marginTop: 4,
    marginLeft: 26,
  },
  addressText: {
    ...typography.body,
    color: colors.text.muted,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

export default MeetingDetailsCard;
