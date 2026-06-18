# Admin Analytics Filtration Implementation

## Overview
Added comprehensive event filtration capabilities to the admin analytics dashboard, allowing filtering of event registrations and registrations from archived events.

## Changes Made

### 1. Updated `AnalyticsController.php`

#### Modified Method: `eventRegistrations()`
- **Added Support**: Query parameter `event_id` for filtering registrations by specific event
- **Archived Events**: Now includes archived events in the analytics (already using `withTrashed()`)
- **Features**:
  - Filter total registrations by event
  - Filter monthly registrations by event (includes archived events)
  - Filter event popularity by specific event or show all
  - Filter recent registrations by specific event
  - Shows which events are archived in the response

**Usage:**
```
GET /api/admin/analytics/event-registrations
GET /api/admin/analytics/event-registrations?event_id=1
GET /api/admin/analytics/event-registrations?event_id=all
```

#### New Method: `recentEventRegistrations()`
- **Purpose**: Get recent event registrations with filtration support
- **Query Parameters**:
  - `event_id`: Filter by specific event (or 'all' for all events)
  - `status`: Optional filter by registration status (approved, pending, rejected)
  - `limit`: Number of recent registrations to return (default: 20)
- **Features**:
  - Includes registration ID and event ID in response
  - Shows event date
  - Indicates if the event is archived
  - Counts total results returned

**Usage:**
```
GET /api/admin/analytics/recent-event-registrations
GET /api/admin/analytics/recent-event-registrations?event_id=1&limit=50
GET /api/admin/analytics/recent-event-registrations?event_id=1&status=approved&limit=20
```

#### New Method: `getEventsForFiltering()`
- **Purpose**: Get list of all events (active and archived) for dropdown/filter selection
- **Features**:
  - Returns all events with their registration counts
  - Indicates which events are archived
  - Sorted by event date (descending)
  - Includes event ID, title, date, and registration count

**Usage:**
```
GET /api/admin/analytics/events-filter
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Christmas Mass",
      "date": "2025-12-25",
      "registrations_count": 45,
      "archived": false
    },
    {
      "id": 2,
      "title": "Old Event",
      "date": "2024-01-01",
      "registrations_count": 20,
      "archived": true
    }
  ]
}
```

### 2. Updated `routes/api.php`

Added two new routes under the authenticated admin group:

```php
Route::get('/analytics/recent-event-registrations', [\App\Http\Controllers\Api\AnalyticsController::class, 'recentEventRegistrations']);
Route::get('/analytics/events-filter', [\App\Http\Controllers\Api\AnalyticsController::class, 'getEventsForFiltering']);
```

These routes are protected by authentication and can only be accessed by authenticated admin users.

## Key Features

### Archived Event Support
- All analytics now include archived events in their calculations
- Uses Laravel's `withTrashed()` to include soft-deleted events
- Responses indicate which events are archived via the `archived` or `event_archived` field

### Event Filtration
- **Specific Event**: Filter by `event_id` to see data for just one event
- **All Events**: Pass `event_id=all` or omit the parameter to see all events
- **Flexible**: Applies to all metrics (total registrations, monthly data, recent registrations)

### Recent Event Registrations Features
- Get the most recent registrations with full details
- Filter by event and registration status
- Configurable limit for number of results
- Includes event date and archived status

## Frontend Integration Points

### For Event Analytics Page
1. Call `GET /api/admin/analytics/events-filter` to populate event dropdown/filter list
2. Call `GET /api/admin/analytics/event-registrations?event_id={selectedEventId}` when event is selected
3. Use the response to display:
   - Total registrations for the event
   - Monthly breakdown
   - Event popularity (single event view)
   - Recent registrations for the event

### For Recent Event Registrations Widget
1. Call `GET /api/admin/analytics/recent-event-registrations?event_id={eventId}&limit=20` to get recent registrations
2. Display the list with:
   - Registration date
   - Event name (with archive indicator)
   - Participant name
   - Email
   - Status
   - Event date

## Response Format

All methods return consistent JSON responses:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Exception details"
}
```

## Database Queries Optimized

- Uses joins efficiently for monthly aggregations
- Includes relationships using `with()` to avoid N+1 queries
- Counts use `withCount()` for efficient database operations
- Filters applied at query level before data retrieval

## Backward Compatibility

- Existing endpoint `eventRegistrations()` still works without event filter parameter
- When no filter is provided, returns all events (same as before)
- All new methods are additions, no existing methods were removed

## Testing Queries

```bash
# Get all analytics without filter
curl "http://localhost:8000/api/admin/analytics/event-registrations"

# Get analytics for specific event
curl "http://localhost:8000/api/admin/analytics/event-registrations?event_id=1"

# Get recent registrations for specific event
curl "http://localhost:8000/api/admin/analytics/recent-event-registrations?event_id=1&limit=20"

# Get list of events for filtering
curl "http://localhost:8000/api/admin/analytics/events-filter"
```

## Files Modified
1. `app/Http/Controllers/Api/AnalyticsController.php` - Added 2 new methods, updated 1 existing method
2. `routes/api.php` - Added 2 new routes
