# Implementation Flow Diagrams

## 1. Location Monitoring Flow

```
┌─────────────┐
│  Meter      │
│  Device     │
└──────┬──────┘
       │
       │ POST /api/meters/{id}/location/
       │ { latitude, longitude }
       │
       ▼
┌─────────────────────────────────┐
│  LocationReceiveAPIView         │
│  (Async)                        │
└──────┬──────────────────────────┘
       │
       │ 1. Validate coordinates
       │ 2. Get meter from DB
       │
       ▼
┌─────────────────────────────────┐
│  LocationService                │
│  - calculate_distance()         │
│  - compare_with_threshold()     │
└──────┬──────────────────────────┘
       │
       │
       ├─► Distance > Threshold?
       │   │
       │   ├─► YES
       │   │   │
       │   │   ▼
       │   │ ┌─────────────────────────────┐
       │   │ │ MeterControlService         │
       │   │ │ - send_turn_off_request()    │
       │   │ │   (async HTTP request)       │
       │   │ └──────┬───────────────────────┘
       │   │        │
       │   │        ▼
       │   │ ┌─────────────────────────────┐
       │   │ │ Update Meter Status: OFF    │
       │   │ │ Create StatusLog            │
       │   │ └─────────────────────────────┘
       │   │
       │   └─► NO
       │       │
       │       ▼
       │   ┌─────────────────────────────┐
       │   │ Update current_location     │
       │   │ Create LocationHistory       │
       │   └─────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Return Response                │
│  {                              │
│    status: "ok",                │
│    meter_status: "ON|OFF",      │
│    within_threshold: bool       │
│  }                              │
└─────────────────────────────────┘
```

## 2. Status Retrieval Flow

```
┌─────────────┐
│  Client     │
│  (Frontend) │
└──────┬──────┘
       │
       │ GET /api/meters/{id}/status/
       │
       ▼
┌─────────────────────────────────┐
│  MeterStatusAPIView             │
│  (Async)                        │
└──────┬──────────────────────────┘
       │
       │
       ▼
┌─────────────────────────────────┐
│  StatusService                  │
│  - get_meter_status()           │
│    (async HTTP to meter)        │
└──────┬──────────────────────────┘
       │
       │
       ▼
┌─────────────────────────────────┐
│  Format Response                │
│  {                              │
│    meter_id: str,               │
│    status: "ON|OFF",            │
│    color: "green|red",          │
│    last_update: datetime        │
│  }                              │
└─────────────────────────────────┘
```

## 3. System Architecture Layers

```
┌─────────────────────────────────────────────┐
│           API Layer (Views)                 │
│  - LocationReceiveAPIView (async)          │
│  - MeterStatusAPIView (async)              │
│  - MeterControlAPIView (async)             │
│  - MeterListAPIView                         │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          Services Layer                      │
│  - LocationService                          │
│  - MeterControlService                      │
│  - StatusService                            │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          Utilities Layer                     │
│  - DistanceCalculator (Haversine)           │
│  - CoordinateValidator                       │
│  - MeterCommunicator (async HTTP)           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          Models Layer                        │
│  - ElectricityMeter                          │
│  - LocationHistory                           │
│  - MeterStatusLog                            │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          Database (SQLite/PostgreSQL)        │
└─────────────────────────────────────────────┘
```

## 4. Async Operation Example

```python
# LocationReceiveAPIView
async def post(self, request, meter_id):
    # 1. Validate input (sync)
    serializer = LocationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    # 2. Get meter (async DB query)
    meter = await ElectricityMeter.objects.aget(id=meter_id)
    
    # 3. Calculate distance (sync)
    distance = LocationService.calculate_distance(
        meter.default_latitude, meter.default_longitude,
        serializer.validated_data['latitude'],
        serializer.validated_data['longitude']
    )
    
    # 4. Check threshold (sync)
    if distance > meter.threshold_distance:
        # 5. Send turn-off request (async HTTP)
        await MeterControlService.send_turn_off_request(meter)
        
        # 6. Update status (async DB)
        meter.status = 'OFF'
        await meter.asave()
        
        # 7. Log status change (async DB)
        await MeterStatusLog.objects.acreate(
            meter=meter,
            status='OFF',
            reason='LOCATION_CHANGE'
        )
    
    # 8. Update location (async DB)
    meter.current_latitude = serializer.validated_data['latitude']
    meter.current_longitude = serializer.validated_data['longitude']
    await meter.asave()
    
    # 9. Create history entry (async DB)
    await LocationHistory.objects.acreate(
        meter=meter,
        latitude=serializer.validated_data['latitude'],
        longitude=serializer.validated_data['longitude'],
        distance_from_default=distance,
        is_within_threshold=distance <= meter.threshold_distance
    )
    
    return Response({...})
```

## 5. Error Handling Flow

```
┌─────────────────────────────────┐
│  API Request                    │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Input Validation               │
│  └─► Invalid? Return 400       │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Database Query                 │
│  └─► Not Found? Return 404     │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Meter Communication            │
│  └─► Timeout/Error?             │
│      Log error, return 503      │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Success Response               │
└─────────────────────────────────┘
```

