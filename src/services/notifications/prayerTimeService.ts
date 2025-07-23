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
    daysAhead: number = 2
  ): Promise<PrayerNotification[]> {
    await this.loadPrayerData();
    
    const currentYear = startDate.getFullYear();
    const endDate = addDays(startDate, daysAhead);
    const notifications: PrayerNotification[] = [];

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

              // Schedule notifications for each prayer
              PRAYER_NAMES.forEach((prayer) => {
                const prayerTimeStr = range.times[prayer];
                if (prayerTimeStr) {
                  const prayerDateTime = createPrayerDateTime(currentDate, prayerTimeStr);
                  const notificationTime = new Date(
                    prayerDateTime.getTime() - (ADVANCE_WARNING_MINUTES * 60 * 1000)
                  );

                  // Only include future notifications
                  if (notificationTime > new Date()) {
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
      
      console.log(`📅 Processed ${notifications.length} notifications for ${daysAhead} days`);
      return notifications;
    } catch (error) {
      console.error('❌ Error processing prayer notifications:', error);
      throw error;
    }
  }

  static async setupPerpetualChain(): Promise<number> {
    try {
      await NotificationService.initialize();
      const now = new Date();

      // Clear old notifications (before today 00:00)
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      await NotificationService.clearOldNotifications(today);

      // Schedule next 2 days
      const notifications = await this.processNotificationsForDateRange(now, 2);
      const scheduledCount = await NotificationService.batchScheduleNotifications(notifications);

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
      // Find tomorrow's Isha notification
      const tomorrow = addDays(new Date(), 1);
      const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
      
      const tomorrowIsha = scheduledNotifications.find(notif =>
        notif.prayer === 'isha' && 
        notif.date.toISOString().split('T')[0] === tomorrowDateStr
      );

      let triggerTime: Date;

      if (tomorrowIsha) {
        // Schedule 5 minutes before Isha notification
        triggerTime = new Date(tomorrowIsha.notificationTime.getTime() - (5 * 60 * 1000));
        console.log(`⏰ Chain trigger scheduled for ${triggerTime.toLocaleString()}`);
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
      
      // Clear old notifications (before today 00:00)
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      await NotificationService.clearOldNotifications(today);

      // Schedule next 2 days
      const notifications = await this.processNotificationsForDateRange(now, 2);
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
    const notifications = await this.processNotificationsForDateRange(today, 1);
    
    return notifications.reduce((acc, notif) => {
      acc[notif.prayer as PrayerName] = notif.originalTime;
      return acc;
    }, {} as Record<PrayerName, Date>);
  }

  static async getUpcomingPrayer(): Promise<PrayerNotification | null> {
    const now = new Date();
    const notifications = await this.processNotificationsForDateRange(now, 2);
    
    return notifications.find(notif => notif.originalTime > now) || null;
  }
}

export default PrayerTimeService;
