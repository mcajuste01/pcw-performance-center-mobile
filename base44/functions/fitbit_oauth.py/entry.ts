"""
Fitbit OAuth callback handler
"""
import requests
import base64
from base44 import app, entities, secrets

@app.function()
def fitbit_oauth_callback(code: str, user_id: str):
    """
    Exchange authorization code for access tokens
    """
    client_id = secrets.get("FITBIT_CLIENT_ID")
    client_secret = secrets.get("FITBIT_CLIENT_SECRET")
    
    # Base64 encode credentials
    auth_string = f"{client_id}:{client_secret}"
    auth_bytes = auth_string.encode('ascii')
    auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
    
    # Exchange code for tokens
    response = requests.post(
        "https://api.fitbit.com/oauth2/token",
        headers={
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data={
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": f"{app.get_app_url()}/fitbit-callback"
        }
    )
    
    if response.status_code != 200:
        return {"success": False, "error": response.text}
    
    data = response.json()
    
    # Update user with tokens
    entities.User.update(user_id, {
        "fitbit_access_token": data["access_token"],
        "fitbit_refresh_token": data["refresh_token"],
        "fitbit_user_id": data["user_id"],
        "fitbit_connected": True
    })
    
    return {"success": True, "user_id": data["user_id"]}