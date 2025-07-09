import React, {useState, useEffect, useCallback} from 'react';
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
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Import YouTube player with error handling
let YoutubeIframe: any;
try {
  YoutubeIframe = require('react-native-youtube-iframe').default;
} catch (error) {
  console.warn('YouTube iframe not available:', error);
}
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import ApiTaskServices from '../services/apiHandler';
import {FeedItem} from '../services/PrayerAppAPI';
import {useWebViewInstallationCheck} from '../hooks/useWebViewInstallationCheck';

// Use FeedItem from the API instead of separate Reminder interface
type Reminder = FeedItem & {
  type?: 'text' | 'image' | 'youtube'; // Add youtube type for video reminders
  // YouTube URL is already defined in FeedItem interface
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
  if (item.type === 'text' || (!item.image_url && !item.youtube_url)) {
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

  // Render YouTube video card
  if (item.type === 'youtube' || item.youtube_url) {
    // Extract YouTube video ID if full URL is provided
    const getYoutubeId = (url: string) => {
      if (!url) return '';
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : url;
    };

    return (
      <TouchableOpacity
        style={styles.reminderCard}
        onPress={handlePress}
        activeOpacity={0.8}>
        <View style={styles.youtubeCardPreview}>
          {/* YouTube thumbnail with play icon overlay */}
          <Image
            source={{
              uri: `https://img.youtube.com/vi/${getYoutubeId(
                item.youtube_url || '',
              )}/0.jpg`,
            }}
            style={styles.youtubeThumbnail}
            resizeMode="cover"
          />
          <View style={styles.playIconOverlay}>
            <View style={styles.playIcon} />
          </View>
          {/* Title overlay at bottom */}
          <View style={styles.youtubeCardTitleContainer}>
            <Text style={styles.youtubeCardTitle} numberOfLines={2}>
              {item.title}
            </Text>
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
  // Check for WebView installation and provide guidance if missing
  useWebViewInstallationCheck();

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

      // Helper function to detect YouTube URLs in content
      const detectYoutubeUrl = (content: string) => {
        if (!content) return null;

        // Match YouTube URLs in content
        const youtubeRegex =
          /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = content.match(youtubeRegex);
        return match ? match[0] : null;
      };

      // Convert FeedItems to Reminders and add type property and youtube_url if present
      const remindersFromFeeds: Reminder[] = fetchedFeeds.map(feed => {
        // First check if the feed already has a youtube_url property
        const youtubeUrl = feed.youtube_url || detectYoutubeUrl(feed.content);

        // Determine the type based on available data
        let type: 'text' | 'image' | 'youtube' = 'text';
        if (youtubeUrl) {
          type = 'youtube';
        } else if (feed.image_url) {
          type = 'image';
        }

        return {
          ...feed,
          type,
          youtube_url: youtubeUrl,
        };
      });

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
                {/* YouTube Video (if available) */}
                {(selectedReminder?.type === 'youtube' ||
                  selectedReminder?.youtube_url) && (
                  <View style={styles.youtubeContainer}>
                    {YoutubeIframe ? (
                      <YoutubeIframe
                        height={220}
                        play={true} // Auto-play when modal opens
                        videoId={(() => {
                          const url = selectedReminder?.youtube_url || '';
                          const regExp =
                            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                          const match = url.match(regExp);
                          return match && match[2].length === 11
                            ? match[2]
                            : url;
                        })()}
                        onChangeState={(event: string) => console.log(event)}
                        onReady={() => console.log('YouTube player ready')}
                        onError={(e: string) =>
                          console.log('YouTube error:', e)
                        }
                        webViewProps={{
                          javaScriptEnabled: true,
                          allowsFullscreenVideo: true,
                        }}
                      />
                    ) : (
                      // Fallback when YouTube iframe is not available
                      <TouchableOpacity
                        style={styles.youtubeErrorFallback}
                        onPress={() => {
                          const url = selectedReminder?.youtube_url || '';
                          if (url) {
                            Linking.openURL(url).catch(err =>
                              console.error('Could not open YouTube URL:', err),
                            );
                          }
                        }}>
                        <Image
                          source={{
                            uri: `https://img.youtube.com/vi/${(() => {
                              const url = selectedReminder?.youtube_url || '';
                              const regExp =
                                /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                              const match = url.match(regExp);
                              return match && match[2].length === 11
                                ? match[2]
                                : '';
                            })()}/0.jpg`,
                          }}
                          style={styles.youtubeThumbnail}
                          resizeMode="cover"
                        />
                        <View style={styles.playIconOverlay}>
                          <View style={styles.playIcon} />
                          <Text style={styles.youtubeOpenText}>
                            Tap to open in YouTube
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Image (if available and not a YouTube video) */}
                {selectedReminder?.image_url &&
                  !selectedReminder.youtube_url &&
                  selectedReminder.type !== 'youtube' && (
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
  // YouTube card styles
  youtubeCardPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  youtubeThumbnail: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 0,
    borderBottomWidth: 15,
    borderTopWidth: 15,
    borderLeftColor: '#fff',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    marginLeft: 5,
  },
  youtubeCardTitleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  youtubeCardTitle: {
    ...typography.bodyMedium,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // YouTube modal styles
  youtubeContainer: {
    marginBottom: 20,
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  youtubeErrorFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtubeOpenText: {
    ...typography.bodyMedium,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  // Modal styles
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
