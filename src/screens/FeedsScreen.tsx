import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  ListRenderItem,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
  Linking,
} from 'react-native';

// Import YouTube player with error handling
let YoutubeIframe: any;
try {
  YoutubeIframe = require('react-native-youtube-iframe').default;
} catch (error) {
  console.warn('YouTube iframe not available:', error);
}
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useNavigation} from '@react-navigation/native';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import SvgIcon from '../components/SvgIcon';
import ApiTaskServices from '../services/apiHandler';
import {FeedItem} from '../services/PrayerAppAPI';

type FeedCategory = 'All Feeds' | 'Reminders' | 'Events';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 24; // Full width with padding
const IMAGE_CARD_HEIGHT = CARD_WIDTH * 0.8; // Instagram-like aspect ratio for image cards
const CARD_SPACING = 16; // Spacing between posts

// Use real API service
const apiService = ApiTaskServices.getInstance();

const FeedCard: React.FC<{
  item: FeedItem;
  onPress?: (feed: FeedItem) => void;
}> = ({item, onPress}) => {
  const [imageHeight, setImageHeight] = useState<number>(IMAGE_CARD_HEIGHT);

  const handlePress = () => {
    onPress?.(item);
  };

  // Calculate image height when component mounts
  React.useEffect(() => {
    if (item.image_url) {
      setImageHeight(IMAGE_CARD_HEIGHT);
    }
  }, [item.image_url]);

  // Render YouTube video card
  if (item.youtube_url) {
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
        style={[styles.feedCard, {height: IMAGE_CARD_HEIGHT}]}
        onPress={handlePress}
        activeOpacity={0.8}>
        <View style={styles.youtubeCardPreview}>
          {/* YouTube thumbnail with play icon overlay */}
          <Image
            source={{
              uri: `https://img.youtube.com/vi/${getYoutubeId(
                item.youtube_url,
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

  // Render text-only card with gradient - dynamic height based on content
  if (!item.image_url) {
    return (
      <TouchableOpacity
        style={[styles.feedCard, styles.textOnlyCard]}
        onPress={handlePress}
        activeOpacity={0.8}>
        <View style={styles.gradientContainer}>
          <View style={styles.gradientOverlay} />
          <View style={styles.textCardContent}>
            <Text style={styles.textCardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.textFadeContainer}>
              <Text style={styles.textCardDescription}>{item.content}</Text>
              <View style={styles.textFadeOverlay} />
            </View>
            <Text style={styles.textCardAuthor}>By {item.author_name}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Render image card - use natural image aspect ratio with dynamic height
  return (
    <TouchableOpacity
      style={[styles.feedCard, {height: imageHeight}]}
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
        style={[styles.feedImage, {height: imageHeight}]}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

const FeedsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<FeedCategory>('All Feeds');
  const [filteredItems, setFilteredItems] = useState<FeedItem[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<FeedItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Animation values
  const modalScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  // Use useMemo to avoid unnecessary re-computations of filtered items
  const computedFilteredItems = useMemo(() => {
    // For now, return all feeds since category is not part of the FeedItem interface
    // This can be enhanced later by adding category filtering logic based on content/title
    return feeds;
  }, [feeds]);

  useEffect(() => {
    loadFeeds();
  }, []);

  useEffect(() => {
    setFilteredItems(computedFilteredItems);
  }, [computedFilteredItems]);
  const loadFeeds = async () => {
    try {
      setLoading(true);
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

      // Process feeds to detect YouTube URLs in content
      const processedFeeds = fetchedFeeds.map(feed => {
        // First check if feed already has a youtube_url property
        const youtubeUrl = feed.youtube_url || detectYoutubeUrl(feed.content);
        if (youtubeUrl) {
          return {...feed, youtube_url: youtubeUrl};
        }
        return feed;
      });

      setFeeds(processedFeeds);
    } catch (err) {
      console.error('Error loading feeds:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleFeedPress = (feed: FeedItem) => {
    setSelectedFeed(feed);
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
      setSelectedFeed(null);
    }, 120);
  };

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: modalScale.value}],
      opacity: modalOpacity.value,
    };
  });

  const handleCategoryChange = useCallback((category: FeedCategory) => {
    setSelectedCategory(category);
  }, []);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Optimized render item function with useCallback to avoid recreating on each render
  const renderFeedItem: ListRenderItem<FeedItem> = useCallback(
    ({item}) => <FeedCard item={item} onPress={handleFeedPress} />,
    [handleFeedPress],
  ); // Memoized keyExtractor function
  const keyExtractor = useCallback((item: FeedItem) => item.id.toString(), []);

  // Cached category buttons
  const categoryButtons = useMemo(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScrollView}>
        {['All Feeds', 'Reminders', 'Events'].map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategory,
            ]}
            onPress={() => handleCategoryChange(category as FeedCategory)}>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText,
              ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    ),
    [selectedCategory, handleCategoryChange],
  );

  // Optimize FlatList with performance props
  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={handleBackPress}>
            {/* <View style={styles.squareIconContainer}>
              <SvgIcon name="backBtn" size={25} color="#333" />
            </View> */}
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FEED</Text>
          {/* <TouchableOpacity style={styles.iconButton}>
            <View style={styles.squareIconContainer}>
              <SvgIcon name="search" size={25} color="#333" />
            </View>
          </TouchableOpacity> */}
        </View>

        {/* Category Selector */}
        <View style={styles.categoryContainer}>{categoryButtons}</View>

        {/* Feed List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading feeds...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderFeedItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.feedList}
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            removeClippedSubviews={true}
            initialNumToRender={4}
            maxToRenderPerBatch={5}
            windowSize={5}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No {selectedCategory} found
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* Feed Detail Modal */}
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
              !selectedFeed?.image_url && styles.textModalContainer,
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
                {selectedFeed?.youtube_url && (
                  <View style={styles.youtubeContainer}>
                    {YoutubeIframe ? (
                      <YoutubeIframe
                        height={220}
                        width="100%"
                        videoId={(() => {
                          // Extract YouTube video ID if full URL is provided
                          const url = selectedFeed.youtube_url || '';
                          const regExp =
                            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                          const match = url.match(regExp);
                          return match && match[2].length === 11
                            ? match[2]
                            : url;
                        })()}
                        play={true} // Auto-play when modal opens
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
                          const url = selectedFeed.youtube_url || '';
                          if (url) {
                            Linking.openURL(url).catch(err =>
                              console.error('Could not open YouTube URL:', err),
                            );
                          }
                        }}>
                        <Image
                          source={{
                            uri: `https://img.youtube.com/vi/${(() => {
                              const url = selectedFeed.youtube_url || '';
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

                {/* Image (if available and no YouTube URL) */}
                {selectedFeed?.image_url && !selectedFeed?.youtube_url && (
                  <View style={styles.modalImageContainer}>
                    <Image
                      source={
                        typeof selectedFeed.image_url === 'string' &&
                        selectedFeed.image_url.startsWith('http')
                          ? {uri: selectedFeed.image_url} // HTTP URL
                          : typeof selectedFeed.image_url === 'string' &&
                            selectedFeed.image_url.includes('assets')
                          ? {uri: selectedFeed.image_url} // Local asset path - treat as URI for now
                          : {uri: selectedFeed.image_url} // Fallback to URI for all cases
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
                    !selectedFeed?.image_url && styles.textModalTitle,
                  ]}>
                  {selectedFeed?.title}
                </Text>
                {/* Description */}
                <Text
                  style={[
                    styles.modalDescription,
                    !selectedFeed?.image_url && styles.textModalDescription,
                  ]}>
                  {selectedFeed?.content}
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
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 28, // Added for status bar margin
    marginBottom : 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.black,
    textAlign: 'center',
  },
  iconButton: {
    padding: 4,
  },
  squareIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesScrollView: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  selectedCategory: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    ...typography.bodyMedium,
    color: colors.text.dark,
  },
  selectedCategoryText: {
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: 12,
  },
  feedList: {
    padding: 12,
  },
  feedCard: {
    width: CARD_WIDTH,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: CARD_SPACING,
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  }, // Text-only card styles - dynamic height based on content
  textOnlyCard: {
    minHeight: 120, // Minimum height for text cards
  },
  gradientContainer: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    position: 'relative',
    minHeight: 120, // Minimum height for text content
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 15,
  },
  textCardContent: {
    padding: 16,
    paddingVertical: 20, // Extra vertical padding for better text layout
  },
  textCardTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.white,

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
  textCardAuthor: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.white,
    opacity: 0.8,
    marginTop: 8,
    fontWeight: '500',
  },
  textFadeOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 18,
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
  // Image card styles
  feedImage: {
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

    lineHeight: 18,
  }, // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalContainer: {
    backgroundColor: '#f8f9fa',
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
    padding: 20,
    paddingTop: 20, // Reduced from 50 to allow image to take more space
  },
  modalImageContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    // paddingHorizontal: 3,
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  // YouTube styles
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
  },
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

    marginTop: 15,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
});

export default FeedsScreen;
