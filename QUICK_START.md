# Quick Start Guide - GPS Meter Monitoring System

## Overview
This system monitors electricity meters by tracking GPS coordinates and automatically shutting them down if moved beyond a threshold distance from their registered location.

## Key Features
- ✅ GPS coordinate tracking and validation
- ✅ Automatic meter shutdown on location change
- ✅ Real-time status monitoring (ON/OFF with color indicators)
- ✅ Location and status history logging
- ✅ Async API endpoints for efficient operations
- ✅ RESTful API design with Django REST Framework

## Technology Stack

### Backend
- **Framework**: Django 6.0
- **API**: Django REST Framework (APIView classes)
- **Async**: Python 3.13+ async/await
- **HTTP Client**: httpx (for async meter communication)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **CORS**: django-cors-headers (for Next.js integration)

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **UI**: React 19
- **Styling**: Tailwind CSS 4
- **Map**: React Leaflet
- **HTTP**: Native Fetch API

## Project Structure
```
backend-api/
├── backend/          # Django project settings
├── gps/              # Main application
│   ├── models.py     # Database models
│   ├── views.py      # APIView classes (async)
│   ├── serializers.py # Request/Response serializers
│   ├── services.py   # Business logic
│   ├── utils.py      # Utilities (distance calc, etc.)
│   └── urls.py       # URL routing
└── manage.py
```

## Core Models
1. **ElectricityMeter**: Stores meter info, default/current locations, status
2. **LocationHistory**: Tracks all coordinate updates
3. **MeterStatusLog**: Logs all status changes

## Main API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/meters/` | Register new meter |
| GET | `/api/meters/` | List all meters |
| GET | `/api/meters/{id}/` | Get meter details |
| POST | `/api/meters/{id}/location/` | Receive coordinates (async) |
| GET | `/api/meters/{id}/status/` | Get meter status (async) |
| POST | `/api/meters/{id}/control/` | Control meter (ON/OFF) |
| GET | `/api/meters/{id}/location-history/` | Location history |
| GET | `/api/meters/{id}/status-history/` | Status history |
| GET | `/api/meters/map-data/` | All meters for map display |
| GET | `/api/meters/{id}/location-trail/` | Location trail for map polyline |

## Key Workflows

### 1. Location Monitoring
```
Meter → POST /location/ → Calculate Distance → 
If > threshold → Turn OFF → Log Status → Return Response
```

### 2. Status Check
```
Client → GET /status/ → Query Meter → Format Response (ON/OFF, color)
```

## Implementation Checklist

### Phase 1: Setup
- [ ] Install dependencies (Django, DRF, httpx)
- [ ] Configure Django REST Framework in settings
- [ ] Set up database

### Phase 2: Models
- [ ] Create ElectricityMeter model
- [ ] Create LocationHistory model
- [ ] Create MeterStatusLog model
- [ ] Run migrations

### Phase 3: Utilities & Services
- [ ] Implement Haversine distance calculator
- [ ] Implement LocationService
- [ ] Implement MeterControlService
- [ ] Implement StatusService
- [ ] Implement async MeterCommunicator

### Phase 4: API
- [ ] Create serializers
- [ ] Implement async APIView classes
- [ ] Set up URL routing
- [ ] Add error handling

### Phase 5: Testing & Security
- [ ] Write unit tests
- [ ] Add authentication
- [ ] Implement rate limiting
- [ ] Add logging

## Configuration

### Backend Environment Variables
- `METER_API_BASE_URL`: Meter API base URL
- `METER_API_TIMEOUT`: Request timeout (default: 5s)
- `DEFAULT_THRESHOLD_DISTANCE`: Default threshold in meters (default: 50m)
- `CORS_ALLOWED_ORIGINS`: Frontend origins (e.g., `http://localhost:3000`)

### Frontend Environment Variables (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL (e.g., `http://localhost:8000/api`)
- `NEXT_PUBLIC_MAPBOX_API_KEY`: Mapbox API key (optional, only if using Mapbox tiles)

## Frontend Features
- ✅ Real-time meter status display (green/red indicators)
- ✅ Interactive map with meter locations
- ✅ Location history visualization
- ✅ Status polling for live updates
- ✅ Responsive design with Tailwind CSS

## Next Steps
1. Review ARCHITECTURE.md for detailed backend design
2. Review FRONTEND_ARCHITECTURE.md for frontend structure
3. Review IMPLEMENTATION_FLOW.md for flow diagrams
4. Start with Phase 1 backend implementation
5. Set up frontend components and API integration
6. Follow best practices outlined in architecture docs

## Notes
- All APIView classes should use async methods
- Use `httpx.AsyncClient` for async HTTP requests to meters
- Use Django's async ORM methods (`aget`, `acreate`, `asave`)
- Implement proper error handling and logging
- Follow RESTful conventions for API design

