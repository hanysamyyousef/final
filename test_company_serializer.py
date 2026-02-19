
import os
import django
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acc.settings')
django.setup()

from core.models import Company
from core.serializers import CompanySerializer

def test_company_serializer_with_string_logo():
    print("Testing CompanySerializer with string logo (URL)...")
    
    # Create a company if not exists
    company, created = Company.objects.get_or_create(name="Test Company")
    
    serializer = CompanySerializer(company)
    data = serializer.data
    
    # Simulate existing logo URL from frontend
    data['logo'] = "/media/company_logos/test.png"
    
    new_serializer = CompanySerializer(company, data=data)
    if new_serializer.is_valid():
        print("Serializer is valid with string logo.")
    else:
        print("Serializer is INVALID with string logo!")
        print(json.dumps(new_serializer.errors, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test_company_serializer_with_string_logo()
