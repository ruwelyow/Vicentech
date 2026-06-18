# Priest Calendar API Troubleshooting Guide

## Issue: 500 Internal Server Error

The 500 error was caused by middleware configuration issues. Here are the fixes applied:

### 1. Fixed Middleware Array Syntax
**Problem**: Used array syntax `['staff']` instead of string `'staff'`
**Fix**: Changed to `Route::middleware('staff')` in routes/api.php

### 2. Added Debugging and Error Handling
**Added**: Comprehensive logging and error handling in PriestCalendarController
**Added**: Debug routes to test authentication and middleware

## Testing the API

### 1. Test Basic API Connectivity
```bash
# Test if API is responding
curl http://localhost:8000/api/test-priest-calendar
```

### 2. Test Authentication (requires valid token)
```bash
# Replace YOUR_TOKEN with actual token from localStorage
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/debug/user
```

### 3. Test Staff Middleware (requires staff user)
```bash
# Replace YOUR_TOKEN with staff user token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/debug/staff
```

## Common Issues and Solutions

### Issue 1: Authentication Error (401)
**Cause**: No token or invalid token
**Solution**: 
1. Check if token exists in localStorage
2. Verify token is valid and not expired
3. Ensure user is logged in

### Issue 2: Staff Access Denied (403)
**Cause**: User doesn't have staff privileges
**Solution**:
1. Check if current user has `is_staff = 1`
2. Use staff account to access priest calendar management

### Issue 3: Priest Not Found
**Cause**: No priests in system or priest validation failing
**Solution**:
1. Run seeder: `php artisan db:seed --class=PriestCalendarSeeder`
2. Verify priests exist: Check users with `is_priest = 1`

## Frontend Integration Checklist

### 1. Authentication Token
```javascript
// Ensure token is being sent correctly
const token = localStorage.getItem('token');
const headers = { Authorization: `Bearer ${token}` };
```

### 2. User Permissions
```javascript
// Check if user has staff privileges
const user = JSON.parse(localStorage.getItem('user'));
if (!user.is_staff) {
    // Redirect or show error
}
```

### 3. API Endpoints
- `GET /api/priests` - Get all priests (requires auth)
- `GET /api/priest-calendar` - Get calendar entries (requires auth)
- `POST /api/priest-calendar` - Create entry (requires staff)
- `PUT /api/priest-calendar/{id}` - Update entry (requires staff)
- `DELETE /api/priest-calendar/{id}` - Delete entry (requires staff)

## Database Verification

### Check if tables exist:
```sql
SHOW TABLES LIKE 'priest_calendars';
SHOW TABLES LIKE 'users';
```

### Check if data exists:
```sql
SELECT COUNT(*) FROM users WHERE is_priest = 1;
SELECT COUNT(*) FROM users WHERE is_staff = 1;
SELECT COUNT(*) FROM priest_calendars;
```

### Sample data creation:
```bash
php artisan db:seed --class=PriestCalendarSeeder
```

## API Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error description",
  "errors": { ... }
}
```

## Debugging Steps

1. **Check Laravel Logs**: `storage/logs/laravel.log`
2. **Test API Endpoints**: Use debug routes first
3. **Verify Database**: Check if data exists
4. **Check Authentication**: Verify token and user permissions
5. **Frontend Console**: Check for JavaScript errors

## Quick Fixes

### Clear Laravel Cache:
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### Restart Development Server:
```bash
php artisan serve
```

### Check Route List:
```bash
php artisan route:list --path=priest
```

## Contact Points

If issues persist:
1. Check Laravel logs for detailed error messages
2. Use debug routes to isolate the problem
3. Verify user permissions and authentication
4. Ensure database tables and data exist

The API is now properly configured with comprehensive error handling and debugging capabilities.