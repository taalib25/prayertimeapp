import React, {useState, useEffect, useMemo} from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import BadgeCard from '../components/BadgeCard';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import MenuButton from '../components/MenuButton';
import SvgIcon from '../components/SvgIcon';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import {CompactChallengeCard} from '../components/PrayerWidgets/MonthlyTaskSelector';

// CompactChallengeCard component extracted from MonthlyTaskSelector
// const CompactChallengeCard: React.FC<{
//   id: string;
//   title: string;
//   subtitle: string;
//   current: number;
//   total: number;
//   backgroundColor: string;
//   progressColor: string;
//   textColor: string;
//   isVisible: boolean;
// }> = React.memo(
//   ({
//     title,
//     subtitle,
//     current,
//     total,
//     backgroundColor,
//     progressColor,
//     textColor,
//     isVisible,
//   }) => {
//     const exceededGoal = current > total;
//     const actualProgressColor = exceededGoal ? colors.success : progressColor;

//     // Calculate progress percentage
//     const progressPercentage = useMemo(() => {
//       const percentage = exceededGoal
//         ? 100
//         : Math.min((current / total) * 100, 100);
//       return Math.round(percentage);
//     }, [current, total, exceededGoal]);

//     return (
//       <View style={[styles.compactCard, {backgroundColor}]}>
//         <Text style={[styles.compactTitle, {color: textColor}]}>{title}</Text>

//         <View style={styles.compactProgressContainer}>
//           <AnimatedCircularProgress
//             size={160}
//             width={14}
//             fill={progressPercentage}
//             tintColor={actualProgressColor}
//             backgroundColor={colors.background.surface}
//             rotation={0}
//             lineCap="round"
//             duration={0}>
//             {() => (
//               <View style={styles.compactProgressText}>
//                 <Text
//                   style={[
//                     styles.compactProgressValue,
//                     {color: exceededGoal ? colors.success : textColor},
//                   ]}>
//                   {current}
//                   <Text
//                     style={[
//                       styles.compactProgressTotal,
//                       {color: exceededGoal ? colors.success : textColor},
//                     ]}>
//                     /{total}
//                   </Text>
//                 </Text>
//               </View>
//             )}
//           </AnimatedCircularProgress>
//         </View>

//         <Text style={[styles.compactSubtitle, {color: textColor}]}>
//           {subtitle}
//         </Text>
//       </View>
//     );
//   },
// );

interface ProfileScreenProps {
  navigation: any;
}

interface UserProfile {
  username: string;
  email: string;
  profileImage?: string;
  memberSince: string;
  location: string;
  masjid: string;
}

interface UserStats {
  fajrCount: number;
  ishaCount: number;
  zikriCount: number;
  quranMinutes: number;
  badges: Array<{
    id: string;
    title: string;
    icon: string;
    isEarned: boolean;
  }>;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({navigation}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      // Load user profile data
      const profileData = await AsyncStorage.getItem('userProfile');
      const statsData = await AsyncStorage.getItem('userStats');

      if (profileData) {
        setUserProfile(JSON.parse(profileData));
      } else {
        // Set default user data if none exists
        const defaultProfile: UserProfile = {
          username: 'Mohamed Hijaz',
          email: 'mohamed.hijaz@example.com',
          memberSince: 'Sep 2024',
          location: 'Gothatuwa',
          masjid: 'Masjid Ul Jabbar Jumma Masjid',
        };
        setUserProfile(defaultProfile);
        await AsyncStorage.setItem(
          'userProfile',
          JSON.stringify(defaultProfile),
        );
      }

      if (statsData) {
        setUserStats(JSON.parse(statsData));
      } else {
        // Set default stats data if none exists
        const defaultStats: UserStats = {
          fajrCount: 25,
          ishaCount: 20,
          zikriCount: 154,
          quranMinutes: 300,
          badges: [
            {id: '1', title: 'Challenge 40', icon: 'mosque', isEarned: true},
            {id: '2', title: 'Zikr Star', icon: 'prayer-beads', isEarned: true},
            {id: '3', title: 'Recite Master', icon: 'quran', isEarned: false},
          ],
        };
        setUserStats(defaultStats);
        await AsyncStorage.setItem('userStats', JSON.stringify(defaultStats));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userProfile || !userStats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile data</Text>
        <TouchableOpacity onPress={loadUserData} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const earnedBadges = userStats.badges.filter(badge => badge.isEarned).length;
  const totalBadges = userStats.badges.length;
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={
              userProfile.profileImage
                ? {uri: userProfile.profileImage}
                : require('../assets/images/profile.png')
            }
            style={styles.profileImage}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userProfile.username}</Text>
            <Text style={styles.memberSince}>
              Member Since {userProfile.memberSince}
            </Text>
            <View style={styles.locationContainer}>
              <SvgIcon name="masjid" size={30} color="#4CAF50" />
              <Text style={styles.locationText}>
                {userProfile.masjid}
                {'\n'}
                {userProfile.location}
              </Text>
            </View>
          </View>
        </View>
        {/* Badges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Badges <Text style={{color: colors.primary}}>{earnedBadges}</Text>
              /{totalBadges}
            </Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesCard}>
            <View style={styles.badgesContainer}>
              {userStats.badges.map(badge => (
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
        {/* Statistics Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Statistics</Text>
          </View>
          <View style={styles.statisticsGrid}>
            <CompactChallengeCard
              id="fajr-ring"
              title="Fajr"
              current={userStats.fajrCount}
              total={30}
              backgroundColor="#E0F7FA"
              progressColor="#00BCD4"
              textColor={colors.text.prayerBlue}
              isVisible={true}
            />
            <CompactChallengeCard
              id="isha-ring"
              title="Isha"
              current={userStats.ishaCount}
              total={30}
              backgroundColor="#FFF3E0"
              progressColor="#FF9800"
              textColor={colors.text.prayerBlue}
              isVisible={true}
            />
            <CompactChallengeCard
              id="zikr-ring"
              title="Zikr"
              current={userStats.zikriCount}
              total={180}
              backgroundColor="#FCE4EC"
              progressColor="#E91E63"
              textColor={colors.text.prayerBlue}
              isVisible={true}
            />
            <CompactChallengeCard
              id="quran-ring"
              title="Quran"
              current={userStats.quranMinutes}
              total={40}
              backgroundColor="#E0F2F1"
              progressColor="#4CAF50"
              textColor={colors.text.prayerBlue}
              isVisible={true}
            />
          </View>
        </View>
        {/* Menu Section */}
        <View style={styles.section}>
          <MenuButton title="Edit Information" onPress={handleEditProfile} />
          <MenuButton
            title="Notification Settings"
            onPress={handleNotificationSettings}
          />
          <MenuButton title="Caller Settings" onPress={handleCallerSettings} />
        </View>
        <View style={{height: 20}} />
      </ScrollView>
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
    backgroundColor: '#FFF',
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
    backgroundColor: '#FFF',
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
    marginBottom: 4,
    textAlign: 'left',
  },
  memberSince: {
    ...typography.bodySmall,
    color: '#666',
    marginBottom: 8,
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
    marginLeft: 6,
    textAlign: 'left',
  },
  section: {
    marginBottom: 20,
    marginTop: 10,
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
    fontWeight: '600',
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
});

export default ProfileScreen;
