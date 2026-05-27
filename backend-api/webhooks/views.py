from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from .serializers import MeterPayloadSerializer
from gps.models import ElectricityMeter, LocationHistory
from gps.utils import DistanceCalculator
import logging

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class MeterWebhookView(APIView):
    authentication_classes = [] # Allow ESP32 to send data directly without auth for now
    permission_classes = []

    def post(self, request, *args, **kwargs):
        try:
            logger.info(f"Received ESP32 webhook payload: {request.data}")
            serializer = MeterPayloadSerializer(data=request.data)
            if serializer.is_valid():
                validated_data = serializer.validated_data
                meter_id = validated_data.get('meter_id')
                
                try:
                    meter = ElectricityMeter.objects.get(meter_id=meter_id)
                except ElectricityMeter.DoesNotExist:
                    logger.error(f"Meter with ID {meter_id} not found")
                    return Response({
                        "status": "error",
                        "message": f"Meter with ID {meter_id} not found"
                    }, status=status.HTTP_404_NOT_FOUND)

                # Update meter telemetry
                meter.voltage = validated_data.get('voltage')
                meter.current = validated_data.get('current')
                meter.power = validated_data.get('power')
                meter.energy = validated_data.get('energy')
                meter.available_units = validated_data.get('units')
                meter.last_seen = timezone.now()
                
                # Check and update location if provided
                lat = validated_data.get('latitude')
                lon = validated_data.get('longitude')
                
                if lat is not None and lon is not None:
                    meter.current_latitude = lat
                    meter.current_longitude = lon
                    meter.last_location_update = timezone.now()
                    
                    # Calculate distance and check threshold
                    distance = DistanceCalculator.calculate_distance(
                        float(meter.default_latitude),
                        float(meter.default_longitude),
                        float(lat),
                        float(lon)
                    )
                    is_within_threshold = distance <= float(meter.threshold_distance)
                    
                    # Create location history
                    LocationHistory.objects.create(
                        meter=meter,
                        latitude=lat,
                        longitude=lon,
                        distance_from_default=distance,
                        is_within_threshold=is_within_threshold
                    )

                meter.save()
                
                logger.info(f"Updated telemetry for meter: {meter_id}")
                return Response({
                    "status": "success", 
                    "message": "Payload processed successfully"
                }, status=status.HTTP_200_OK)
            
            logger.error(f"Invalid payload data: {serializer.errors}")
            return Response({
                "status": "error", 
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}")
            return Response({
                "status": "error", 
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
