// API client for GPS Meter Monitoring System

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

import type {
  Meter,
  MeterStatus,
  MapMeter,
  LocationHistory,
  LocationTrail,
  MeterStatusLog,
  ApiResponse,
  MetersListResponse,
  MapDataResponse,
  LocationUpdateRequest,
  MeterControlRequest,
} from './types';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { code: 'UNKNOWN_ERROR', message: `HTTP ${response.status}` },
    }));
    return error;
  }
  return response.json();
}

// Meter Management
export async function getMeters(): Promise<Meter[]> {
  const response = await fetch(`${API_BASE}/meters/`);
  const data: ApiResponse<MetersListResponse> = await handleResponse(response);
  if (data.status === 'success' && data.data) {
    return data.data.meters;
  }
  throw new Error(data.error?.message || 'Failed to fetch meters');
}

export async function getMeter(meterId: string): Promise<Meter> {
  const response = await fetch(`${API_BASE}/meters/${meterId}/`);
  const data: ApiResponse<Meter> = await handleResponse(response);
  if (data.status === 'success' && data.data) {
    return data.data;
  }
  throw new Error(data.error?.message || 'Failed to fetch meter');
}

export async function createMeter(meterData: Partial<Meter>): Promise<Meter> {
  const response = await fetch(`${API_BASE}/meters/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meterData),
  });
  const data: ApiResponse<Meter> = await handleResponse(response);
  if (data.status === 'success' && data.data) {
    return data.data;
  }
  throw new Error(data.error?.message || 'Failed to create meter');
}

export async function updateMeter(
  meterId: string,
  meterData: Partial<Meter>
): Promise<Meter> {
  const response = await fetch(`${API_BASE}/meters/${meterId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meterData),
  });
  const data: ApiResponse<Meter> = await handleResponse(response);
  if (data.status === 'success' && data.data) {
    return data.data;
  }
  throw new Error(data.error?.message || 'Failed to update meter');
}

export async function deleteMeter(meterId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/meters/${meterId}/`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || 'Failed to delete meter');
  }
}

// Location & Status
export async function sendLocationUpdate(
  meterId: string,
  location: LocationUpdateRequest
): Promise<ApiResponse<{
  meter_status: 'ON' | 'OFF';
  within_threshold: boolean;
  distance: number;
  action_taken?: string;
}>> {
  const response = await fetch(`${API_BASE}/meters/${meterId}/location/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(location),
  });
  return handleResponse(response);
}

export async function getMeterStatus(meterId: string): Promise<MeterStatus> {
  const response = await fetch(`${API_BASE}/meters/${meterId}/status/`);
  const data: ApiResponse<MeterStatus> = await handleResponse(response);
  if (data.status === 'success' && data.data) {
    return data.data;
  }
  throw new Error(data.error?.message || 'Failed to fetch meter status');
}

// Map Data
export async function getMapData(): Promise<MapMeter[]> {
  const response = await fetch(`${API_BASE}/meters/map-data/`);
  const data: ApiResponse<MapDataResponse> = await handleResponse(response);
  if (data.status === 'success' && data.data) {
    return data.data.meters;
  }
  throw new Error(data.error?.message || 'Failed to fetch map data');
}

// History
export async function getLocationHistory(
  meterId: string
): Promise<LocationHistory[]> {
  const response = await fetch(`${API_BASE}/meters/${meterId}/location-history/`);
  const data: ApiResponse<{ history: LocationHistory[] }> = await handleResponse(
    response
  );
  if (data.status === 'success' && data.data) {
    return data.data.history;
  }
  throw new Error(data.error?.message || 'Failed to fetch location history');
}

export async function getLocationTrail(
  meterId: string
): Promise<LocationTrail[]> {
  const response = await fetch(`${API_BASE}/meters/${meterId}/location-trail/`);
  const data: ApiResponse<{ trail: LocationTrail[] }> = await handleResponse(
    response
  );
  if (data.status === 'success' && data.data) {
    return data.data.trail;
  }
  throw new Error(data.error?.message || 'Failed to fetch location trail');
}

export async function getStatusHistory(
  meterId: string
): Promise<MeterStatusLog[]> {
  const response = await fetch(`${API_BASE}/meters/${meterId}/status-history/`);
  const data: ApiResponse<{ history: MeterStatusLog[] }> = await handleResponse(
    response
  );
  if (data.status === 'success' && data.data) {
    return data.data.history;
  }
  throw new Error(data.error?.message || 'Failed to fetch status history');
}

// Control
export async function controlMeter(
  meterId: string,
  control: MeterControlRequest
): Promise<{ meter_id: string; status: 'ON' | 'OFF'; message: string }> {
  const response = await fetch(`${API_BASE}/meters/${meterId}/control/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(control),
  });
  const data: ApiResponse<{
    meter_id: string;
    status: 'ON' | 'OFF';
    message: string;
  }> = await handleResponse(response);
  if (data.status === 'success' && data.data) {
    return data.data;
  }
  throw new Error(data.error?.message || 'Failed to control meter');
}

