# GPS-Based Electricity Meter Monitoring System - Architectural Plan

## 1. System Overview

This system monitors electricity meters by tracking their GPS coordinates and automatically shutting them down if they are moved from their registered location. The system uses async operations for efficient handling of meter communications.

## 2. Architecture Components

### 2.1 Core Components

1. **Models Layer** (`gps/models.py`)
   - `ElectricityMeter`: Stores meter information and default location
   - `LocationHistory`: Tracks coordinate changes over time
   - `MeterStatus`: Logs meter status changes

2. **API Layer** (`gps/views.py`)
   - RESTful API endpoints using Django REST Framework APIView
   - Async view classes for handling meter communications

3. **Services Layer** (`gps/services.py`)
   - `LocationService`: Handles coordinate comparison logic
   - `MeterControlService`: Manages meter control operations (on/off)
   - `StatusService`: Handles meter status retrieval

4. **Utilities Layer** (`gps/utils.py`)
   - `DistanceCalculator`: Calculates distance between coordinates (Haversine formula)
   - `CoordinateValidator`: Validates GPS coordinates
   - `MeterCommunicator`: Async functions for meter communication

5. **Serializers** (`gps/serializers.py`)
   - Request/Response serializers for API endpoints

## 3. Database Schema

### 3.1 ElectricityMeter Model
```python
- id: Primary Key
- meter_id: CharField (unique identifier from meter)
- name: CharField (human-readable name)
- default_latitude: DecimalField (registered location)
- default_longitude: DecimalField (registered location)
- current_latitude: DecimalField (last received location)
- current_longitude: DecimalField (last received location)
- status: CharField (choices: 'ON', 'OFF') - Current meter status
- is_active: BooleanField (whether meter is operational)
- threshold_distance: DecimalField (max allowed distance in meters, default: 50m)
- created_at: DateTimeField
- updated_at: DateTimeField
- last_location_update: DateTimeField
```

### 3.2 LocationHistory Model
```python
- id: Primary Key
- meter: ForeignKey (ElectricityMeter)
- latitude: DecimalField
- longitude: DecimalField
- distance_from_default: DecimalField (calculated distance)
- is_within_threshold: BooleanField
- timestamp: DateTimeField
```

### 3.3 MeterStatusLog Model
```python
- id: Primary Key
- meter: ForeignKey (ElectricityMeter)
- status: CharField (choices: 'ON', 'OFF')
- reason: CharField (e.g., 'LOCATION_CHANGE', 'MANUAL', 'SYSTEM')
- timestamp: DateTimeField
```

## 4. API Endpoints

### 4.1 Meter Registration & Management
- `POST /api/meters/` - Register a new meter
- `GET /api/meters/` - List all meters
- `GET /api/meters/{meter_id}/` - Get meter details
- `PUT /api/meters/{meter_id}/` - Update meter information
- `DELETE /api/meters/{meter_id}/` - Delete meter

### 4.2 Location Tracking
- `POST /api/meters/{meter_id}/location/` - Receive coordinates from meter (async)
  - Request: `{ "latitude": float, "longitude": float }`
  - Response: `{ "status": "ok", "meter_status": "ON|OFF", "within_threshold": bool }`

### 4.3 Meter Status
- `GET /api/meters/{meter_id}/status/` - Get current meter status (async)
  - Response: `{ "meter_id": str, "status": "ON|OFF", "color": "green|red", "last_update": datetime }`

### 4.4 Meter Control
- `POST /api/meters/{meter_id}/control/` - Control meter (turn on/off)
  - Request: `{ "action": "ON|OFF", "reason": str }`

### 4.5 History & Analytics
- `GET /api/meters/{meter_id}/location-history/` - Get location history
- `GET /api/meters/{meter_id}/status-history/` - Get status change history

### 4.6 Frontend-Specific Endpoints
- `GET /api/meters/map-data/` - Get all meters with locations for map display
  - Response: `{ "meters": [{ "id", "name", "latitude", "longitude", "status", "color" }] }`
- `GET /api/meters/{meter_id}/map-details/` - Get meter details optimized for map
  - Response: `{ "meter": {...}, "default_location": {...}, "current_location": {...}, "distance": float }`
- `GET /api/meters/{meter_id}/location-trail/` - Get location trail for map polyline
  - Response: `{ "trail": [[lat, lng], ...], "timestamps": [...] }`

## 5. Core Business Logic

