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
} from 'react-native';
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

interface FeedItem {
  id: string;
  title: string;
  description: string;
  imagePath?: any; // Optional - for text-only feeds
  category: string;
  priority?: 'high' | 'medium' | 'low';
  type?: 'text' | 'image'; // Add type to distinguish
}

type FeedCategory = 'All Feeds' | 'Reminders' | 'Events';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_HEIGHT = 160; // Further reduced height
const CARD_SPACING = 8; // Small spacing between cards
const TEXT_CARD_WIDTH = SCREEN_WIDTH * 0.6; // More constrained text-only cards

// Mock API service - same as ReminderSection
const feedApi = {
  async fetchFeeds(): Promise<FeedItem[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: '1',
        title: 'Morning Dhikr',
        description:
          'Start your day with remembrance of Allah. Recite the morning adhkar after Fajr prayer to protect yourself throughout the day.',
        imagePath: require('../assets/images/reminderLarge1.png'),
        priority: 'high',
        category: 'Reminders',
        type: 'image',
      },
      {
        id: '2',
        title: 'Quran Recitation',
        description:
          '10 minutes of Quran after Fajr prayer. Even a few verses daily will bring immense reward and barakah to your day.',
        imagePath: require('../assets/images/reminderLarge2.png'),
        priority: 'high',
        category: 'Reminders',
        type: 'image',
      },
      {
        id: '3',
        title: 'Remember Allah often',
        description:
          'Those who believe and whose hearts find peace in the remembrance of Allah - truly it is in the remembrance of Allah that hearts find peace.',
        priority: 'medium',
        category: 'Reminders',
        type: 'text',
      },
      {
        id: '4',
        title: 'Seek forgiveness',
        description:
          'Say Astaghfirullah 100 times daily. The Prophet (PBUH) sought forgiveness more than 70 times a day.',
        priority: 'high',
        category: 'Reminders',
        type: 'text',
      },
      {
        id: '5',
        title: 'Evening Duas',
        description:
          'Protection duas before sleep to guard against evil and nightmares.',
        imagePath: require('../assets/images/reminderLarge2.png'),
        priority: 'medium',
        category: 'Reminders',
        type: 'image',
      },
      {
        id: '6',
        title: 'When you Miss THE FAJR PRAYER',
        description: 'It is going to be a miserable day with SHAITHAAN',
        imagePath: require('../assets/images/reminderLarge1.png'),
        category: 'Events',
        type: 'image',
      },
      {
        id: '7',
        title: 'Community Prayer Gathering',
        description:
          'Join our weekly community prayer gathering every Friday evening. Strengthen your faith together with fellow believers.',
        category: 'Events',
        type: 'text',
      },
    ];
  },
};

const FeedCard: React.FC<{
  item: FeedItem;
  onPress?: (feed: FeedItem) => void;
}> = ({item, onPress}) => {
  const handlePress = () => {
    onPress?.(item);
  };

  // Render text-only card with gradient
  if (item.type === 'text' || !item.imagePath) {
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
              <Text style={styles.textCardDescription} numberOfLines={3}>
                {item.description}
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
      style={styles.feedCard}
      onPress={handlePress}
      activeOpacity={0.8}>
      <Image
        source={item.imagePath}
        style={styles.feedImage}
        resizeMode="cover"
      />
      <View style={styles.imageCardOverlay}>
        <Text style={styles.imageCardTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
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
    if (selectedCategory === 'All Feeds') {
      return feeds;
    }
    return feeds.filter((item: FeedItem) => item.category === selectedCategory);
  }, [selectedCategory, feeds]);

  useEffect(() => {
    loadFeeds();
  }, []);

  useEffect(() => {
    setFilteredItems(computedFilteredItems);
  }, [computedFilteredItems]);

  const loadFeeds = async () => {
    try {
      setLoading(true);
      const fetchedFeeds = await feedApi.fetchFeeds();
      setFeeds(fetchedFeeds);
    } catch (err) {
      console.error('Error loading feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedPress = (feed: FeedItem) => {
    setSelectedFeed(feed);
    setModalVisible(true);

    // Animate modal appearance with reduced animation
    modalScale.value = withSpring(1, {
      damping: 18,
      stiffness: 150,
    });
    modalOpacity.value = withTiming(1, {
      duration: 150,
    });
  };

  const closeModal = () => {
    // Animate modal disappearance with reduced animation
    modalScale.value = withSpring(0, {
      damping: 18,
      stiffness: 150,
    });
    modalOpacity.value = withTiming(0, {
      duration: 100,
    });

    setTimeout(() => {
      setModalVisible(false);
      setSelectedFeed(null);
    }, 150);
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
  );
  // Memoized keyExtractor function
  const keyExtractor = useCallback((item: FeedItem) => item.id, []);

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
            <View style={styles.squareIconContainer}>
              <SvgIcon name="backBtn" size={25} color="#333" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Feeds</Text>
          <TouchableOpacity style={styles.iconButton}>
            <View style={styles.squareIconContainer}>
              <SvgIcon name="search" size={25} color="#333" />
            </View>
          </TouchableOpacity>
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
          <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
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
                {selectedFeed?.imagePath && (
                  <View style={styles.modalImageContainer}>
                    <Image
                      source={selectedFeed.imagePath}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Title */}
                <Text style={styles.modalTitle}>{selectedFeed?.title}</Text>

                {/* Description */}
                <Text style={styles.modalDescription}>
                  {selectedFeed?.description}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontWeight: '600',
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
    height: CARD_HEIGHT,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  // Text-only card styles
  textOnlyCard: {
    width: '100%',
    marginHorizontal: 6,
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
    padding: 16,
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
    fontWeight: '600',
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalContent: {
    padding: 20,
    paddingTop: 50, // Account for close button
  },
  modalImageContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  modalTitle: {
    ...typography.h2,
    fontSize: 22,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 28,
  },
  modalDescription: {
    ...typography.body,
    fontSize: 16,
    color: '#4CAF50', // Light green color
    lineHeight: 24,
    marginBottom: 20,
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
});

export default FeedsScreen;
