from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Employee, Attendance, EmployeeLoan, Salary
from .serializers import (
    EmployeeSerializer, AttendanceSerializer, 
    EmployeeLoanSerializer, SalarySerializer
)

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

class EmployeeLoanViewSet(viewsets.ModelViewSet):
    queryset = EmployeeLoan.objects.all()
    serializer_class = EmployeeLoanSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def post_loan(self, request, pk=None):
        loan = self.get_object()
        if loan.post_loan():
            return Response({'status': 'loan posted'})
        return Response({'error': 'could not post loan'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def unpost_loan(self, request, pk=None):
        loan = self.get_object()
        if loan.unpost_loan():
            return Response({'status': 'loan unposted'})
        return Response({'error': 'could not unpost loan'}, status=status.HTTP_400_BAD_REQUEST)

class SalaryViewSet(viewsets.ModelViewSet):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def post_salary(self, request, pk=None):
        salary = self.get_object()
        if salary.post_salary():
            return Response({'status': 'salary posted'})
        return Response({'error': 'could not post salary'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def unpost_salary(self, request, pk=None):
        salary = self.get_object()
        if salary.unpost_salary():
            return Response({'status': 'salary unposted'})
        return Response({'error': 'could not unpost salary'}, status=status.HTTP_400_BAD_REQUEST)
