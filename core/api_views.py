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
from django.db import transaction
from django.db.models.deletion import ProtectedError
from core.models import Company, Branch, Store, Safe, Bank, Contact, Representative, Driver, SystemSettings
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
    BankSerializer,
    ContactSerializer,
    RepresentativeSerializer,
    DriverSerializer,
    SystemSettingsSerializer
)

class BankViewSet(viewsets.ModelViewSet):
    queryset = Bank.objects.all()
    serializer_class = BankSerializer
    permission_classes = [IsAuthenticated]

class DashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = {
            'companies_count': Company.objects.count(),
            'branches_count': Branch.objects.count(),
            'stores_count': Store.objects.count(),
            'safes_count': Safe.objects.count(),
            'contacts_count': Contact.objects.count(),
            'customers_count': Contact.objects.filter(contact_type__in=[Contact.CUSTOMER, Contact.BOTH]).count(),
            'suppliers_count': Contact.objects.filter(contact_type__in=[Contact.SUPPLIER, Contact.BOTH]).count(),
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
        top_customers = Contact.objects.filter(contact_type__in=[Contact.CUSTOMER, Contact.BOTH])\
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
            total_customers_balance = Contact.objects.filter(contact_type__in=[Contact.CUSTOMER, Contact.BOTH]).aggregate(total=Sum('current_balance'))['total'] or 0
            total_suppliers_balance = Contact.objects.filter(contact_type__in=[Contact.SUPPLIER, Contact.BOTH]).aggregate(total=Sum('current_supplier_balance'))['total'] or 0
            
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

    @action(detail=False, methods=['get', 'put', 'patch'])
    def current(self, request):
        settings = SystemSettings.get_settings()
        if request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(settings, data=request.data, partial=request.method == 'PATCH')
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
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

    def get_queryset(self):
        queryset = Contact.objects.all()
        contact_type = self.request.query_params.get('contact_type')
        if contact_type:
            if contact_type == 'customer':
                queryset = queryset.filter(contact_type__in=[Contact.CUSTOMER, Contact.BOTH])
            elif contact_type == 'supplier':
                queryset = queryset.filter(contact_type__in=[Contact.SUPPLIER, Contact.BOTH])
            else:
                queryset = queryset.filter(contact_type=contact_type)
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # التحقق من وجود بيانات مرتبطة في الموديلات المختلفة
        # 1. الفواتير
        if instance.invoices.exists():
            return Response(
                {"error": "لا يمكن حذف جهة الاتصال لوجود فواتير مرتبطة بها."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 2. السندات (القبض والصرف)
        if instance.payments.exists():
            return Response(
                {"error": "لا يمكن حذف جهة الاتصال لوجود سندات قبض أو صرف مرتبطة بها."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 3. حركات الحساب
        if instance.transactions.exists():
            return Response(
                {"error": "لا يمكن حذف جهة الاتصال لوجود حركات مالية مسجلة في كشف حسابها."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 4. المصروفات
        if hasattr(instance, 'expenses') and instance.expenses.exists():
            return Response(
                {"error": "لا يمكن حذف جهة الاتصال لوجود مصروفات مرتبطة بها."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 5. الإيرادات
        if hasattr(instance, 'incomes') and instance.incomes.exists():
            return Response(
                {"error": "لا يمكن حذف جهة الاتصال لوجود إيرادات مرتبطة بها."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 6. إعدادات النظام (العميل/المورد الافتراضي)
        settings = SystemSettings.get_settings()
        if settings.default_customer == instance or settings.default_supplier == instance:
            return Response(
                {"error": "لا يمكن حذف جهة الاتصال لأنها محددة كجهة افتراضية في إعدادات النظام."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 7. التحقق من الحسابات المحاسبية المرتبطة ووجود قيود عليها
        accounts_to_delete = []
        for account_field in ['customer_account', 'supplier_account', 'account']:
            acc = getattr(instance, account_field)
            if acc:
                if acc.journal_items.exists():
                    return Response(
                        {"error": f"لا يمكن حذف جهة الاتصال لوجود قيود محاسبية مسجلة على حسابها: {acc.name}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                accounts_to_delete.append(acc)

        try:
            # تنفيذ عملية الحذف لجهة الاتصال
            # الحسابات المرتبطة سيتم التعامل معها عبر إشارة post_delete في signals.py
            return super().destroy(request, *args, **kwargs)
                
        except ProtectedError as e:
            # في حال وجود علاقة PROTECT لم يتم اكتشافها في الفحوصات السابقة
            protected_objs = list(e.protected_objects)
            obj_names = [str(obj) for obj in protected_objs[:3]]
            error_msg = f"لا يمكن حذف جهة الاتصال لوجود بيانات مرتبطة بها في: {', '.join(obj_names)}"
            if len(protected_objs) > 3:
                error_msg += " ..."
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"حدث خطأ غير متوقع أثناء الحذف: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RepresentativeViewSet(viewsets.ModelViewSet):
    queryset = Representative.objects.all()
    serializer_class = RepresentativeSerializer
    permission_classes = [IsAuthenticated]

class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [IsAuthenticated]
