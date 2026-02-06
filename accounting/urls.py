from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, export_views, api_views

app_name = 'accounting'

router = DefaultRouter()
router.register(r'accounts', api_views.AccountViewSet)
router.register(r'cost-centers', api_views.CostCenterViewSet)
router.register(r'journal-entries', api_views.JournalEntryViewSet)
router.register(r'journal-items', api_views.JournalItemViewSet)
router.register(r'financial-periods', api_views.FinancialPeriodViewSet)
router.register(r'fixed-assets', api_views.FixedAssetViewSet)
router.register(r'reports', api_views.AccountingReportViewSet, basename='accounting-reports')

urlpatterns = [
    # API URLs
    path('api/', include(router.urls)),

    path('dashboard/', views.financial_dashboard, name='dashboard'),
    path('reports/trial-balance/', views.trial_balance_view, name='trial_balance'),
    path('reports/trial-balance/export/', export_views.export_trial_balance_excel, name='export_trial_balance_excel'),
    path('reports/profit-loss/', views.profit_loss_view, name='profit_loss'),
    path('reports/profit-loss/export/', export_views.export_profit_loss_excel, name='export_profit_loss_excel'),
    path('reports/balance-sheet/', views.balance_sheet_view, name='balance_sheet'),
    path('reports/balance-sheet/export/', export_views.export_balance_sheet_excel, name='export_balance_sheet_excel'),
    path('reports/vat/', views.vat_report_view, name='vat_report'),
]
