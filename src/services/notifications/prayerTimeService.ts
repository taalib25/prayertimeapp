import { addDays, parseDate, PRAYER_NAMES, createPrayerDateTime, ADVANCE_WARNING_MINUTES } from '../../utils/helpers';
import { YearlyPrayerData, PrayerNotification, PrayerName } from '../../utils/types';
import NotificationService from './notificationServices';

class PrayerTimeService {
  private static yearlyData: YearlyPrayerData | null = null;

  static async loadPrayerData(): Promise<YearlyPrayerData> {
    try {
      if (!this.yearlyData) {
        this.yearlyData = require('../../types/prayer_times.json') as YearlyPrayerData;
        console.log('📖 Prayer data loaded successfully');
      }
      return this.yearlyData;
    } catch (error) {
      console.error('❌ Failed to load prayer data:', error);
      throw error;
    }
  }

// Replace the getUpcomingNotifications method with this:
static async getUpcomingNotifications(daysAhead: number = 2): Promise<PrayerNotification[]> {
  await this.loadPrayerData();
  
  const now = new Date();
  // Start from yesterday to ensure we don't miss today's prayers due to date boundary issues
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 1);
  
  const currentYear = now.getFullYear();
  const endDate = addDays(now, daysAhead);
  const notifications: PrayerNotification[] = [];

