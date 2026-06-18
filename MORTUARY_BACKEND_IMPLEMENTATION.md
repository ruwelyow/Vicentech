# StaffMortuary Backend Implementation

## Overview
I've successfully created a complete backend system for the StaffMortuary.jsx component that saves data to your database instead of using localStorage. The implementation includes:

## Components Created

### 1. Database Model (`app/Models/MortuaryRack.php`)
- **Primary Key**: String ID (A1, A2, B1, B2, etc.)
- **Fields**:
  - `id`: Rack identifier (A1, A2, B1, B2, etc.)
  - `status`: Enum (available, occupied, reserved)
  - `occupant`: Name of the person occupying the rack
  - `date_occupied`: Date when the rack was occupied
  - `position_row`: Row position in the grid
  - `position_col`: Column position in the grid
  - `notes`: Additional notes
  - `created_at`, `updated_at`: Timestamps

### 2. Database Migration (`database/migrations/2025_09_22_092631_create_mortuary_racks_table.php`)
- Creates the `mortuary_racks` table with proper schema
- Includes indexes for efficient position-based queries
- Uses string primary key for rack IDs

### 3. API Controller (`app/Http/Controllers/Api/MortuaryController.php`)
**Endpoints**:
- `GET /api/staff/mortuary/` - Get all racks and statistics
- `GET /api/staff/mortuary/statistics` - Get mortuary statistics
- `GET /api/staff/mortuary/{id}` - Get specific rack details
- `PATCH /api/staff/mortuary/{id}` - Update rack information
- `PATCH /api/staff/mortuary/{id}/reset` - Reset rack to available
- `POST /api/staff/mortuary/bulk-update` - Update multiple racks
- `POST /api/staff/mortuary/initialize` - Initialize mortuary layout

### 4. API Routes (`routes/api.php`)
- All routes are protected under `auth:sanctum` and `staff` middleware
- Routes are prefixed with `/api/staff/mortuary/`

### 5. Frontend Service (`resources/js/services/MortuaryService.js`)
- JavaScript service class for API communication
- Handles authentication headers automatically
- Provides methods for all CRUD operations
- Includes error handling

### 6. Updated Frontend Component (`resources/js/pages/STAFF/StaffMortuary.jsx`)
- **API Integration**: Now uses the MortuaryService instead of localStorage
- **Error Handling**: Displays user-friendly error messages
- **Fallback**: Falls back to localStorage if API is unavailable
- **Loading States**: Shows loading spinner while fetching data
- **Real-time Updates**: Updates both API and localStorage for consistency

### 7. Enhanced CSS (`resources/css/staffMortuary.css`)
- Added error container styling
- Enhanced loading spinner with text
- Retry button styling

## Key Features

### Database Persistence
- All mortuary data is now stored in the database
- Automatic initialization of default 5x5 grid layout
- Proper data validation and error handling

### API-First Design
- RESTful API endpoints for all operations
- JSON responses with success/error indicators
- Proper HTTP status codes

### Frontend Integration
- Seamless integration with existing React component
- Maintains backward compatibility with localStorage
- Real-time updates and error handling

### Security
- All endpoints require authentication (`auth:sanctum`)
- Staff-only access (`staff` middleware)
- Input validation and sanitization

## Usage

### For Staff Users
1. Navigate to the Staff Mortuary page
2. The system automatically loads data from the database
3. All changes are saved to the database in real-time
4. If the API is unavailable, the system falls back to localStorage

### API Testing
You can test the API using the test endpoint:
```
GET /api/test-mortuary
```

## Database Schema
```sql
CREATE TABLE mortuary_racks (
    id VARCHAR(255) PRIMARY KEY,
    status ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
    occupant VARCHAR(255) NULL,
    date_occupied DATE NULL,
    position_row INT NOT NULL,
    position_col INT NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_position (position_row, position_col)
);
```

## Migration Commands
The migration has already been run, but if you need to reset:
```bash
php artisan migrate:rollback --step=1
php artisan migrate
```

## Next Steps
1. Test the mortuary functionality in your application
2. Verify that staff users can access the mortuary management
3. Check that data persists correctly in the database
4. Remove the test route (`/api/test-mortuary`) when ready for production

The backend is now fully functional and ready for use!
