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
    
    # إدارة الحسابات
    path('accounts/', views.account_list, name='account_list'),
    path('accounts/create/', views.account_create, name='account_create'),
    path('accounts/<int:pk>/update/', views.account_update, name='account_update'),
    
    # القيود المحاسبية
    path('entries/', views.journal_entry_list, name='journal_entry_list'),
    path('entries/create/', views.journal_entry_create, name='journal_entry_create'),
    path('entries/<int:pk>/', views.journal_entry_detail, name='journal_entry_detail'),
    path('entries/<int:pk>/post/', views.journal_entry_post, name='journal_entry_post'),
    path('entries/<int:pk>/unpost/', views.journal_entry_unpost, name='journal_entry_unpost'),
    
    path('reports/trial-balance/', views.trial_balance_view, name='trial_balance'),
    path('reports/trial-balance/export/', export_views.export_trial_balance_excel, name='export_trial_balance_excel'),
    path('reports/profit-loss/', views.profit_loss_view, name='profit_loss'),
    path('reports/profit-loss/export/', export_views.export_profit_loss_excel, name='export_profit_loss_excel'),
    path('reports/balance-sheet/', views.balance_sheet_view, name='balance_sheet'),
    path('reports/balance-sheet/export/', export_views.export_balance_sheet_excel, name='export_balance_sheet_excel'),
    path('reports/vat/', views.vat_report_view, name='vat_report'),

    # مسارات التقارير الجديدة
    path('reports/', views.report_center, name='report_center'),
    path('reports/contact-balances/', views.contact_balances_view, name='contact_balances'),
    path('reports/sales-purchase-summary/', views.sales_purchase_summary_view, name='sales_purchase_summary'),
]
