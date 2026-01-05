# React Leaflet Setup Guide

## Installation

```bash
cd client
npm install react-leaflet leaflet
npm install --save-dev @types/leaflet
```

## Basic Setup

### 1. Import Leaflet CSS

Add to `app/globals.css` or `app/layout.tsx`:

```css
@import 'leaflet/dist/leaflet.css';
```

Or in `app/layout.tsx`:

```typescript
import 'leaflet/dist/leaflet.css';
```

### 2. Fix Default Marker Icons (Next.js Issue)

Leaflet markers don't work out of the box in Next.js. Create a utility file:

**`lib/leaflet-fix.ts`**
```typescript
import L from 'leaflet';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
```

Import this in your map component or layout.

### 3. Create Basic Map Component

**`components/map/MeterMap.tsx`**
```typescript
'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Meter } from '@/lib/types';
import '@/lib/leaflet-fix';

interface MeterMapProps {
  meters: Meter[];
  selectedMeterId?: string;
  showThreshold?: boolean;
}

export default function MeterMap({ meters, selectedMeterId, showThreshold = true }: MeterMapProps) {
  // Calculate center from meters or use default
  const center: [number, number] = meters.length > 0
    ? [meters[0].default_latitude, meters[0].default_longitude]
    : [40.7128, -74.0060]; // Default: New York

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {meters.map((meter) => (
          <div key={meter.id}>
            {/* Default Location Marker (Blue) */}
            <Marker
              position={[meter.default_latitude, meter.default_longitude]}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{meter.name}</h3>
                  <p className="text-sm text-blue-600">Default Location</p>
                  <p className="text-xs text-gray-500">ID: {meter.meter_id}</p>
                </div>
              </Popup>
            </Marker>

            {/* Current Location Marker (Status Color) */}
            <Marker
              position={[meter.current_latitude, meter.current_longitude]}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{meter.name}</h3>
                  <p className={`text-sm font-semibold ${
                    meter.status === 'ON' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Status: {meter.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    Distance: {meter.distance_from_default?.toFixed(2) || 0}m
                  </p>
                  <p className="text-xs text-gray-500">
                    {meter.within_threshold ? '✓ Within threshold' : '✗ Outside threshold'}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Threshold Circle */}
            {showThreshold && (
              <Circle
                center={[meter.default_latitude, meter.default_longitude]}
                radius={meter.threshold_distance || 50}
                pathOptions={{
                  color: meter.within_threshold ? '#10b981' : '#ef4444',
                  fillColor: meter.within_threshold ? '#10b981' : '#ef4444',
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
            )}
          </div>
        ))}
      </MapContainer>
    </div>
  );
}
```

### 4. Custom Status Markers

Create custom marker icons for different statuses:

**`lib/markers.ts`**
```typescript
import L from 'leaflet';

export const createStatusIcon = (status: 'ON' | 'OFF') => {
  const color = status === 'ON' ? '#10b981' : '#ef4444';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export const createDefaultIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: #3b82f6;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};
```

Then use in your map:

```typescript
import { createStatusIcon, createDefaultIcon } from '@/lib/markers';

// In Marker component:
<Marker
  position={[meter.current_latitude, meter.current_longitude]}
  icon={createStatusIcon(meter.status)}
>
```

### 5. Location Trail (Polyline)

Add location history trail:

```typescript
import { Polyline } from 'react-leaflet';

// In your map component:
{meter.locationTrail && meter.locationTrail.length > 1 && (
  <Polyline
    positions={meter.locationTrail.map(point => [point.lat, point.lng])}
    pathOptions={{
      color: '#3b82f6',
      weight: 3,
      opacity: 0.7,
    }}
  />
)}
```

## Usage in Pages

### Full Map Page

**`app/map/page.tsx`**
```typescript
'use client';

import { useEffect, useState } from 'react';
import MeterMap from '@/components/map/MeterMap';
import { getMapData } from '@/lib/api';
import { Meter } from '@/lib/types';

export default function MapPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMapData();
        setMeters(data.data.meters);
      } catch (error) {
        console.error('Failed to load map data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading map...</div>;
  }

  return (
    <div className="h-screen w-screen">
      <MeterMap meters={meters} showThreshold={true} />
    </div>
  );
}
```

### Meter Details with Map

**`app/meters/[id]/map/page.tsx`**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MeterMap from '@/components/map/MeterMap';
import { getMeter, getLocationTrail } from '@/lib/api';
import { Meter } from '@/lib/types';

export default function MeterMapPage() {
  const params = useParams();
  const meterId = params.id as string;
  const [meter, setMeter] = useState<Meter | null>(null);
  const [trail, setTrail] = useState<Array<{lat: number, lng: number}>>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [meterData, trailData] = await Promise.all([
        getMeter(meterId),
        getLocationTrail(meterId),
      ]);
      setMeter(meterData);
      setTrail(trailData.data.trail);
    };
    fetchData();
  }, [meterId]);

  if (!meter) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen">
      <MeterMap 
        meters={[meter]} 
        selectedMeterId={meterId}
        showTrail={true}
        showThreshold={true}
      />
    </div>
  );
}
```

## Styling

### Custom Map Styles

Add to `app/globals.css`:

```css
.leaflet-container {
  height: 100%;
  width: 100%;
  z-index: 1;
}

.custom-marker {
  background: transparent;
  border: none;
}
```

### Responsive Map Container

```typescript
<div className="h-[400px] w-full md:h-[600px] lg:h-screen">
  <MeterMap meters={meters} />
</div>
```

## Tile Providers

### OpenStreetMap (Default - Free, No API Key)
```typescript
<TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
```

### Mapbox (Requires API Key)
```typescript
<TileLayer
  attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
  url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_KEY}`}
/>
```

## Common Issues & Solutions

### Issue: Markers not showing
**Solution**: Import the leaflet-fix utility and ensure Leaflet CSS is imported.

### Issue: Map not rendering in Next.js
**Solution**: Make sure the component is marked with `'use client'` directive.

### Issue: Map tiles not loading
**Solution**: Check network tab, ensure CORS is properly configured, or try a different tile provider.

### Issue: SSR errors
**Solution**: Use dynamic import with `ssr: false`:

```typescript
import dynamic from 'next/dynamic';

const MeterMap = dynamic(() => import('@/components/map/MeterMap'), {
  ssr: false,
});
```

## Best Practices

1. **Always use 'use client'** for map components
2. **Import Leaflet CSS** in layout or globals
3. **Fix marker icons** for Next.js compatibility
4. **Use dynamic imports** if SSR causes issues
5. **Handle loading states** while fetching map data
6. **Implement error boundaries** for map components
7. **Optimize re-renders** with React.memo for map components
8. **Use proper TypeScript types** for coordinates

## Next Steps

1. Install React Leaflet packages
2. Set up Leaflet CSS import
3. Create leaflet-fix utility
4. Build MeterMap component
5. Integrate into pages
6. Add custom markers and styling
7. Implement location trails and threshold circles

