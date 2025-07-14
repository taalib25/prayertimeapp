import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Pressable,
} from 'react-native';
import BadgeCard from '../components/BadgeCard';
import MenuButton from '../components/MenuButton';
import SvgIcon from '../components/SvgIcon';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import {CompactChallengeCard} from '../components/MonthViewComponent/CompactChallengeCard';
import {useAuth} from '../contexts/AuthContext';
import {useUser} from '../hooks/useUser';
import ImageService from '../services/ImageService';
import AlertModal from '../components/AlertModel';
import {useFocusEffect} from '@react-navigation/native';
import withObservables from '@nozbe/with-observables';
import database from '../services/db';
import DailyTasksModel from '../model/DailyTasks';
import {Q} from '@nozbe/watermelondb';
import {getTodayDateString} from '../utils/helpers';

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  isEarned: boolean;
  category: string;
}

interface ProfileScreenProps {
  navigation: any;
  dailyTasks: DailyTasksModel[];
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  navigation,
  dailyTasks,
}) => {
  const {logout} = useAuth();
  const {user, userInitials, refresh} = useUser();

  // Helper function to calculate consecutive Fajr streak at mosque
  const calculateFajrStreak = useCallback(
    (dailyTasks: DailyTasksModel[]): number => {
      if (!dailyTasks || dailyTasks.length === 0) return 0;

      // Sort tasks by date in descending order (newest first)
      const sortedTasks = [...dailyTasks].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      let streak = 0;

      // Count consecutive Fajr mosque prayers from today backwards
      for (const task of sortedTasks) {
        if (task.fajrStatus === 'mosque') {
          streak++;
        } else {
          // Break on first non-mosque day (including null, 'home', 'none')
          break;
        }
      }

      return streak;
    },
    [],
  );
  // Replace useBadgeCalculation with direct badge calculation
  const badgeData = useMemo(() => {
    // Calculate Challenge 40 badge (40+ consecutive Fajr at mosque)
    const fajrMosqueStreak = calculateFajrStreak(dailyTasks);
    const challenge40Earned = fajrMosqueStreak >= 40;

    // Calculate Zikr Star badge (200+ zikr count in a single day)
    const maxDailyZikrCount = Math.max(
      ...dailyTasks.map(task => task.totalZikrCount || 0),
      0,
    );
    const zikrStarEarned = maxDailyZikrCount >= 200;

    // Highlight Recite Master badge if Quran recited today
    const today = getTodayDateString();
    const todayTask = dailyTasks.find(task => task.date === today);
    const reciteMasterEarned = (todayTask?.quranMinutes || 0) > 0;

    const badges: Badge[] = [
      {
        id: '1',
        title: 'Challenge 40',
        description: 'Completed 40+ consecutive Fajr prayers at mosque',
        icon: 'mosque',
        isEarned: challenge40Earned,
        category: 'prayer',
      },
      {
        id: '2',
        title: 'Zikr Star',
        description: 'Completed 200+ zikr count in a single day',
        icon: 'prayer-beads',
        isEarned: zikrStarEarned,
        category: 'zikr',
      },
      {
        id: '3',
        title: 'Recite Master',
        description: 'Recited Quran today',
        icon: 'quran',
        isEarned: reciteMasterEarned,
        category: 'quran',
      },
    ];

    const earnedBadges = badges.filter(badge => badge.isEarned).length;
    const totalBadges = badges.length;

    return {
      badges,
      earnedBadges,
      totalBadges,
    };
  }, [dailyTasks]);

  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const imageService = ImageService.getInstance();

  const isLoading = false;
  const error = null;
  // AlertModal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Refresh user data when screen is focused
  useFocusEffect(
    useCallback(() => {
      refresh?.();
    }, [refresh]),
  );

  useEffect(() => {
    loadProfileImage();
  }, [user?.id, user?.profileImage]);

  const loadProfileImage = async () => {
    if (user?.id) {
      // First check if user has profileImage in data
      if (user.profileImage) {
        setProfileImageUri(user.profileImage);
        return;
      }

      // Otherwise check AsyncStorage
      const savedUri = await imageService.getImageUri(user.id);
      if (savedUri) {
        setProfileImageUri(savedUri);
      }
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfileScreen');
  };

  const handleNotificationSettings = () => {
    navigation.navigate('NotificationScreen');
  };
  const handleCallerSettings = () => {
    navigation.navigate('CallerSettings');
  };

  const handlePickupSettings = () => {
    navigation.navigate('PickupSettings');
  };

  const handleDatabaseView = () => {
    navigation.navigate('DatabaseScreen');
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile data</Text>
        <TouchableOpacity
          onPress={() => {
            // Refresh by calling the hook again
          }}
          style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {profileImageUri ? (
              <Image
                source={{uri: profileImageUri}}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>{userInitials}</Text>
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName || user?.username}
            </Text>
            <Text style={styles.memberSince}>
              {user?.joinedDate
                ? `Member Since ${new Date(user.joinedDate).toLocaleDateString(
                    'en',
                    {month: 'short', year: 'numeric'},
                  )}`
                : ''}
            </Text>
            {user?.mosqueName && (
              <View style={styles.locationContainer}>
                <SvgIcon name="masjid" size={32} color="#4CAF50" />
                <Text style={styles.locationText}>
                  {user.mosqueName || 'Masjid Ul Haram'}
                </Text>
              </View>
            )}
          </View>
        </View>
        {/* Badges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Badges{' '}
              <Text style={{color: colors.primary}}>
                {badgeData.earnedBadges}
              </Text>
              /{badgeData.totalBadges}
            </Text>
      
          </View>
          <View style={styles.badgesCard}>
            <View style={styles.badgesContainer}>
              {badgeData.badges.map((badge: any) => (
                <BadgeCard
                  key={badge.id}
                  icon={badge.icon as any}
                  title={badge.title}
                  isEarned={badge.isEarned}
                />
              ))}
            </View>
          </View>
        </View>
        {/* <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Statistics</Text>
          </View>
          <View style={styles.statisticsGrid}>
            <CompactChallengeCard
              id="zikr-goal"
              title="Zikr"
              current={Math.floor((user?.zikriGoal || 600) * 0.6)} // Mock current progress
              total={user?.zikriGoal || 600}
              backgroundColor="#FCE4EC"
              progressColor="#E91E63"
              textColor={colors.text.prayerBlue}
              isVisible={true}
            />
            <CompactChallengeCard
              id="quran-goals"
              title="Quran"
              current={Math.floor((user?.quranGoal || 300) * 0.4)} // Mock current progress
              total={user?.quranGoal || 300}
              backgroundColor="#E0F2F1"
              progressColor="#4CAF50"
              textColor={colors.text.prayerBlue}
              isVisible={true}
            />
            <CompactChallengeCard
              id="Fajr"
              title="Fajr"
              current={18} // Mock current progress for this month
              total={30}
              backgroundColor="#E0F2F1"
              progressColor="#4CAF50"
              textColor={colors.text.prayerBlue}
              isVisible={true}
            />
            <CompactChallengeCard
              id="quran-goal"
              title="Isha"
              current={Math.floor(23)} // Mock current progress
              total={30}
              backgroundColor="#E0F2F1"
              progressColor="#CAAF50"
              textColor={colors.text.prayerBlue}
              isVisible={true}
            />
          </View>
        </View> */}
        {/* Menu Section */}
        <View style={styles.menuSection}>
          <MenuButton title="Edit Information" onPress={handleEditProfile} />
          {/* <MenuButton
            title="Notification Settings"
            onPress={handleNotificationSettings}
          /> */}
          <MenuButton title="Caller Settings" onPress={handleCallerSettings} />
          {/* Pickup Settings - Available for all users */}
          <MenuButton
            title="Pickup Assistance"
            onPress={handlePickupSettings}
          />
          {/* <MenuButton title="Database Explorer" onPress={handleDatabaseView} /> */}
          {/* Logout fButton */}
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
        <View style={{height: 120}} />
      </ScrollView>
      <AlertModal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
        confirmDestructive={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    paddingTop: 30,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    ...typography.body,
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  errorText: {
    ...typography.body,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    ...typography.button,
    color: '#FFF',
  },
  header: {
    // backgroundColor: colors.background.surface,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    marginLeft: '10%',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    ...typography.headerProfile,
    color: '#333',
    marginBottom: 3,
    textAlign: 'left',
  },
  memberSince: {
    ...typography.bodySmall,
    color: '#666',
    marginBottom: 1,
    textAlign: 'left',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  locationText: {
    ...typography.caption,
    color: '#666',
    paddingTop: 3,
    marginLeft: 8,
    textAlign: 'left',
    width: '70%',
  },
  section: {
    marginBottom: 20,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  menuSection: {
    marginBottom: 20,
    marginTop: 20,
    paddingHorizontal: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.h3,
    color: '#333',
  },
  viewAll: {
    ...typography.bodySmall,
    color: '#4CAF50',
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  badgesCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  seeAllButton: {
    padding: 8,
    borderRadius: 6,
  },
  seeAllText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  // CompactChallengeCard styles from MonthlyTaskSelector
  compactCard: {
    width: '48%',
    aspectRatio: 1.0,
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactTitle: {
    ...typography.h3,
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 6,
  },
  compactSubtitle: {
    ...typography.body,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 4,
  },
  compactProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 8,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryMain,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    ...typography.h2,
    color: colors.white,
  },
  settingsInfo: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  settingItem: {
    ...typography.body,
    marginVertical: 4,
    color: colors.text.secondary,
  },
  compactProgressText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactProgressValue: {
    ...typography.h3,
    textAlign: 'center',
    fontSize: 16,
  },
  compactProgressTotal: {
    ...typography.bodySmall,
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 4,
  },
  logoutText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
});

// Add withObservables enhancement for reactive daily tasks
const enhance = withObservables([], () => ({
  dailyTasks: database
    .get<DailyTasksModel>('daily_tasks')
    .query(Q.sortBy('date', Q.desc))
    .observeWithColumns([
      'date',
      'fajr_status',
      'dhuhr_status',
      'asr_status',
      'maghrib_status',
      'isha_status',
      'total_zikr_count',
      'quran_minutes',
      'special_tasks',
    ]),
}));

export default enhance(ProfileScreen);
