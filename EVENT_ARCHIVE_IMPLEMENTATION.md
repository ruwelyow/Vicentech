# Event Archive Implementation Summary

## Overview
Implemented soft deletes (archiving) for events to preserve all event registrations and analytics data when events are "deleted". This ensures data integrity and historical analytics accuracy.

## What Was Implemented

### 1. Database Changes
- ✅ Added `deleted_at` column to `events` table via migration
- ✅ Event model now uses `SoftDeletes` trait
- ✅ Foreign key constraint remains as `cascade` (safe with soft deletes since rows aren't actually deleted)

### 2. Backend Changes

#### Event Model (`app/Models/Event.php`)
- ✅ Added `SoftDeletes` trait
- ✅ Added `deleted_at` to casts

#### EventController (`app/Http/Controllers/Api/EventController.php`)
- ✅ **`destroy()` method**: Now performs soft delete (archive) instead of hard delete
  - Returns success message indicating event was archived
  - Preserves all registrations and analytics data
  
- ✅ **`restore($id)` method**: New method to restore archived events
  - Requires event to be archived
  - Returns success message on restoration
  
- ✅ **`forceDelete($id)` method**: New method for permanent deletion
  - Only works on archived events
  - Prevents deletion if event has registrations (protects analytics)
  - Only allows deletion of events with zero registrations
  
- ✅ **`index()` method**: Updated to support archive filtering
  - Default: Returns only active (non-archived) events
  - `?include_archived=true`: Returns both active and archived events
  - `?only_archived=true`: Returns only archived events
  
- ✅ **`joinEvent()` method**: Prevents registration for archived events
  - Returns 403 error if event is archived
  
- ✅ **`getCalendarEvents()` method**: Excludes archived events from calendar
  - Only shows active events to users

#### AnalyticsController (`app/Http/Controllers/Api/AnalyticsController.php`)
- ✅ **`eventRegistrations()` method**: Updated to include archived events
  - Event popularity includes archived events (preserves historical data)
  - Recent registrations include events even if archived
  - Monthly registrations include archived events
  
- ✅ All analytics queries use `withTrashed()` to include archived events
- ✅ Analytics data includes `archived` flag to indicate event status

#### EventRegistration Model (`app/Models/EventRegistration.php`)
- ✅ Updated `event()` relationship to include archived events
  - Uses `withTrashed()` so registrations can access their event even if archived
  - Ensures analytics can always access event data

### 3. Routes (`routes/api.php`)
- ✅ Added restore endpoint: `POST /api/events/{id}/restore` (requires auth)
- ✅ Added force delete endpoint: `DELETE /api/events/{id}/force-delete` (requires auth)
- ✅ Existing delete endpoint: `DELETE /api/events/{id}` now archives instead of deleting

## How It Works

### Archiving Events
1. When admin clicks "Delete" on an event:
   - Event is soft deleted (`deleted_at` timestamp is set)
   - Event no longer appears in default event lists
   - Event is excluded from calendar
   - Event cannot accept new registrations
   - **All existing registrations are preserved**
   - **All analytics data remains accessible**

### Analytics Data Preservation
1. All analytics queries include archived events using `withTrashed()`
2. Event registrations can still access their event data
3. Historical analytics remain accurate
4. Event popularity charts include archived events
5. Monthly registration data includes archived events

### Restoring Events
1. Admin can restore archived events via `POST /api/events/{id}/restore`
2. Restored events become active again
3. Can accept new registrations
4. Appears in event lists and calendar

### Permanent Deletion
1. Only archived events can be permanently deleted
2. Events with registrations **cannot** be permanently deleted (protects analytics)
3. Only events with zero registrations can be permanently deleted
4. Permanent deletion removes event and all data (use with caution)

## Database Migration

Run the migration to add soft deletes:
```bash
php artisan migrate
```

This will add the `deleted_at` column to the `events` table.

## API Endpoints

### Archive Event (Soft Delete)
```
DELETE /api/events/{id}
```
**Response:**
```json
{
  "success": true,
  "message": "Event archived successfully. All registrations and analytics data have been preserved.",
  "event": { ... }
}
```

### Restore Archived Event
```
POST /api/events/{id}/restore
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Event restored successfully.",
  "event": { ... }
}
```

### Permanently Delete Archived Event
```
DELETE /api/events/{id}/force-delete
Authorization: Bearer {token}
```
**Response (if event has registrations):**
```json
{
  "success": false,
  "message": "Cannot permanently delete event. It has X registration(s). To preserve analytics data, events with registrations cannot be permanently deleted.",
  "registrations_count": X
}
```

**Response (if event has no registrations):**
```json
{
  "success": true,
  "message": "Event permanently deleted."
}
```

### Get Events with Archive Filter
```
GET /api/events?include_archived=true  // Get all events (active + archived)
GET /api/events?only_archived=true     // Get only archived events
GET /api/events                        // Get only active events (default)
```

## Frontend Updates Needed

### 1. Update Admin Events Page (`resources/js/pages/ADMIN/AdminEvents.jsx`)
- ✅ Change "Delete" button text to "Archive" (or show both options)
- ✅ Update success message to indicate event was archived
- ✅ Add "View Archived Events" section/tab
- ✅ Add "Restore" button for archived events
- ✅ Add filter to show/hide archived events
- ✅ Show archived badge/indicator on archived events

### 2. Update Event List Display
- Show archived events with different styling (grayed out, "Archived" badge)
- Add filter toggle: "Show Archived Events"
- Add restore button for archived events

### 3. Update Delete Confirmation
- Change message to: "Are you sure you want to archive this event? All registrations and analytics data will be preserved."
- Or provide options: "Archive" (preserves data) vs "Delete Permanently" (only if no registrations)

## Benefits

1. **Data Preservation**: All event registrations and analytics data are preserved
2. **Historical Accuracy**: Analytics remain accurate even after events are "deleted"
3. **Recovery**: Archived events can be restored if needed
4. **Safety**: Events with registrations cannot be permanently deleted
5. **User Experience**: Archived events don't clutter active event lists
6. **Analytics Integrity**: All historical data remains accessible for reporting

## Testing Checklist

- [ ] Archive an event and verify it disappears from active event list
- [ ] Verify archived event still appears in analytics
- [ ] Verify archived event cannot accept new registrations
- [ ] Verify archived event is excluded from calendar
- [ ] Restore an archived event and verify it becomes active
- [ ] Try to permanently delete event with registrations (should fail)
- [ ] Try to permanently delete event without registrations (should succeed)
- [ ] Verify analytics include archived events
- [ ] Verify event registrations can still access archived event data

## Next Steps

1. Run migration: `php artisan migrate`
2. Update admin UI to show archive functionality
3. Test archiving and restoring events
4. Verify analytics still work correctly with archived events
5. Update user documentation

## Notes

- Soft deletes don't actually remove rows from the database
- Foreign key constraints don't trigger on soft deletes (rows still exist)
- Analytics queries must use `withTrashed()` to include archived events
- Event registrations relationship automatically includes archived events
- Calendar and public event lists exclude archived events by default


