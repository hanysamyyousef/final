from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import (
    ExpenseCategory, IncomeCategory, SafeTransaction, 
    ContactTransaction, ProductTransaction, Expense, Income,
    SafeDeposit, SafeWithdrawal, MoneyTransfer,
    InventoryAdjustment, StockTransfer
)
from .serializers import (
    ExpenseCategorySerializer, IncomeCategorySerializer, SafeTransactionSerializer,
    ContactTransactionSerializer, ProductTransactionSerializer, ExpenseSerializer, IncomeSerializer,
    SafeDepositSerializer, SafeWithdrawalSerializer, MoneyTransferSerializer,
    InventoryAdjustmentSerializer, StockTransferSerializer
)

class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated]

class IncomeCategoryViewSet(viewsets.ModelViewSet):
    queryset = IncomeCategory.objects.all()
    serializer_class = IncomeCategorySerializer
    permission_classes = [IsAuthenticated]

class SafeTransactionViewSet(viewsets.ModelViewSet):
    queryset = SafeTransaction.objects.all()
    serializer_class = SafeTransactionSerializer
    permission_classes = [IsAuthenticated]

class ContactTransactionViewSet(viewsets.ModelViewSet):
    queryset = ContactTransaction.objects.all()
    serializer_class = ContactTransactionSerializer
    permission_classes = [IsAuthenticated]

class ProductTransactionViewSet(viewsets.ModelViewSet):
    queryset = ProductTransaction.objects.all()
    serializer_class = ProductTransactionSerializer
    permission_classes = [IsAuthenticated]

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def post_expense(self, request, pk=None):
        expense = self.get_object()
        if expense.post():
            return Response({'status': 'expense posted'})
        return Response({'error': 'could not post expense'}, status=status.HTTP_400_BAD_REQUEST)

class IncomeViewSet(viewsets.ModelViewSet):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def post_income(self, request, pk=None):
        income = self.get_object()
        if income.post():
            return Response({'status': 'income posted'})
        return Response({'error': 'could not post income'}, status=status.HTTP_400_BAD_REQUEST)

class SafeDepositViewSet(viewsets.ModelViewSet):
    queryset = SafeDeposit.objects.all()
    serializer_class = SafeDepositSerializer
    permission_classes = [IsAuthenticated]

class SafeWithdrawalViewSet(viewsets.ModelViewSet):
    queryset = SafeWithdrawal.objects.all()
    serializer_class = SafeWithdrawalSerializer
    permission_classes = [IsAuthenticated]

class MoneyTransferViewSet(viewsets.ModelViewSet):
    queryset = MoneyTransfer.objects.all()
    serializer_class = MoneyTransferSerializer
    permission_classes = [IsAuthenticated]

class InventoryAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = InventoryAdjustment.objects.all().order_by('-date')
    serializer_class = InventoryAdjustmentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def post_adjustment(self, request, pk=None):
        adjustment = self.get_object()
        try:
            adjustment.post_adjustment()
            return Response({'status': 'Adjustment posted successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StockTransferViewSet(viewsets.ModelViewSet):
    queryset = StockTransfer.objects.all().order_by('-date')
    serializer_class = StockTransferSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def post_transfer(self, request, pk=None):
        transfer = self.get_object()
        try:
            transfer.post_transfer()
            return Response({'status': 'Transfer posted successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
