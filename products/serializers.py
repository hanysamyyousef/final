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
    
    class Meta:
        model = Product
        fields = '__all__'
