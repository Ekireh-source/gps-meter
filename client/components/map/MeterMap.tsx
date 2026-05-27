'use client';

import { useState, useEffect, useRef } from 'react';
import type { MapMeter } from '@/lib/types';

interface MeterMapProps {
  meters: MapMeter[];
  selectedMeterId?: string;
  showTrail?: boolean;
  showThreshold?: boolean;
}

export default function MeterMap({
  meters,
  selectedMeterId,
  showThreshold = true,
}: MeterMapProps) {
  const [MapComponents, setMapComponents] = useState<any>(null);
  const [Leaflet, setLeaflet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const hasFitBoundsRef = useRef(false);

  useEffect(() => {
    // Dynamically import leaflet and react-leaflet only when component mounts
    // This prevents build errors when packages aren't installed
    const loadMapLibraries = async () => {
      try {
        // @ts-ignore - Modules will be available after npm install
        const [leafletModule, reactLeafletModule] = await Promise.all([
          // @ts-ignore
          import('leaflet'),
          // @ts-ignore
          import('react-leaflet'),
        ]);

        // Import leaflet CSS
        // @ts-ignore
        await import('leaflet/dist/leaflet.css');

        // Handle exports - react-leaflet v5 uses named exports, not default
        const L = leafletModule.default || leafletModule;
        // react-leaflet v5 has named exports, not a default export
        const ReactLeaflet = reactLeafletModule;

        // Fix leaflet icons for Next.js
        if (L && L.Icon) {
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          });
        }

        setLeaflet(L);
        setMapComponents(ReactLeaflet);
        setLoading(false);
        console.log('Leaflet libraries loaded successfully', {
          hasLeaflet: !!L,
          hasReactLeaflet: !!ReactLeaflet,
          hasMapContainer: !!(ReactLeaflet?.MapContainer),
        });
      } catch (error) {
        console.error('Error loading Leaflet libraries:', error);
        console.warn('Leaflet libraries not available. Please run: npm install leaflet react-leaflet @types/leaflet');
        setLoading(false);
      }
    };

    loadMapLibraries();
  }, []);

  // Calculate center from meters or use default
  const center: [number, number] =
    meters.length > 0
      ? [
          meters[0].default_location.lat,
          meters[0].default_location.lng,
        ]
      : [40.7128, -74.0060]; // Default: New York

  // Show loading or error state if libraries aren't loaded
  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  if (!MapComponents || !Leaflet) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-2">Map libraries not available</p>
          <p className="text-sm text-gray-500 mb-4">
            Please install: npm install leaflet react-leaflet @types/leaflet
          </p>
          <p className="text-xs text-gray-400">
            Then uncomment the Leaflet CSS import in app/globals.css
          </p>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } = MapComponents;
  const L = Leaflet;

  // Debug: Log if components are available
  if (!MapContainer || !TileLayer) {
    console.error('MapContainer or TileLayer not available from react-leaflet');
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-2">Map components not available</p>
          <p className="text-sm text-gray-500">
            MapContainer: {MapContainer ? '✓' : '✗'}, TileLayer: {TileLayer ? '✓' : '✗'}
          </p>
        </div>
      </div>
    );
  }

  // Custom marker icons
  const createStatusIcon = (status: 'ON' | 'OFF') => {
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

  const createDefaultIcon = () => {
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



  // Internal component to access map instance
  function MapBoundsFitter() {
    // useMap must be called inside a component that's a child of MapContainer
    let map;
    try {
      map = useMap();
    } catch (error) {
      // useMap might not be available, skip bounds fitting
      return null;
    }

    useEffect(() => {
      if (!map || !L || meters.length === 0 || hasFitBoundsRef.current) return;

      const bounds: [number, number][] = [];

      // Collect all meter locations (default and current)
      meters.forEach((meter) => {
        bounds.push([meter.default_location.lat, meter.default_location.lng]);
        bounds.push([meter.current_location.lat, meter.current_location.lng]);
      });

      if (bounds.length > 0) {
        try {
          const latlngBounds = L.latLngBounds(bounds);
          map.fitBounds(latlngBounds, {
            padding: [50, 50], // Add padding around bounds
            maxZoom: 18, // Limit max zoom when fitting bounds
          });
          hasFitBoundsRef.current = true;
        } catch (error) {
          console.warn('Error fitting bounds:', error);
        }
      }
    }, [map, meters]);

    return null;
  }

  return (
    <div className="h-full w-full relative" style={{ minHeight: '400px' }}>
      <MapContainer
        center={center}
        zoom={13}
        minZoom={3}
        maxZoom={19}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        keyboard={true}
        zoomControl={true}
        attributionControl={true}
        // Leaflet map options from documentation
        zoomSnap={1}
        zoomDelta={1}
        wheelDebounceTime={40}
        wheelPxPerZoomLevel={60}
        trackResize={true}
        boxZoom={true}
        closePopupOnClick={true}
        // Inertia options for smooth panning
        inertia={true}
        inertiaDeceleration={3000}
        inertiaMaxSpeed={Infinity}
        easeLinearity={0.2}
        // Keyboard navigation
        keyboardPanDelta={80}
      >
        <MapBoundsFitter />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          minZoom={3}
        />

        {meters.map((meter) => (
          <div key={meter.id}>
            {/* Default Location Marker (Blue) */}
            <Marker
              position={[meter.default_location.lat, meter.default_location.lng]}
              icon={createDefaultIcon()}
              keyboard={true}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <span className="font-semibold text-xs">{meter.name} ({meter.meter_id}) <span className="text-blue-500 font-normal">[Default]</span></span>
              </Tooltip>
              <Popup
                closeButton={true}
                autoPan={true}
                autoPanPadding={[50, 50]}
              >
                <div className="p-2">
                  <h3 className="font-bold">{meter.name}</h3>
                  <p className="text-sm text-blue-600">Default Location</p>
                  <p className="text-xs text-gray-500">ID: {meter.meter_id}</p>
                </div>
              </Popup>
            </Marker>

            {/* Current Location Marker (Status Color) */}
            <Marker
              position={[meter.current_location.lat, meter.current_location.lng]}
              icon={createStatusIcon(meter.status)}
              keyboard={true}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <span className="font-semibold text-xs">{meter.name} ({meter.meter_id}) <span className="text-green-600 font-normal">[Current]</span></span>
              </Tooltip>
              <Popup
                closeButton={true}
                autoPan={true}
                autoPanPadding={[50, 50]}
              >
                <div className="p-2">
                  <h3 className="font-bold">{meter.name}</h3>
                  <p className="text-xs text-gray-500 font-semibold mb-1">ID: {meter.meter_id}</p>
                  <p
                    className={`text-sm font-semibold ${
                      meter.status === 'ON' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    Status: {meter.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    Distance: {Number(meter.distance_from_default).toFixed(2)}m
                  </p>
                  <p className="text-xs text-gray-500">
                    {meter.within_threshold
                      ? '✓ Within threshold'
                      : '✗ Outside threshold'}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Threshold Circle */}
            {showThreshold && (
              <Circle
                center={[meter.default_location.lat, meter.default_location.lng]}
                radius={meter.threshold_distance}
                pathOptions={{
                  color: meter.within_threshold ? '#10b981' : '#ef4444',
                  fillColor: meter.within_threshold ? '#10b981' : '#ef4444',
                  fillOpacity: 0.1,
                  weight: 2,
                }}
                interactive={false}
              />
            )}
          </div>
        ))}
      </MapContainer>
    </div>
  );
}
