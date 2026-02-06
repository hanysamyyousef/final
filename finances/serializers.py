from rest_framework import serializers
from .models import (
    ExpenseCategory, IncomeCategory, SafeTransaction, 
    ContactTransaction, ProductTransaction, Expense, Income,
    StoreIssue, StoreIssueItem, StoreReceive, StoreReceiveItem,
    StorePermit, StorePermitItem, SafeDeposit, SafeWithdrawal, MoneyTransfer,
    InventoryAdjustment, StockTransfer
)
from core.serializers import SafeSerializer, BankSerializer, ContactSerializer, StoreSerializer
from products.serializers import ProductSerializer, ProductUnitSerializer

class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = '__all__'

class IncomeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = IncomeCategory
        fields = '__all__'

class SafeTransactionSerializer(serializers.ModelSerializer):
    safe_name = serializers.CharField(source='safe.name', read_only=True)
    bank_name = serializers.CharField(source='bank.name', read_only=True)
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    
    source_id = serializers.SerializerMethodField()

    class Meta:
        model = SafeTransaction
        fields = '__all__'

    def get_source_id(self, obj):
        if hasattr(obj, 'created_by_expense'):
            return obj.created_by_expense.id
        if hasattr(obj, 'created_by_income'):
            return obj.created_by_income.id
        if hasattr(obj, 'created_by_deposit'):
            return obj.created_by_deposit.id
        if hasattr(obj, 'created_by_withdrawal'):
            return obj.created_by_withdrawal.id
        return None

class ContactTransactionSerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)

    class Meta:
        model = ContactTransaction
        fields = '__all__'

class ProductTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)

    class Meta:
        model = ProductTransaction
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    safe_name = serializers.CharField(source='safe.name', read_only=True)
    bank_name = serializers.CharField(source='bank.name', read_only=True)

    class Meta:
        model = Expense
        fields = '__all__'

class IncomeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    safe_name = serializers.CharField(source='safe.name', read_only=True)
    bank_name = serializers.CharField(source='bank.name', read_only=True)

    class Meta:
        model = Income
        fields = '__all__'

class SafeDepositSerializer(serializers.ModelSerializer):
    safe_name = serializers.CharField(source='safe.name', read_only=True)
    bank_name = serializers.CharField(source='bank.name', read_only=True)

    class Meta:
        model = SafeDeposit
        fields = '__all__'

class SafeWithdrawalSerializer(serializers.ModelSerializer):
    safe_name = serializers.CharField(source='safe.name', read_only=True)
    bank_name = serializers.CharField(source='bank.name', read_only=True)

    class Meta:
        model = SafeWithdrawal
        fields = '__all__'

class MoneyTransferSerializer(serializers.ModelSerializer):
    from_safe_name = serializers.CharField(source='from_safe.name', read_only=True)
    from_bank_name = serializers.CharField(source='from_bank.name', read_only=True)
    to_safe_name = serializers.CharField(source='to_safe.name', read_only=True)
    to_bank_name = serializers.CharField(source='to_bank.name', read_only=True)

    class Meta:
        model = MoneyTransfer
        fields = '__all__'

class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    unit_name = serializers.CharField(source='product_unit.unit.name', read_only=True)
    adjustment_type_display = serializers.CharField(source='get_adjustment_type_display', read_only=True)

    class Meta:
        model = InventoryAdjustment
        fields = '__all__'

class StockTransferSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    from_store_name = serializers.CharField(source='from_store.name', read_only=True)
    to_store_name = serializers.CharField(source='to_store.name', read_only=True)
    unit_name = serializers.CharField(source='product_unit.unit.name', read_only=True)

    class Meta:
        model = StockTransfer
        fields = '__all__'
