# Admin Analytics Filtration - Quick Reference Guide

## Summary of Changes

✅ **Event Filtration in Event Analytics** - Filter all analytics by specific event even if archived
✅ **Recent Event Registrations Filtration** - New dedicated endpoint with event filtering
✅ **Event List for Filtering** - New endpoint to get all events (active & archived) for dropdowns
✅ **Archived Events Support** - All methods include archived events in calculations

---

## API Endpoints

### 1. Event Registration Analytics with Filtration
**Endpoint:** `GET /api/admin/analytics/event-registrations`

**Query Parameters:**
- `event_id` (optional): Specific event ID to filter by, or `all` for all events

**Examples:**
```
# Get all events analytics
GET /api/admin/analytics/event-registrations

# Get analytics for event ID 1 (including archived)
GET /api/admin/analytics/event-registrations?event_id=1

# Explicitly get all events
GET /api/admin/analytics/event-registrations?event_id=all
```

**Response includes:**
- `totalRegistrations` - Count filtered by event
- `activeEvents` - Count of active (non-archived) events
- `totalParticipants` - Unique participants for selected event(s)
- `monthlyRegistrations` - Monthly breakdown (filtered by event)
- `eventPopularity` - Top events by registrations (filtered by event)
- `recentRegistrations` - Last 20 registrations (filtered by event, includes archive status)

---

### 2. Recent Event Registrations with Filtration
**Endpoint:** `GET /api/admin/analytics/recent-event-registrations`

**Query Parameters:**
- `event_id` (optional): Filter by specific event ID, or `all` for all events
- `status` (optional): Filter by status (`approved`, `pending`, `rejected`, or `all`)
- `limit` (optional): Number of results to return (default: 20)

**Examples:**
```
# Get 20 most recent registrations from all events
GET /api/admin/analytics/recent-event-registrations

# Get 50 most recent registrations for event ID 1
GET /api/admin/analytics/recent-event-registrations?event_id=1&limit=50

# Get approved registrations for event ID 2, limit to 10
GET /api/admin/analytics/recent-event-registrations?event_id=2&status=approved&limit=10

# Get all registrations across all events
GET /api/admin/analytics/recent-event-registrations?event_id=all&limit=100
```

**Response includes for each registration:**
- `id` - Registration ID
- `date` - Registration date (ISO format)
- `event_id` - ID of the event
- `event` - Event title
- `participant` - Full name of participant
- `email` - Email address
- `status` - Registration status (Approved, Pending, Rejected)
- `event_archived` - Boolean indicating if event is archived
- `event_date` - Event date

---

### 3. Events List for Filtering
**Endpoint:** `GET /api/admin/analytics/events-filter`

**Query Parameters:** None

**Example:**
```
GET /api/admin/analytics/events-filter
```

**Response includes for each event:**
- `id` - Event ID
- `title` - Event title
- `date` - Event date
- `registrations_count` - Total registrations for this event
- `archived` - Boolean indicating if event is archived

**Use this endpoint to:**
- Populate event dropdown/select lists in the admin dashboard
- Show which events are active vs archived
- Display registration count per event

---

## Frontend Implementation Example

### Step 1: Load Event Filter Options
```javascript
async function loadEventFilters() {
  const response = await fetch('/api/admin/analytics/events-filter');
  const data = await response.json();
  return data.data; // Array of events with registration counts
}
```

### Step 2: Handle Event Selection
```javascript
async function onEventSelected(eventId) {
  // Get analytics for selected event
  const analyticsResponse = await fetch(
    `/api/admin/analytics/event-registrations?event_id=${eventId}`
  );
  const analyticsData = await analyticsResponse.json();
  
  // Get recent registrations for selected event
  const registrationsResponse = await fetch(
    `/api/admin/analytics/recent-event-registrations?event_id=${eventId}&limit=20`
  );
  const registrationsData = await registrationsResponse.json();
  
  // Update dashboard with filtered data
  updateAnalyticsDashboard(analyticsData.data);
  updateRecentRegistrations(registrationsData.data);
}
```

### Step 3: Filter Recent Registrations by Status
```javascript
async function filterByStatus(eventId, status) {
  const response = await fetch(
    `/api/admin/analytics/recent-event-registrations?event_id=${eventId}&status=${status}`
  );
  const data = await response.json();
  return data.data;
}
```

---

## Key Features

### 🎯 Event Filtration
- Filter analytics by specific event ID
- Works with both active and archived events
- Can view "all events" by omitting parameter or using `event_id=all`

### 🗂️ Archived Events
- All methods automatically include archived (soft-deleted) events
- Response fields indicate which events are archived via `archived` or `event_archived` boolean

### 📊 Comprehensive Data
- Monthly registration trends per event
- Event popularity rankings
- Recent participant registrations with full details
- Unique participant counts

### 🔒 Security
- All analytics endpoints require authentication
- Protected by `auth:sanctum` middleware
- Available only to admin users

---

## Response Format

All endpoints return JSON with this format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "count": 20
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Exception details"
}
```

---

## Usage Scenarios

### Scenario 1: Admin wants to see analytics for a specific past event (archived)
1. Call `GET /api/admin/analytics/events-filter` to see all events including archived
2. Select the archived event from the list
3. Call `GET /api/admin/analytics/event-registrations?event_id={archived_event_id}`
4. View full analytics including registrations from the archived event

### Scenario 2: Admin wants to see recent registrations from a specific event
1. Call `GET /api/admin/analytics/recent-event-registrations?event_id={event_id}&limit=50`
2. Display the list showing participant names, emails, registration status
3. Filter by status if needed: `&status=approved`

### Scenario 3: Admin wants to see all recent registrations across all events
1. Call `GET /api/admin/analytics/recent-event-registrations?event_id=all&limit=100`
2. Display comprehensive list of all recent registrations with event names showing which are archived

---

## Database Optimization

All queries are optimized for performance:
- Uses `join()` for monthly aggregations
- Uses `with()` to load relationships eagerly (avoiding N+1 queries)
- Uses `withCount()` for efficient counting
- Filters applied at query level before data retrieval
- Supports soft-deleted records with `withTrashed()`

---

## Testing the Endpoints

Using curl:
```bash
# Test event filter list
curl http://localhost:8000/api/admin/analytics/events-filter

# Test analytics with filter
curl "http://localhost:8000/api/admin/analytics/event-registrations?event_id=1"

# Test recent registrations with filter
curl "http://localhost:8000/api/admin/analytics/recent-event-registrations?event_id=1&limit=20"

# Test recent registrations with status filter
curl "http://localhost:8000/api/admin/analytics/recent-event-registrations?event_id=1&status=approved"
```

---

## Related Files Modified
- `app/Http/Controllers/Api/AnalyticsController.php` - 2 new methods + 1 updated method
- `routes/api.php` - 2 new routes added
- Documentation: `ADMIN_ANALYTICS_FILTRATION.md`
