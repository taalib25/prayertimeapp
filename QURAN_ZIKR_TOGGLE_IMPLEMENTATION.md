# Quran and Zikr Task Toggle Implementation

## Overview

This document outlines the implementation of the Quran and Zikr task toggling functionality in the prayer app. The system ensures that clicking a Quran or Zikr special task correctly toggles its completion state and updates the database accordingly.

## Key Files Modified

### 1. `taskHandler.ts`

- **Purpose**: Handles the core toggle logic for all task types
- **Key Function**: `handleTaskCompletion()`
- **Logic for Quran/Zikr**:
  - Determines current completion state based on database values
  - For Quran: If current minutes >= task amount, it's completed
  - For Zikr: If current count >= task amount, it's completed
  - Toggles by adding/removing the task amount
  - Ensures values never go below 0

### 2. `useTaskManager.ts`

- **Purpose**: React hook that manages task operations
- **Key Function**: `handleTaskToggle()`
- **Flow**:
  1. Gets task template from special tasks definition
  2. Calls `handleTaskCompletion()` with toggle logic
  3. Refreshes UI data after completion

### 3. `dataTransform.tsx`

- **Purpose**: Transforms database data for UI display
- **Key Logic**:
  - Calculates completion state for Quran/Zikr based on current values
  - Quran: completed if `quranMinutes >= task.amount`
  - Zikr: completed if `totalZikrCount >= task.amount`
  - Prayer: completed if status is 'mosque' or 'home'

### 4. `DailyTasksSelector.tsx`

- **Purpose**: Main component that handles task interactions
- **Key Addition**: `handleTaskToggleWithRefresh()`
- **Flow**:
  1. Calls toggle handler
  2. Refreshes data to show updated state
  3. Updates UI reactively

## Toggle Logic Flow

### For Quran Tasks (15-minute recitation)

1. **Check Current State**: Get current `quranMinutes` from database
2. **Determine Completion**: Is `quranMinutes >= 15`?
3. **Toggle Action**:
   - If completed: Subtract 15 minutes (minimum 0)
   - If not completed: Add 15 minutes
4. **Update Database**: Call `updateQuranMinutes()`
5. **Refresh UI**: Data transformation recalculates completion state

### For Zikr Tasks (100x Allahu Akbar)

1. **Check Current State**: Get current `totalZikrCount` from database
2. **Determine Completion**: Is `totalZikrCount >= 100`?
3. **Toggle Action**:
   - If completed: Subtract 100 count (minimum 0)
   - If not completed: Add 100 count
4. **Update Database**: Call `updateZikrCount()`
5. **Refresh UI**: Data transformation recalculates completion state

### For Prayer Tasks

1. **Check Current State**: Get prayer status from database
2. **Determine Completion**: Is status 'mosque' or 'home'?
3. **Toggle Action**:
   - If completed: Set to 'none'
   - If not completed: Set to 'mosque'
4. **Update Database**: Call `updatePrayerStatus()`
5. **Refresh UI**: Data transformation reflects new status

## Database Integration

### Functions Used

- `updateQuranMinutes(date, minutes)`: Updates Quran reading time
- `updateZikrCount(date, count)`: Updates total Zikr count
- `updatePrayerStatus(date, prayer, status)`: Updates prayer completion
- `getRecentDailyTasks(days)`: Fetches recent task data

### Data Structure

```typescript
interface DailyTaskData {
  date: string;
  quranMinutes: number; // Total minutes read
  totalZikrCount: number; // Total Zikr count
  fajrStatus: PrayerStatus; // Prayer statuses
  // ... other prayer statuses
  specialTasks: SpecialTask[]; // UI-specific task states
}
```

## UI Behavior

### Expected User Experience

1. **Initial State**: Tasks show as not completed (empty circle)
2. **First Click**: Task becomes completed (filled circle with checkmark)
   - Quran: Adds 15 minutes to database
   - Zikr: Adds 100 count to database
3. **Second Click**: Task becomes not completed (empty circle)
   - Quran: Subtracts 15 minutes from database (min 0)
   - Zikr: Subtracts 100 count from database (min 0)
4. **Visual Feedback**: Task item background changes to indicate completion

### Performance Optimizations

- Memoized components prevent unnecessary re-renders
- Database calls are batched when possible
- Data transformation is memoized
- Optimistic UI updates with proper error handling

## Error Handling

### Safeguards

- Values never go below 0
- Only today's tasks can be modified
- Database errors are caught and logged
- UI shows error states appropriately

### Logging

- All toggle operations are logged with before/after values
- Error states include task details for debugging
- Success confirmations include actual database values

## Testing Scenarios

### Basic Toggle

1. Click Quran task → Should add 15 minutes
2. Click again → Should subtract 15 minutes
3. Check database values match expected amounts

### Edge Cases

1. Multiple rapid clicks → Should handle gracefully
2. Network interruption → Should show error state
3. Task already at minimum → Should not go negative
4. Past dates → Should not allow modification

### Integration

1. Multiple task types in same day
2. Cross-day navigation
3. Data persistence across app restarts

## Future Enhancements

### Potential Improvements

1. **Partial Completion**: Allow users to input custom amounts
2. **Progress Tracking**: Show progress bars for partially completed tasks
3. **Streak Tracking**: Track consecutive days of completion
4. **Notifications**: Remind users of incomplete tasks
5. **Analytics**: Aggregate statistics over time

### Scalability

- Task system is designed to easily add new task types
- Database schema supports additional fields
- UI components are modular and reusable

## Troubleshooting

### Common Issues

1. **UI Not Updating**: Check if `refetch()` is called after toggle
2. **Database Mismatch**: Verify database update functions
3. **Toggle Not Working**: Check console logs for errors
4. **Performance Issues**: Profile component renders

### Debug Tips

- Enable console logging in `taskHandler.ts`
- Check database values directly in development
- Verify component props are updating correctly
- Test with different date scenarios