### 5.1 Location Comparison Flow
1. Meter sends coordinates via POST to `/api/meters/{meter_id}/location/`
2. System retrieves meter's default location
3. Calculate distance using Haversine formula
4. Compare with threshold distance
5. If distance > threshold:
   - Log location violation
   - Send async request to meter to turn OFF
   - Update meter status to OFF
   - Create status log entry
6. Update meter's current location
7. Create location history entry
8. Return response with status

### 5.2 Status Retrieval Flow
1. Client requests status via GET `/api/meters/{meter_id}/status/`
2. System queries meter status (async)
3. Return status with color indicator:
   - ON = green
   - OFF = red

## 6. Technology Stack

### Backend
- **Backend Framework**: Django 6.0
- **API Framework**: Django REST Framework (APIView classes)
- **Async Support**: Django async views (Python 3.13+)
- **Database**: SQLite (development) / PostgreSQL (production)
- **HTTP Client**: `httpx` (async) for meter communication
- **Distance Calculation**: Custom Haversine implementation
- **CORS**: `django-cors-headers` for Next.js frontend integration

### Frontend
- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Map Library**: React Leaflet
- **HTTP Client**: Fetch API or Axios
- **State Management**: React Hooks (useState, useEffect) or Context API
- **Styling**: CSS Modules / Tailwind CSS

## 7. Best Practices Implementation

