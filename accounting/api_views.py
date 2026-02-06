from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Account, JournalEntry, JournalItem, CostCenter, FinancialPeriod
from .serializers import (
    AccountSerializer, 
    JournalEntrySerializer, 
    JournalItemSerializer, 
    CostCenterSerializer, 
    FinancialPeriodSerializer
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
