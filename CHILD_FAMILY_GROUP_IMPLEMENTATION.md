# Child Family Group Implementation

## Overview
This implementation allows children (sons/daughters) to create their own family group while remaining part of their original family. The new family is treated as a sub-family linked to the original family.

## Features Implemented

### 1. Database Changes

#### Migration: `2025_01_15_000001_create_user_families_table.php`
- Creates a many-to-many relationship table between users and families
- Fields:
  - `user_id`: Foreign key to users
  - `family_id`: Foreign key to families
  - `family_role`: Role in the family (head, spouse, child, etc.)
  - `relationship_to_head`: Relationship to family head
  - `is_family_head`: Boolean indicating if user is head of this family
  - `is_primary`: Boolean indicating if this is the user's primary family
- Unique constraint on `['user_id', 'family_id']` to prevent duplicates

#### Migration: `2025_01_15_000002_add_parent_family_id_to_families_table.php`
- Adds `parent_family_id` to families table
- Links sub-families to their parent family
- Foreign key constraint with `onDelete('set null')`

### 2. Model Updates

#### User Model (`app/Models/User.php`)
- Added `families()`: Many-to-many relationship to all families
- Added `primaryFamily()`: Relationship to primary family
- Added `secondaryFamilies()`: Relationship to secondary families

#### Family Model (`app/Models/Family.php`)
- Added `users()`: Many-to-many relationship to all users
- Added `parentFamily()`: Relationship to parent family
- Added `subFamilies()`: Relationship to sub-families
- Added `parent_family_id` to fillable array

#### New Model: `app/Models/UserFamily.php`
- Pivot model for the many-to-many relationship
- Handles family membership details

### 3. Backend API Changes

#### FamilyController Updates

**Modified `store()` method:**
- Allows children to create secondary families by checking `is_secondary_family` flag
- Validates that only children can create secondary families
- Ensures user can only be head of one family (their own secondary family)
- Creates family with `parent_family_id` linking to original family
- Adds user to `user_families` table with `is_primary = false` for secondary families

**New `getUserFamilies()` method:**
- Returns all families (primary and secondary) for authenticated user
- Includes family details and members
- Marks which family is primary and which user is head
- Endpoint: `GET /api/user/families`

### 4. Frontend Changes

#### Profile.jsx Updates

**New State Variables:**
- `userFamilies`: Array of all user's families
- `selectedFamilyId`: Currently selected family for display
- `showCreateOwnFamilyForm`: Controls create family modal visibility
- `creatingOwnFamily`: Loading state for family creation

**New Functions:**
- `fetchUserFamilies()`: Fetches all families for the user
- `fetchFamilyMembersForFamily(familyId)`: Fetches members for specific family
- `handleCreateOwnFamily()`: Handles creation of secondary family
- `handleFamilyTabSwitch(familyId)`: Switches between family tabs

**UI Changes:**
1. **"Create Own Family Group" Button:**
   - Visible only to children (`family_role === 'child'`)
   - Only shown if user doesn't already have a secondary family where they're head
   - Positioned on the right side of "Family Grouping" header
   - Styled with gold theme (#CD8B3E)

2. **Family Tabs:**
   - Appears when user has multiple families
   - Shows "Original Family" for primary family
   - Shows family name for secondary families
   - Crown icon (👑) for families where user is head
   - Active tab highlighted in gold
   - Smooth switching between families

3. **Create Own Family Modal:**
   - Form for creating secondary family
   - Fields: Family Name, Address, Phone, Email
   - Validates and creates family with `is_secondary_family: true`
   - Refreshes family list after creation
   - Automatically switches to newly created family

4. **Family Members Display:**
   - Shows members of currently selected family
   - Displays user's role correctly (head in secondary, original role in primary)
   - "Invite Family Member" button only shows for family heads of selected family
   - "Leave Family Group" button only shows for primary family members

## API Endpoints

### Create Secondary Family
```
POST /api/families
Body: {
  family_name: string (required),
  address: string (optional),
  phone: string (optional),
  email: string (optional),
  is_secondary_family: true
}
```

### Get User's Families
```
GET /api/user/families
Response: {
  success: true,
  data: [
    {
      id: number,
      family_name: string,
      family_code: string,
      is_primary: boolean,
      is_head: boolean,
      parent_family_id: number | null,
      members: [...]
    }
  ]
}
```

## Usage Flow

1. **Child User Views Profile:**
   - Sees "Create Own Family Group" button in Family Grouping section
   - Button only visible if they don't already have a secondary family

2. **Child Creates Family:**
   - Clicks "Create Own Family Group" button
   - Modal opens with family creation form
   - Fills in family details
   - Submits form
   - New family is created as sub-family of original family
   - User becomes head of new family
   - User remains member of original family

3. **Viewing Multiple Families:**
   - After creating secondary family, tabs appear
   - "Original Family" tab shows original family members
   - New family tab shows new family (initially just the user)
   - User can switch between tabs to view different families

4. **Managing Secondary Family:**
   - User can invite members to their secondary family
   - User can manage their secondary family like any family head
   - Original family remains unchanged

## Database Schema

### user_families Table
```
- id (primary key)
- user_id (foreign key -> users.id)
- family_id (foreign key -> families.id)
- family_role (string, nullable)
- relationship_to_head (string, nullable)
- is_family_head (boolean, default: false)
- is_primary (boolean, default: false)
- timestamps
```

### families Table (updated)
```
- ...existing fields...
- parent_family_id (foreign key -> families.id, nullable)
```

## Constraints

1. Only children (`family_role === 'child'`) can create secondary families
2. User can only be head of one family (their secondary family)
3. User remains in original family when creating secondary family
4. Secondary family is linked to original family via `parent_family_id`

## Testing Checklist

- [ ] Child user can see "Create Own Family Group" button
- [ ] Non-child users cannot see the button
- [ ] Child can create secondary family
- [ ] Child cannot create multiple secondary families
- [ ] Tabs appear after creating secondary family
- [ ] User can switch between family tabs
- [ ] Correct members shown for each family
- [ ] User is head of secondary family
- [ ] User remains member of original family
- [ ] Secondary family is linked to original family
- [ ] Family head management works for secondary family

## Notes

- The implementation maintains backward compatibility with existing family structure
- Primary families still use `family_id` in users table
- Secondary families use the many-to-many relationship
- The system supports both approaches simultaneously

