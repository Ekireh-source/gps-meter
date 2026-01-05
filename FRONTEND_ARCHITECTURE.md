# Frontend Architecture - Next.js GPS Meter Monitoring

## Overview
The frontend is built with Next.js (App Router) and TypeScript, providing a real-time dashboard for monitoring electricity meters with interactive map visualization.

## Technology Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Map Library**: React Leaflet
- **HTTP Client**: Native Fetch API
- **State Management**: React Hooks (useState, useEffect, Context API)

## Project Structure

```
client/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                 # Dashboard/Home page
│   ├── meters/
│   │   ├── page.tsx             # Meters list page
│   │   └── [id]/
│   │       ├── page.tsx         # Meter details page
│   │       └── map/
│   │           └── page.tsx     # Meter map view
│   └── map/
│       └── page.tsx             # Full map view (all meters)
├── components/
│   ├── meters/
│   │   ├── MeterCard.tsx        # Meter status card component
│   │   ├── MeterList.tsx        # List of meters
│   │   ├── MeterStatus.tsx      # Status indicator
│   │   └── MeterDetails.tsx     # Meter detail view
│   ├── map/
│   │   ├── MeterMap.tsx         # Main map component
│   │   ├── MeterMarker.tsx      # Map marker component
│   │   ├── LocationTrail.tsx    # Location history polyline
│   │   └── ThresholdCircle.tsx  # Threshold radius circle
│   ├── charts/
│   │   ├── LocationHistory.tsx  # Location history chart
│   │   └── StatusTimeline.tsx   # Status change timeline
│   └── ui/
│       ├── StatusIndicator.tsx  # Color status indicator
│       ├── LoadingSpinner.tsx    # Loading component
│       └── ErrorMessage.tsx     # Error display
├── lib/
│   ├── api.ts                   # API client functions
│   ├── types.ts                 # TypeScript interfaces
│   └── constants.ts             # App constants
├── hooks/
│   ├── useMeters.ts             # Fetch all meters
│   ├── useMeter.ts              # Fetch single meter
│   ├── useMeterStatus.ts        # Poll meter status
│   ├── useMapData.ts            # Fetch map data
│   └── useLocationHistory.ts    # Fetch location history
├── context/
│   └── MeterContext.tsx         # Global meter state (optional)
└── public/
    └── (static assets)
```

## Key Components

### 1. MeterCard Component
Displays meter information in a card format with status indicator.

**Props:**
```typescript
interface MeterCardProps {
  meter: Meter;
  onClick?: () => void;
}
```

**Features:**
- Status indicator (green/red)
- Meter name and ID
- Last update timestamp
- Distance from default location
- Click to view details

### 2. MeterMap Component
Interactive map showing meter locations using React Leaflet.

**Props:**
```typescript
interface MeterMapProps {
  meters: Meter[];
  selectedMeterId?: string;
  showTrail?: boolean;
  showThreshold?: boolean;
}
```

**Features:**
- Multiple meter markers
- Default vs current location markers
- Location trail polyline
- Threshold radius circles
- Click markers for details
- Real-time updates

### 3. StatusIndicator Component
Color-coded status indicator (green for ON, red for OFF).

**Props:**
```typescript
interface StatusIndicatorProps {
  status: 'ON' | 'OFF';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}
```

## API Integration

### API Client (`lib/api.ts`)

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Meter {
  id: number;
  meter_id: string;
  name: string;
  status: 'ON' | 'OFF';
  color: 'green' | 'red';
  latitude: number;
  longitude: number;
  default_latitude: number;
  default_longitude: number;
  current_latitude: number;
  current_longitude: number;
  distance_from_default: number;
  within_threshold: boolean;
  last_location_update: string;
}

export async function getMeters(): Promise<Meter[]> {
  const res = await fetch(`${API_BASE}/meters/`);
  const data = await res.json();
  return data.data.meters;
}

export async function getMeter(id: string): Promise<Meter> {
  const res = await fetch(`${API_BASE}/meters/${id}/`);
  const data = await res.json();
  return data.data;
}

export async function getMeterStatus(id: string) {
  const res = await fetch(`${API_BASE}/meters/${id}/status/`);
  return res.json();
}

export async function getMapData() {
  const res = await fetch(`${API_BASE}/meters/map-data/`);
  return res.json();
}

export async function getLocationHistory(meterId: string) {
  const res = await fetch(`${API_BASE}/meters/${meterId}/location-history/`);
  return res.json();
}

