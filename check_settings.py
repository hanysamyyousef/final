
import os
import django
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acc.settings')
django.setup()

from core.models import SystemSettings

def check_settings():
    settings = SystemSettings.get_settings()
    print(f"Damaged Account: {settings.damaged_account}")
    print(f"Sales Account: {settings.sales_account}")
    print(f"Purchases Account: {settings.purchases_account}")
    print(f"VAT Percentage: {settings.vat_percentage}")
    
    # Check if damaged account is None
    if settings.damaged_account is None:
        print("ALERT: Damaged Account is None!")

if __name__ == "__main__":
    check_settings()
