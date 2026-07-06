"""
Sync Fitbit data to training logs
"""
import requests
import base64
from datetime import datetime, timedelta
from base44 import app, entities, secrets

def refresh_token(refresh_token: str):
    """Refresh Fitbit access token"""
    client_id = secrets.get("FITBIT_CLIENT_ID")
    client_secret = secrets.get("FITBIT_CLIENT_SECRET")
    
    auth_string = f"{client_id}:{client_secret}"
    auth_b64 = base64.b64encode(auth_string.encode('ascii')).decode('ascii')
    
    response = requests.post(
        "https://api.fitbit.com/oauth2/token",
        headers={
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }
    )
    
    if response.status_code == 200:
        return response.json()
    return None

@app.function()
def sync_fitbit_data(user_id: str, date: str = None):
    """
    Sync Fitbit data for a specific date (defaults to today)
    Returns: heart rate, calories, steps, active minutes, sleep data
    """
    user = entities.User.get(user_id)
    
    if not user.get("fitbit_connected"):
        return {"success": False, "error": "Fitbit not connected"}
    
    access_token = user.get("fitbit_access_token")
    refresh = user.get("fitbit_refresh_token")
    
    # Refresh token if needed
    if not access_token and refresh:
        token_data = refresh_token(refresh)
        if token_data:
            access_token = token_data["access_token"]
            entities.User.update(user_id, {
                "fitbit_access_token": access_token,
                "fitbit_refresh_token": token_data["refresh_token"]
            })
        else:
            return {"success": False, "error": "Token refresh failed"}
    
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Fetch activity data
    activity_response = requests.get(
        f"https://api.fitbit.com/1/user/-/activities/date/{date}.json",
        headers=headers
    )
    
    if activity_response.status_code == 401:
        # Token expired, try refresh
        token_data = refresh_token(refresh)
        if token_data:
            access_token = token_data["access_token"]
            entities.User.update(user_id, {
                "fitbit_access_token": access_token,
                "fitbit_refresh_token": token_data["refresh_token"]
            })
            headers = {"Authorization": f"Bearer {access_token}"}
            activity_response = requests.get(
                f"https://api.fitbit.com/1/user/-/activities/date/{date}.json",
                headers=headers
            )
    
    if activity_response.status_code != 200:
        return {"success": False, "error": "Failed to fetch activity data"}
    
    activity_data = activity_response.json()
    
    # Fetch heart rate data
    hr_response = requests.get(
        f"https://api.fitbit.com/1/user/-/activities/heart/date/{date}/1d.json",
        headers=headers
    )
    
    heart_data = hr_response.json() if hr_response.status_code == 200 else {}
    
    # Fetch sleep data
    sleep_response = requests.get(
        f"https://api.fitbit.com/1.2/user/-/sleep/date/{date}.json",
        headers=headers
    )
    
    sleep_data = sleep_response.json() if sleep_response.status_code == 200 else {}
    
    # Compile results
    summary = activity_data.get("summary", {})
    hr_zones = heart_data.get("activities-heart", [{}])[0].get("value", {})
    sleep_summary = sleep_data.get("summary", {})
    
    result = {
        "success": True,
        "date": date,
        "steps": summary.get("steps", 0),
        "calories": summary.get("caloriesOut", 0),
        "active_minutes": summary.get("veryActiveMinutes", 0) + summary.get("fairlyActiveMinutes", 0),
        "resting_heart_rate": hr_zones.get("restingHeartRate", 0),
        "cardio_minutes": hr_zones.get("heartRateZones", [{}])[2].get("minutes", 0) if len(hr_zones.get("heartRateZones", [])) > 2 else 0,
        "sleep_hours": sleep_summary.get("totalMinutesAsleep", 0) / 60 if sleep_summary else 0,
        "sleep_quality": sleep_summary.get("stages", {}).get("deep", 0) if sleep_summary else 0
    }
    
    return result