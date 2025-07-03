# Fix for Quran Task Monthly UI Refresh Issue

## Problem

- Quran task updates didn't refresh the monthly UI stats
- Zikr task updates worked perfectly
- After Zikr update, both Quran and Zikr would work

## Root Cause

The issue was with the **MonthlyTaskContext** caching strategy:

1. **Cache Hash Too Simple**: The cache key wasn't granular enough to detect individual Quran vs Zikr changes
2. **Cache Duration Too Long**: 2-minute cache was too aggressive for reactive updates
3. **Insufficient Debug Logging**: Hard to track what was happening with cache invalidation

## Fixes Applied

### 1. Improved Cache Hash Strategy

**File**: `src/contexts/MonthlyTaskContext.tsx`

```typescript
// BEFORE: Simple hash that could miss individual changes
const dailyTasksHash =
  dailyTasks.length +
  dailyTasks.reduce(
    (sum, t) => sum + (t.quranMinutes || 0) + (t.totalZikrCount || 0),
    0,
  );

// AFTER: Detailed hash that tracks Quran and Zikr separately
const quranTotal = dailyTasks.reduce(
  (sum, t) => sum + (t.quranMinutes || 0),
  0,
);
const zikrTotal = dailyTasks.reduce(
  (sum, t) => sum + (t.totalZikrCount || 0),
  0,
);
const dailyTasksHash = `${dailyTasks.length}-Q${quranTotal}-Z${zikrTotal}`;
```

### 2. Reduced Cache Duration

```typescript
// BEFORE: 2 minutes (120000ms)
dataCache.set(cacheKey, allMonths, 120000);

// AFTER: 30 seconds (30000ms) for better reactivity
dataCache.set(cacheKey, allMonths, 30000);
```

### 3. Enhanced Debug Logging

- Added detailed logging to MonthlyTaskContext for hash calculation
- Added logging to useMonthlyAggregatedData for stats computation
- Added explicit cache clearing messages in DailyTasksContext

### 4. Explicit Cache Management

```typescript
// More explicit cache clearing with detailed logging
dataCache.clear(); // Clear all caches including monthly stats
console.log('🧹 All caches cleared after Quran update');
```

## Testing Steps

### 1. Test Quran Update Alone

1. Open the app and navigate to daily tasks
2. Toggle a Quran task (15 minutes)
3. **Check console logs for**:
   ```
   🔄 Updating Quran to 15 minutes for [date]
   🧹 All caches cleared after Quran update
   📊 useMonthlyAggregatedData: Computing stats for [year-month]
   🔄 Computing fresh monthly data transform...
   💾 Monthly data cached with key: [hash]
   ```
4. Navigate to monthly stats - should show updated Quran progress immediately

### 2. Test Zikr Update Alone

1. Toggle a Zikr task (100 count)
2. **Check console logs for**:
   ```
   🔄 Updating Zikr to 100 count for [date]
   🧹 All caches cleared after Zikr update
   📊 useMonthlyAggregatedData: Computing stats for [year-month]
   🔄 Computing fresh monthly data transform...
   💾 Monthly data cached with key: [hash]
   ```
3. Navigate to monthly stats - should show updated Zikr progress immediately

### 3. Test Both Updates

1. Update Quran first, then Zikr
2. Both should work independently and update monthly stats immediately
3. Check that cache keys are different for each update

## Expected Console Output

When working correctly, you should see:

```
🔄 Toggling task quran_15min for date 2025-06-23
🔄 Updating Quran to 15 minutes for 2025-06-23
🧹 All caches cleared after Quran update
✅ Quran updated and UI refreshed
🔍 MonthlyTaskContext: Detailed stats - Length: 30, Quran: 15, Zikr: 0
🔍 MonthlyTaskContext: Cache key: monthly-stats-{"monthlyZikrGoal":3000,"monthlyQuranPagesGoal":300}-30-Q15-Z0...
🔄 Computing fresh monthly data transform...
📊 useMonthlyAggregatedData: Computing stats for 2025-6 with 30 daily tasks
📊 Month stats computed: Quran=1, Zikr=0, Fajr=0, Isha=0
💾 Monthly data cached with key: 30-Q15-Z0
```

## Key Improvements

1. **Granular Cache Keys**: Each task type change creates a unique cache key
2. **Faster Cache Expiry**: 30-second cache allows for more reactive updates
3. **Better Debugging**: Clear logs show exactly what's happening
4. **Consistent Behavior**: Both Quran and Zikr now work identically

## Files Modified

1. `src/contexts/MonthlyTaskContext.tsx` - Improved cache hashing and reduced cache duration
2. `src/contexts/DailyTasksContext.tsx` - Enhanced cache clearing with better logging
3. `src/hooks/useContextualData.ts` - Added debug logging to monthly stats computation

The fix ensures that **both Quran and Zikr updates trigger immediate monthly UI refreshes** with proper cache invalidation and reactive updates.
