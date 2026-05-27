// TypeScript types for the GPS Meter Monitoring System

export interface Meter {
  id: number;
  meter_id: string;
  name: string;
  default_latitude: number;
  default_longitude: number;
  current_latitude: number | null;
  current_longitude: number | null;
  status: 'ON' | 'OFF';
  color: 'green' | 'red';
  is_active: boolean;
  threshold_distance: number;
  within_threshold: boolean;
  created_at: string;
  updated_at: string;
  last_location_update: string | null;
  available_units: number | null;
  last_seen: string | null;
  relay_status: string;
  connection_status: string;
  current_balance: number | null;
  tamper: boolean;
  voltage: number | null;
  current: number | null;
  power: number | null;
  energy: number | null;
}

export interface MeterStatus {
  meter_id: string;
  name: string;
  status: 'ON' | 'OFF';
  color: 'green' | 'red';
  last_update: string | null;
  within_threshold: boolean;
  distance_from_default: number;
}

export interface MapMeter {
  id: number;
  meter_id: string;
  name: string;
  status: 'ON' | 'OFF';
  color: 'green' | 'red';
  default_location: {
    lat: number;
    lng: number;
  };
  current_location: {
    lat: number;
    lng: number;
  };
  distance_from_default: number;
  within_threshold: boolean;
  threshold_distance: number;
}

export interface LocationHistory {
  id: number;
  meter: number;
  latitude: number;
  longitude: number;
  distance_from_default: number;
  is_within_threshold: boolean;
  timestamp: string;
}

export interface LocationTrail {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface MeterStatusLog {
  id: number;
  meter: number;
  status: 'ON' | 'OFF';
  reason: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error' | 'ok';
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

export interface MetersListResponse {
  meters: Meter[];
}

export interface MapDataResponse {
  meters: MapMeter[];
}

export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
}

export interface MeterControlRequest {
  action: 'ON' | 'OFF';
  reason?: string;
}

