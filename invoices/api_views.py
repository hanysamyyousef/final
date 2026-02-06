from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from .models import Invoice, InvoiceItem
from .serializers import InvoiceSerializer, InvoiceItemSerializer

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
