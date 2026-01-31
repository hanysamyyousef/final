from rest_framework import serializers
from .models import (
    ExpenseCategory, IncomeCategory, SafeTransaction, 
    ContactTransaction, ProductTransaction, Expense, Income,
    StoreIssue, StoreIssueItem, StoreReceive, StoreReceiveItem,
    StorePermit, StorePermitItem
)
from core.serializers import SafeSerializer, ContactSerializer, StoreSerializer
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
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)

    class Meta:
        model = SafeTransaction
        fields = '__all__'

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

    class Meta:
        model = Expense
        fields = '__all__'

class IncomeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    safe_name = serializers.CharField(source='safe.name', read_only=True)

    class Meta:
        model = Income
        fields = '__all__'
