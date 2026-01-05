import math
from typing import Tuple
from decimal import Decimal


class DistanceCalculator:
    """Utility class for calculating distances between GPS coordinates."""
    
    EARTH_RADIUS_KM = 6371.0  # Earth's radius in kilometers
    
    @staticmethod
    def calculate_distance(
        lat1: float, 
        lon1: float, 
        lat2: float, 
        lon2: float
    ) -> float:
        """
        Calculate the distance between two GPS coordinates using Haversine formula.
        
        Args:
            lat1: Latitude of first point
            lon1: Longitude of first point
            lat2: Latitude of second point
            lon2: Longitude of second point
        
        Returns:
            Distance in meters
        """
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = (
            math.sin(dlat / 2) ** 2 +
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))
        
        # Distance in kilometers, convert to meters
        distance_km = DistanceCalculator.EARTH_RADIUS_KM * c
        distance_m = distance_km * 1000
        
        return round(distance_m, 2)
    
    @staticmethod
    def is_within_threshold(
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float,
        threshold_meters: float
    ) -> Tuple[bool, float]:
        """
        Check if two coordinates are within a threshold distance.
        
        Args:
            lat1: Latitude of first point
            lon1: Longitude of first point
            lat2: Latitude of second point
            lon2: Longitude of second point
            threshold_meters: Threshold distance in meters
        
        Returns:
            Tuple of (is_within_threshold, distance_in_meters)
        """
        distance = DistanceCalculator.calculate_distance(lat1, lon1, lat2, lon2)
        return (distance <= threshold_meters, distance)


class CoordinateValidator:
    """Utility class for validating GPS coordinates."""
    
    @staticmethod
    def validate_latitude(latitude: float) -> bool:
        """Validate latitude is between -90 and 90."""
        return -90.0 <= latitude <= 90.0
    
    @staticmethod
    def validate_longitude(longitude: float) -> bool:
        """Validate longitude is between -180 and 180."""
        return -180.0 <= longitude <= 180.0
    
    @staticmethod
    def validate_coordinates(latitude: float, longitude: float) -> Tuple[bool, str]:
        """
        Validate both latitude and longitude.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not CoordinateValidator.validate_latitude(latitude):
            return False, f"Latitude must be between -90 and 90, got {latitude}"
        
        if not CoordinateValidator.validate_longitude(longitude):
            return False, f"Longitude must be between -180 and 180, got {longitude}"
        
        return True, ""

