"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from game.views import PlayerViewSet, TeamViewSet, MatchViewSet, LeagueViewSet, RegisterView

# Create a router instance for DRF viewsets
router = routers.DefaultRouter()
router.register(r'players', PlayerViewSet, basename='player')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'leagues', LeagueViewSet, basename='league')
router.register(r'matches', MatchViewSet, basename='match')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include(router.urls)),
    
    # Authentication endpoints
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.register, name='register'),
    
    # DRF auth
    path('api-auth/', include('rest_framework.urls')),
]
