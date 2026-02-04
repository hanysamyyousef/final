from rest_framework import serializers
from .models import Category, Unit, Product, ProductUnit
from core.models import Store

class CategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    class Meta:
        model = Category
        fields = '__all__'

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'

class ProductUnitSerializer(serializers.ModelSerializer):
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    class Meta:
        model = ProductUnit
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    default_store_name = serializers.CharField(source='default_store.name', read_only=True)
    units = ProductUnitSerializer(many=True, read_only=True)
    
    # Field to receive multiple units data
    units_data = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = '__all__'

    def create(self, validated_data):
        units_data = validated_data.pop('units_data', [])
        
        product = super().create(validated_data)
        
        for unit_item in units_data:
            ProductUnit.objects.create(
                product=product,
                unit_id=unit_item.get('unit'),
                conversion_factor=unit_item.get('conversion_factor', 1),
                purchase_price=unit_item.get('purchase_price', 0),
                selling_price=unit_item.get('selling_price', 0),
                barcode=unit_item.get('barcode', ''),
                is_default_purchase=unit_item.get('is_default_purchase', False),
                is_default_sale=unit_item.get('is_default_sale', False)
            )
        return product

    def update(self, instance, validated_data):
        units_data = validated_data.pop('units_data', None)
        
        product = super().update(instance, validated_data)
        
        if units_data is not None:
            # Simple approach: delete existing units and recreate them
            # This is safer than trying to match IDs for a complex nested update
            instance.units.all().delete()
            for unit_item in units_data:
                ProductUnit.objects.create(
                    product=instance,
                    unit_id=unit_item.get('unit'),
                    conversion_factor=unit_item.get('conversion_factor', 1),
                    purchase_price=unit_item.get('purchase_price', 0),
                    selling_price=unit_item.get('selling_price', 0),
                    barcode=unit_item.get('barcode', ''),
                    is_default_purchase=unit_item.get('is_default_purchase', False),
                    is_default_sale=unit_item.get('is_default_sale', False)
                )
            
        return product
