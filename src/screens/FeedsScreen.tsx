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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';

interface FeedItem {
  id: string;
  title: string;
  description: string;
  imagePath: any;
  category: string;
  backgroundColor: string;
}

type FeedCategory = 'All Feeds' | 'Reminders' | 'Events';

const feedItems: FeedItem[] = [
  {
    id: '1',
    title: 'Morning Dhikr',
    description: 'Start your day with remembrance of Allah',
    imagePath: require('../assets/images/reminder1.png'),
    category: 'Reminders',
    backgroundColor: '#E8F5FE',
  },
  {
    id: '2',
    title: 'Quran Recitation',
    description: '10 minutes of Quran after Fajr prayer',
    imagePath: require('../assets/images/reminder2.png'),
    category: 'Reminders',
    backgroundColor: '#FFF9C4',
  },
  {
    id: '3',
    title: 'When you Miss THE FAJR PRAYER',
    description: 'It is going to be a miserable day with SHAITHAAN',
    imagePath: require('../assets/images/reminder1.png'),
    category: 'Events',
    backgroundColor: '#673AB7',
  },
  {
    id: '4',
    title: 'Evening Duas',
    description: 'Protection duas before sleep',
    imagePath: require('../assets/images/reminder2.png'),
    category: 'Reminders',
    backgroundColor: '#E3F2FD',
  },
];

const CARD_BORDER_RADIUS = 8; // Less rounded
const SCREEN_WIDTH = Dimensions.get('window').width;

const FeedCard: React.FC<{item: FeedItem}> = ({item}) => {
  return (
    <View style={styles.feedCard}>
      <Image
        source={item.imagePath}
        style={styles.feedImage}
        resizeMode="cover" // 'cover' to fill the card, 'contain' to show whole image
      />
    </View>
  );
};

const FeedsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<FeedCategory>('All Feeds');
  const [filteredItems, setFilteredItems] = useState<FeedItem[]>([]);

  // Use useMemo to avoid unnecessary re-computations of filtered items
  const computedFilteredItems = useMemo(() => {
    if (selectedCategory === 'All Feeds') {
      return feedItems;
    }
    return feedItems.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
      setFilteredItems(computedFilteredItems);
    }, 500); // Reduced timeout for faster perceived loading
    return () => clearTimeout(timer);
  }, [computedFilteredItems]);

  const handleCategoryChange = useCallback((category: FeedCategory) => {
    setSelectedCategory(category);
  }, []);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Optimized render item function with useCallback to avoid recreating on each render
  const renderFeedItem: ListRenderItem<FeedItem> = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={[styles.feedItem, {backgroundColor: item.backgroundColor}]}
        activeOpacity={0.9}>
       <FeedCard item={item} />
      </TouchableOpacity>
    ),
    [],
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Feeds</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchButtonText}>🔍</Text>
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
          getItemLayout={(_, index) => ({
            length: 280, // Approximate height of each item
            offset: 280 * index,
            index,
          })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {selectedCategory} found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    color: colors.text.dark,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.dark,
  },
  searchButton: {
    padding: 8,
  },
  searchButtonText: {
    fontSize: 20,
    color: colors.text.dark,
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
  feedItem: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedImage: {
    width: '100%',
    height: 180,
  },
  feedContent: {
    padding: 16,
  },
  feedTitle: {
    ...typography.h3,
    color: colors.text.dark,
    marginBottom: 8,
  },
  feedDescription: {
    ...typography.body,
    color: colors.text.secondary,
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
  feedCard: {
    height: 250, // Example height for feed cards
    width: '100%', // Full width
    borderRadius: CARD_BORDER_RADIUS, // Less rounded
    overflow: 'hidden',
    marginBottom: 16, // Spacing between cards
    backgroundColor: colors.background.light, // Placeholder background
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: CARD_BORDER_RADIUS / 2, // Softer shadow
  },
});

export default FeedsScreen;
