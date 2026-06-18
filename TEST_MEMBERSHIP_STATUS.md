# How to Test Membership Status Display

## Option 1: Direct SQL Update (Quickest)

If you're using SQLite (database.sqlite), you can run this in your terminal:

```bash
# Navigate to your project directory
cd "C:\Users\admin\Downloads\code latest nov 5"

# Open SQLite
sqlite3 database/database.sqlite
```

Then run:
```sql
-- First, find your user ID
SELECT id, name, email, membership_status FROM users WHERE email = 'your-email@example.com';

-- Update your membership status (replace YOUR_USER_ID with your actual user ID)
UPDATE users SET membership_status = 'active' WHERE id = YOUR_USER_ID;
-- Or try: 'inactive', 'visitor', 'new_member', 'transferred_out', 'deceased', 'suspended'

-- Verify the change
SELECT id, name, membership_status FROM users WHERE id = YOUR_USER_ID;

-- Exit SQLite
.quit
```

Then refresh your profile page in the browser.

---

## Option 2: Laravel Tinker (Recommended)

Open terminal in your project directory and run:

```bash
php artisan tinker
```

Then:
```php
// Find your user
$user = App\Models\User::where('email', 'your-email@example.com')->first();

// Check current status
$user->membership_status;

// Update to different statuses
$user->update(['membership_status' => 'active']);
// Or: 'inactive', 'visitor', 'new_member', 'transferred_out', 'deceased', 'suspended'

// Verify
$user->fresh()->membership_status;

// Exit
exit
```

Then refresh your profile page.

---

## Option 3: Temporary Test Button (Easiest - Already Added!)

I've added a temporary test button that appears in development mode. It will show up in your profile page as "🧪 Test Status (Dev Only)".

**How to use:**
1. Make sure you're running in development mode (NODE_ENV=development)
2. Go to your profile page
3. Click the "🧪 Test Status (Dev Only)" button
4. It will cycle through all statuses: active → inactive → visitor → new_member → transferred_out → deceased → suspended → active...
5. The badge will update immediately!

**Note:** This button only appears in development mode and will be hidden in production.

---

## Option 4: Database GUI Tool

If you have a database GUI tool (like DB Browser for SQLite, phpMyAdmin, etc.):

1. Open your database
2. Navigate to the `users` table
3. Find your user row
4. Edit the `membership_status` column
5. Set it to: `active`, `inactive`, `visitor`, `new_member`, `transferred_out`, `deceased`, or `suspended`
6. Save and refresh your profile page

---

## Available Status Values:

- `active` - Active Member (Green badge)
- `inactive` - Inactive Member (Yellow badge)
- `visitor` - Visitor (Blue badge)
- `new_member` - New Member (Purple badge)
- `transferred_out` - Transferred Out (Gray badge)
- `deceased` - Deceased (Gray badge)
- `suspended` - Suspended (Red badge)

---

## After Testing:

Remember to:
1. Clear your browser's localStorage (or the profile will fetch fresh data from API)
2. Refresh the profile page
3. The status badge should update immediately

