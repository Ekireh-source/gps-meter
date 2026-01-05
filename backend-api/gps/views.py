from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import Http404
from asgiref.sync import sync_to_async
import logging

from gps.models import ElectricityMeter, LocationHistory, MeterStatusLog
from gps.serializers import (
    LocationSerializer,
    MeterControlSerializer,
    ElectricityMeterSerializer,
    MeterListSerializer,
    MapDataSerializer,
    LocationHistorySerializer,
    LocationTrailSerializer,
    MeterStatusLogSerializer,
)
from gps.services import LocationService, MeterControlService, StatusService

logger = logging.getLogger(__name__)


class MeterListCreateAPIView(APIView):
    """API view for listing and creating meters."""
    
    def get(self, request):
        """Get list of all meters."""
        try:
            meters = ElectricityMeter.objects.all()
            serializer = MeterListSerializer(meters, many=True)
            return Response({
                'status': 'success',
                'data': {
                    'meters': serializer.data
                }
            })
        except Exception as e:
            logger.exception("Error fetching meters list")
            return Response({
                'status': 'error',
                'error': {
                    'code': 'FETCH_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Create a new meter."""
        try:
            serializer = ElectricityMeterSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            meter = serializer.save()
            
            # Create initial status log
            MeterStatusLog.objects.create(
                meter=meter,
                status=meter.status,
                reason='SYSTEM'
            )
            
            return Response({
                'status': 'success',
                'data': serializer.data,
                'message': 'Meter created successfully'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Error creating meter")
            return Response({
                'status': 'error',
                'error': {
                    'code': 'CREATE_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_400_BAD_REQUEST)


class MeterDetailAPIView(APIView):
    """API view for retrieving, updating, and deleting a meter."""
    
    
    def get(self, request, meter_id):
        """Get meter details."""
        try:
            try:
                meter = ElectricityMeter.objects.get(meter_id=meter_id)
            except ElectricityMeter.DoesNotExist:
                return Response({
                    'status': 'error',
                    'error': {
                        'code': 'NOT_FOUND',
                        'message': f"Meter with ID '{meter_id}' not found"
                    }
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = ElectricityMeterSerializer(meter)
            return Response({
                'status': 'success',
                'data': serializer.data
            })
        except Exception as e:
            logger.exception(f"Error fetching meter {meter_id}")
            return Response({
                'status': 'error',
                'error': {
                    'code': 'FETCH_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, meter_id):
        """Update meter."""
        try:
            try:
                meter = ElectricityMeter.objects.get(meter_id=meter_id)
            except ElectricityMeter.DoesNotExist:
                return Response({
                    'status': 'error',
                    'error': {
                        'code': 'NOT_FOUND',
                        'message': f"Meter with ID '{meter_id}' not found"
                    }
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = ElectricityMeterSerializer(meter, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            return Response({
                'status': 'success',
                'data': serializer.data,
                'message': 'Meter updated successfully'
            })
        except Exception as e:
            logger.exception(f"Error updating meter {meter_id}")
            return Response({
                'status': 'error',
                'error': {
                    'code': 'UPDATE_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, meter_id):
        """Delete meter."""
        try:
            try:
                meter = ElectricityMeter.objects.get(meter_id=meter_id)
            except ElectricityMeter.DoesNotExist:
                return Response({
                    'status': 'error',
                    'error': {
                        'code': 'NOT_FOUND',
                        'message': f"Meter with ID '{meter_id}' not found"
                    }
                }, status=status.HTTP_404_NOT_FOUND)
            
            meter.delete()
            return Response({
                'status': 'success',
                'message': 'Meter deleted successfully'
            }, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception(f"Error deleting meter {meter_id}")
            return Response({
                'status': 'error',
                'error': {
                    'code': 'DELETE_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LocationReceiveAPIView(APIView):
    """API view for receiving location updates from meters (async)."""
    
    async def post(self, request, meter_id):
        """Receive and process location update from meter."""
        try:
            # Get meter
            try:
                meter = await ElectricityMeter.objects.aget(meter_id=meter_id)
            except ElectricityMeter.DoesNotExist:
                return Response({
                    'status': 'error',
                    'error': {
                        'code': 'NOT_FOUND',
                        'message': f"Meter with ID '{meter_id}' not found"
                    }
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Validate location data (serializer is synchronous)
            def validate_location():
                serializer = LocationSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                return serializer.validated_data
            
            validated_data = await sync_to_async(validate_location)()
            
            # Process location update
            result = await LocationService.process_location_update(
                meter,
                float(validated_data['latitude']),
                float(validated_data['longitude'])
            )
            
            if not result['success']:
                return Response({
                    'status': 'error',
                    'error': {
                        'code': 'PROCESSING_ERROR',
                        'message': result.get('error', 'Failed to process location update')
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Refresh meter to get updated status
            await meter.arefresh_from_db()
            
            return Response({
                'status': 'ok',
                'meter_status': meter.status,
                'within_threshold': result['within_threshold'],
                'distance': result['distance'],
                'action_taken': result.get('action_taken')
            })
        except Exception as e:
            logger.exception(f"Error processing location update for meter {meter_id}")
            return Response({
                'status': 'error',
                'error': {
                    'code': 'SERVER_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MeterStatusAPIView(APIView):
    """API view for retrieving meter status."""
    
    def get(self, request, meter_id):
        """Get current meter status."""
        try:
            try:
                meter = ElectricityMeter.objects.get(meter_id=meter_id)
            except ElectricityMeter.DoesNotExist:
                return Response({
                    'status': 'error',
                    'error': {
                        'code': 'NOT_FOUND',
                        'message': f"Meter with ID '{meter_id}' not found"
                    }
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get status data (using stored status, async device query is optional)
            from gps.utils import DistanceCalculator
            
            status_data = {
                'meter_id': meter.meter_id,
                'name': meter.name,
                'status': meter.status,
                'color': 'green' if meter.status == 'ON' else 'red',
                'last_update': meter.last_location_update.isoformat() if meter.last_location_update else None,
                'within_threshold': meter.within_threshold,
                'distance_from_default': (
                    DistanceCalculator.calculate_distance(
                        float(meter.default_latitude),
                        float(meter.default_longitude),
                        float(meter.current_latitude) if meter.current_latitude else float(meter.default_latitude),
                        float(meter.current_longitude) if meter.current_longitude else float(meter.default_longitude)
                    ) if meter.current_latitude and meter.current_longitude else 0
                )
            }
            
            return Response({
                'status': 'success',
                'data': status_data
            })
        except Exception as e:
            logger.exception(f"Error fetching status for meter {meter_id}")
            return Response({
                'status': 'error',
                'error': {
                    'code': 'FETCH_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MeterControlAPIView(APIView):
    """API view for controlling meters (turn on/off)."""
    
    async def post(self, request, meter_id):
        """Control meter (turn on or off)."""
        try:
            try:
                meter = await ElectricityMeter.objects.aget(meter_id=meter_id)
            except ElectricityMeter.DoesNotExist:
                return Response({
                    'status': 'error',
                    'error': {
                        'code': 'NOT_FOUND',
                        'message': f"Meter with ID '{meter_id}' not found"
                    }
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Validate control data (serializer is synchronous)
            def validate_control():
                serializer = MeterControlSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                return serializer.validated_data
            
            validated_data = await sync_to_async(validate_control)()
            
            action = validated_data['action']
            reason = validated_data.get('reason', 'MANUAL')
            
            if action == 'OFF':
                result = await MeterControlService.turn_off_meter(meter, reason)
            else:
                result = await MeterControlService.turn_on_meter(meter, reason)
            
            if result['success']:
                return Response({
                    'status': 'success',
                    'data': {
                        'meter_id': meter.meter_id,
                        'status': result['status'],
                        'message': result['message']
                    }
                })
            else:
                return Response({
                    'status': 'error',
                    'error': {
                        'code': 'CONTROL_ERROR',
                        'message': result.get('error', 'Failed to control meter')
                    }
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.exception(f"Error controlling meter {meter_id}")
            return Response({
                'status': 'error',
                'error': {
                    'code': 'SERVER_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MapDataAPIView(APIView):
    """API view for getting all meters data optimized for map display."""
    
    def get(self, request):
        """Get all meters with map-optimized data."""
        try:
            meters = ElectricityMeter.objects.filter(is_active=True)
            serializer = MapDataSerializer(meters, many=True)
            return Response({
                'status': 'success',
                'data': {
                    'meters': serializer.data
                }
            })
        except Exception as e:
            logger.exception("Error fetching map data")
            return Response({
                'status': 'error',
                'error': {
                    'code': 'FETCH_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LocationHistoryAPIView(APIView):
    """API view for getting location history."""
    
    def get(self, request, meter_id):
        """Get location history for a meter."""
        try:
            try:
                meter = ElectricityMeter.objects.get(meter_id=meter_id)
            except ElectricityMeter.DoesNotExist:
                return Response({
                    'status': 'error',
                    'error': {
                        'code': 'NOT_FOUND',
                        'message': f"Meter with ID '{meter_id}' not found"
                    }
                }, status=status.HTTP_404_NOT_FOUND)
            
            history = LocationHistory.objects.filter(meter=meter).order_by('-timestamp')[:100]
            serializer = LocationHistorySerializer(history, many=True)
            
            return Response({
                'status': 'success',
                'data': {
                    'history': serializer.data
                }
            })
        except Exception as e:
            logger.exception(f"Error fetching location history for meter {meter_id}")
            return Response({
                'status': 'error',
                'error': {
                    'code': 'FETCH_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LocationTrailAPIView(APIView):
    """API view for getting location trail (for map polyline)."""
    
    def get(self, request, meter_id):
        """Get location trail for a meter."""
        try:
            try:
                meter = ElectricityMeter.objects.get(meter_id=meter_id)
            except ElectricityMeter.DoesNotExist:
                return Response({
                    'status': 'error',
                    'error': {
                        'code': 'NOT_FOUND',
                        'message': f"Meter with ID '{meter_id}' not found"
                    }
                }, status=status.HTTP_404_NOT_FOUND)
            
            history = LocationHistory.objects.filter(meter=meter).order_by('timestamp')[:100]
            
            trail = [
                {
                    'lat': float(entry.latitude),
                    'lng': float(entry.longitude),
                    'timestamp': entry.timestamp.isoformat()
                }
                for entry in history
            ]
            
            return Response({
                'status': 'success',
                'data': {
                    'trail': trail
                }
            })
        except Exception as e:
            logger.exception(f"Error fetching location trail for meter {meter_id}")
            return Response({
                'status': 'error',
                'error': {
                    'code': 'FETCH_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StatusHistoryAPIView(APIView):
    """API view for getting status change history."""
    
    def get(self, request, meter_id):
        """Get status change history for a meter."""
        try:
            try:
                meter = ElectricityMeter.objects.get(meter_id=meter_id)
            except ElectricityMeter.DoesNotExist:
                return Response({
                    'status': 'error',
                    'error': {
                        'code': 'NOT_FOUND',
                        'message': f"Meter with ID '{meter_id}' not found"
                    }
                }, status=status.HTTP_404_NOT_FOUND)
            
            logs = MeterStatusLog.objects.filter(meter=meter).order_by('-timestamp')[:100]
            serializer = MeterStatusLogSerializer(logs, many=True)
            
            return Response({
                'status': 'success',
                'data': {
                    'history': serializer.data
                }
            })
        except Exception as e:
            logger.exception(f"Error fetching status history for meter {meter_id}")
            return Response({
                'status': 'error',
                'error': {
                    'code': 'FETCH_ERROR',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

