from rest_framework import serializers
from .models import Account, JournalEntry, JournalItem, CostCenter, FinancialPeriod

class AccountSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)
    
    class Meta:
        model = Account
        fields = '__all__'

class JournalItemSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_code = serializers.CharField(source='account.code', read_only=True)
    cost_center_name = serializers.CharField(source='cost_center.name', read_only=True)
    
    class Meta:
        model = JournalItem
        fields = '__all__'

class JournalEntrySerializer(serializers.ModelSerializer):
    items = JournalItemSerializer(many=True, read_only=True)
    total_debit = serializers.SerializerMethodField()
    total_credit = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalEntry
        fields = '__all__'
        
    def get_total_debit(self, obj):
        return sum(item.debit for item in obj.items.all())
        
    def get_total_credit(self, obj):
        return sum(item.credit for item in obj.items.all())

class CostCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostCenter
        fields = '__all__'

class FinancialPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialPeriod
        fields = '__all__'
