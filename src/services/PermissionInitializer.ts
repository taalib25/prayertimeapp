/**
 * Permission Initializer Service
 * Handles early permission requests for the app
 */

import UnifiedNotificationService from './UnifiedNotificationService';

class PermissionInitializer {
  private static instance: PermissionInitializer;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): PermissionInitializer {
    if (!PermissionInitializer.instance) {
      PermissionInitializer.instance = new PermissionInitializer();
    }
    return PermissionInitializer.instance;
  }

  /**
   * Initialize all app permissions early in the app lifecycle
   */
  async initializeAppPermissions(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔐 Permissions already initialized');
      return;
    }

    try {
      console.log('🚀 Starting app permission initialization...');

      // Initialize notification service and request permissions
      const notificationService = UnifiedNotificationService.getInstance();
      await notificationService.initialize();

      // Get permission status for logging
      const status = await notificationService.getPermissionStatus();
      console.log('📊 Final permission status:', status);

      this.isInitialized = true;
      console.log('✅ App permissions initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing app permissions:', error);
      // Don't throw error, let app continue with limited functionality
      this.isInitialized = true;
    }
  }


  /**
   * Re-initialize permissions if needed
   */
  async refreshPermissions(): Promise<void> {
    this.isInitialized = false;
    await this.initializeAppPermissions();
  }
}

export default PermissionInitializer;
