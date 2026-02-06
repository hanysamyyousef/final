from rest_framework import serializers
from .models import Employee, Attendance, EmployeeLoan, Salary

class EmployeeSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = Employee
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'

class EmployeeLoanSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    safe_name = serializers.CharField(source='safe.name', read_only=True)
    
    class Meta:
        model = EmployeeLoan
        fields = '__all__'

class SalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    safe_name = serializers.CharField(source='safe.name', read_only=True)
    
    class Meta:
        model = Salary
        fields = '__all__'
