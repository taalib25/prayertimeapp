# Prayer App API Endpoints Documentation

## Overview

This document outlines the API endpoints required for the Prayer Times mobile application. The app handles user authentication, prayer time management, and bulk data operations.

## Base URL

```
https://api.prayerapp.com/v1
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication Endpoints

### 1.1 User Login

**POST** `/auth/login`

Request body:

```json
{
  "username": "ahmed_test",
  "password": "test123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "username": "ahmed_test",
      "phoneNumber": "0123456789",
      "isVerified": false,
      "name": "John Doe"
    },
    "requiresPhoneVerification": true
  }
}
```

### 1.2 Send OTP

**POST** `/auth/send-otp`

Request body:

```json
{
  "phoneNumber": "0123456789"
}
```

Response:

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresIn": 300
  }
}
```

### 1.3 Verify OTP

**POST** `/auth/verify-otp`

Request body:

```json
{
  "phoneNumber": "0123456789",
  "otp": "1234"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "phoneNumber": "0123456789",
      "isVerified": true,
      "name": "John Doe",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  }
}
```

### 1.4 Logout

**POST** `/auth/logout`

Headers: `Authorization: Bearer <token>`

Response:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. Prayer Times Endpoints

### 2.1 Get Prayer Times

**GET** `/prayer-times/{date}`

Parameters:

- `date`: YYYY-MM-DD format (e.g., 2025-01-15)

Headers: `Authorization: Bearer <token>`

Response:

```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "fajr": "05:30",
    "sunrise": "06:45",
    "dhuhr": "12:15",
    "asr": "15:30",
    "maghrib": "17:45",
    "isha": "19:00"
  }
}
```

### 2.2 Get Prayer Times Range

**GET** `/prayer-times`

Query parameters:

- `startDate`: YYYY-MM-DD format
- `endDate`: YYYY-MM-DD format
- `limit`: Optional, max 31 days

Headers: `Authorization: Bearer <token>`

Response:

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-15",
      "fajr": "05:30",
      "sunrise": "06:45",
      "dhuhr": "12:15",
      "asr": "15:30",
      "maghrib": "17:45",
      "isha": "19:00"
    }
  ]
}
```

### 2.3 Create/Update Prayer Times

**POST** `/prayer-times`

Headers: `Authorization: Bearer <token>`

Request body:

```json
{
  "date": "2025-01-15",
  "fajr": "05:30",
  "sunrise": "06:45",
  "dhuhr": "12:15",
  "asr": "15:30",
  "maghrib": "17:45",
  "isha": "19:00"
}
```

Response:

```json
{
  "success": true,
  "message": "Prayer times saved successfully",
  "data": {
    "date": "2025-01-15",
    "fajr": "05:30",
    "sunrise": "06:45",
    "dhuhr": "12:15",
    "asr": "15:30",
    "maghrib": "17:45",
    "isha": "19:00"
  }
}
```

### 2.4 Bulk Import Prayer Times

**POST** `/prayer-times/bulk-import`

Headers: `Authorization: Bearer <token>`

Request body:

```json
{
  "prayerTimes": [
    {
      "date": "2025-01-01",
      "fajr": "04:39",
      "sunrise": "05:52",
      "dhuhr": "11:48",
      "asr": "15:07",
      "maghrib": "17:37",
      "isha": "18:48"
    },
    {
      "date": "2025-01-06",
      "fajr": "04:41",
      "sunrise": "05:54",
      "dhuhr": "11:50",
      "asr": "15:09",
      "maghrib": "17:40",
      "isha": "18:50"
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "message": "Bulk import completed",
  "data": {
    "imported": 2,
    "failed": 0,
    "errors": []
  }
}
```

---

## 3. User Management Endpoints

### 3.1 Get User Profile

**GET** `/user/profile`

Headers: `Authorization: Bearer <token>`

Response:

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "phoneNumber": "0123456789",
    "isVerified": true,
    "name": "John Doe",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### 3.2 Update User Profile

**PUT** `/user/profile`

Headers: `Authorization: Bearer <token>`

Request body:

```json
{
  "name": "John Smith",
  "phoneNumber": "0987654321"
}
```

Response:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user_123",
    "username": "john_smith",
    "phoneNumber": "0987654321",
    "isVerified": true,
    "name": "John Smith",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

## 4. Validation Rules

### Username Validation

- Required field
- Minimum 3 characters
- Must be unique

### Email Validation (Optional)

- Must be valid email format if provided
- Trimmed whitespace

### Password Validation

- Minimum 6 characters

### Phone Number Validation

- Exactly 10 digits
- Must start with 0
- Format: 0123456789

### OTP Validation

- Exactly 4 digits
- Numeric only
- Expires in 5 minutes

### Prayer Time Validation

- Time format: HH:MM (24-hour)
- Date format: YYYY-MM-DD
- All prayer times required except sunrise (optional)

---

## 5. Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Authentication required",
  "message": "Please login to access this resource"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Resource not found",
  "message": "Prayer times not found for the specified date"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 6. Rate Limiting

- Authentication endpoints: 5 requests per minute per IP
- OTP endpoints: 3 requests per 5 minutes per phone number
- Prayer times endpoints: 100 requests per minute per user
- Bulk import: 5 requests per hour per user

---

## 7. Data Format Notes

### Date Format

- All dates use ISO format: YYYY-MM-DD
- Timezone: UTC (client handles local conversion)

### Time Format

- 24-hour format: HH:MM
- No seconds precision needed
- Example: "05:30", "17:45"

### Bulk Import Format

- Maximum 366 records per request (one year)
- Duplicate dates will update existing records
- Invalid records are skipped with error details

---

## 8. Implementation Notes

### Local Database Sync

- App maintains local SQLite database
- API serves as backup and sync mechanism
- Offline functionality for prayer times viewing
- Sync on app startup and daily

### Authentication Flow

1. User enters email/password
2. Server validates credentials
3. If valid, request phone verification
4. Send OTP to phone number
5. Verify OTP and complete login
6. Return JWT token for authenticated requests

### Prayer Times Management

- Support for manual entry and bulk import
- Validation ensures logical prayer time ordering
- Local storage for offline access
- Background sync for updates
