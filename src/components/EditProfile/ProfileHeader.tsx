import React from 'react';
import {View, Text, Pressable, Image, StyleSheet, Alert} from 'react-native';
import SvgIcon from '../SvgIcon';
import {colors, spacing} from '../../utils/theme';
import {typography} from '../../utils/typography';
import {useAppUser} from '../../hooks/useUnifiedUser';

const ProfileHeader: React.FC = () => {
  const {profile, displayName} = useAppUser();

  const handleProfilePictureUpdate = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => {
            Alert.alert('Camera', 'Camera functionality will be implemented');
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            Alert.alert('Gallery', 'Gallery functionality will be implemented');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {cancelable: true},
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={
            profile?.profileImage
              ? {uri: profile.profileImage}
              : require('../../assets/images/profile.png')
          }
          style={styles.profileImage}
        />
        <Pressable
          style={({pressed}) => [
            styles.cameraButton,
            pressed && styles.pressedState,
          ]}
          onPress={handleProfilePictureUpdate}>
          <SvgIcon name="camera" size={30} color={colors.white} />
        </Pressable>
      </View>
      <Text style={styles.profileName}>{displayName}</Text>
      <Text style={styles.memberSince}>
        Member Since {profile?.memberSince || 'Recently'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.light,
  },
  profileName: {
    ...typography.headerProfile,
    color: colors.text.dark,
    marginBottom: 4,
  },
  memberSince: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 1,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedState: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
});

export default ProfileHeader;
