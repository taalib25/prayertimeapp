import {Platform, PermissionsAndroid, Alert} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Image Service for handling profile picture uploads
 * Follows best practices for image handling and storage
 * Supports backward compatibility with Android API < 30
 */

export interface ImagePickerResult {
  success: boolean;
  uri?: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
  error?: string;
}

class ImageService {
  private static instance: ImageService;

  static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  /**
   * Default image picker options with optimization and backward compatibility
   */
  private getImagePickerOptions() {
    const baseOptions = {
      mediaType: 'photo' as MediaType,
      includeBase64: false, // Avoid base64 for performance
      maxHeight: 800, // Optimize for profile pictures
      maxWidth: 800,
      quality: 0.8, // Good balance between quality and file size
      selectionLimit: 1,
      includeExtra: false, // Reduce unnecessary data
    };

    // Merge with device-specific options
    const deviceOptions = this.getDeviceSpecificOptions();
    return {...baseOptions, ...deviceOptions};
  }

  /**
   * Request camera permission on Android with enhanced compatibility
   */
  private async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs camera access to take profile pictures.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Camera permission error:', err);
        return false;
      }
    }
    return true; // iOS permissions are handled via Info.plist
  }

  /**
   * Request storage permission for Android < 30
   */
  private async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'android' && Platform.Version < 30) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs storage access to save profile pictures.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Storage permission error:', err);
        return false;
      }
    }
    return true; // Not needed for Android 30+ or iOS
  }

  /**
   * Take photo using camera with enhanced permission handling
   */
  async takePhoto(): Promise<ImagePickerResult> {
    try {
      // Request both camera and storage permissions
      const hasCameraPermission = await this.requestCameraPermission();
      if (!hasCameraPermission) {
        return {
          success: false,
          error: 'Camera permission denied',
        };
      }

      const hasStoragePermission = await this.requestStoragePermission();
      if (!hasStoragePermission) {
        return {
          success: false,
          error: 'Storage permission denied',
        };
      }

      return new Promise(resolve => {
        launchCamera(
          this.getImagePickerOptions(),
          (response: ImagePickerResponse) => {
            resolve(this.handleImagePickerResponse(response));
          },
        );
      });
    } catch (error) {
      console.error('Camera launch error:', error);
      return {
        success: false,
        error: 'Failed to launch camera',
      };
    }
  }

  /**
   * Select photo from gallery with enhanced permission handling
   */
  async selectFromGallery(): Promise<ImagePickerResult> {
    try {
      // Check storage permission for Android < 30
      const hasStoragePermission = await this.requestStoragePermission();
      if (!hasStoragePermission) {
        return {
          success: false,
          error: 'Storage permission denied',
        };
      }

      return new Promise(resolve => {
        launchImageLibrary(
          this.getImagePickerOptions(),
          (response: ImagePickerResponse) => {
            resolve(this.handleImagePickerResponse(response));
          },
        );
      });
    } catch (error) {
      console.error('Gallery launch error:', error);
      return {
        success: false,
        error: 'Failed to launch gallery',
      };
    }
  }

  /**
   * Handle image picker response with enhanced validation
   */
  private handleImagePickerResponse(
    response: ImagePickerResponse,
  ): ImagePickerResult {
    if (response.didCancel) {
      return {
        success: false,
        error: 'User cancelled',
      };
    }

    if (response.errorMessage) {
      return {
        success: false,
        error: response.errorMessage,
      };
    }

    if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];

      // Enhanced validation for better backward compatibility
      if (!asset.uri) {
        return {
          success: false,
          error: 'No image URI received',
        };
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (asset.fileSize && asset.fileSize > maxSize) {
        return {
          success: false,
          error: 'Image too large. Please select an image under 5MB.',
        };
      }

      // Additional validation for file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (asset.type && !validTypes.includes(asset.type.toLowerCase())) {
        return {
          success: false,
          error: 'Invalid image format. Please use JPG, PNG, or WebP.',
        };
      }

      return {
        success: true,
        uri: asset.uri,
        fileName: asset.fileName || `profile_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
        fileSize: asset.fileSize || 0,
      };
    }

    return {
      success: false,
      error: 'No image selected',
    };
  }

  /**
   * Save image URI to user preferences with enhanced error handling
   */
  async saveImageUri(imageUri: string, userId: number): Promise<void> {
    try {
      const key = this.getCacheKey(userId);
      const imageData = {
        uri: imageUri,
        timestamp: Date.now(),
        version: '2.0',
      };

      await AsyncStorage.setItem(key, JSON.stringify(imageData));
      console.log('✅ Image URI saved for user:', userId);

      // Clean up old cache format if it exists
      const oldKey = `profile_image_${userId}`;
      await AsyncStorage.removeItem(oldKey);
    } catch (error) {
      console.error('❌ Error saving image URI:', error);
      throw new Error('Failed to save image');
    }
  }

  /**
   * Get saved image URI for user with fallback to old format
   */
  async getImageUri(userId: number): Promise<string | null> {
    try {
      // Try new format first
      const newKey = this.getCacheKey(userId);
      const newData = await AsyncStorage.getItem(newKey);

      if (newData) {
        const imageData = JSON.parse(newData);
        return imageData.uri || null;
      }

      // Fallback to old format for backward compatibility
      const oldKey = `profile_image_${userId}`;
      const oldData = await AsyncStorage.getItem(oldKey);

      if (oldData) {
        // Migrate to new format
        await this.saveImageUri(oldData, userId);
        return oldData;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting image URI:', error);
      return null;
    }
  }

  /**
   * Delete saved image URI with cleanup of both formats
   */
  async deleteImageUri(userId: number): Promise<void> {
    try {
      const newKey = this.getCacheKey(userId);
      const oldKey = `profile_image_${userId}`;

      await Promise.all([
        AsyncStorage.removeItem(newKey),
        AsyncStorage.removeItem(oldKey),
      ]);

      console.log('✅ Image URI deleted for user:', userId);
    } catch (error) {
      console.error('❌ Error deleting image URI:', error);
    }
  }

  /**
   * Show image picker action sheet
   */
  showImagePickerOptions(onCamera: () => void, onGallery: () => void): void {
    Alert.alert(
      'Select Profile Picture',
      'Choose how you want to select your profile picture',
      [
        {
          text: 'Camera',
          onPress: onCamera,
        },
        {
          text: 'Gallery',
          onPress: onGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {cancelable: true},
    );
  }

  /**
   * Validate image file with enhanced checks
   */
  validateImage(
    uri: string,
    fileSize?: number,
  ): {valid: boolean; error?: string} {
    if (!uri) {
      return {valid: false, error: 'No image selected'};
    }

    // Check file size (max 5MB)
    if (fileSize && fileSize > 5 * 1024 * 1024) {
      return {valid: false, error: 'Image too large. Maximum size is 5MB.'};
    }

    // Check file extension with better validation
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const uriLower = uri.toLowerCase();
    const hasValidExtension = validExtensions.some(
      ext => uriLower.includes(`.${ext}`) || uriLower.includes(`%2E${ext}`),
    );

    if (!hasValidExtension) {
      return {
        valid: false,
        error: 'Invalid image format. Use JPG, PNG, or WebP.',
      };
    }

    return {valid: true};
  }

  /**
   * Get optimized cache key for user images
   */
  private getCacheKey(userId: number): string {
    return `profile_image_v2_${userId}`;
  }

  /**
   * Check if device supports latest image picker features
   */
  private supportsModernImagePicker(): boolean {
    return (
      Platform.OS === 'ios' ||
      (Platform.OS === 'android' && Platform.Version >= 30)
    );
  }

  /**
   * Get device-specific image picker options
   */
  private getDeviceSpecificOptions() {
    const baseOptions: any = {};

    if (Platform.OS === 'android') {
      if (Platform.Version < 30) {
        // For older Android versions, use legacy storage
        baseOptions.storageOptions = {
          skipBackup: true,
          path: 'images',
          privateDirectory: true,
        };
      } else {
        // For Android 30+, use scoped storage
        baseOptions.includeExtra = false;
      }
    }

    return baseOptions;
  }
}

export default ImageService;
