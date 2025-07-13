/**
 * ⚠️ DEPRECATED: This entire file contains hooks that use useDailyTasks pattern
 * which conflicts with withObservables HOC reactive pattern.
 *
 * All components should use withObservables HOC directly:
 *
 * const enhance = withObservables([], () => ({
 *   dailyTasks: database.get('daily_tasks').query().observe()
 * }));
 *
 * This ensures single source of truth and consistent reactivity.
 *
 * DO NOT USE THESE HOOKS - they cause reactive conflicts!
 *
 * Instead of using:
 * - usePrayerData -> Use withObservables with database.get('daily_tasks').query()
 * - useFajrChartData -> Use withObservables with date filtering
 * - useMonthlyAggregatedData -> Use withObservables with monthly query
 * - useQuranData -> Use withObservables with database.get('daily_tasks').query()
 * - useZikrData -> Use withObservables with database.get('daily_tasks').query()
 */

// This file is deprecated to prevent reactive conflicts
export {};
