
import os
import django
import json
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acc.settings')
django.setup()

from core.models import SystemSettings
from core.serializers import SystemSettingsSerializer

def test_serializer_with_empty_foreignkeys():
    print("Testing SystemSettingsSerializer with empty foreign keys...")
    
    settings_obj = SystemSettings.get_settings()
    serializer = SystemSettingsSerializer(settings_obj)
    data = serializer.data
    
    # Simulate empty strings from frontend dropdowns
    data['default_customer'] = ''
    data['default_supplier'] = ''
    data['default_safe'] = ''
    data['default_store'] = ''
    data['vat_percentage'] = '15.0' # String from input
    
    new_serializer = SystemSettingsSerializer(settings_obj, data=data)
    if new_serializer.is_valid():
        print("Serializer is valid with empty strings for foreign keys.")
    else:
        print("Serializer is INVALID!")
        print(json.dumps(new_serializer.errors, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test_serializer_with_empty_foreignkeys()
