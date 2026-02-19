from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Category, Unit, Product, ProductUnit, ProductCustomField, ProductCustomFieldValue
from .serializers import (
    CategorySerializer, 
    UnitSerializer, 
    ProductSerializer, 
    ProductUnitSerializer,
    ProductCustomFieldSerializer,
    ProductCustomFieldValueSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

class ProductUnitViewSet(viewsets.ModelViewSet):
    queryset = ProductUnit.objects.all()
    serializer_class = ProductUnitSerializer
    permission_classes = [IsAuthenticated]

class ProductCustomFieldViewSet(viewsets.ModelViewSet):
    queryset = ProductCustomField.objects.all()
    serializer_class = ProductCustomFieldSerializer
    permission_classes = [IsAuthenticated]

class ProductCustomFieldValueViewSet(viewsets.ModelViewSet):
    queryset = ProductCustomFieldValue.objects.all()
    serializer_class = ProductCustomFieldValueSerializer
    permission_classes = [IsAuthenticated]
