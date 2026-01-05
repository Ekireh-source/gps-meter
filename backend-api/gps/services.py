import httpx
import logging
from typing import Optional, Dict, Any
from django.conf import settings
from gps.models import ElectricityMeter, LocationHistory, MeterStatusLog
from gps.utils import DistanceCalculator, CoordinateValidator

logger = logging.getLogger(__name__)


class LocationService:
    """Service for handling location-related operations."""
    
    @staticmethod
    async def process_location_update(
        meter: ElectricityMeter,
        latitude: float,
        longitude: float
    ) -> Dict[str, Any]:
        """
        Process a location update from a meter.
        
        Args:
            meter: The ElectricityMeter instance
            latitude: New latitude
            longitude: New longitude
        
        Returns:
            Dictionary with processing results
        """
        # Validate coordinates
        is_valid, error_msg = CoordinateValidator.validate_coordinates(latitude, longitude)
        if not is_valid:
            return {
                'success': False,
                'error': error_msg
            }
        
        # Calculate distance from default location
        distance = DistanceCalculator.calculate_distance(
            float(meter.default_latitude),
            float(meter.default_longitude),
            latitude,
            longitude
        )
        
        threshold = float(meter.threshold_distance)
        is_within_threshold = distance <= threshold
        
        # Update meter's current location
        meter.current_latitude = latitude
        meter.current_longitude = longitude
        from django.utils import timezone
        meter.last_location_update = timezone.now()
        await meter.asave()
        
        # Create location history entry
        await LocationHistory.objects.acreate(
            meter=meter,
            latitude=latitude,
            longitude=longitude,
            distance_from_default=distance,
            is_within_threshold=is_within_threshold
        )
        
        # If outside threshold, turn off meter
        if not is_within_threshold:
            logger.warning(
                f"Meter {meter.meter_id} moved {distance}m from default location "
                f"(threshold: {threshold}m). Turning off."
            )
            await MeterControlService.turn_off_meter(meter, reason='LOCATION_CHANGE')
        
        return {
            'success': True,
            'distance': distance,
            'within_threshold': is_within_threshold,
            'meter_status': meter.status,
            'action_taken': 'turned_off' if not is_within_threshold else None
        }


class MeterControlService:
    """Service for controlling meters (turning on/off)."""
    
    @staticmethod
    async def turn_off_meter(
        meter: ElectricityMeter,
        reason: str = 'SYSTEM'
    ) -> Dict[str, Any]:
        """
        Turn off a meter and send command to the physical device.
        
        Args:
            meter: The ElectricityMeter instance
            reason: Reason for turning off
        
        Returns:
            Dictionary with operation results
        """
        try:
            # Send command to meter device
            success = await MeterCommunicator.send_control_command(
                meter.meter_id,
                action='OFF'
            )
            
            if success:
                # Update meter status
                meter.status = 'OFF'
                await meter.asave()
                
                # Log status change
                await MeterStatusLog.objects.acreate(
                    meter=meter,
                    status='OFF',
                    reason=reason
                )
                
                logger.info(f"Meter {meter.meter_id} turned OFF. Reason: {reason}")
                return {
                    'success': True,
                    'status': 'OFF',
                    'message': 'Meter turned off successfully'
                }
            else:
                logger.error(f"Failed to send turn-off command to meter {meter.meter_id}")
                return {
                    'success': False,
                    'error': 'Failed to communicate with meter device'
                }
        except Exception as e:
            logger.exception(f"Error turning off meter {meter.meter_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    async def turn_on_meter(
        meter: ElectricityMeter,
        reason: str = 'MANUAL'
    ) -> Dict[str, Any]:
        """
        Turn on a meter and send command to the physical device.
        
        Args:
            meter: The ElectricityMeter instance
            reason: Reason for turning on
        
        Returns:
            Dictionary with operation results
        """
        try:
            # Send command to meter device
            success = await MeterCommunicator.send_control_command(
                meter.meter_id,
                action='ON'
            )
            
            if success:
                # Update meter status
                meter.status = 'ON'
                await meter.asave()
                
                # Log status change
                await MeterStatusLog.objects.acreate(
                    meter=meter,
                    status='ON',
                    reason=reason
                )
                
                logger.info(f"Meter {meter.meter_id} turned ON. Reason: {reason}")
                return {
                    'success': True,
                    'status': 'ON',
                    'message': 'Meter turned on successfully'
                }
            else:
                logger.error(f"Failed to send turn-on command to meter {meter.meter_id}")
                return {
                    'success': False,
                    'error': 'Failed to communicate with meter device'
                }
        except Exception as e:
            logger.exception(f"Error turning on meter {meter.meter_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


class StatusService:
    """Service for retrieving meter status."""
    
    @staticmethod
    async def get_meter_status(meter: ElectricityMeter) -> Dict[str, Any]:
        """
        Get current status of a meter.
        
        Args:
            meter: The ElectricityMeter instance
        
        Returns:
            Dictionary with meter status information
        """
        # Optionally query the meter device for real-time status
        # For now, we'll use the stored status
        device_status = await MeterCommunicator.get_meter_status(meter.meter_id)
        
        # Use device status if available, otherwise use stored status
        status = device_status if device_status else meter.status
        
        return {
            'meter_id': meter.meter_id,
            'name': meter.name,
            'status': status,
            'color': 'green' if status == 'ON' else 'red',
            'last_update': meter.last_location_update,
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


class MeterCommunicator:
    """Service for communicating with meter devices via HTTP."""
    
    @staticmethod
    async def send_control_command(
        meter_id: str,
        action: str
    ) -> bool:
        """
        Send control command to meter device.
        
        Args:
            meter_id: Meter identifier
            action: 'ON' or 'OFF'
        
        Returns:
            True if successful, False otherwise
        """
        base_url = getattr(settings, 'METER_API_BASE_URL', 'http://localhost:8001')
        timeout = getattr(settings, 'METER_API_TIMEOUT', 5)
        
        url = f"{base_url}/meters/{meter_id}/control"
        payload = {"action": action}
        
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return True
        except httpx.TimeoutException:
            logger.error(f"Timeout communicating with meter {meter_id}")
            return False
        except httpx.RequestError as e:
            logger.error(f"Error communicating with meter {meter_id}: {str(e)}")
            return False
        except Exception as e:
            logger.exception(f"Unexpected error communicating with meter {meter_id}: {str(e)}")
            return False
    
    @staticmethod
    async def get_meter_status(meter_id: str) -> Optional[str]:
        """
        Get status from meter device.
        
        Args:
            meter_id: Meter identifier
        
        Returns:
            Status ('ON' or 'OFF') or None if unavailable
        """
        base_url = getattr(settings, 'METER_API_BASE_URL', 'http://localhost:8001')
        timeout = getattr(settings, 'METER_API_TIMEOUT', 5)
        
        url = f"{base_url}/meters/{meter_id}/status"
        
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                return data.get('status')
        except Exception as e:
            logger.debug(f"Could not get status from meter {meter_id}: {str(e)}")
            return None

