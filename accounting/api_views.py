from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Account, JournalEntry, JournalItem, CostCenter, FinancialPeriod, FixedAsset
from .serializers import (
    AccountSerializer, 
    JournalEntrySerializer, 
    JournalItemSerializer, 
    CostCenterSerializer, 
    FinancialPeriodSerializer,
    FixedAssetSerializer
)
from .reports import AccountingReports

class AccountingReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def trial_balance(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        cost_center_id = request.query_params.get('cost_center')
        
        report = AccountingReports.get_trial_balance(start_date, end_date, cost_center_id)
        
        # Serialize account objects in the report data
        serialized_data = []
        for item in report['data']:
            serialized_item = item.copy()
            serialized_item['account'] = AccountSerializer(item['account']).data
            serialized_data.append(serialized_item)
        
        report['data'] = serialized_data
        return Response(report)

    @action(detail=False, methods=['get'])
    def profit_loss(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        report = AccountingReports.get_profit_loss(start_date, end_date)
        
        # Serialize account objects
        report['income'] = [
            {'account': AccountSerializer(item['account']).data, 'balance': item['balance']}
            for item in report['income']
        ]
        report['expense'] = [
            {'account': AccountSerializer(item['account']).data, 'balance': item['balance']}
            for item in report['expense']
        ]
        
        return Response(report)

    @action(detail=False, methods=['get'])
    def balance_sheet(self, request):
        date = request.query_params.get('date')
        
        report = AccountingReports.get_balance_sheet(date)
        
        # Serialize account objects
        report['assets'] = [
            {'account': AccountSerializer(item['account']).data, 'balance': item['balance']}
            for item in report['assets']
        ]
        report['liabilities'] = [
            {'account': AccountSerializer(item['account']).data, 'balance': item['balance']}
            for item in report['liabilities']
        ]
        report['equity'] = [
            {'account': AccountSerializer(item['account']).data, 'balance': item['balance']}
            for item in report['equity']
        ]
        
        return Response(report)

    @action(detail=False, methods=['get'])
    def vat_report(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        report = AccountingReports.get_vat_report(start_date, end_date)
        
        # Serialize account objects if they exist in the report (check AccountingReports.get_vat_report implementation)
        if 'input_vat_details' in report:
            for item in report['input_vat_details']:
                if 'account' in item:
                    item['account'] = AccountSerializer(item['account']).data
        if 'output_vat_details' in report:
            for item in report['output_vat_details']:
                if 'account' in item:
                    item['account'] = AccountSerializer(item['account']).data
                    
        return Response(report)

    @action(detail=False, methods=['get'])
    def general_ledger(self, request):
        account_id = request.query_params.get('account')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        cost_center_id = request.query_params.get('cost_center')
        
        if not account_id:
            return Response({'error': 'Account ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        report = AccountingReports.get_general_ledger(account_id, start_date, end_date, cost_center_id)
        
        if not report:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Serialize account object
        report['account'] = AccountSerializer(report['account']).data
        
        return Response(report)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        from django.db.models import Sum
        from django.utils import timezone
        
        # 1. إجمالي الأصول والخصوم
        assets = Account.objects.filter(account_type='asset', parent=None).aggregate(total=Sum('balance'))['total'] or 0
        liabilities = Account.objects.filter(account_type='liability', parent=None).aggregate(total=Sum('balance'))['total'] or 0
        
        # 2. صافي الربح لهذا الشهر
        this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0)
        income = JournalItem.objects.filter(
            account__account_type='income',
            journal_entry__date__gte=this_month_start,
            journal_entry__is_posted=True
        ).aggregate(total=Sum('credit'))['total'] or 0
        
        expenses = JournalItem.objects.filter(
            account__account_type='expense',
            journal_entry__date__gte=this_month_start,
            journal_entry__is_posted=True
        ).aggregate(total=Sum('debit'))['total'] or 0
        
        return Response({
            'assets': float(assets),
            'liabilities': float(liabilities),
            'income': float(income),
            'expenses': float(expenses),
            'net_profit': float(income - expenses)
        })

class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]

class JournalEntryViewSet(viewsets.ModelViewSet):
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def post_entry(self, request, pk=None):
        entry = self.get_object()
        try:
            if entry.post():
                return Response({'status': 'entry posted'})
            return Response({'status': 'entry already posted'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def unpost_entry(self, request, pk=None):
        entry = self.get_object()
        try:
            if entry.unpost():
                return Response({'status': 'entry unposted'})
            return Response({'status': 'entry already unposted'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class JournalItemViewSet(viewsets.ModelViewSet):
    queryset = JournalItem.objects.all()
    serializer_class = JournalItemSerializer
    permission_classes = [IsAuthenticated]

class CostCenterViewSet(viewsets.ModelViewSet):
    queryset = CostCenter.objects.all()
    serializer_class = CostCenterSerializer
    permission_classes = [IsAuthenticated]

class FinancialPeriodViewSet(viewsets.ModelViewSet):
    queryset = FinancialPeriod.objects.all()
    serializer_class = FinancialPeriodSerializer
    permission_classes = [IsAuthenticated]

class FixedAssetViewSet(viewsets.ModelViewSet):
    queryset = FixedAsset.objects.all()
    serializer_class = FixedAssetSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def run_depreciation(self, request, pk=None):
        asset = self.get_object()
        target_date_str = request.data.get('date')
        target_date = None
        
        if target_date_str:
            try:
                from django.utils import timezone
                target_date = timezone.datetime.strptime(target_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        
        entry = asset.post_depreciation(target_date)
        if entry:
            return Response({
                'status': 'depreciation posted',
                'entry_id': entry.id,
                'entry_number': entry.entry_number,
                'amount': float(asset.calculate_depreciation(target_date)) # Note: amount calculation might need to be called before post if we want exact value returned, but here it's already posted.
            })
        return Response({'status': 'no depreciation due'}, status=status.HTTP_200_OK)
