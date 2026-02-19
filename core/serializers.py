from rest_framework import serializers
from .models import Company, Branch, Store, Safe, Bank, Representative, Driver, Contact, SystemSettings

class BankSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    class Meta:
        model = Bank
        fields = '__all__'

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = '__all__'

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

    def to_internal_value(self, data):
        # If logo is a string (URL), remove it from data so it's not validated as a file
        # This preserves the existing logo in the instance
        if 'logo' in data and isinstance(data['logo'], str):
            data = data.copy()
            data.pop('logo')
        return super().to_internal_value(data)

class BranchSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    class Meta:
        model = Branch
        fields = '__all__'

class StoreSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    class Meta:
        model = Store
        fields = '__all__'

class SafeSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    class Meta:
        model = Safe
        fields = '__all__'

class ContactSerializer(serializers.ModelSerializer):
    customer_account_name = serializers.CharField(source='customer_account.name', read_only=True)
    supplier_account_name = serializers.CharField(source='supplier_account.name', read_only=True)
    
    class Meta:
        model = Contact
        fields = '__all__'

class RepresentativeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Representative
        fields = '__all__'

class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = '__all__'
