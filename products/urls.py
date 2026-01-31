from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, api_views

router = DefaultRouter()
router.register(r'categories', api_views.CategoryViewSet)
router.register(r'units', api_views.UnitViewSet)
router.register(r'products', api_views.ProductViewSet)
router.register(r'product-units', api_views.ProductUnitViewSet)

urlpatterns = [
    # API URLs
    path('api/', include(router.urls)),
    
    # Old Category URLs
    path('categories/', views.category_list, name='category_list'),
    path('categories/add/', views.category_add, name='category_add'),
    path('categories/<int:pk>/', views.category_detail, name='category_detail'),
    path('categories/<int:pk>/edit/', views.category_edit, name='category_edit'),
    path('categories/<int:pk>/delete/', views.category_delete, name='category_delete'),

    # Unit URLs
    path('units/', views.unit_list, name='unit_list'),
    path('units/add/', views.unit_add, name='unit_add'),
    path('units/<int:pk>/edit/', views.unit_edit, name='unit_edit'),
    path('units/<int:pk>/delete/', views.unit_delete, name='unit_delete'),

    # Product URLs
    path('products/', views.product_list, name='product_list'),
    path('products/add/', views.product_add, name='product_add'),
    path('products/<int:pk>/', views.product_detail, name='product_detail'),
    path('products/<int:pk>/edit/', views.product_edit, name='product_edit'),
    path('products/<int:pk>/delete/', views.product_delete, name='product_delete'),

    # API URLs
    path('api/product/<int:product_id>/units/', views.product_units_api, name='product_units_api'),
    path('api/product/<int:product_id>/info/', views.product_info_api, name='product_info_api'),
]
