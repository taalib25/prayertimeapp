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
  Alert,
} from 'react-native';
import BadgeCard from '../components/BadgeCard';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import MenuButton from '../components/MenuButton';
import SvgIcon from '../components/SvgIcon';
import {colors} from '../utils/theme';
import {typography} from '../utils/typography';
import {CompactChallengeCard} from '../components/MonthViewComponent/CompactChallengeCard';
import {useUser} from '../hooks/useUser';
import {useAuth} from '../contexts/AuthContext';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({navigation}) => {
  const {logout} = useAuth();
  const {user, isLoading, error, displayName, userInitials} = useUser();

  const handleEditProfile = () => {
    navigation.navigate('EditProfileScreen');
  };

  const handleNotificationSettings = () => {
    navigation.navigate('NotificationScreen');
  };
  const handleCallerSettings = () => {
    console.log('user >>>>>>>>>>', user);
    navigation.navigate('CallerSettings');
  };

  const handleDatabaseView = () => {
    navigation.navigate('DatabaseScreen');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile data</Text>
        <TouchableOpacity
          onPress={() => {
            // Refresh by calling the hook again
            console.log('Retrying to load user data...');
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
            <Text style={styles.profileImageText}>{userInitials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.memberSince}>Member Since Sep 2024</Text>
            <View style={styles.locationContainer}>
              <SvgIcon name="masjid" size={32} color="#4CAF50" />
              <Text style={styles.locationText}>
                {user.masjid || 'Local Mosque'}
              </Text>
            </View>
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly Goals</Text>
          </View>
          <View style={styles.statisticsGrid}>
            <CompactChallengeCard
              id="zikr-goal"
              title="Zikr Goal"
              current={Math.floor(user.zikriGoal * 0.6)} // Mock current progress
              total={user.zikriGoal}
              backgroundColor="#FCE4EC"
              progressColor="#E91E63"
              textColor={colors.text.prayerBlue}
              isVisible={true}
            />
            <CompactChallengeCard
              id="quran-goal"
              title="Quran Goal"
              current={Math.floor(user.quranGoal * 0.4)} // Mock current progress
              total={user.quranGoal}
              backgroundColor="#E0F2F1"
              progressColor="#4CAF50"
              textColor={colors.text.prayerBlue}
              isVisible={true}
            />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>
          <View style={styles.settingsInfo}>
            <Text style={styles.settingItem}>Location: {user.location}</Text>
            <Text style={styles.settingItem}>Theme: {user.theme}</Text>
            <Text style={styles.settingItem}>Language: {user.language}</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <MenuButton title="Edit Information" onPress={handleEditProfile} />
          <MenuButton
            title="Notification Settings"
            onPress={handleNotificationSettings}
          />
          <MenuButton title="Caller Settings" onPress={handleCallerSettings} />
          <MenuButton title="Database Explorer" onPress={handleDatabaseView} />

          {/* Logout Button */}
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
        <View style={{height: 120}} />
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
    width: '70%',
  },
  section: {
    marginBottom: 20,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  menuSection: {
    marginBottom: 20,
    marginTop: 101,
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
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileImageText: {
    ...typography.h2,
    color: colors.white,
    fontWeight: 'bold',
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

export default ProfileScreen;
