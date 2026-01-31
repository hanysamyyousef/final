from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import (
    ExpenseCategory, IncomeCategory, SafeTransaction, 
    ContactTransaction, ProductTransaction, Expense, Income
)
from .serializers import (
    ExpenseCategorySerializer, IncomeCategorySerializer, SafeTransactionSerializer,
    ContactTransactionSerializer, ProductTransactionSerializer, ExpenseSerializer, IncomeSerializer
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
