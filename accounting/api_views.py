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
