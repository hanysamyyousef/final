from rest_framework import serializers
from .models import Invoice, InvoiceItem

class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    unit_name = serializers.CharField(source='product_unit.unit.name', read_only=True)
    class Meta:
        model = InvoiceItem
        exclude = ['invoice']
        read_only_fields = ['total_price', 'discount_amount', 'tax_amount', 'net_price']

class InvoiceSerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    safe_name = serializers.CharField(source='safe.name', read_only=True)
    representative_name = serializers.CharField(source='representative.name', read_only=True)
    driver_name = serializers.CharField(source='driver.name', read_only=True)
    items = InvoiceItemSerializer(many=True)
    invoice_type_display = serializers.CharField(source='get_invoice_type_display', read_only=True)
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['total_amount', 'discount_amount', 'tax_amount', 'net_amount', 'remaining_amount']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        
        # التأكد من أن الحقول التي قد تكون مفقودة لها قيم افتراضية
        validated_data.setdefault('discount_type', 'value')
        validated_data.setdefault('discount_value', 0)
        validated_data.setdefault('tax_type', 'value')
        validated_data.setdefault('tax_value', 0)
        
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        
        # إعادة حساب الإجماليات بعد إضافة البنود
        invoice.calculate_totals()
        invoice.save()
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # تحديث حقول الفاتورة
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            # حذف البنود القديمة وإضافة الجديدة
            instance.items.all().delete()
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)
            
            # إعادة حساب الإجماليات
            instance.calculate_totals()
            instance.save()
        
        return instance
