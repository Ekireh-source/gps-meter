# How to Fetch and Display Meters as Markers on the Map

## Overview

The map displays meters automatically by fetching data from the API and rendering markers for each meter.

## Step-by-Step Flow

### 1. **Page Component** (`app/map/page.tsx`)

The map page uses a custom hook to fetch meter data:

```typescript
const { meters, loading, error, refresh } = useMapData(10000);
// 10000 = refresh interval in milliseconds (10 seconds)
```

Then passes the meters to the map component:

```typescript
<MeterMap meters={meters} showThreshold={true} />
```

### 2. **Data Fetching Hook** (`hooks/useMapData.ts`)

The `useMapData` hook:
- Fetches data from the API endpoint `/api/meters/map-data/`
- Automatically refreshes at the specified interval (10 seconds)
- Returns: `{ meters, loading, error, refresh }`

```typescript
export function useMapData(refreshInterval?: number) {
  const [meters, setMeters] = useState<MapMeter[]>([]);
  // ... fetches data and returns meters array
}
```

### 3. **API Call** (`lib/api.ts`)

The `getMapData()` function:
- Makes a GET request to: `GET /api/meters/map-data/`
- Returns an array of `MapMeter` objects

Each `MapMeter` object contains:
```typescript
{
  id: number;
  meter_id: string;
  name: string;
  status: 'ON' | 'OFF';
  default_location: { lat: number; lng: number };
  current_location: { lat: number; lng: number };
  distance_from_default: number;
  within_threshold: boolean;
  threshold_distance: number;
}
```

### 4. **Rendering Markers** (`components/map/MeterMap.tsx`)

The `MeterMap` component receives the meters array and maps over it:

```typescript
{meters.map((meter) => (
  <div key={meter.id}>
    {/* Default Location Marker (Blue) */}
    <Marker
      position={[meter.default_location.lat, meter.default_location.lng]}
      icon={createDefaultIcon()}
    >
      <Popup>...</Popup>
    </Marker>

    {/* Current Location Marker (Status Color) */}
    <Marker
      position={[meter.current_location.lat, meter.current_location.lng]}
      icon={createStatusIcon(meter.status)}
    >
      <Popup>...</Popup>
    </Marker>

    {/* Threshold Circle */}
    <Circle
      center={[meter.default_location.lat, meter.default_location.lng]}
      radius={meter.threshold_distance}
    />
  </div>
))}
```

## Marker Types

### 1. **Default Location Marker** (Blue)
- Position: `meter.default_location.lat/lng`
- Color: Blue circle
- Shows: Where the meter should be

### 2. **Current Location Marker** (Green/Red)
- Position: `meter.current_location.lat/lng`
- Color: Green if `status === 'ON'`, Red if `status === 'OFF'`
- Shows: Where the meter actually is

### 3. **Threshold Circle**
- Center: Default location
- Radius: `meter.threshold_distance` (in meters)
- Color: Green if within threshold, Red if outside

## Customizing Markers

### Change Marker Icons

Edit the `createStatusIcon()` and `createDefaultIcon()` functions in `MeterMap.tsx`:

```typescript
const createStatusIcon = (status: 'ON' | 'OFF') => {
  const color = status === 'ON' ? '#10b981' : '#ef4444';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; ..."></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};
```

### Add More Marker Types

You can add additional markers by adding more `<Marker>` components inside the map function:

```typescript
{/* Example: Add a custom marker */}
<Marker position={[lat, lng]} icon={customIcon}>
  <Popup>Custom Marker Info</Popup>
</Marker>
```

## Debugging

If markers aren't showing:

1. **Check the console** for errors
2. **Verify API response**: Check if `meters` array has data
3. **Check coordinates**: Ensure lat/lng values are valid numbers
4. **Check map bounds**: The map might need to fit bounds to show markers

Add debug logging:

```typescript
useEffect(() => {
  console.log('Meters to display:', meters);
  console.log('Number of meters:', meters.length);
}, [meters]);
```

## Manual Refresh

You can manually refresh the data by calling the `refresh` function:

```typescript
const { meters, loading, error, refresh } = useMapData(10000);

// Later, in a button handler:
<button onClick={refresh}>Refresh Map</button>
```

## Summary

1. **Fetch**: `useMapData()` hook fetches from `/api/meters/map-data/`
2. **Pass**: Meters array is passed to `<MeterMap>` component
3. **Render**: Component maps over meters and creates markers
4. **Display**: Markers appear on the map with popups and circles

The entire process is automatic once the page loads!

