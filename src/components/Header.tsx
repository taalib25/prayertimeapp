import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import SvgIcon from './SvgIcon';

interface HeaderProps {
  location?: string;
  userName?: string;
  mosqueName?: string;
  mosqueLocation?: string;
  avatarImage?: any;
}

const Header: React.FC<HeaderProps> = ({
  location = 'Colombo, Sri Lanka',
  userName = 'User',
  mosqueName = 'Local Mosque',
  avatarImage,
}) => {
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
              {location}
            </Text>
            <View style={styles.chevronIcon} />
          </TouchableOpacity>
          <Text style={styles.dateText} numberOfLines={1}>
            {new Date()
              .toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
              .replace(',', '')}
          </Text>
        </View>

        {/* User Info */}
        <View style={styles.userContainer}>
          <View style={styles.avatar}>
            {avatarImage ? (
              <Image
                source={avatarImage}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {userName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.greeting} numberOfLines={1}>
              Assalamu Alaikum!
            </Text>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.welcomeBack} numberOfLines={1}>
              Welcome Back!
            </Text>
          </View>
        </View>
        <View style={styles.underline} />

        {/* Mosque Info */}
        <View style={styles.mosqueContainer}>
          <SvgIcon
            name="masjid"
            size={34}
            color={colors.accent}
            style={styles.mosqueIcon}
          />
          <View style={styles.mosqueTextContainer}>
            <Text style={styles.mosqueName} numberOfLines={2}>
              {mosqueName}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    fontWeight: '700',
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
    fontWeight: '500',
  },
  dateText: {
    ...typography.bodyMedium,
    color: '#fff',
    fontSize: 16,
    marginLeft: 14,
    justifyContent: 'flex-start',
    fontWeight: '600',
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
    marginTop:-5,
  },
  mosqueTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  mosqueName: {
    ...typography.bodyMedium,
    fontSize: 14,
    color: colors.text.dark,
    // fontWeight: '600',
    lineHeight: 16,
  },
  // mosqueLocation: {
  //   ...typography.bodyTiny,
  //   color: colors.background.surface,
  //   lineHeight: 16,
  // },
});

export default Header;
