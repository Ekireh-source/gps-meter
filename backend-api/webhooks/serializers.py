from rest_framework import serializers


class MeterPayloadSerializer(serializers.Serializer):
    meter_id = serializers.CharField(max_length=100)
    voltage = serializers.FloatField()
    current = serializers.FloatField()
    power = serializers.FloatField()
    energy = serializers.FloatField()
    units = serializers.FloatField()
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
