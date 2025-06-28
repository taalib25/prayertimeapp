import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import SvgIcon from './SvgIcon';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import MeetingService, {MeetingDetails} from '../services/MeetingService';

interface MeetingDetailsCardProps {
  onClose?: () => void;
}

const MeetingDetailsCard: React.FC<MeetingDetailsCardProps> = ({onClose}) => {
  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const meetingService = MeetingService.getInstance();

  useEffect(() => {
    fetchMeetingDetails();
  }, []);

  const fetchMeetingDetails = async () => {
    try {
      setIsLoading(true);

      // Get the active consultation (only one consultation shown at a time)
      const activeConsultation = await meetingService.getActiveConsultation();

      if (activeConsultation) {
        setMeeting(activeConsultation);
      }

      setIsLoading(false);
    } catch (err) {
      setError('Failed to load consultation details');
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Loading meeting details...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !meeting) {
    return null; // Don't show the component if there's an error or no meeting
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
            <Text style={styles.detailValue}>{meeting.time}</Text>
          </View>

          <View style={styles.detailItem}>
            <SvgIcon name="map" size={16} color={colors.text.muted} />
            <Text style={styles.detailLabel}>Place:</Text>
            <Text style={styles.detailValue}>{meeting.location.name}</Text>
          </View>

          {meeting.location.address && (
            <View style={styles.addressRow}>
              <Text style={styles.addressText}>{meeting.location.address}</Text>
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
    fontWeight: '600',
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
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
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
