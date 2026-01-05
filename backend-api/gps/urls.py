from django.urls import path
from gps import views

app_name = 'gps'

urlpatterns = [
    # Meter management
    path('meters/', views.MeterListCreateAPIView.as_view(), name='meter-list-create'),
    path('meters/<str:meter_id>/', views.MeterDetailAPIView.as_view(), name='meter-detail'),
    
    # Location tracking
    path('meters/<str:meter_id>/location/', views.LocationReceiveAPIView.as_view(), name='location-receive'),
    
    # Status
    path('meters/<str:meter_id>/status/', views.MeterStatusAPIView.as_view(), name='meter-status'),
    
    # Control
    path('meters/<str:meter_id>/control/', views.MeterControlAPIView.as_view(), name='meter-control'),
    
    # Map data
    path('meters/map-data/', views.MapDataAPIView.as_view(), name='map-data'),
    
    # History
    path('meters/<str:meter_id>/location-history/', views.LocationHistoryAPIView.as_view(), name='location-history'),
    path('meters/<str:meter_id>/location-trail/', views.LocationTrailAPIView.as_view(), name='location-trail'),
    path('meters/<str:meter_id>/status-history/', views.StatusHistoryAPIView.as_view(), name='status-history'),
]

