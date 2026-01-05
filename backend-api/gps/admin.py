from django.contrib import admin
from gps.models import ElectricityMeter, LocationHistory, MeterStatusLog


@admin.register(ElectricityMeter)
class ElectricityMeterAdmin(admin.ModelAdmin):
    list_display = ['meter_id', 'name', 'status', 'is_active', 'within_threshold', 'created_at']
    list_filter = ['status', 'is_active', 'created_at']
    search_fields = ['meter_id', 'name']
    readonly_fields = ['created_at', 'updated_at', 'last_location_update', 'color', 'within_threshold']
    fieldsets = (
        ('Basic Information', {
            'fields': ('meter_id', 'name', 'is_active')
        }),
        ('Location', {
            'fields': (
                'default_latitude', 'default_longitude',
                'current_latitude', 'current_longitude',
                'threshold_distance', 'last_location_update'
            )
        }),
        ('Status', {
            'fields': ('status', 'color', 'within_threshold')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(LocationHistory)
class LocationHistoryAdmin(admin.ModelAdmin):
    list_display = ['meter', 'latitude', 'longitude', 'distance_from_default', 'is_within_threshold', 'timestamp']
    list_filter = ['is_within_threshold', 'timestamp']
    search_fields = ['meter__meter_id', 'meter__name']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'


@admin.register(MeterStatusLog)
class MeterStatusLogAdmin(admin.ModelAdmin):
    list_display = ['meter', 'status', 'reason', 'timestamp']
    list_filter = ['status', 'reason', 'timestamp']
    search_fields = ['meter__meter_id', 'meter__name']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
