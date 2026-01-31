from rest_framework import serializers
from .models import Invoice, InvoiceItem

class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    class Meta:
        model = InvoiceItem
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    safe_name = serializers.CharField(source='safe.name', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    invoice_type_display = serializers.CharField(source='get_invoice_type_display', read_only=True)
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
