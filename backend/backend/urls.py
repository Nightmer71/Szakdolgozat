"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from game.views import PlayerViewSet, TeamViewSet, MatchViewSet, LeagueViewSet, DraftViewSet, RegisterView

# Create a router instance for DRF viewsets
router = routers.DefaultRouter()
router.register(r'players', PlayerViewSet, basename='player')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'leagues', LeagueViewSet, basename='league')
router.register(r'matches', MatchViewSet, basename='match')
router.register(r'drafts', DraftViewSet, basename='draft')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include(router.urls)),
    
    # Draft custom endpoints (must come before generic router)
    path('api/drafts/leagues/<int:league_id>/draft/', DraftViewSet.as_view({'get': 'get_draft', 'post': 'create_draft'}), name='draft_detail'),
    path('api/drafts/leagues/<int:league_id>/draft/start/', DraftViewSet.as_view({'post': 'start_draft'}), name='draft_start'),
    path('api/drafts/leagues/<int:league_id>/draft/pick/', DraftViewSet.as_view({'post': 'make_pick'}), name='draft_pick'),
    path('api/drafts/leagues/<int:league_id>/draft/picks/', DraftViewSet.as_view({'get': 'get_picks'}), name='draft_picks'),
    path('api/drafts/leagues/<int:league_id>/draft/available-players/', DraftViewSet.as_view({'get': 'get_available_players'}), name='available_players'),
    
    # Authentication endpoints
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view({'post': 'register'}), name='register'),
    
    # DRF auth
    path('api-auth/', include('rest_framework.urls')),
]
