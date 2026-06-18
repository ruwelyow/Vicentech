# Priest Calendar Backend API Documentation

This document describes the backend API created for the Priest Calendar management system.

## Overview

The Priest Calendar system allows staff members to manage priest schedules and priests to view their own schedules. The system includes:

- **Database Table**: `priest_calendars` - stores priest duty assignments
- **Model**: `PriestCalendar` - handles database operations
- **Controller**: `PriestCalendarController` - manages API endpoints
- **Middleware**: `PriestMiddleware` - ensures only priests can access priest-only routes

## Database Schema

### priest_calendars table
```sql
- id (primary key)
- priest_id (foreign key to users.id)
- duty (string) - e.g., "Mass", "Confession", "Baptism"
- date (date) - the date of the duty
- time (time) - the time of the duty
- notes (text, nullable) - additional notes
- status (enum: 'scheduled', 'completed', 'cancelled') - default: 'scheduled'
- created_at, updated_at (timestamps)
```

### users table (updated)
- Added `is_priest` field to identify priest users

## API Endpoints

### Authentication Required
All endpoints require authentication using Sanctum tokens:
```
Authorization: Bearer {token}
```

### Public Endpoints (Authenticated users)

#### GET /api/priests
Get all priests (users with is_priest = true)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Fr. Gomer Torres",
      "email": "fr.gomer@church.com"
    }
  ]
}
```

#### GET /api/priest-calendar
Get all priest calendar entries with optional filters
**Query Parameters:**
- `priest_id` - Filter by specific priest
- `date` - Filter by specific date (YYYY-MM-DD)
- `start_date` & `end_date` - Filter by date range
- `status` - Filter by status (scheduled, completed, cancelled)

#### GET /api/priest-calendar/monthly
Get calendar entries for a specific month
**Query Parameters:**
- `year` - Year (default: current year)
- `month` - Month (default: current month)

#### GET /api/priest-calendar/priest/{priestId}
Get schedule for a specific priest
**Query Parameters:**
- `start_date` & `end_date` - Date range filter
- `status` - Status filter

### Staff/Admin Only Endpoints

#### POST /api/priest-calendar
Create a new priest calendar entry
**Required fields:**
```json
{
  "priest_id": 1,
  "duty": "Sunday Mass",
  "date": "2024-08-10",
  "time": "08:00",
  "notes": "Optional notes"
}
```

#### GET /api/priest-calendar/{id}
Get a specific calendar entry

#### PUT /api/priest-calendar/{id}
Update a calendar entry
**Fields (all optional):**
```json
{
  "priest_id": 1,
  "duty": "Updated duty",
  "date": "2024-08-10",
  "time": "09:00",
  "notes": "Updated notes",
  "status": "completed"
}
```

#### DELETE /api/priest-calendar/{id}
Delete a calendar entry

### Priest-Only Endpoints

#### GET /api/priest/my-schedule
Get the authenticated priest's own schedule
**Query Parameters:**
- `start_date` & `end_date` - Date range filter
- `status` - Status filter

## Frontend Integration

### PriestCalendar.jsx (Staff Interface)
- Allows staff to create, edit, and delete priest calendar entries
- Fetches list of priests from `/api/priests`
- Manages calendar entries via CRUD operations
- Includes form validation and error handling

### PriestDashboard.jsx (Priest Interface)
- Shows calendar view of priest's own schedule
- Fetches data from `/api/priest/my-schedule`
- Displays duties with notes and status
- Updates automatically when month changes

## Sample Data

The system includes a seeder (`PriestCalendarSeeder`) that creates:
- Two sample priests: Fr. Gomer Torres and Fr. Jeric Advincula
- Sample calendar entries for the next week

To run the seeder:
```bash
php artisan db:seed --class=PriestCalendarSeeder
```

## Security Features

1. **Authentication**: All endpoints require valid Sanctum tokens
2. **Authorization**: 
   - Staff middleware for management endpoints
   - Priest middleware for priest-only endpoints
3. **Validation**: Input validation on all create/update operations
4. **Conflict Detection**: Prevents double-booking of priests
5. **Priest Verification**: Ensures only actual priests can be assigned duties

## Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error

## Usage Examples

### Creating a new duty assignment
```javascript
const response = await axios.post('/api/priest-calendar', {
  priest_id: 1,
  duty: 'Sunday Mass',
  date: '2024-08-10',
  time: '08:00',
  notes: 'Main Sunday service'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Fetching priest's schedule
```javascript
const response = await axios.get('/api/priest/my-schedule', {
  headers: { Authorization: `Bearer ${token}` },
  params: {
    start_date: '2024-08-01',
    end_date: '2024-08-31'
  }
});
```

This backend provides a complete solution for managing priest calendars with proper authentication, authorization, and data validation.