  try {
    Object.entries(this.yearlyData!.monthly_prayer_times).forEach(([monthName, monthData]) => {
      monthData.date_ranges.forEach((range) => {
        const rangeStart = parseDate(range.from_date, currentYear);
        const rangeEnd = parseDate(range.to_date, currentYear);

        // Check if this range overlaps with our target date range (starting from yesterday)
        if (rangeStart <= endDate && rangeEnd >= startDate) {
          const actualStart = new Date(Math.max(rangeStart.getTime(), startDate.getTime()));
          const actualEnd = new Date(Math.min(rangeEnd.getTime(), endDate.getTime()));
          
          const daysDiff = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          // Process each day in the overlapping range
          for (let dayOffset = 0; dayOffset < daysDiff; dayOffset++) {
            const currentDate = new Date(actualStart);
            currentDate.setDate(actualStart.getDate() + dayOffset);

            // Schedule notifications for each prayer
            PRAYER_NAMES.forEach((prayer) => {
              const prayerTimeStr = range.times[prayer];
              if (prayerTimeStr) {
                const prayerDateTime = createPrayerDateTime(currentDate, prayerTimeStr);
                const notificationTime = new Date(
                  prayerDateTime.getTime() - (ADVANCE_WARNING_MINUTES * 60 * 1000)
                );

                // Only include if notification time is in the future
                if (notificationTime > now) {
                  notifications.push({
                    id: `${prayer}-prayer-${currentDate.toISOString().split('T')[0]}`,
                    prayer,
                    date: new Date(currentDate),
                    originalTime: new Date(prayerDateTime),
                    notificationTime: new Date(notificationTime),
                  });
                }
              }
            });
          }
        }
      });
    });

    // Sort by notification time
    notifications.sort((a, b) => a.notificationTime.getTime() - b.notificationTime.getTime());
    
    console.log(`📅 Found ${notifications.length} upcoming notifications (starting from yesterday to capture today)`);
    
    // Debug: Log today's notifications specifically
    const today = new Date();
    const todayNotifications = notifications.filter(n => this.isSameDay(n.date, today));
    console.log(`📅 Today's notifications found: ${todayNotifications.length}`);
    todayNotifications.forEach(n => {
      console.log(`   - ${n.prayer}: ${n.originalTime.toLocaleTimeString()} (notification at ${n.notificationTime.toLocaleTimeString()})`);
    });
    
    return notifications;
  } catch (error) {
    console.error('❌ Error getting upcoming notifications:', error);
    throw error;
  }
}

  // Helper method to check if two dates are the same day
  private static isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  static async setupPerpetualChain(): Promise<number> {
    try {
      await NotificationService.initialize();
      const now = new Date();

      console.log(`🚀 Setting up perpetual chain at ${now.toLocaleString()}`);

      // Clear ALL old notifications first
      await NotificationService.clearAllPrayerNotifications();

      // Get all upcoming notifications (including today's remaining prayers)
      const notifications = await this.getUpcomingNotifications(2);
      
      if (notifications.length === 0) {
        console.log('⚠️ No upcoming notifications found');
        return 0;
      }

      const scheduledCount = await NotificationService.batchScheduleNotifications(notifications);

      // Log what was scheduled for today
      const todayNotifications = notifications.filter(n => this.isSameDay(n.date, now));
      console.log(`📅 Scheduled ${todayNotifications.length} notifications for today:`);
      todayNotifications.forEach(n => {
        console.log(`   - ${n.prayer}: ${n.originalTime.toLocaleTimeString()} (reminder at ${n.notificationTime.toLocaleTimeString()})`);
      });

      // Schedule the next refresh trigger (simplified - just use 15 min before last Isha)
      await this.scheduleNextRefreshTrigger(notifications);

      return scheduledCount;
    } catch (error) {
      console.error('❌ Failed to setup perpetual chain:', error);
      throw error;
    }
  }

  // Simplified refresh trigger - just schedule 15 minutes before the last Isha prayer
  static async scheduleNextRefreshTrigger(scheduledNotifications: PrayerNotification[]): Promise<void> {
    try {
      const now = new Date();
      
      // Find the last Isha prayer in our scheduled notifications
      const ishaNotifications = scheduledNotifications.filter(notif => notif.prayer === 'isha');
      
      let triggerTime: Date;

      if (ishaNotifications.length > 0) {
        const lastIsha = ishaNotifications[ishaNotifications.length - 1];
        // Schedule trigger 15 minutes before the last Isha notification time
        triggerTime = new Date(lastIsha.notificationTime.getTime() - (15 * 60 * 1000));
        console.log(`⏰ Chain trigger scheduled for ${triggerTime.toLocaleString()} (15min before last Isha notification)`);
      } else {
        // Fallback: schedule for next day at 00:30
        triggerTime = addDays(new Date(), 1);
        triggerTime.setHours(0, 30, 0, 0);
        console.log(`⏰ Fallback trigger scheduled for ${triggerTime.toLocaleString()}`);
      }

      await NotificationService.scheduleSystemTrigger(
        'prayer-refresh-trigger',
        triggerTime.getTime()
      );
    } catch (error) {
      console.error('❌ Failed to schedule refresh trigger:', error);
      throw error;
    }
  }

  static async handleRefresh(): Promise<void> {
    try {
      console.log('🔄 Chain trigger fired, refreshing prayer notifications...');
      
      // Clear ALL existing prayer notifications
      await NotificationService.clearAllPrayerNotifications();

      // Schedule next 3 days of notifications
      const notifications = await this.getUpcomingNotifications(2);
      await NotificationService.batchScheduleNotifications(notifications);

      // Schedule the next chain trigger
      await this.scheduleNextRefreshTrigger(notifications);

      console.log('✅ Prayer notifications refreshed successfully');
    } catch (error) {
      console.error('❌ Refresh failed, scheduling fallback trigger:', error);
      
      // Schedule fallback trigger for next day at 00:30
      const fallbackTime = addDays(new Date(), 1);
      fallbackTime.setHours(0, 30, 0, 0);
      
      await NotificationService.scheduleSystemTrigger(
        'prayer-refresh-trigger',
        fallbackTime.getTime()
      );
    }
  }

  static async getTodaysPrayerTimes(): Promise<Record<PrayerName, Date>> {
    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const notifications = await this.getUpcomingNotifications(1);
    const todayNotifications = notifications.filter(n => this.isSameDay(n.date, today));
    
    return todayNotifications.reduce((acc, notif) => {
      acc[notif.prayer as PrayerName] = notif.originalTime;
      return acc;
    }, {} as Record<PrayerName, Date>);
  }

  static async getUpcomingPrayer(): Promise<PrayerNotification | null> {
    const notifications = await this.getUpcomingNotifications(2);
    return notifications[0] || null;
  }

  static async checkAndEnsureNotifications(): Promise<boolean> {
    try {
      const existingNotifications = await NotificationService.getScheduledNotifications();
      const now = new Date();
      
      // Check if we have at least 5 future notifications
      const futureNotifications = existingNotifications.filter(n => 
        n.trigger.timestamp && n.trigger.timestamp > now.getTime()
      );

      const isProperlySetup = futureNotifications.length >= 5;
      
      console.log(`📊 Notification check: future=${futureNotifications.length}, proper=${isProperlySetup}`);
      
      if (!isProperlySetup) {
        console.log('🔄 Notifications not properly setup, reinitializing...');
        await this.setupPerpetualChain();
        return true;
      }
      
      return isProperlySetup;
    } catch (error) {
      console.error('❌ Failed to check notifications:', error);
      return false;
    }
  }
}

export default PrayerTimeService;
