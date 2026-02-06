from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from .models import Invoice, InvoiceItem, Payment
from .serializers import InvoiceSerializer, InvoiceItemSerializer, PaymentSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-date')
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def post_payment(self, request, pk=None):
        payment = self.get_object()
        if payment.post_payment():
            return Response({'status': 'payment posted'})
        return Response({'error': 'could not post payment'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def unpost_payment(self, request, pk=None):
        payment = self.get_object()
        if payment.unpost_payment():
            return Response({'status': 'payment unposted'})
        return Response({'error': 'could not unpost payment'}, status=status.HTTP_400_BAD_REQUEST)

class InvoiceReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def sales_summary(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = Invoice.objects.filter(invoice_type=Invoice.SALE)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
            
        summary = queryset.aggregate(
            total_sales=Sum('net_amount'),
            total_count=Count('id'),
            total_paid=Sum('paid_amount'),
            total_remaining=Sum('remaining_amount')
        )
        
        return Response(summary)

    @action(detail=False, methods=['get'])
    def purchases_summary(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = Invoice.objects.filter(invoice_type=Invoice.PURCHASE)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
            
        summary = queryset.aggregate(
            total_purchases=Sum('net_amount'),
            total_count=Count('id'),
            total_paid=Sum('paid_amount'),
            total_remaining=Sum('remaining_amount')
        )
        
        return Response(summary)

    @action(detail=False, methods=['get'])
    def product_sales(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = InvoiceItem.objects.filter(invoice__invoice_type=Invoice.SALE)
        if start_date:
            queryset = queryset.filter(invoice__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(invoice__date__lte=end_date)
            
        report = queryset.values('product__name').annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('net_price')
        ).order_by('-total_revenue')
        
        return Response(report)

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-date')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def next_number(self, request):
        invoice_type = request.query_params.get('type', 'sale')
        
        # البحث عن كل الفواتير من هذا النوع لاستخراج أكبر رقم عددي
        all_invoices = Invoice.objects.filter(invoice_type=invoice_type)
        
        max_num = 0
        import re
        
        for inv in all_invoices:
            # استخراج الأرقام من رقم الفاتورة
            nums = re.findall(r'\d+', inv.number)
            if nums:
                # نأخذ آخر مجموعة أرقام ونحولها لرقم
                try:
                    current_num = int(nums[-1])
                    # إذا كان الرقم يبدو كطابع زمني (أكبر من 1000000000)، نتجاهله في الحساب التسلسلي
                    if current_num < 1000000000:
                        if current_num > max_num:
                            max_num = current_num
                except ValueError:
                    continue
        
        next_num = max_num + 1
        
        # تنسيق الرقم الناتج (مثلاً INV-1 أو مجرد 1)
        # سأستخدم الرقم المجرد حالياً ليكون بسيطاً كما طلب المستخدم
        return Response({'next_number': str(next_num)})

    def get_queryset(self):
        queryset = Invoice.objects.all().order_by('-date')
        invoice_type = self.request.query_params.get('type')
        if invoice_type:
            queryset = queryset.filter(invoice_type=invoice_type)
        return queryset

class InvoiceItemViewSet(viewsets.ModelViewSet):
    queryset = InvoiceItem.objects.all()
    serializer_class = InvoiceItemSerializer
    permission_classes = [IsAuthenticated]
