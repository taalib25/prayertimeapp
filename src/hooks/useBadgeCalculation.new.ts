/**
 * ⚠️ DEPRECATED: This hook uses useDailyTasks which conflicts with withObservables HOC.
 *
 * Use withObservables HOC directly in components instead:
 *
 * const enhance = withObservables([], () => ({
 *   dailyTasks: database.get('daily_tasks').query().observe()
 * }));
 *
 * This ensures single source of truth and consistent reactivity.
 *
 * DO NOT USE THIS HOOK - it causes reactive conflicts!
 */

// Deprecated function - do not use
export const useBadgeCalculation = () => {
  throw new Error(
    'useBadgeCalculation is deprecated - use withObservables HOC pattern instead',
  );
};
