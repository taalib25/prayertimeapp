import { 
  addDays, 
  parseDate, 
  PRAYER_NAMES, 
  createPrayerDateTime, 
  ADVANCE_WARNING_MINUTES,
  formatDateYMD,
  debugTimestamp
} from '../../utils/helpers';
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

  static async getUpcomingNotifications(daysAhead: number = 3): Promise<PrayerNotification[]> {
    await this.loadPrayerData();
    
    const now = new Date();
    const notifications: PrayerNotification[] = [];

    try {
      // EXPLICIT TODAY CHECK - Force include today's remaining prayers
      await this.addTodaysRemainingPrayers(now, notifications);
      
      // Add future days
      await this.addFutureDaysPrayers(now, daysAhead, notifications);

      // Sort by notification time
      notifications.sort((a, b) => a.notificationTime.getTime() - b.notificationTime.getTime());
      
      console.log(`📅 Generated ${notifications.length} total notifications`);
      
      // CRITICAL DEBUG: Log each notification with its date breakdown
      console.log('📋 Notification Schedule Breakdown:');
      notifications.forEach((n, index) => {
        console.log(`   ${index + 1}. ${n.id}`);
        console.log(`      Prayer Date: ${formatDateYMD(n.date)}`);
        console.log(`      Prayer Time: ${n.originalTime.toLocaleString()}`);
        console.log(`      Notification Time: ${n.notificationTime.toLocaleString()}`);
        console.log(`      Timestamp: ${n.notificationTime.getTime()}`);
        console.log('   ---');
      });
      
      return notifications;
    } catch (error) {
      console.error('❌ Error getting upcoming notifications:', error);
      throw error;
    }
  }

  private static async addTodaysRemainingPrayers(now: Date, notifications: PrayerNotification[]): Promise<void> {
    const today = new Date(now);
    const currentYear = today.getFullYear();
    Object.entries(this.yearlyData!.monthly_prayer_times).forEach(([monthName, monthData]) => {
      monthData.date_ranges.forEach((range) => {
        const rangeStart = parseDate(range.from_date, currentYear);
        const rangeEnd = parseDate(range.to_date, currentYear);
        console.log(`📅 Checking range: ${formatDateYMD(rangeStart)} to ${formatDateYMD(rangeEnd)} ::::: ${formatDateYMD(today)}`);
        if (formatDateYMD(rangeStart) <= formatDateYMD(today) && formatDateYMD(rangeEnd) >= formatDateYMD(today)) {
          console.log(`✅ Found matching date range for today: ${range.from_date} to ${range.to_date}`);
          
          PRAYER_NAMES.forEach((prayer) => {
            const prayerTimeStr = range.times[prayer];
            if (prayerTimeStr) {
              const prayerDateTime = createPrayerDateTime(today, prayerTimeStr);
              
              debugTimestamp(prayerDateTime, `${prayer} prayer time`);
              
              if (prayerDateTime > now) {
                let notificationTime = new Date(
                  prayerDateTime.getTime() - (ADVANCE_WARNING_MINUTES * 60 * 1000)
                );
                
                if (notificationTime <= now) {
                  notificationTime = new Date(now.getTime() + 30 * 1000);
                  console.log(`⚡ Adjusted ${prayer} notification to immediate`);
                }

                const notification = {
                  id: `${prayer}-prayer-${formatDateYMD(today)}`,
                  prayer,
                  date: new Date(today),
                  originalTime: new Date(prayerDateTime),
                  notificationTime: new Date(notificationTime),
                };
                
                notifications.push(notification);
                
                console.log(`✅ ADDED TODAY'S ${prayer}:`);
                console.log(`    Prayer: ${prayerDateTime.toLocaleString()}`);
                console.log(`    Notification: ${notificationTime.toLocaleString()}`);
              } else {
                console.log(`⏭️ Skipped ${prayer} - prayer time passed`);
              }
            }
          });
        }
      });
    });
    
    console.log(`📊 Today's prayers added: ${notifications.length}`);
  }

  private static async addFutureDaysPrayers(now: Date, daysAhead: number, notifications: PrayerNotification[]): Promise<void> {
    const tomorrow = addDays(now, 1);
    const endDate = addDays(now, daysAhead);
    const currentYear = now.getFullYear();
    
    console.log(`📅 Adding future prayers: ${formatDateYMD(tomorrow)} to ${formatDateYMD(endDate)}`);

    Object.entries(this.yearlyData!.monthly_prayer_times).forEach(([monthName, monthData]) => {
      monthData.date_ranges.forEach((range) => {
        const rangeStart = parseDate(range.from_date, currentYear);
        const rangeEnd = parseDate(range.to_date, currentYear);   
        if (
          formatDateYMD(rangeStart) <= formatDateYMD(endDate) &&
          formatDateYMD(rangeEnd) >= formatDateYMD(tomorrow)
        ) {
          const actualStart = new Date(Math.max(rangeStart.getTime(), tomorrow.getTime()));
          const actualEnd = new Date(Math.min(rangeEnd.getTime(), endDate.getTime()));
          
          const daysDiff = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          for (let dayOffset = 0; dayOffset < daysDiff; dayOffset++) {
            const currentDate = new Date(actualStart);
            currentDate.setDate(actualStart.getDate() + dayOffset);

            PRAYER_NAMES.forEach((prayer) => {
              const prayerTimeStr = range.times[prayer];
              if (prayerTimeStr) {
                const prayerDateTime = createPrayerDateTime(currentDate, prayerTimeStr);
                const notificationTime = new Date(
                  prayerDateTime.getTime() - (ADVANCE_WARNING_MINUTES * 60 * 1000)
                );

                notifications.push({
                  id: `${prayer}-prayer-${formatDateYMD(currentDate)}`,
                  prayer,
                  date: new Date(currentDate),
                  originalTime: new Date(prayerDateTime),
                  notificationTime: new Date(notificationTime),
                });
              }
            });
          }
        }
      });
    });
  }

  private static isSameDay(date1: Date, date2: Date): boolean {
    return formatDateYMD(date1) === formatDateYMD(date2);
  }

  static async setupPerpetualChain(): Promise<number> {
    try {
      await NotificationService.initialize();
      const now = new Date();

      console.log(`🚀 Setting up perpetual chain at: ${now.toLocaleString()}`);

      await NotificationService.clearAllPrayerNotifications();
      const notifications = await this.getUpcomingNotifications(3);
      
      if (notifications.length === 0) {
        console.log('⚠️ No upcoming notifications found');
        return 0;
      }

      const scheduledCount = await NotificationService.batchScheduleNotifications(notifications);
      await this.scheduleNextRefreshTrigger(notifications);

      console.log(`✅ Perpetual chain setup complete. Scheduled ${scheduledCount} notifications.`);
      
      // VERIFICATION: Check what was actually scheduled
      setTimeout(async () => {
        const scheduled = await NotificationService.getScheduledNotifications();
        console.log(`🔍 VERIFICATION: ${scheduled.length} notifications actually scheduled in system`);
      }, 2000);
      
      return scheduledCount;
    } catch (error) {
      console.error('❌ Failed to setup perpetual chain:', error);
      throw error;
    }
  }

  static async scheduleNextRefreshTrigger(scheduledNotifications: PrayerNotification[]): Promise<void> {
    try {
      const ishaNotifications = scheduledNotifications.filter(notif => notif.prayer === 'isha');
      
      let triggerTime: Date;
      if (ishaNotifications.length > 0) {
        const lastIsha = ishaNotifications[ishaNotifications.length - 1];
        triggerTime = new Date(lastIsha.notificationTime.getTime() - (15 * 60 * 1000));
      } else {
        triggerTime = addDays(new Date(), 1);
        triggerTime.setHours(0, 30, 0, 0);
      }

      await NotificationService.scheduleSystemTrigger(
        'prayer-refresh-trigger',
        triggerTime.getTime()
      );
    } catch (error) {
      console.error('❌ Failed to schedule refresh trigger:', error);
    }
  }

  static async handleRefresh(): Promise<void> {
    try {
      console.log('🔄 Chain trigger fired, refreshing prayer notifications...');
      
      await NotificationService.clearAllPrayerNotifications();
      const notifications = await this.getUpcomingNotifications(3);
      await NotificationService.batchScheduleNotifications(notifications);
      await this.scheduleNextRefreshTrigger(notifications);

      console.log('✅ Prayer notifications refreshed successfully');
    } catch (error) {
      console.error('❌ Refresh failed, scheduling fallback trigger:', error);
      
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
    await this.loadPrayerData();
    
    const currentYear = today.getFullYear();
    const prayerTimes: Record<string, Date> = {};

    Object.entries(this.yearlyData!.monthly_prayer_times).forEach(([monthName, monthData]) => {
      monthData.date_ranges.forEach((range) => {
        const rangeStart = parseDate(range.from_date, currentYear);
        const rangeEnd = parseDate(range.to_date, currentYear);

        if (rangeStart <= today && rangeEnd >= today) {
          PRAYER_NAMES.forEach((prayer) => {
            const prayerTimeStr = range.times[prayer];
            if (prayerTimeStr) {
              const prayerDateTime = createPrayerDateTime(today, prayerTimeStr);
              prayerTimes[prayer] = prayerDateTime;
            }
          });
        }
      });
    });
    
    return prayerTimes as Record<PrayerName, Date>;
  }

  static async getUpcomingPrayer(): Promise<PrayerNotification | null> {
    const notifications = await this.getUpcomingNotifications(2);
    return notifications[0] || null;
  }

  static async checkAndEnsureNotifications(): Promise<boolean> {
    try {
      const existingNotifications = await NotificationService.getScheduledNotifications();
      const now = new Date();
      
      const todayPrayerTimes = await this.getTodaysPrayerTimes();
      const remainingTodayPrayers = Object.entries(todayPrayerTimes).filter(
        ([prayer, time]) => time > now
      );
      
      const hasAllTodayNotifications = remainingTodayPrayers.every(([prayer]) => 
        existingNotifications.some(existing => 
          existing.notification.id?.includes(`${prayer}-prayer-${formatDateYMD(now)}`)
        )
      );
      
      const futureNotifications = existingNotifications.filter(n => 
        n.trigger.timestamp && n.trigger.timestamp > now.getTime()
      );

      const isProperlySetup = hasAllTodayNotifications && futureNotifications.length >= 5;
      
      console.log(`📊 Notification check: today=${hasAllTodayNotifications}, future=${futureNotifications.length}, proper=${isProperlySetup}`);
      
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