### 7.1 Code Organization
- Separation of concerns (Models, Views, Services, Utils)
- DRY (Don't Repeat Yourself) principle
- Single Responsibility Principle

### 7.2 API Design
- RESTful conventions
- Proper HTTP status codes
- Consistent response formats
- Input validation
- Error handling

### 7.3 Async Operations
- Use `async def` for I/O-bound operations
- Use `asyncio` for concurrent operations
- Proper async/await patterns
- Timeout handling for meter communications

### 7.4 Security
- API authentication (Token-based or JWT)
- Input sanitization
- SQL injection prevention (Django ORM)
- Rate limiting for API endpoints
- HTTPS in production

### 7.5 Error Handling
- Try-except blocks for async operations
- Proper error logging
- User-friendly error messages
- Graceful degradation

### 7.6 Testing
- Unit tests for services
- Integration tests for API endpoints
- Mock meter responses for testing

### 7.7 Logging
- Structured logging
- Log levels (DEBUG, INFO, WARNING, ERROR)
- Log important events (location changes, status changes)

## 8. File Structure

### Backend Structure
```
backend-api/
├── backend/
│   ├── settings.py        # Django settings (CORS config)
│   ├── urls.py            # Main URL routing
│   └── ...
├── gps/
│   ├── __init__.py
│   ├── models.py          # Database models
│   ├── views.py           # APIView classes (async)
│   ├── serializers.py     # DRF serializers
│   ├── services.py        # Business logic services
│   ├── utils.py           # Utility functions
│   ├── urls.py            # URL routing
│   ├── admin.py           # Django admin configuration
│   └── tests.py           # Test cases
└── manage.py
```

### Frontend Structure (Next.js)
```
client/
├── app/
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home/Dashboard page
│   ├── meters/
│   │   ├── page.tsx       # Meters list page
│   │   └── [id]/
│   │       ├── page.tsx   # Meter details page
│   │       └── map.tsx    # Map view component
│   └── map/
│       └── page.tsx       # Full map view
├── components/
│   ├── MeterCard.tsx      # Meter status card
│   ├── MeterMap.tsx       # Map component
│   ├── StatusIndicator.tsx # Status color indicator
│   └── LocationHistory.tsx # Location history chart
├── lib/
│   ├── api.ts             # API client functions
│   └── types.ts           # TypeScript types
├── hooks/
│   ├── useMeters.ts       # Meter data hook
│   └── useMeterStatus.ts  # Status polling hook
└── public/
```

## 9. Implementation Phases

### Phase 1: Core Models & Database
- Create ElectricityMeter model
- Create LocationHistory model
- Create MeterStatusLog model
- Run migrations

### Phase 2: Services & Utilities
- Implement DistanceCalculator (Haversine)
- Implement LocationService
- Implement MeterControlService
- Implement StatusService
- Implement MeterCommunicator (async)

### Phase 3: API Endpoints
- Meter registration endpoints
- Location receiving endpoint (async)
- Status retrieval endpoint (async)
- Meter control endpoint
- History endpoints

### Phase 4: Integration & Testing
- Integration testing
- Error handling refinement
- Logging implementation
- Documentation

### Phase 5: Security & Production Readiness
- Authentication implementation
- Rate limiting
- Production settings
- Monitoring setup

## 10. Configuration Requirements

### Backend Environment Variables
- `METER_API_BASE_URL`: Base URL for meter communication
- `METER_API_TIMEOUT`: Timeout for meter requests (default: 5s)
- `DEFAULT_THRESHOLD_DISTANCE`: Default threshold in meters (default: 50m)
- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode flag
- `CORS_ALLOWED_ORIGINS`: Allowed frontend origins (e.g., `http://localhost:3000`)
- `ALLOWED_HOSTS`: Allowed backend hosts

### Frontend Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API base URL (e.g., `http://localhost:8000/api`)
- `NEXT_PUBLIC_MAPBOX_API_KEY`: Mapbox API key (optional, only if using Mapbox tiles instead of OpenStreetMap)

## 11. Response Format Standards

### Success Response
```json
{
    "status": "success",
    "data": { ... },
    "message": "Optional message"
}
```

### Error Response
```json
{
    "status": "error",
    "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable error message"
    }
}
```

## 12. Meter Communication Protocol

### Assumed Meter API Endpoints
- `GET {meter_base_url}/meters/{meter_id}/status` - Get meter status
- `POST {meter_base_url}/meters/{meter_id}/control` - Control meter
  - Body: `{ "action": "ON|OFF" }`

Note: These endpoints need to be implemented on the meter side or configured based on actual meter API.

## 13. Frontend Architecture

### 13.1 Next.js App Structure
- **App Router**: Using Next.js 13+ App Router for routing
- **Server Components**: For initial data fetching
- **Client Components**: For interactive features (map, status updates)
- **API Integration**: Centralized API client in `lib/api.ts`

### 13.2 Key Frontend Features

#### Meter Status Display
- Real-time status indicators (green for ON, red for OFF)
- Status polling with configurable intervals
- Status history timeline
- Alert notifications for status changes

#### Map Integration
- Interactive map showing all meters
- Markers for default and current locations
- Polyline showing location trail/history
- Circle radius showing threshold distance
- Click markers to view meter details
- Real-time location updates

#### Components
1. **MeterCard**: Displays meter info with status indicator
2. **MeterMap**: Interactive map with React Leaflet
3. **StatusIndicator**: Color-coded status (green/red)
4. **LocationHistory**: Chart/timeline of location changes
5. **MeterList**: List view of all meters with filters

### 13.3 API Integration Pattern

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getMeters() {
  const res = await fetch(`${API_BASE}/meters/`);
  return res.json();
}

export async function getMeterStatus(meterId: string) {
  const res = await fetch(`${API_BASE}/meters/${meterId}/status/`);
  return res.json();
}

export async function getMapData() {
  const res = await fetch(`${API_BASE}/meters/map-data/`);
  return res.json();
}
```

### 13.4 Real-time Updates
- Polling: Use `setInterval` or `useEffect` for status polling
- WebSocket (optional): For real-time updates if needed
- Refresh on focus: Update data when window regains focus

## 14. CORS Configuration

### Django CORS Settings
```python
# settings.py
INSTALLED_APPS = [
    ...
    'corsheaders',
    'rest_framework',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Should be at top
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js dev server
    "http://localhost:3001",
]

CORS_ALLOW_CREDENTIALS = True
```

## 15. API Response Formats for Frontend

### Meter List Response
```json
{
  "status": "success",
  "data": {
    "meters": [
      {
        "id": 1,
        "meter_id": "MTR-001",
        "name": "Meter 1",
        "status": "ON",
        "color": "green",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "last_location_update": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Map Data Response
```json
{
  "status": "success",
  "data": {
    "meters": [
      {
        "id": 1,
        "meter_id": "MTR-001",
        "name": "Meter 1",
        "default_location": { "lat": 40.7128, "lng": -74.0060 },
        "current_location": { "lat": 40.7130, "lng": -74.0062 },
        "status": "ON",
        "color": "green",
        "distance_from_default": 25.5,
        "within_threshold": true
      }
    ]
  }
}
```

### Location Trail Response (for map polyline)
```json
{
  "status": "success",
  "data": {
    "trail": [
      { "lat": 40.7128, "lng": -74.0060, "timestamp": "2024-01-15T10:00:00Z" },
      { "lat": 40.7129, "lng": -74.0061, "timestamp": "2024-01-15T10:15:00Z" },
      { "lat": 40.7130, "lng": -74.0062, "timestamp": "2024-01-15T10:30:00Z" }
    ]
  }
}
```

