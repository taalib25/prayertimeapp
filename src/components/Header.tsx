import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import SvgIcon from './SvgIcon';
import {useUser} from '../hooks/useUser';
import {useFocusEffect} from '@react-navigation/native';
import ImageService from '../services/ImageService';
import moment from 'moment-hijri';

const Header: React.FC = () => {
  const {userInitials, user, refresh} = useUser();
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  const imageService = ImageService.getInstance();

  // Refresh user data when screen is focused
  useFocusEffect(
    useCallback(() => {
      refresh?.();
    }, [refresh]),
  );

  // Load profile image on component mount
  useEffect(() => {
    loadProfileImage();
    console.log('Profile image loaded:', moment());
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

  return (
    <View style={styles.container}>
      {/* Background PNG */}
      <Image
        source={require('../assets/images/profileSection2.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Location Bar */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.locationBar}>
            <SvgIcon
              name="map"
              size={12}
              color="#fff"
              style={styles.locationIcon}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {user?.address || 'Colombo,LK'}
            </Text>
            <View style={styles.chevronIcon} />
          </TouchableOpacity>
          <Text style={styles.dateText} numberOfLines={1}>
            {moment().locale('en').format('iDD iMMMM iYYYY')}
          </Text>
        </View>
        {/* User Info */}
        <View style={styles.userContainer}>
          <View style={styles.avatar}>
            {profileImageUri ? (
              <Image
                source={{uri: profileImageUri}}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{userInitials || 'U'}</Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.greeting} numberOfLines={1}>
              Assalamu Alaikum!
            </Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.firstName ||
                user?.fullName?.split(' ')[0] ||
                user?.username?.split(' ')[0] ||
                'Ahmed'}
            </Text>
            <Text style={styles.welcomeBack} numberOfLines={1}>
              ID: {user?.memberId || '1001'}
            </Text>
          </View>
        </View>
        <View style={styles.underline} />
        {/* Mosque Info - Only show if mosqueName is provided */}
        {user?.mosqueName && (
          <View style={styles.mosqueContainer}>
            <SvgIcon
              name="masjid"
              size={34}
              color={colors.accent}
              style={styles.mosqueIcon}
            />
            <View style={styles.mosqueTextContainer}>
              <Text style={styles.mosqueName} numberOfLines={2}>
                {user?.mosqueName || 'Al-Masjid Al-Haram'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.background.overlay,
    height: '20%',
    width: '20%',
    aspectRatio: 1,
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
  },
  avatarText: {
    ...typography.h3,
    color: '#fff',
  },
  container: {
    // height: 230,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: -12,
    marginTop: 24,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 16,
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
    width: '100%',
    paddingRight: 60, // Add padding to avoid right-side image
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.dark,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    maxWidth: '55%', // Reduce from 65% to ensure spacing
  },
  locationIcon: {
    marginRight: 6,
  },
  locationText: {
    ...typography.body,
    color: '#fff',
    marginRight: 6,
    fontSize: 14,
    flexShrink: 1,
    maxWidth: 120,
  },
  dateText: {
    ...typography.bodyMedium,
    color: '#fff',
    fontSize: 16,
    marginLeft: 14,
    justifyContent: 'flex-start',
  },
  chevronIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginLeft: 2,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
    width: '100%',
    paddingRight: 80, // Add padding to avoid right-side image
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
    width: '90%', // Use percentage-based width
  },
  greeting: {
    ...typography.h3,
    color: colors.text.dark,
    flexShrink: 1,
    fontSize: 20,
    width: '100%', // Use percentage-based width
  },
  userName: {
    ...typography.h2,
    color: '#fff',
    marginBottom: 1,
    flexShrink: 1,
    width: '100%', // Use percentage-based width
  },
  welcomeBack: {
    ...typography.bodyTiny,
    color: colors.text.primary,
    flexShrink: 1,
    width: '100%', // Use percentage-based width
  },
  underline: {
    height: 1.5,
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: '60%',
    borderRadius: 1,
  },
  mosqueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    // marginTop: -4,
    width: '85%',
    paddingRight: 60,
  },
  mosqueIcon: {
    marginRight: 12,
    marginTop: -5,
  },
  mosqueTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  mosqueName: {
    ...typography.bodyMedium,
    fontSize: 14,
    color: colors.text.dark,
    //
    lineHeight: 16,
  },
  // mosqueLocation: {
  //   ...typography.bodyTiny,
  //   color: colors.background.surface,
  //   lineHeight: 16,
  // },
});

export default Header;
