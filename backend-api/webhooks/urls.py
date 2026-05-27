from django.urls import path
from .views import MeterWebhookView

urlpatterns = [
    path('esp32/', MeterWebhookView.as_view(), name='meter-webhook'),
]
