from rest_framework import serializers
from decimal import Decimal
from gps.models import ElectricityMeter, LocationHistory, MeterStatusLog


class LocationSerializer(serializers.Serializer):
    """Serializer for location update requests."""
    latitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=True
    )
    longitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=True
    )
    
    def validate_latitude(self, value):
        if value < Decimal('-90') or value > Decimal('90'):
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_longitude(self, value):
        if value < Decimal('-180') or value > Decimal('180'):
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value


class MeterControlSerializer(serializers.Serializer):
    """Serializer for meter control requests."""
    action = serializers.ChoiceField(choices=['ON', 'OFF'], required=True)
    reason = serializers.CharField(max_length=100, required=False, default='MANUAL')


class ElectricityMeterSerializer(serializers.ModelSerializer):
    """Serializer for ElectricityMeter model."""
    color = serializers.ReadOnlyField()
    within_threshold = serializers.ReadOnlyField()
    
    class Meta:
        model = ElectricityMeter
        fields = [
            'id',
            'meter_id',
            'name',
            'default_latitude',
            'default_longitude',
            'current_latitude',
            'current_longitude',
            'status',
            'color',
            'is_active',
            'threshold_distance',
            'within_threshold',
            'created_at',
            'updated_at',
            'last_location_update',
            'available_units',
            'last_seen',
            'relay_status',
            'connection_status',
            'current_balance',
            'tamper',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'color', 'within_threshold']


class MeterListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for meter lists."""
    color = serializers.ReadOnlyField()
    within_threshold = serializers.ReadOnlyField()
    
    class Meta:
        model = ElectricityMeter
        fields = [
            'id',
            'meter_id',
            'name',
            'status',
            'color',
            'current_latitude',
            'current_longitude',
            'within_threshold',
            'last_location_update',
            'available_units',
            'last_seen',
            'relay_status',
            'connection_status',
            'current_balance',
            'tamper',
        ]


class MapDataSerializer(serializers.ModelSerializer):
    """Serializer optimized for map display."""
    color = serializers.ReadOnlyField()
    within_threshold = serializers.ReadOnlyField()
    default_location = serializers.SerializerMethodField()
    current_location = serializers.SerializerMethodField()
    distance_from_default = serializers.SerializerMethodField()
    
    class Meta:
        model = ElectricityMeter
        fields = [
            'id',
            'meter_id',
            'name',
            'status',
            'color',
            'default_location',
            'current_location',
            'distance_from_default',
            'within_threshold',
            'threshold_distance',
        ]
    
    def get_default_location(self, obj):
        return {
            'lat': float(obj.default_latitude),
            'lng': float(obj.default_longitude)
        }
    
    def get_current_location(self, obj):
        if obj.current_latitude and obj.current_longitude:
            return {
                'lat': float(obj.current_latitude),
                'lng': float(obj.current_longitude)
            }
        return {
            'lat': float(obj.default_latitude),
            'lng': float(obj.default_longitude)
        }
    
    def get_distance_from_default(self, obj):
        if obj.current_latitude and obj.current_longitude:
            from gps.utils import DistanceCalculator
            return DistanceCalculator.calculate_distance(
                float(obj.default_latitude),
                float(obj.default_longitude),
                float(obj.current_latitude),
                float(obj.current_longitude)
            )
        return 0.0


class LocationHistorySerializer(serializers.ModelSerializer):
    """Serializer for location history."""
    
    class Meta:
        model = LocationHistory
        fields = [
            'id',
            'meter',
            'latitude',
            'longitude',
            'distance_from_default',
            'is_within_threshold',
            'timestamp',
        ]
        read_only_fields = ['id', 'timestamp']


class LocationTrailSerializer(serializers.Serializer):
    """Serializer for location trail data (for map polylines)."""
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    timestamp = serializers.DateTimeField()


class MeterStatusLogSerializer(serializers.ModelSerializer):
    """Serializer for meter status logs."""
    
    class Meta:
        model = MeterStatusLog
        fields = [
            'id',
            'meter',
            'status',
            'reason',
            'timestamp',
        ]
        read_only_fields = ['id', 'timestamp']

