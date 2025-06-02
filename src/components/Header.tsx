import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {typography} from '../utils/typography';
import {colors} from '../utils/theme';
import SvgIcon from './SvgIcon';

interface HeaderProps {
  location: string;
  userName: string;
  mosqueName: string;
  mosqueLocation: string;
  avatarImage?: any; // Optional local image path
}

const Header: React.FC<HeaderProps> = ({
  location,
  userName,
  mosqueName,
  mosqueLocation,
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

        <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16, marginTop: 8}}>
          <TouchableOpacity style={styles.locationBar}>
            <SvgIcon
              name="map"
              size={12}
              color="#fff"
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>{location}</Text>
            <View style={styles.chevronIcon} />
          </TouchableOpacity>
          <Text style={{...typography.body, color: '#fff', fontSize: 14,marginLeft:14,justifyContent: 'flex-end'}}>
            {new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }).replace(',', '')}
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
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Assalamu Alaikum!</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.welcomeBack}>Welcome Back!</Text>
          </View>
        </View>
        <View style={styles.underline} />
        {/* Mosque Info */}{' '}
        <View style={styles.mosqueContainer}>
          <SvgIcon
            name="masjid"
            size={34}
            color={colors.accent}
            style={styles.mosqueIcon}
          />
          <Text style={styles.mosqueName}>
            {mosqueName}, {mosqueLocation}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    height: 60,
    width: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    ...typography.h3,
    color: '#fff',
    fontWeight: '700',
  },
  container: {
    height: 230,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 14,
    marginTop: 10,
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
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.dark,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  locationIcon: {
    marginRight: 6,
  },
  locationText: {
    ...typography.body,
    color: '#fff',
    marginRight: 6,
    fontSize: 14,
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
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    ...typography.h3,
    color: colors.text.dark,
  },
  userName: {
    ...typography.headerProfile,
    color: '#fff',
    marginBottom: 1,
  },
  underline: {
    height: 1.5,
    marginTop: 4,
    backgroundColor: colors.white,
    width: '60%',
    borderRadius: 1,
  },
  welcomeBack: {
    ...typography.bodyTiny,
    color: colors.text.secondary,
  },
  mosqueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: -4,
    width: '100%',
  },
  mosqueIcon: {
    marginRight: 12,
  },
  mosqueName: {
    ...typography.bodySmall,
    color: colors.text.dark,
    width: '55%',
  },
});

export default Header;
