import React, {useState, useEffect} from 'react';
import {View, Text, Pressable, Image, StyleSheet, Alert} from 'react-native';
import SvgIcon from '../SvgIcon';
import {colors, spacing} from '../../utils/theme';
import {typography} from '../../utils/typography';
import {useUser} from '../../hooks/useUser';
import ImageService, {ImagePickerResult} from '../../services/ImageService';

const ProfileHeader: React.FC = () => {
  const {user, displayName, userInitials, updateUser} = useUser();
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const imageService = ImageService.getInstance();

  // Load saved profile image on component mount
  useEffect(() => {
    loadProfileImage();
  }, [user?.id]);

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
        // Update user data with the saved image
        await updateUser({profileImage: savedUri});
      }
    }
  };

  const handleImageSelection = async (result: ImagePickerResult) => {
    if (!result.success || !result.uri || !user?.id) {
      if (result.error && result.error !== 'User cancelled') {
        Alert.alert('Error', result.error);
      }
      return;
    }

    try {
      setIsLoading(true);

      // Validate the image
      const validation = imageService.validateImage(
        result.uri,
        result.fileSize,
      );
      if (!validation.valid) {
        Alert.alert('Invalid Image', validation.error);
        return;
      }

      // Save image URI
      await imageService.saveImageUri(result.uri, user.id);

      // Update local state
      setProfileImageUri(result.uri);

      // Update user data
      await updateUser({profileImage: result.uri});

      console.log('✅ Profile image updated successfully');
    } catch (error) {
      console.error('❌ Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraOption = async () => {
    try {
      setIsLoading(true);
      const result = await imageService.takePhoto();
      await handleImageSelection(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGalleryOption = async () => {
    try {
      setIsLoading(true);
      const result = await imageService.selectFromGallery();
      await handleImageSelection(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureUpdate = () => {
    if (isLoading) return;

    imageService.showImagePickerOptions(
      handleCameraOption,
      handleGalleryOption,
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {profileImageUri ? (
          <Image
            source={{uri: profileImageUri}}
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileImageText}>{userInitials}</Text>
          </View>
        )}

        <Pressable
          style={({pressed}) => [
            styles.cameraButton,
            pressed && styles.pressedState,
            isLoading && styles.loadingState,
          ]}
          onPress={handleProfilePictureUpdate}
          disabled={isLoading}>
          <SvgIcon
            name="camera"
            size={30}
            color={isLoading ? colors.text.muted : colors.white}
          />
        </Pressable>
      </View>
      <Text style={styles.profileName}>{displayName}</Text>
      {user?.joinedDate && (
        <Text style={styles.memberSince}>
          Member Since{' '}
          {new Date(user.joinedDate).toLocaleDateString('en', {
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      )}
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
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    ...typography.h2,
    color: colors.white,
    fontWeight: 'bold',
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
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pressedState: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
  loadingState: {
    opacity: 0.6,
  },
});

export default ProfileHeader;
