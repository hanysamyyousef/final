from rest_framework import serializers
from .models import Category, Unit, Product, ProductUnit, ProductComponent, ProductCustomField, ProductCustomFieldValue
from core.models import Store

class ProductCustomFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCustomField
        fields = '__all__'

class ProductCustomFieldValueSerializer(serializers.ModelSerializer):
    custom_field_name = serializers.CharField(source='custom_field.name', read_only=True)
    class Meta:
        model = ProductCustomFieldValue
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    class Meta:
        model = Category
        fields = '__all__'

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'

class ProductComponentSerializer(serializers.ModelSerializer):
    component_product_name = serializers.CharField(source='component_product.name', read_only=True)
    component_purchase_price = serializers.SerializerMethodField()
    component_selling_price = serializers.SerializerMethodField()

    class Meta:
        model = ProductComponent
        fields = '__all__'

    def get_component_purchase_price(self, obj):
        # Get default purchase price from the component product's units
        default_unit = obj.component_product.units.filter(is_default_purchase=True).first()
        return default_unit.purchase_price if default_unit else 0

    def get_component_selling_price(self, obj):
        # Get default selling price from the component product's units
        default_unit = obj.component_product.units.filter(is_default_sale=True).first()
        return default_unit.selling_price if default_unit else 0

class ProductUnitSerializer(serializers.ModelSerializer):
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    class Meta:
        model = ProductUnit
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    default_store_name = serializers.CharField(source='default_store.name', read_only=True)
    units = ProductUnitSerializer(many=True, read_only=True)
    components = ProductComponentSerializer(many=True, read_only=True)
    custom_field_values = ProductCustomFieldValueSerializer(many=True, read_only=True)
    
    # Field to receive multiple units data
    units_data = serializers.JSONField(write_only=True, required=False)
    # Field to receive multiple components data
    components_data = serializers.JSONField(write_only=True, required=False)
    # Field to receive custom fields values
    custom_fields_data = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = '__all__'

    def create(self, validated_data):
        import json
        import logging
        logger = logging.getLogger(__name__)
        
        units_data = validated_data.pop('units_data', [])
        if isinstance(units_data, str):
            try:
                units_data = json.loads(units_data)
            except Exception as e:
                logger.error(f"Error parsing units_data: {e}")
                units_data = []
                
        components_data = validated_data.pop('components_data', [])
        if isinstance(components_data, str):
            try:
                components_data = json.loads(components_data)
            except Exception as e:
                logger.error(f"Error parsing components_data: {e}")
                components_data = []
                
        custom_fields_data = validated_data.pop('custom_fields_data', [])
        if isinstance(custom_fields_data, str):
            try:
                custom_fields_data = json.loads(custom_fields_data)
            except Exception as e:
                logger.error(f"Error parsing custom_fields_data: {e}")
                custom_fields_data = []
        
        product = super().create(validated_data)
        
        # Save Units
        for unit_item in units_data:
            if isinstance(unit_item, dict) and unit_item.get('unit'):
                ProductUnit.objects.create(
                    product=product,
                    unit_id=unit_item.get('unit'),
                    conversion_factor=unit_item.get('conversion_factor', 1),
                    purchase_price=unit_item.get('purchase_price', 0),
                    selling_price=unit_item.get('selling_price', 0),
                    wholesale_price=unit_item.get('wholesale_price', 0),
                    discount_type=unit_item.get('discount_type', 'percentage'),
                    purchase_discount=unit_item.get('purchase_discount', 0),
                    selling_discount=unit_item.get('selling_discount', 0),
                    wholesale_discount=unit_item.get('wholesale_discount', 0),
                    unit_tax_type=unit_item.get('unit_tax_type'),
                    unit_tax_value=unit_item.get('unit_tax_value'),
                    barcode=unit_item.get('barcode', ''),
                    is_default_purchase=unit_item.get('is_default_purchase', False),
                    is_default_sale=unit_item.get('is_default_sale', False)
                )
            
        # Save Components for Assembly
        if product.product_type == 'assembly' and components_data:
            for comp_item in components_data:
                if isinstance(comp_item, dict) and comp_item.get('component_product'):
                    ProductComponent.objects.create(
                        assembly_product=product,
                        component_product_id=comp_item.get('component_product'),
                        quantity=comp_item.get('quantity', 1)
                    )

        # Save Custom Fields Values
        for field_item in custom_fields_data:
            if isinstance(field_item, dict) and field_item.get('custom_field') and field_item.get('value'):
                ProductCustomFieldValue.objects.create(
                    product=product,
                    custom_field_id=field_item.get('custom_field'),
                    value=field_item.get('value')
                )
                
        return product

    def update(self, instance, validated_data):
        import json
        import logging
        logger = logging.getLogger(__name__)
        
        units_data = validated_data.pop('units_data', None)
        if units_data is not None and isinstance(units_data, str):
            try:
                units_data = json.loads(units_data)
            except Exception as e:
                logger.error(f"Error parsing units_data: {e}")
                units_data = []
                
        components_data = validated_data.pop('components_data', None)
        if components_data is not None and isinstance(components_data, str):
            try:
                components_data = json.loads(components_data)
            except Exception as e:
                logger.error(f"Error parsing components_data: {e}")
                components_data = []
                
        custom_fields_data = validated_data.pop('custom_fields_data', None)
        if custom_fields_data is not None and isinstance(custom_fields_data, str):
            try:
                custom_fields_data = json.loads(custom_fields_data)
            except Exception as e:
                logger.error(f"Error parsing custom_fields_data: {e}")
                custom_fields_data = []
        
        product = super().update(instance, validated_data)
        
        if units_data is not None:
            instance.units.all().delete()
            for unit_item in units_data:
                if isinstance(unit_item, dict) and unit_item.get('unit'):
                    ProductUnit.objects.create(
                        product=instance,
                        unit_id=unit_item.get('unit'),
                        conversion_factor=unit_item.get('conversion_factor', 1),
                        purchase_price=unit_item.get('purchase_price', 0),
                        selling_price=unit_item.get('selling_price', 0),
                        wholesale_price=unit_item.get('wholesale_price', 0),
                        discount_type=unit_item.get('discount_type', 'percentage'),
                        purchase_discount=unit_item.get('purchase_discount', 0),
                        selling_discount=unit_item.get('selling_discount', 0),
                        wholesale_discount=unit_item.get('wholesale_discount', 0),
                        unit_tax_type=unit_item.get('unit_tax_type'),
                        unit_tax_value=unit_item.get('unit_tax_value'),
                        barcode=unit_item.get('barcode', ''),
                        is_default_purchase=unit_item.get('is_default_purchase', False),
                        is_default_sale=unit_item.get('is_default_sale', False)
                    )
        
        if components_data is not None:
            instance.components.all().delete()
            if product.product_type == 'assembly':
                for comp_item in components_data:
                    if isinstance(comp_item, dict) and comp_item.get('component_product'):
                        ProductComponent.objects.create(
                            assembly_product=instance,
                            component_product_id=comp_item.get('component_product'),
                            quantity=comp_item.get('quantity', 1)
                        )

        if custom_fields_data is not None:
            instance.custom_field_values.all().delete()
            for field_item in custom_fields_data:
                if isinstance(field_item, dict) and field_item.get('custom_field') and field_item.get('value'):
                    ProductCustomFieldValue.objects.create(
                        product=instance,
                        custom_field_id=field_item.get('custom_field'),
                        value=field_item.get('value')
                    )
        
        return product
