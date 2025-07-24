import notifee, { TriggerType } from '@notifee/react-native';
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

  static async processNotificationsForDateRange(
    startDate: Date, 
    daysAhead: number = 2,
    includeCurrentDayRemaining: boolean = true
  ): Promise<PrayerNotification[]> {
    await this.loadPrayerData();
    
    const currentYear = startDate.getFullYear();
    const endDate = addDays(startDate, daysAhead);
    const notifications: PrayerNotification[] = [];
    const now = new Date();

    try {
      Object.entries(this.yearlyData!.monthly_prayer_times).forEach(([monthName, monthData]) => {
        monthData.date_ranges.forEach((range) => {
          const rangeStart = parseDate(range.from_date, currentYear);
          const rangeEnd = parseDate(range.to_date, currentYear);

          // Check if this range overlaps with our target date range
          if (rangeStart <= endDate && rangeEnd >= startDate) {
            const actualStart = new Date(Math.max(rangeStart.getTime(), startDate.getTime()));
            const actualEnd = new Date(Math.min(rangeEnd.getTime(), endDate.getTime()));
            
            const daysDiff = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            // Process each day in the overlapping range
            for (let dayOffset = 0; dayOffset < daysDiff; dayOffset++) {
              const currentDate = new Date(actualStart);
              currentDate.setDate(actualStart.getDate() + dayOffset);
              const isToday = this.isSameDay(currentDate, now);

              // Schedule notifications for each prayer
              PRAYER_NAMES.forEach((prayer) => {
                const prayerTimeStr = range.times[prayer];
                if (prayerTimeStr) {
                  const prayerDateTime = createPrayerDateTime(currentDate, prayerTimeStr);
                  const notificationTime = new Date(
                    prayerDateTime.getTime() - (ADVANCE_WARNING_MINUTES * 60 * 1000)
                  );

                  // Enhanced logic for current day and future notifications
                  let shouldInclude = false;

                  if (isToday && includeCurrentDayRemaining) {
                    // For today: include if the PRAYER TIME (not notification time) is still in the future
                    shouldInclude = prayerDateTime > now;
                    if (shouldInclude) {
                      console.log(`📅 Including today's ${prayer} prayer at ${prayerDateTime.toLocaleTimeString()}`);
                    }
                  } else if (!isToday) {
                    // For future days: include if notification time is in the future
                    shouldInclude = notificationTime > now;
                  }

                  if (shouldInclude) {
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
      
      console.log(`📅 Processed ${notifications.length} notifications for ${daysAhead} days (includeToday: ${includeCurrentDayRemaining})`);
      return notifications;
    } catch (error) {
      console.error('❌ Error processing prayer notifications:', error);
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

      // Schedule notifications starting from today (including remaining prayers for today)
      const notifications = await this.processNotificationsForDateRange(now, 2, true);
      
      if (notifications.length === 0) {
        console.log('⚠️ No notifications to schedule - might be end of day');
        // If no notifications for today, try next 3 days
        const extendedNotifications = await this.processNotificationsForDateRange(now, 3, false);
        const scheduledCount = await NotificationService.batchScheduleNotifications(extendedNotifications);
        await this.scheduleNextRefreshTrigger(extendedNotifications);
        return scheduledCount;
      }

      const scheduledCount = await NotificationService.batchScheduleNotifications(notifications);

      // Log what was scheduled for today
      const todayNotifications = notifications.filter(n => this.isSameDay(n.date, now));
      console.log(`📅 Scheduled ${todayNotifications.length} notifications for today:`);
      todayNotifications.forEach(n => {
        console.log(`   - ${n.prayer}: ${n.originalTime.toLocaleTimeString()} (reminder at ${n.notificationTime.toLocaleTimeString()})`);
      });

      // Schedule the next refresh trigger
      await this.scheduleNextRefreshTrigger(notifications);

      return scheduledCount;
    } catch (error) {
      console.error('❌ Failed to setup perpetual chain:', error);
      throw error;
    }
  }

  static async scheduleNextRefreshTrigger(scheduledNotifications: PrayerNotification[]): Promise<void> {
    try {
      // Find the next available Isha notification (could be today or tomorrow)
      const now = new Date();
      const nextIsha = scheduledNotifications
        .filter(notif => notif.prayer === 'isha')
        .find(notif => notif.originalTime > now);

      let triggerTime: Date;

      if (nextIsha) {
        // Schedule 5 minutes before the next Isha notification
        triggerTime = new Date(nextIsha.notificationTime.getTime() - (5 * 60 * 1000));
        console.log(`⏰ Chain trigger scheduled for ${triggerTime.toLocaleString()} (5min before ${nextIsha.prayer})`);
      } else {
        // Fallback: schedule for 00:30 next day
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
      
      const now = new Date();
      
      // Clear ALL existing prayer notifications
      await NotificationService.clearAllPrayerNotifications();

      // Schedule next 2-3 days (don't include today's remaining since it's likely end of day)
      const notifications = await this.processNotificationsForDateRange(now, 3, false);
      await NotificationService.batchScheduleNotifications(notifications);

      // Schedule the next chain trigger
      await this.scheduleNextRefreshTrigger(notifications);

      console.log('✅ Prayer notifications refreshed successfully');
    } catch (error) {
      console.error('❌ Refresh failed, scheduling fallback trigger:', error);
      
      // Schedule fallback trigger for 00:30 next day
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
    // Get all of today's prayers (not just remaining ones)
    const notifications = await this.processNotificationsForDateRange(today, 0, false);
    
    // Also get any remaining prayers for today
    const remainingNotifications = await this.processNotificationsForDateRange(today, 0, true);
    
    // Combine and deduplicate
    const allTodayNotifications = [...notifications, ...remainingNotifications];
    const uniqueNotifications = allTodayNotifications.filter((notif, index, arr) => 
      arr.findIndex(n => n.prayer === notif.prayer && this.isSameDay(n.date, today)) === index
    );
    
    return uniqueNotifications.reduce((acc, notif) => {
      if (this.isSameDay(notif.date, today)) {
        acc[notif.prayer as PrayerName] = notif.originalTime;
      }
      return acc;
    }, {} as Record<PrayerName, Date>);
  }

  static async getUpcomingPrayer(): Promise<PrayerNotification | null> {
    const now = new Date();
    const notifications = await this.processNotificationsForDateRange(now, 2, true);
    
    return notifications.find(notif => notif.originalTime > now) || null;
  }

  // New method: Check if notifications are already set up properly
  static async checkAndEnsureNotifications(): Promise<boolean> {
    try {
      const existingNotifications = await NotificationService.getScheduledNotifications();
      const now = new Date();
      
      // Check if we have notifications for today's remaining prayers
      const todayRemaining = await this.processNotificationsForDateRange(now, 0, true);
      const hasAllTodayNotifications = todayRemaining.every(expected => 
        existingNotifications.some(existing => existing.notification.id === expected.id)
      );

      // Check if we have enough future notifications (at least 5)
      const futureNotifications = existingNotifications.filter(n => 
        n.trigger.timestamp && n.trigger.timestamp > now.getTime()
      );

      const isProperlySetup = hasAllTodayNotifications && futureNotifications.length >= 5;
      
      console.log(`📊 Notification check: today=${hasAllTodayNotifications}, future=${futureNotifications.length}, proper=${isProperlySetup}`);
      
      return isProperlySetup;
    } catch (error) {
      console.error('❌ Failed to check notifications:', error);
      return false;
    }
  }
}

export default PrayerTimeService;
