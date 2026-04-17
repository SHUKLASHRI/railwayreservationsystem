import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("RAILRADAR_API_KEY")
BASE_URL = os.getenv("RAILRADAR_BASE_URL", "https://api.railradar.org/api/v1")

class RailRadarService:
    @staticmethod
    def _get_headers():
        return {
            "X-API-Key": API_KEY,
            "Accept": "application/json"
        }

    @staticmethod
    def search_stations(query):
        """
        Search for stations by name or code.
        We'll use internal caching in routes for this to avoid circular imports.
        """
        url = f"{BASE_URL}/search/stations"
        params = {"query": query}
        try:
            response = requests.get(url, headers=RailRadarService._get_headers(), params=params, timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"RailRadar Station Search Error: {e}")
            return []

    @staticmethod
    def get_trains_between(source_code, dest_code, date=None):
        """Get trains between two stations."""
        url = f"{BASE_URL}/trains/between"
        params = {
            "sourceStationCode": source_code,
            "destinationStationCode": dest_code,
            "date": date
        }
        try:
            response = requests.get(url, headers=RailRadarService._get_headers(), params=params, timeout=10)
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
        url = f"{BASE_URL}/trains/{train_number}/schedule"
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
        # /api/v1/trains/{trainNumber}/live-status is the standard endpoint for real-time
        url = f"{BASE_URL}/trains/{train_number}/live-status"
        try:
            response = requests.get(url, headers=RailRadarService._get_headers(), timeout=10)
            if response.status_code == 404:
                # Fallback to instances if exact live status not available
                url = f"{BASE_URL}/trains/{train_number}/instances"
                response = requests.get(url, headers=RailRadarService._get_headers(), timeout=5)
            
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"RailRadar Live Status Error: {e}")
            return None
