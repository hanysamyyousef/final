
import requests
import json

base_url = "http://127.0.0.1:8000"
auth = ('admin', 'admin') # Assuming default or common dev credentials if needed, but let's try without first if it's local

def test_settings_save():
    # 1. Get current settings
    print("Fetching current settings...")
    try:
        # Use session to handle potential authentication if required
        session = requests.Session()
        # If authentication is required, we might need to provide it. 
        # But let's first see if we can get a response.
        response = session.get(f"{base_url}/core/api/system-settings/current/")
        if response.status_code != 200:
            print(f"Failed to fetch settings: {response.status_code}")
            print(response.text)
            return

        settings = response.data if hasattr(response, 'data') else response.json()
        print("Current settings fetched successfully.")

        # 2. Try to save settings back
        print("Saving settings back...")
        response = session.put(f"{base_url}/core/api/system-settings/current/", json=settings)
        
        if response.status_code == 200:
            print("Settings saved successfully!")
        else:
            print(f"Failed to save settings: {response.status_code}")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_settings_save()
