"""
FILE: services/railradar_service.py
CONTENT: Official RailRadar API Integration
EXPLANATION: This service acts as the bridge between AeroRail and the real-world 
             Indian Railways data via the RailRadar API. It handles authentication 
             and provides methods to fetch live train status.
USE: Imported by 'routes/train.py' for real-time tracking.
"""

import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("RAILRADAR_API_KEY")
BASE_URL = os.getenv("RAILRADAR_BASE_URL", "https://api.railradar.org/api/v1")

class RailRadarService:
    """
    RAILRADAR API WRAPPER
    Explanation: Encapsulates the logic for communicating with the external RailRadar API.
    """
    @staticmethod
    def _get_headers():
        return {
            "Accept": "application/json"
        }

    @staticmethod
    def _build_url(endpoint, params=None):
        if params is None:
            params = {}
        params['apiKey'] = API_KEY
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items() if v is not None])
        return f"{BASE_URL.strip()}/{endpoint.strip('/')}?{query_string}"

    @staticmethod
    def search_stations(query):
        """Search for stations by name or code."""
        url = RailRadarService._build_url("search/stations", {"query": query})
        try:
            response = requests.get(url, headers=RailRadarService._get_headers(), timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"RailRadar Station Search Error: {e}")
            return []

    @staticmethod
    def get_trains_between(source_code, dest_code, date=None):
        """Get trains between two stations."""
        url = RailRadarService._build_url("trains/between", {
            "sourceStationCode": source_code,
            "destinationStationCode": dest_code,
            "date": date
        })
        try:
            response = requests.get(url, headers=RailRadarService._get_headers(), timeout=10)
            response.raise_for_status()
            data = response.json()
            if isinstance(data, list):
                return data
            return data.get("trains", [])
        except Exception as e:
            print(f"RailRadar Trains Between Error: {e}")
            return []

    @staticmethod
    def get_train_schedule(train_number):
        """Get schedule for a specific train."""
        url = RailRadarService._build_url(f"trains/{train_number}")
        try:
            response = requests.get(url, headers=RailRadarService._get_headers(), timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"RailRadar Schedule Error: {e}")
            return None

    @staticmethod
    def get_live_status(train_number):
        """Get live running status."""
        # Note: /api/v1/trains/{trainNumber} often returns both schedule and liveData
        url = RailRadarService._build_url(f"trains/{train_number}")
        try:
            response = requests.get(url, headers=RailRadarService._get_headers(), timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"RailRadar Live Status Error: {e}")
            return None

