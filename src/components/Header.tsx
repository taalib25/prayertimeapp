import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {typography} from '../utils/typography';
import SvgIcon from './SvgIcon';

interface HeaderProps {
  location: string;
  userName: string;
  mosqueName: string;
  mosqueLocation: string;
}

const Header: React.FC<HeaderProps> = ({
  location,
  userName,
  mosqueName,
  mosqueLocation,
}) => {
  return (
    <View style={styles.container}>
      {/* Background PNG instead of SVG */}
      <Image
        source={require('../assets/images/profileSection.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Location Bar */}
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

        {/* User Info */}
        <View style={styles.userContainer}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Assalamu Alaikum!</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.welcomeBack}>Welcome Back!</Text>
          </View>
        </View>

        {/* Mosque Info */}
        <View style={styles.mosqueContainer}>
          <SvgIcon
            name="masjid"
            size={24}
            color="#42D0D3"
            style={styles.mosqueIcon}
          />
          <View>
            <Text style={styles.mosqueName}>{mosqueName}</Text>
            <Text style={styles.mosqueLocation}>{mosqueLocation}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 230,
    position: 'relative',
    overflow: 'hidden',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
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
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    ...typography.body,
    color: '#5CE5D5',
    marginBottom: 4,
  },
  userName: {
    ...typography.h2,
    color: '#fff',
    marginBottom: 4,
  },
  welcomeBack: {
    ...typography.body,
    color: '#B3B8D3',
  },
  mosqueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 78, 141, 0.5)',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    width: '100%',
  },
  mosqueIcon: {
    marginRight: 10,
  },
  mosqueName: {
    ...typography.bodyMedium,
    color: '#fff',
  },
  mosqueLocation: {
    ...typography.caption,
    color: '#B3B8D3',
  },
});

export default Header;
