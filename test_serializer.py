
import os
import django
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acc.settings')
django.setup()

from core.models import SystemSettings
from core.serializers import SystemSettingsSerializer
from rest_framework.renderers import JSONRenderer

def test_serializer_validation():
    print("Testing SystemSettingsSerializer validation...")
    
    # 1. Get current settings
    settings_obj = SystemSettings.get_settings()
    serializer = SystemSettingsSerializer(settings_obj)
    data = serializer.data
    
    print(f"Current data keys: {list(data.keys())}")
    
    # 2. Validate data
    new_serializer = SystemSettingsSerializer(settings_obj, data=data)
    if new_serializer.is_valid():
        print("Serializer is valid with current data.")
    else:
        print("Serializer is INVALID with current data!")
        print(json.dumps(new_serializer.errors, indent=2, ensure_ascii=False))

    # 3. Test with some modifications (e.g., VAT)
    data['vat_percentage'] = 15.0
    new_serializer = SystemSettingsSerializer(settings_obj, data=data)
    if new_serializer.is_valid():
        print("Serializer is valid with modified data (VAT=15).")
    else:
        print("Serializer is INVALID with modified data!")
        print(json.dumps(new_serializer.errors, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test_serializer_validation()
