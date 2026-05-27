from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class ElectricityMeter(models.Model):
    """Model representing an electricity meter with GPS tracking."""
    
    STATUS_CHOICES = [
        ('ON', 'On'),
        ('OFF', 'Off'),
    ]
    
    meter_id = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    
    # Default/Registered location
    default_latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        validators=[MinValueValidator(Decimal('-90')), MaxValueValidator(Decimal('90'))]
    )
    default_longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        validators=[MinValueValidator(Decimal('-180')), MaxValueValidator(Decimal('180'))]
    )
    
    # Current location (last received)
    current_latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('-90')), MaxValueValidator(Decimal('90'))]
    )
    current_longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('-180')), MaxValueValidator(Decimal('180'))]
    )
    
    status = models.CharField(max_length=3, choices=STATUS_CHOICES, default='ON')
    is_active = models.BooleanField(default=True)
    threshold_distance = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('50.00'),
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Maximum allowed distance in meters"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_location_update = models.DateTimeField(null=True, blank=True)
    
    # Additional meter data fields
    voltage = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Current RMS voltage"
    )
    current = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Current RMS current"
    )
    power = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Active power in kW"
    )
    energy = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Total energy consumed in kWh"
    )
    available_units = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        default=Decimal('0.00'),
        help_text="Available units for the meter"
    )
    last_seen = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time the meter was seen/connected"
    )
    relay_status = models.CharField(
        max_length=10,
        default='OFF',
        help_text="Relay status (ON/OFF)"
    )
    connection_status = models.CharField(
        max_length=20,
        default='OFFLINE',
        help_text="Connection status (ONLINE/OFFLINE)"
    )
    current_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        default=Decimal('0.00'),
        help_text="Current balance of the meter"
    )
    tamper = models.BooleanField(
        default=False,
        help_text="Tamper detection status"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Electricity Meter'
        verbose_name_plural = 'Electricity Meters'
    
    def __str__(self):
        return f"{self.name} ({self.meter_id})"
    
    @property
    def color(self):
        """Return color based on status."""
        return 'green' if self.status == 'ON' else 'red'
    
    @property
    def within_threshold(self):
        """Check if current location is within threshold."""
        if not self.current_latitude or not self.current_longitude:
            return True  # Assume within threshold if no current location
        
        from gps.utils import DistanceCalculator
        distance = DistanceCalculator.calculate_distance(
            float(self.default_latitude),
            float(self.default_longitude),
            float(self.current_latitude),
            float(self.current_longitude)
        )
        return distance <= float(self.threshold_distance)


class LocationHistory(models.Model):
    """Model to track location history for meters."""
    
    meter = models.ForeignKey(
        ElectricityMeter, 
        on_delete=models.CASCADE, 
        related_name='location_history'
    )
    latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        validators=[MinValueValidator(Decimal('-90')), MaxValueValidator(Decimal('90'))]
    )
    longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        validators=[MinValueValidator(Decimal('-180')), MaxValueValidator(Decimal('180'))]
    )
    distance_from_default = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Distance from default location in meters"
    )
    is_within_threshold = models.BooleanField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Location History'
        verbose_name_plural = 'Location Histories'
        indexes = [
            models.Index(fields=['meter', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.meter.meter_id} - {self.timestamp}"


class MeterStatusLog(models.Model):
    """Model to log status changes for meters."""
    
    STATUS_CHOICES = [
        ('ON', 'On'),
        ('OFF', 'Off'),
    ]
    
    REASON_CHOICES = [
        ('LOCATION_CHANGE', 'Location Change'),
        ('MANUAL', 'Manual Control'),
        ('SYSTEM', 'System Action'),
        ('METER_REPORTED', 'Meter Reported'),
    ]
    
    meter = models.ForeignKey(
        ElectricityMeter, 
        on_delete=models.CASCADE, 
        related_name='status_logs'
    )
    status = models.CharField(max_length=3, choices=STATUS_CHOICES)
    reason = models.CharField(max_length=20, choices=REASON_CHOICES, default='SYSTEM')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Meter Status Log'
        verbose_name_plural = 'Meter Status Logs'
        indexes = [
            models.Index(fields=['meter', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.meter.meter_id} - {self.status} - {self.timestamp}"
