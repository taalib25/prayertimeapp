import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import ApiTaskServices from '../services/apiHandler';
import {FeedItem} from '../services/PrayerAppAPI';

// Use FeedItem from the API instead of separate Reminder interface
type Reminder = FeedItem & {
  type?: 'text' | 'image'; // Add type to distinguish for UI
};

interface ReminderSectionProps {
  onSeeAllPress?: () => void;
  maxItems?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_SIZE = 200; // Increased from 160 to 200 - bigger square cards
const CARD_SPACING = 16; // Increased spacing for better visual separation

// Use real API service
const apiService = ApiTaskServices.getInstance();

const ReminderCard: React.FC<{
  item: Reminder;
  onPress?: (reminder: Reminder) => void;
}> = ({item, onPress}) => {
  const handlePress = () => {
    onPress?.(item);
  };
  // Render text-only card with gradient - simplified and bigger
  if (item.type === 'text' || !item.image_url) {
    return (
      <TouchableOpacity
        style={[styles.reminderCard, styles.textOnlyCard]}
        onPress={handlePress}
        activeOpacity={0.8}>
        <View style={styles.gradientContainer}>
          <View style={styles.gradientOverlay} />
          <View style={styles.textCardContent}>
            <Text style={styles.textCardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.textFadeContainer}>
              <Text style={styles.textCardDescription} numberOfLines={3}>
                {item.content}
              </Text>
              <View style={styles.textFadeOverlay} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
  // Render image card
  return (
    <TouchableOpacity
      style={styles.reminderCard}
      onPress={handlePress}
      activeOpacity={0.8}>
      <Image
        source={
          typeof item.image_url === 'string' &&
          item.image_url.startsWith('http')
            ? {uri: item.image_url} // HTTP URL
            : typeof item.image_url === 'string' &&
              item.image_url.includes('assets')
            ? {uri: item.image_url} // Local asset path - treat as URI for now
            : {uri: item.image_url || ''} // Fallback to empty URI for other cases
        }
        style={styles.reminderImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

const ReminderSection: React.FC<ReminderSectionProps> = ({
  maxItems,
  onSeeAllPress,
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  // Animation values
  const modalScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    loadReminders();
  }, []);
  const loadReminders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch feeds from the API and convert them to reminders
      const fetchedFeeds = await apiService.fetchFeeds();

      // Convert FeedItems to Reminders and add type property
      const remindersFromFeeds: Reminder[] = fetchedFeeds.map(feed => ({
        ...feed,
        type: feed.image_url ? 'image' : ('text' as 'text' | 'image'),
      }));

      // Apply maxItems limit if specified
      const limitedReminders = maxItems
        ? remindersFromFeeds.slice(0, maxItems)
        : remindersFromFeeds;

      setReminders(limitedReminders);
    } catch (err) {
      console.error('Error loading reminders:', err);
      setError('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };
  const handleReminderPress = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setModalVisible(true);

    // Animate modal appearance with faster animation
    modalScale.value = withSpring(1, {
      damping: 25,
      stiffness: 200,
      mass: 0.6,
    });
    modalOpacity.value = withTiming(1, {
      duration: 150,
    });
  };

  const closeModal = () => {
    // Animate modal disappearance with faster animation
    modalScale.value = withSpring(0, {
      damping: 25,
      stiffness: 200,
      mass: 0.6,
    });
    modalOpacity.value = withTiming(0, {
      duration: 100,
    });

    setTimeout(() => {
      setModalVisible(false);
      setSelectedReminder(null);
    }, 120);
  };

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: modalScale.value}],
      opacity: modalOpacity.value,
    };
  });

  const handleSeeAllPress = () => {
    console.log('See all reminders pressed');
    if (onSeeAllPress) {
      onSeeAllPress();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading reminders...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadReminders}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (reminders.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No reminders available</Text>
        </View>
      </View>
    );
  }
  return (
    <>
      <View style={styles.container}>
        <View style={styles.remindersContainer}>
          <FlatList
            data={reminders}
            renderItem={({item}) => (
              <ReminderCard item={item} onPress={handleReminderPress} />
            )}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.remindersList}
            decelerationRate="fast"
          />
        </View>

