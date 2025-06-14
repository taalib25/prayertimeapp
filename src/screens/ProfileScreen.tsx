import React, {useState, useEffect} from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BadgeCard from '../components/BadgeCard';
import StatisticRing from '../components/StatisticRing';
import MenuButton from '../components/MenuButton';
import SvgIcon from '../components/SvgIcon';
import {colors} from '../utils/theme';

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
            {id: '1', title: 'Challenge 40', icon: 'salah', isEarned: true},
            {id: '2', title: 'Zikr Star', icon: 'prayer-beads', isEarned: true},
            {id: '3', title: 'Recite Master', icon: 'profile', isEarned: false},
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
    navigation.navigate('EditProfile');
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
              <SvgIcon name="masjid" size={16} color="#4CAF50" />
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
          <View style={styles.badgesCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Badges {earnedBadges}/{totalBadges}
              </Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
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
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statisticsGrid}>
            <StatisticRing
              title="FAJR Ring"
              current={userStats.fajrCount}
              total={30}
              color="#00BCD4"
              backgroundColor="#E0F7FA"
            />
            <StatisticRing
              title="ISHA Ring"
              current={userStats.ishaCount}
              total={30}
              color="#00BCD4"
              backgroundColor="#FFF3E0"
            />
            <StatisticRing
              title="ZIKR Ring"
              current={userStats.zikriCount}
              total={18000}
              color="#00BCD4"
              backgroundColor="#FCE4EC"
            />
            <StatisticRing
              title="Quran Ring"
              current={userStats.quranMinutes}
              total={450}
              color="#00BCD4"
              backgroundColor="#E0F2F1"
              unit="min"
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
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
    fontSize: 16,
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
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    lineHeight: 16,
    flex: 1,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAll: {
    fontSize: 14,
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
  },
});

export default ProfileScreen;
