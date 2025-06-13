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
} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';

interface Reminder {
  id: string;
  title: string;
  description: string;
  imagePath: any; // For now using local images, later will be string for HTTP URLs
  priority?: 'high' | 'medium' | 'low';
  category?: string;
}

interface ReminderSectionProps {
  onSeeAllPress?: () => void;
  maxItems?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.47; // Reduced to 60% to show multiple cards

// Mock API service
const reminderApi = {
  async fetchReminders(): Promise<Reminder[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
      {
        id: '1',
        title: 'Morning Dhikr',
        description: 'Start your day with remembrance of Allah',
        imagePath: require('../assets/images/reminder1.png'),
        priority: 'high',
        category: 'dhikr',
      },
      {
        id: '2',
        title: 'Quran Recitation',
        description: '10 minutes of Quran after Fajr prayer',
        imagePath: require('../assets/images/reminder2.png'),
        priority: 'high',
        category: 'quran',
      },
      {
        id: '3',
        title: 'Masjid Visit',
        description: 'Remember to attend Jummah prayer today',
        imagePath: require('../assets/images/reminder1.png'),
        priority: 'medium',
        category: 'prayer',
      },
      {
        id: '4',
        title: 'Evening Duas',
        description: 'Protection duas before sleep',
        imagePath: require('../assets/images/reminder2.png'),
        priority: 'medium',
        category: 'dua',
      },
    ];
  },
};

const ReminderCard: React.FC<{
  item: Reminder;
  onPress?: (reminder: Reminder) => void;
}> = ({item, onPress}) => {
  const handlePress = () => {
    onPress?.(item);
  };

  return (
    <TouchableOpacity
      style={styles.reminderCard}
      onPress={handlePress}
      activeOpacity={0.8}>
      <Image
        source={item.imagePath}
        style={styles.reminderImage}
        resizeMode="contain"
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

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedReminders = await reminderApi.fetchReminders();

      // Apply maxItems limit if specified
      const limitedReminders = maxItems
        ? fetchedReminders.slice(0, maxItems)
        : fetchedReminders;

      setReminders(limitedReminders);
    } catch (err) {
      console.error('Error loading reminders:', err);
      setError('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleReminderPress = (reminder: Reminder) => {
    console.log('Reminder pressed:', reminder.title);
    // TODO: Navigate to reminder detail or perform action
  };

  const handleSeeAllPress = () => {
    console.log('See all reminders pressed');
    if (onSeeAllPress) {
      onSeeAllPress();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Reminders</Text>
        </View>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Reminders</Text>
        </View>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Reminders</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No reminders available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Daily Reminders</Text>
        <TouchableOpacity
          onPress={handleSeeAllPress}
          style={styles.seeAllButton}
          activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.remindersContainer}>
        <FlatList
          data={reminders}
          renderItem={({item}) => (
            <ReminderCard item={item} onPress={handleReminderPress} />
          )}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.remindersList}
          snapToAlignment="start"
          decelerationRate="normal"
          snapToInterval={CARD_WIDTH + 8}
          pagingEnabled={false}
        />
      </View>

      <Text style={styles.quoteText}>
        "Remind, indeed reminders benefit the believers"
      </Text>
      <Text style={styles.quoteSource}>(Quran 51:55)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 120,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  seeAllButton: {
    padding: 8,
    borderRadius: 6,
  },
  seeAllText: {
    ...typography.bodyMedium,
    color: colors.primary,
    textAlign: 'left',
    fontWeight: '600',
  },
  remindersContainer: {
    marginBottom: 20,
  },
  remindersList: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  reminderCard: {
    width: CARD_WIDTH,
    height: 180,
    marginRight: 0, // Reduced margin for closer spacing
    borderRadius: 15,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  reminderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  quoteText: {
    ...typography.bodyMedium,
    color: colors.primary,
    textAlign: 'right',
    marginTop: 10,
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
