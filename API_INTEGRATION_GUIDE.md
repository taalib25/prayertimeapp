# API Integration Guide

## Overview

This document outlines the API integration for daily tasks (Prayer, Quran, Zikr) with optimistic UI updates and minimal code changes to the existing codebase.

## Architecture

```
UI Interaction → Optimistic Update → Local DB → API Call → Final Sync
     ↓              ↓                  ↓         ↓         ↓
   Instant        Immediate          Reliable  Server    Consistency
   Response       Feedback           Fallback  Sync      Check
```

## Implementation Summary

### 1. **ApiTaskServices** (`src/services/apiTaskServices.ts`)

- **Purpose**: Centralized API service for all task updates
- **Features**:
  - Prayer status updates via existing API
  - Placeholder methods for Quran and Zikr (ready for implementation)
  - Error handling and logging
  - Batch update capability

### 2. **DailyTasksContext** (Updated)

- **Optimistic UI**: Updates UI immediately before API calls
- **Rollback**: Restores previous state if API fails
- **Error Display**: Shows user-friendly error messages
- **Auto-retry**: Clears errors after 3 seconds

### 3. **taskHandler.ts** (Updated)

- **Dual Updates**: Updates both local DB and API
- **Graceful Degradation**: Continues if API fails but DB succeeds
- **Logging**: Comprehensive logging for debugging

## Key Features

### ✅ **Optimistic UI Updates**

- UI responds instantly to user interactions
- No waiting for network requests
- Smooth user experience

### ✅ **Error Resilience**

- Local database always updated first
- API failures don't break functionality
- User gets visual feedback on errors

### ✅ **Minimal Code Changes**

- Existing components work unchanged
- Only context and services modified
- No breaking changes to public APIs

### ✅ **Future-Ready**

- Placeholder methods for Quran/Zikr APIs
- Batch update capability
- Extensible architecture

## API Integration Points

### Prayer Updates ✅ **IMPLEMENTED**

```typescript
// Existing API endpoint
await apiService.updatePrayerStatus(date, prayerName, status);
```

### Quran Updates 🔄 **PLACEHOLDER READY**

```typescript
// TODO: Replace placeholder when API is available
await apiService.updateQuranMinutes(date, minutes);

// Expected API call:
// await this.api.post('/daily-tasks/quran', { date, minutes });
```

### Zikr Updates 🔄 **PLACEHOLDER READY**

```typescript
// TODO: Replace placeholder when API is available
await apiService.updateZikrCount(date, count);

// Expected API call:
// await this.api.post('/daily-tasks/zikr', { date, count });
```

## Usage Examples

### From Component (No changes needed)

```typescript
// Existing code works unchanged
const {updatePrayerAndRefresh} = useDailyTasksContext();
await updatePrayerAndRefresh(date, 'fajr', 'mosque');
```

### From Task Handler (Automatic)

```typescript
// Automatically uses both DB + API
await handleTaskCompletion(task, dateISO, refreshCallback);
```

## Error Handling

### Optimistic Update Flow

1. **Immediate UI Update**: User sees change instantly
2. **Local DB Update**: Ensures offline functionality
3. **API Call**: Syncs with server
4. **Success**: Final refresh from DB
5. **Failure**: Rollback UI + show error

### Graceful Degradation

- API failure doesn't break app functionality
- Local database remains consistent
- User gets feedback about sync status

## TODO: API Endpoint Implementation

### Quran Progress Endpoint

```typescript
POST /api/daily-tasks/quran
{
  "date": "2025-06-19",
  "minutes": 30,
  "user_id": 1001
}
```

### Zikr Progress Endpoint

```typescript
POST /api/daily-tasks/zikr
{
  "date": "2025-06-19",
  "count": 200,
  "user_id": 1001
}
```

### Batch Update Endpoint

```typescript
POST /api/daily-tasks/batch
{
  "updates": [
    {
      "type": "prayer",
      "date": "2025-06-19",
      "data": {"prayer": "fajr", "status": "mosque"}
    },
    {
      "type": "quran",
      "date": "2025-06-19",
      "data": {"minutes": 15}
    }
  ]
}
```

## Benefits

### For Users

- ⚡ **Instant Feedback**: No waiting for network requests
- 🔄 **Offline Support**: App works without internet
- 📱 **Better UX**: Smooth interactions, clear error messages

### For Developers

- 🔧 **Easy Integration**: Replace placeholders with real API calls
- 🐛 **Better Debugging**: Comprehensive logging
- 🚀 **Future-Proof**: Ready for new features

### For System

- 📊 **Data Consistency**: Local DB + API sync
- 🛡️ **Error Resilience**: Multiple fallback layers
- 📈 **Performance**: Optimistic updates + efficient batching

## Next Steps

1. **Implement Quran API endpoint** - Replace placeholder in `apiTaskServices.ts`
2. **Implement Zikr API endpoint** - Replace placeholder in `apiTaskServices.ts`
3. **Add batch API endpoint** - For efficient multiple updates
4. **Add offline sync** - Queue API calls when offline
5. **Add conflict resolution** - Handle server/client data conflicts

## Files Modified

- ✅ `src/services/apiTaskServices.ts` (New)
- ✅ `src/contexts/DailyTasksContext.tsx` (Updated)
- ✅ `src/components/DailyTasksComponent/taskHandler.ts` (Updated)
- 📄 `API_INTEGRATION_GUIDE.md` (This file)

The implementation provides a robust foundation for API integration while maintaining the existing functionality and user experience.