export async function getLocationTrail(meterId: string) {
  const res = await fetch(`${API_BASE}/meters/${meterId}/location-trail/`);
  return res.json();
}
```

## Custom Hooks

### useMeterStatus Hook
Polls meter status at regular intervals.

```typescript
export function useMeterStatus(meterId: string, interval = 5000) {
  const [status, setStatus] = useState<'ON' | 'OFF' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getMeterStatus(meterId);
        setStatus(data.data.status);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, interval);

    return () => clearInterval(intervalId);
  }, [meterId, interval]);

  return { status, loading, error };
}
```

### useMeters Hook
Fetches all meters with optional refresh.

```typescript
export function useMeters(refreshInterval?: number) {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMeters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMeters();
      setMeters(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeters();
    
    if (refreshInterval) {
      const intervalId = setInterval(fetchMeters, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchMeters, refreshInterval]);

  return { meters, loading, error, refresh: fetchMeters };
}
```

## Pages

### 1. Dashboard (`app/page.tsx`)
- Overview of all meters
- Summary statistics
- Recent status changes
- Quick access to map view

### 2. Meters List (`app/meters/page.tsx`)
- List of all meters with cards
- Filter by status
- Search functionality
- Sort options

### 3. Meter Details (`app/meters/[id]/page.tsx`)
- Detailed meter information
- Status indicator
- Location information
- History charts
- Control buttons

### 4. Map View (`app/map/page.tsx`)
- Full-screen map
- All meters displayed
- Interactive markers
- Location trails
- Threshold circles

## Map Integration - React Leaflet

### Installation
```bash
npm install react-leaflet leaflet
npm install --save-dev @types/leaflet
```

### Setup

1. **Import Leaflet CSS** (in `app/layout.tsx` or `app/globals.css`):
```typescript
import 'leaflet/dist/leaflet.css';
```

2. **Create Map Component** (`components/map/MeterMap.tsx`):
```typescript
'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Meter } from '@/lib/types';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MeterMapProps {
  meters: Meter[];
  selectedMeterId?: string;
  showTrail?: boolean;
  showThreshold?: boolean;
}

export default function MeterMap({ meters, selectedMeterId, showTrail, showThreshold }: MeterMapProps) {
  return (
    <MapContainer
      center={[40.7128, -74.0060]} // Default center
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {meters.map((meter) => (
        <div key={meter.id}>
          {/* Default location marker */}
          <Marker
            position={[meter.default_latitude, meter.default_longitude]}
            icon={L.icon({
              iconUrl: '/marker-blue.png', // Custom blue marker
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })}
          >
            <Popup>
              <div>
                <h3>{meter.name}</h3>
                <p>Default Location</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Current location marker */}
          <Marker
            position={[meter.current_latitude, meter.current_longitude]}
            icon={L.icon({
              iconUrl: meter.status === 'ON' ? '/marker-green.png' : '/marker-red.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })}
          >
            <Popup>
              <div>
                <h3>{meter.name}</h3>
                <p>Status: {meter.status}</p>
                <p>Distance: {meter.distance_from_default.toFixed(2)}m</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Threshold circle */}
          {showThreshold && (
            <Circle
              center={[meter.default_latitude, meter.default_longitude]}
              radius={meter.threshold_distance || 50}
              pathOptions={{ color: 'orange', fillOpacity: 0.1 }}
            />
          )}
        </div>
      ))}
    </MapContainer>
  );
}
```

### Tile Providers

React Leaflet uses OpenStreetMap tiles by default (free, no API key required). Alternative providers:

- **OpenStreetMap** (default): Free, no API key
- **Mapbox**: Requires API key, better performance
- **CartoDB**: Free tier available

### Features
- ✅ Free and open-source
- ✅ Lightweight and performant
- ✅ Highly customizable
- ✅ No API key required (with OpenStreetMap)
- ✅ Good documentation and community support
- ✅ Supports markers, circles, polylines, popups

## Styling Approach

### Tailwind CSS
- Utility-first CSS framework
- Responsive design
- Custom color scheme:
  - Green: `#10b981` (ON status)
  - Red: `#ef4444` (OFF status)
  - Blue: `#3b82f6` (default)

### Component Styling
- Use CSS Modules for component-specific styles
- Tailwind utilities for layout and spacing
- Custom animations for status changes

## State Management

### Local State
- Use `useState` for component-level state
- Use `useReducer` for complex state logic

### Global State (Optional)
- React Context API for shared state
- Consider Zustand or Jotai for more complex needs

## Real-time Updates

### Polling Strategy
- Status polling: Every 5 seconds
- Location updates: Every 10 seconds
- Pause polling when tab is not visible
- Resume on tab focus

### Implementation
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Pause polling
    } else {
      // Resume polling
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

## Error Handling

### API Error Handling
- Try-catch blocks in API calls
- Error boundaries for component errors
- User-friendly error messages
- Retry logic for failed requests

### Error Display
```typescript
if (error) {
  return <ErrorMessage message="Failed to load meters. Please try again." />;
}
```

## Performance Optimization

### Code Splitting
- Dynamic imports for map components
- Lazy load heavy components

### Memoization
- `React.memo` for expensive components
- `useMemo` for computed values
- `useCallback` for event handlers

### Image Optimization
- Next.js Image component for optimized images
- Lazy loading for map tiles

## Environment Configuration

### `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
# Note: React Leaflet with OpenStreetMap doesn't require an API key
# If using Mapbox tiles, uncomment and add your key:
# NEXT_PUBLIC_MAPBOX_API_KEY=your_mapbox_key_here
```

## Testing Strategy

### Unit Tests
- Component rendering tests
- Hook tests
- Utility function tests

### Integration Tests
- API integration tests
- Map interaction tests

### E2E Tests (Optional)
- Playwright or Cypress for full user flows

## Deployment Considerations

### Build Optimization
- Production build with optimizations
- Static generation where possible
- API route caching

### Environment Variables
- Set `NEXT_PUBLIC_API_URL` for production
- Configure CORS on backend
- Set up proper error tracking

## Next Steps

1. Install React Leaflet: `npm install react-leaflet leaflet @types/leaflet`
2. Import Leaflet CSS in layout or globals.css
3. Create base components (MeterCard, StatusIndicator)
4. Implement API client
5. Build MeterMap component with React Leaflet
6. Build dashboard page
7. Implement map view with markers and circles
8. Add real-time polling
9. Style and polish UI