        <Text style={styles.quoteText}>
          "Remind, indeed reminders benefit the believers"
        </Text>
        <Text style={styles.quoteSource}>(Quran 51:55)</Text>
      </View>

      {/* Reminder Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}>
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View
            style={[
              styles.modalContainer,
              modalAnimatedStyle,
              selectedReminder?.type === 'text' && styles.textModalContainer,
            ]}>
            <Pressable onPress={e => e.stopPropagation()}>
              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalContent}
                showsVerticalScrollIndicator={false}>
                {/* Image (if available) */}
                {selectedReminder?.image_url && (
                  <View style={styles.modalImageContainer}>
                    <Image
                      source={
                        typeof selectedReminder.image_url === 'string' &&
                        selectedReminder.image_url.startsWith('http')
                          ? {uri: selectedReminder.image_url} // HTTP URL
                          : typeof selectedReminder.image_url === 'string' &&
                            selectedReminder.image_url.includes('assets')
                          ? {uri: selectedReminder.image_url} // Local asset path - treat as URI for now
                          : {uri: selectedReminder.image_url} // Fallback to URI for all cases
                      }
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
                {/* Title */}
                <Text
                  style={[
                    styles.modalTitle,
                    selectedReminder?.type === 'text' && styles.textModalTitle,
                  ]}>
                  {selectedReminder?.title}
                </Text>
                {/* Description */}
                <Text
                  style={[
                    styles.modalDescription,
                    selectedReminder?.type === 'text' &&
                      styles.textModalDescription,
                  ]}>
                  {selectedReminder?.content}
                </Text>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginBottom: 10,
  },
  remindersContainer: {
    marginBottom: 20,
  },
  remindersList: {
    paddingHorizontal: 8,
  },
  reminderCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 15,
    overflow: 'hidden',
    marginRight: CARD_SPACING,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  // Text-only card styles
  textOnlyCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
  },
  gradientContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 15,
    position: 'relative',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 15,
  },
  textCardContent: {
    flex: 1,
    padding: 16, // Increased padding for better spacing
    justifyContent: 'center',
  },
  textCardTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  textFadeContainer: {
    position: 'relative',
  },
  textCardDescription: {
    ...typography.body,
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
    lineHeight: 18,
  },
  textFadeOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 18,
    backgroundColor: colors.primary,
    opacity: 0.7,
  }, // Image card styles
  reminderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  imageCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  imageCardTitle: {
    ...typography.bodyMedium,
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
    lineHeight: 18,
  }, // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.background.light,
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  textModalContainer: {
    backgroundColor: colors.primary,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 10, // For Android
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '700',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalContent: {
    padding: 19,
    paddingTop: 20, // Reduced from 50 to allow image to take more space
  },
  textModalContent: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    margin: 0,
  },
  modalImageContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 3,
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  modalTitle: {
    ...typography.h2,
    fontSize: 24,
    color: colors.primary,
    marginBottom: 16,
    lineHeight: 30,
  },
  textModalTitle: {
    color: colors.white,
  },
  modalDescription: {
    ...typography.body,
    fontSize: 16,
    color: '#4CAF50', // Light green color
    lineHeight: 24,
    marginBottom: 20,
  },
  textModalDescription: {
    color: colors.white,
    opacity: 0.95,
  },
  // Existing styles
  quoteText: {
    ...typography.h3,
    fontSize: 16,
    color: colors.primary,
    textAlign: 'right',
  },
  quoteSource: {
    ...typography.bodyMedium,
    color: colors.primary,
    textAlign: 'right',
    marginBottom: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginLeft: 10,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    ...typography.bodyMedium,
    color: colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default ReminderSection;
