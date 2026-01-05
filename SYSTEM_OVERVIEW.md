# GPS Meter Monitoring System - Complete Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Dashboard  │  │  Meter List  │  │   Map View   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                            │                                 │
│                    API Client (fetch)                        │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    Django Backend (APIView)                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              API Endpoints (Async)                  │    │
│  │  - POST /api/meters/{id}/location/                 │    │
│  │  - GET  /api/meters/{id}/status/                   │    │
│  │  - GET  /api/meters/map-data/                      │    │
│  │  - POST /api/meters/{id}/control/                  │    │
│  └──────────────┬──────────────────────────────────────┘    │
│                 │                                            │
│  ┌──────────────┴──────────────┐                           │
│  │      Services Layer         │                           │
│  │  - LocationService          │                           │
│  │  - MeterControlService      │                           │
│  │  - StatusService            │                           │
│  └──────────────┬──────────────┘                           │
│                 │                                            │
│  ┌──────────────┴──────────────┐                           │
│  │      Utilities Layer         │                           │
│  │  - DistanceCalculator        │                           │
│  │  - MeterCommunicator (async) │                           │
│  └──────────────┬──────────────┘                           │
│                 │                                            │
│  ┌──────────────┴──────────────┐                           │
│  │      Models Layer            │                           │
│  │  - ElectricityMeter          │                           │
│  │  - LocationHistory           │                           │
│  │  - MeterStatusLog            │                           │
│  └──────────────┬──────────────┘                           │
│                 │                                            │
│         Database (SQLite/PostgreSQL)                        │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │
┌────────────────────────────┼─────────────────────────────────┐
│              Electricity Meters (IoT Devices)                │
│  - Send GPS coordinates                                     │
│  - Receive control commands                                 │
│  - Report status                                            │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Location Monitoring Flow
```
Meter Device
    │
    │ POST /api/meters/{id}/location/
    │ { latitude, longitude }
    │
    ▼
Django APIView (async)
    │
    │ 1. Validate coordinates
    │ 2. Get meter from DB
    │ 3. Calculate distance
    │
    ▼
LocationService
    │
    │ Distance > Threshold?
    │
    ├─► YES → MeterControlService → HTTP Request → Meter (Turn OFF)
    │         │
    │         ▼
    │    Update Status: OFF
    │    Create StatusLog
    │
    └─► NO → Update current location
             Create LocationHistory
    │
    ▼
Return Response
```

### 2. Frontend Status Display Flow
```
Next.js Component
    │
    │ GET /api/meters/{id}/status/
    │ (Polling every 5s)
    │
    ▼
Django APIView (async)
    │
    │ Query meter status from DB
    │
    ▼
Return { status: "ON|OFF", color: "green|red" }
    │
    ▼
Update UI Component
    │
    ▼
Display Status Indicator (Green/Red)
```

### 3. Map Display Flow
```
Next.js Map Component
    │
    │ GET /api/meters/map-data/
    │
    ▼
Django APIView
    │
    │ Get all meters with locations
    │
    ▼
Return { meters: [{ id, name, lat, lng, status, color }] }
    │
    ▼
Render Map with Markers
    │
    ├─► Default Location Marker (Blue)
    ├─► Current Location Marker (Status Color)
    ├─► Threshold Circle
    └─► Location Trail Polyline
```

## Key Features

### Backend Features
- ✅ Async APIView classes for efficient I/O
- ✅ GPS coordinate validation and distance calculation
- ✅ Automatic meter shutdown on location change
- ✅ Status tracking and history logging
- ✅ RESTful API design
- ✅ CORS support for Next.js frontend

### Frontend Features
- ✅ Real-time status monitoring with color indicators
- ✅ Interactive map with multiple meters
- ✅ Location history visualization
- ✅ Status polling for live updates
- ✅ Responsive design
- ✅ TypeScript for type safety

## API Endpoints Summary

### Meter Management
- `POST /api/meters/` - Register new meter
- `GET /api/meters/` - List all meters
- `GET /api/meters/{id}/` - Get meter details
- `PUT /api/meters/{id}/` - Update meter
- `DELETE /api/meters/{id}/` - Delete meter

