from rest_framework import serializers
from .models import Account, JournalEntry, JournalItem, CostCenter, FinancialPeriod, FixedAsset

class AccountSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)
    
    class Meta:
        model = Account
        fields = '__all__'

class FixedAssetSerializer(serializers.ModelSerializer):
    asset_account_name = serializers.CharField(source='asset_account.name', read_only=True)
    depreciation_account_name = serializers.CharField(source='depreciation_account.name', read_only=True)
    expense_account_name = serializers.CharField(source='expense_account.name', read_only=True)
    
    class Meta:
        model = FixedAsset
        fields = '__all__'
        read_only_fields = ('current_value', 'last_depreciation_date')

    def create(self, validated_data):
        # Set initial current_value to acquisition_cost
        validated_data['current_value'] = validated_data.get('acquisition_cost')
        return super().create(validated_data)

class JournalItemSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_code = serializers.CharField(source='account.code', read_only=True)
    cost_center_name = serializers.CharField(source='cost_center.name', read_only=True)
    
    class Meta:
        model = JournalItem
        fields = '__all__'

class JournalEntrySerializer(serializers.ModelSerializer):
    items = JournalItemSerializer(many=True)
    total_debit = serializers.SerializerMethodField()
    total_credit = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalEntry
        fields = '__all__'
        
    def get_total_debit(self, obj):
        return sum(item.debit for item in obj.items.all())
        
    def get_total_credit(self, obj):
        return sum(item.credit for item in obj.items.all())

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        journal_entry = JournalEntry.objects.create(**validated_data)
        for item_data in items_data:
            JournalItem.objects.create(journal_entry=journal_entry, **item_data)
        return journal_entry

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance.entry_number = validated_data.get('entry_number', instance.entry_number)
        instance.date = validated_data.get('date', instance.date)
        instance.description = validated_data.get('description', instance.description)
        instance.reference = validated_data.get('reference', instance.reference)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                JournalItem.objects.create(journal_entry=instance, **item_data)
        
        return instance

class CostCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostCenter
        fields = '__all__'

class FinancialPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialPeriod
        fields = '__all__'
