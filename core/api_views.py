import os
import shutil
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Sum, Q, DecimalField
from django.db.models.functions import Coalesce, TruncMonth
from decimal import Decimal
from django.conf import settings as django_settings
from core.models import Company, Branch, Store, Safe, Contact, Representative, Driver, SystemSettings
from django.utils import timezone
from datetime import timedelta
from products.models import Product, Category
from invoices.models import Invoice
from employees.models import Employee

from rest_framework import viewsets, status
from rest_framework.decorators import action
from .serializers import (
    CompanySerializer, 
    BranchSerializer, 
    StoreSerializer, 
    SafeSerializer, 
    ContactSerializer,
    RepresentativeSerializer,
    DriverSerializer,
    SystemSettingsSerializer
)

class DashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = {
            'companies_count': Company.objects.count(),
            'branches_count': Branch.objects.count(),
            'stores_count': Store.objects.count(),
            'safes_count': Safe.objects.count(),
            'contacts_count': Contact.objects.count(),
            'customers_count': Contact.objects.filter(contact_type=Contact.CUSTOMER).count(),
            'suppliers_count': Contact.objects.filter(contact_type=Contact.SUPPLIER).count(),
            'products_count': Product.objects.count(),
            'categories_count': Category.objects.count(),
            'invoices_count': Invoice.objects.count(),
            'sale_invoices_count': Invoice.objects.filter(invoice_type=Invoice.SALE).count(),
            'purchase_invoices_count': Invoice.objects.filter(invoice_type=Invoice.PURCHASE).count(),
            'representatives_count': Representative.objects.count(),
            'drivers_count': Driver.objects.count(),
            'employees_count': Employee.objects.count(),
        }
        
        # إضافة أكثر العملاء تعاملاً
        top_customers = Contact.objects.filter(contact_type=Contact.CUSTOMER)\
            .annotate(
                invoice_count=Count('invoices', filter=Q(invoices__invoice_type=Invoice.SALE)),
                total_spent=Coalesce(
                    Sum('invoices__net_amount', filter=Q(invoices__invoice_type=Invoice.SALE)),
                    Decimal('0'),
                    output_field=DecimalField()
                )
            ).order_by('-total_spent')[:5]
            
        stats['top_customers'] = [
            {
                'id': c.id,
                'name': c.name,
                'invoice_count': c.invoice_count,
                'total_spent': float(c.total_spent)
            } for c in top_customers
        ]
        
        # إضافة ملخص المديونيات
        try:
            total_customers_balance = Contact.objects.filter(contact_type=Contact.CUSTOMER).aggregate(total=Sum('current_balance'))['total'] or 0
            total_suppliers_balance = Contact.objects.filter(contact_type=Contact.SUPPLIER).aggregate(total=Sum('current_balance'))['total'] or 0
            
            stats['debt_summary'] = {
                'total_customers_balance': abs(float(total_customers_balance)),
                'total_suppliers_balance': abs(float(total_suppliers_balance)),
                'total_debt': abs(float(total_customers_balance)) + abs(float(total_suppliers_balance))
            }
        except Exception as e:
            print(f"Error calculating debt summary: {e}")
            stats['debt_summary'] = {'total_customers_balance': 0, 'total_suppliers_balance': 0, 'total_debt': 0}
        
        # إضافة بيانات الرسم البياني (آخر 6 أشهر)
        try:
            six_months_ago = timezone.now() - timedelta(days=180)
            monthly_stats = Invoice.objects.filter(date__gte=six_months_ago)\
                .annotate(month=TruncMonth('date'))\
                .values('month')\
                .annotate(
                    sales=Sum('net_amount', filter=Q(invoice_type=Invoice.SALE)),
                    expenses=Sum('net_amount', filter=Q(invoice_type=Invoice.PURCHASE))
                ).order_by('month')
                
            months_map = {
                1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل', 5: 'مايو', 6: 'يونيو',
                7: 'يوليو', 8: 'أغسطس', 9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر'
            }
            
            stats['chart_data'] = [
                {
                    'name': months_map[item['month'].month] if item['month'] else 'غير معروف',
                    'sales': float(item['sales'] or 0),
                    'expenses': float(item['expenses'] or 0)
                } for item in monthly_stats
            ]
        except Exception as e:
            print(f"Error generating chart data: {e}")
            stats['chart_data'] = []
        
        return Response(stats)

class SystemSettingsViewSet(viewsets.ModelViewSet):
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return SystemSettings.get_settings()

    @action(detail=False, methods=['get'])
    def current(self, request):
        settings = SystemSettings.get_settings()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def backup(self, request):
        """إنشاء نسخة احتياطية من قاعدة البيانات"""
        try:
            # مسار قاعدة البيانات الحالية
            db_path = django_settings.BASE_DIR / 'db.sqlite3'
            
            # مجلد النسخ الاحتياطية
            backup_dir = django_settings.BASE_DIR / 'backups'
            if not os.path.exists(backup_dir):
                os.makedirs(backup_dir)
                
            # اسم ملف النسخة الاحتياطية
            timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            backup_filename = f'backup_{timestamp}.sqlite3'
            backup_path = backup_dir / backup_filename
            
            # نسخ الملف
            shutil.copy2(db_path, backup_path)
            
            return Response({
                'message': 'تم إنشاء النسخة الاحتياطية بنجاح',
                'filename': backup_filename
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f'فشل إنشاء النسخة الاحتياطية: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Branch.objects.all()
        company_id = self.request.query_params.get('company', None)
        if company_id is not None:
            queryset = queryset.filter(company_id=company_id)
        return queryset

class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated]

class SafeViewSet(viewsets.ModelViewSet):
    queryset = Safe.objects.all()
    serializer_class = SafeSerializer
    permission_classes = [IsAuthenticated]

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]

class RepresentativeViewSet(viewsets.ModelViewSet):
    queryset = Representative.objects.all()
    serializer_class = RepresentativeSerializer
    permission_classes = [IsAuthenticated]

class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [IsAuthenticated]