### Location & Status
- `POST /api/meters/{id}/location/` - Receive coordinates (async)
- `GET /api/meters/{id}/status/` - Get status (async)
- `GET /api/meters/{id}/location-history/` - Location history
- `GET /api/meters/{id}/status-history/` - Status history

### Frontend-Specific
- `GET /api/meters/map-data/` - All meters for map
- `GET /api/meters/{id}/location-trail/` - Location trail for polyline
- `GET /api/meters/{id}/map-details/` - Map-optimized details

### Control
- `POST /api/meters/{id}/control/` - Control meter (ON/OFF)

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 16+ (App Router) |
| Frontend Language | TypeScript |
| Frontend UI | React 19 |
| Frontend Styling | Tailwind CSS 4 |
| Frontend Map | React Leaflet |
| Backend Framework | Django 6.0 |
| API Framework | Django REST Framework |
| Backend Language | Python 3.13+ |
| Async Support | Django async views |
| Database | SQLite (dev) / PostgreSQL (prod) |
| HTTP Client (Backend) | httpx (async) |
| CORS | django-cors-headers |

## File Structure

```
gps-sys/
├── backend-api/
│   ├── backend/
│   │   ├── settings.py        # Django settings + CORS
│   │   └── urls.py            # Main URL routing
│   ├── gps/
│   │   ├── models.py          # Database models
│   │   ├── views.py           # APIView classes (async)
│   │   ├── serializers.py     # DRF serializers
│   │   ├── services.py        # Business logic
│   │   ├── utils.py           # Utilities
│   │   └── urls.py            # App URL routing
│   └── manage.py
│
├── client/
│   ├── app/
│   │   ├── page.tsx           # Dashboard
│   │   ├── meters/
│   │   │   ├── page.tsx       # Meters list
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Meter details
│   │   └── map/
│   │       └── page.tsx       # Map view
│   ├── components/
│   │   ├── meters/            # Meter components
│   │   ├── map/               # Map components
│   │   └── ui/                # UI components
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   └── types.ts           # TypeScript types
│   └── hooks/                 # Custom React hooks
│
└── Documentation/
    ├── ARCHITECTURE.md        # Backend architecture
    ├── FRONTEND_ARCHITECTURE.md # Frontend architecture
    ├── IMPLEMENTATION_FLOW.md  # Flow diagrams
    ├── QUICK_START.md         # Quick reference
    └── SYSTEM_OVERVIEW.md     # This file
```

## Development Workflow

### Backend Development
1. Create models in `gps/models.py`
2. Create migrations: `python manage.py makemigrations`
3. Apply migrations: `python manage.py migrate`
4. Implement services in `gps/services.py`
5. Create APIView classes in `gps/views.py`
6. Set up URL routing in `gps/urls.py`
7. Test with Django admin or API client

### Frontend Development
1. Set up API client in `lib/api.ts`
2. Create TypeScript types in `lib/types.ts`
3. Build components in `components/`
4. Create pages in `app/`
5. Implement custom hooks in `hooks/`
6. Test with backend API

### Integration
1. Configure CORS in Django settings
2. Set environment variables
3. Test API endpoints from frontend
4. Implement error handling
5. Add loading states
6. Polish UI/UX

## Environment Setup

### Backend (.env or settings.py)
```python
METER_API_BASE_URL=http://meter-api.example.com
METER_API_TIMEOUT=5
DEFAULT_THRESHOLD_DISTANCE=50
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_MAP_API_KEY=your_key_here
```

## Next Steps

1. ✅ Architecture planning (Complete)
2. ⏳ Backend implementation
   - Models and migrations
   - Services and utilities
   - APIView endpoints
3. ⏳ Frontend implementation
   - API client setup
   - Component development
   - Map integration
4. ⏳ Integration and testing
5. ⏳ Deployment preparation

## Documentation Index

- **ARCHITECTURE.md**: Complete backend architecture details
- **FRONTEND_ARCHITECTURE.md**: Frontend structure and components
- **IMPLEMENTATION_FLOW.md**: Visual flow diagrams
- **QUICK_START.md**: Quick reference guide
- **SYSTEM_OVERVIEW.md**: This file - complete system overview

