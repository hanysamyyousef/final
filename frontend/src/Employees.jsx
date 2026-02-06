import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from './api';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Briefcase,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Save,
  DollarSign,
  CreditCard,
  Wallet,
  FileText,
  RotateCcw,
  CheckCircle,
  PlusCircle,
  History,
  ShieldCheck
} from 'lucide-react';

const Employees = () => {
  const { sub } = useParams();
  
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loans, setLoans] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [safes, setSafes] = useState([]);
  const [activeTab, setActiveTab] = useState(sub === 'attendance' ? 'attendance' : sub === 'salaries' ? 'salaries' : 'employees');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (sub) {
      setActiveTab(sub === 'attendance' ? 'attendance' : sub === 'salaries' ? 'salaries' : 'employees');
    }
  }, [sub]);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [editingLoan, setEditingLoan] = useState(null);
  const [editingSalary, setEditingSalary] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    national_id: '',
    phone: '',
    address: '',
    job_title: '',
    department: '',
    hire_date: new Date().toISOString().split('T')[0],
    salary: 0,
    status: 'active',
    notes: ''
  });

  const [attendanceFormData, setAttendanceFormData] = useState({
    employee: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    check_in: '09:00',
    check_out: '17:00',
    notes: ''
  });

  const [loanFormData, setLoanFormData] = useState({
    employee: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    safe: ''
  });

  const [salaryFormData, setSalaryFormData] = useState({
    employee: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    base_salary: 0,
    deductions: 0,
    loans_deduction: 0,
    safe: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, attRes, loanRes, salRes, safeRes] = await Promise.all([
        api.get('/employees/api/employees/'),
        api.get('/employees/api/attendance/'),
        api.get('/employees/api/loans/'),
        api.get('/employees/api/salaries/'),
        api.get('/finances/api/safes/')
      ]);
      setEmployees(empRes.data);
      setAttendanceRecords(attRes.data);
      setLoans(loanRes.data);
      setSalaries(salRes.data);
      setSafes(safeRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name || '',
        national_id: employee.national_id || '',
        phone: employee.phone || '',
        address: employee.address || '',
        job_title: employee.job_title || '',
        department: employee.department || '',
        hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
        salary: employee.salary || 0,
        status: employee.status || 'active',
        notes: employee.notes || ''
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        national_id: '',
        phone: '',
        address: '',
        job_title: '',
        department: '',
        hire_date: new Date().toISOString().split('T')[0],
        salary: 0,
        status: 'active',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenAttendanceModal = (attendance = null) => {
    if (attendance) {
      setEditingAttendance(attendance);
      setAttendanceFormData({
        employee: attendance.employee || '',
        date: attendance.date || new Date().toISOString().split('T')[0],
        status: attendance.status || 'present',
        check_in: attendance.check_in || '09:00',
        check_out: attendance.check_out || '17:00',
        notes: attendance.notes || ''
      });
    } else {
      setEditingAttendance(null);
      setAttendanceFormData({
        employee: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        check_in: '09:00',
        check_out: '17:00',
        notes: ''
      });
    }
    setIsAttendanceModalOpen(true);
  };

  const handleOpenLoanModal = (loan = null) => {
    if (loan) {
      setEditingLoan(loan);
      setLoanFormData({
        employee: loan.employee || '',
        amount: loan.amount || 0,
        date: loan.date || new Date().toISOString().split('T')[0],
        description: loan.description || '',
        safe: loan.safe || ''
      });
    } else {
      setEditingLoan(null);
      setLoanFormData({
        employee: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        safe: safes[0]?.id || ''
      });
    }
    setIsLoanModalOpen(true);
  };

  const handleOpenSalaryModal = (salary = null) => {
    if (salary) {
      setEditingSalary(salary);
      setSalaryFormData({
        employee: salary.employee || '',
        month: salary.month || new Date().getMonth() + 1,
        year: salary.year || new Date().getFullYear(),
        base_salary: salary.base_salary || 0,
        deductions: salary.deductions || 0,
        loans_deduction: salary.loans_deduction || 0,
        safe: salary.safe || '',
        notes: salary.notes || ''
      });
    } else {
      setEditingSalary(null);
      setSalaryFormData({
        employee: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        base_salary: 0,
        deductions: 0,
        loans_deduction: 0,
        safe: safes[0]?.id || '',
        notes: ''
      });
    }
    setIsSalaryModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/api/employees/${editingEmployee.id}/`, formData);
      } else {
        await api.post('/employees/api/employees/', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving employee:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      try {
        await api.delete(`/employees/api/employees/${id}/`);
        fetchData();
      } catch (err) {
        console.error('Error deleting employee:', err);
      }
    }
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    try {
      if (editingAttendance) {
        await api.put(`/employees/api/attendance/${editingAttendance.id}/`, attendanceFormData);
      } else {
        await api.post('/employees/api/attendance/', attendanceFormData);
      }
      setIsAttendanceModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('خطأ في حفظ السجل. قد يكون هناك سجل موجود بالفعل لهذا الموظف في نفس التاريخ.');
    }
  };

  const handleDeleteAttendance = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف سجل الحضور هذا؟')) {
      try {
        await api.delete(`/employees/api/attendance/${id}/`);
        fetchData();
      } catch (err) {
        console.error('Error deleting attendance:', err);
      }
    }
  };

  const handleSaveLoan = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...loanFormData,
        amount: parseFloat(loanFormData.amount)
      };
      if (editingLoan) {
        await api.put(`/employees/api/loans/${editingLoan.id}/`, data);
      } else {
        await api.post('/employees/api/loans/', data);
      }
      setIsLoanModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving loan:', err);
    }
  };

  const handleDeleteLoan = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه السلفة؟')) {
      try {
        await api.delete(`/employees/api/loans/${id}/`);
        fetchData();
      } catch (err) {
        console.error('Error deleting loan:', err);
      }
    }
  };

  const handlePostLoan = async (id) => {
    try {
      await api.post(`/employees/api/loans/${id}/post_loan/`);
      fetchData();
    } catch (err) {
      console.error('Error posting loan:', err);
    }
  };

  const handleUnpostLoan = async (id) => {
    try {
      await api.post(`/employees/api/loans/${id}/unpost_loan/`);
      fetchData();
    } catch (err) {
      console.error('Error unposting loan:', err);
    }
  };

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...salaryFormData,
        month: parseInt(salaryFormData.month),
        year: parseInt(salaryFormData.year),
        base_salary: parseFloat(salaryFormData.base_salary),
        deductions: parseFloat(salaryFormData.deductions),
        loans_deduction: parseFloat(salaryFormData.loans_deduction),
      };
      if (editingSalary) {
        await api.put(`/employees/api/salaries/${editingSalary.id}/`, data);
      } else {
        await api.post('/employees/api/salaries/', data);
      }
      setIsSalaryModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving salary:', err);
    }
  };

  const handleDeleteSalary = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الراتب؟')) {
      try {
        await api.delete(`/employees/api/salaries/${id}/`);
        fetchData();
      } catch (err) {
        console.error('Error deleting salary:', err);
      }
    }
  };

  const handlePostSalary = async (id) => {
    try {
      await api.post(`/employees/api/salaries/${id}/post_salary/`);
      fetchData();
    } catch (err) {
      console.error('Error posting salary:', err);
    }
  };

  const handleUnpostSalary = async (id) => {
    try {
      await api.post(`/employees/api/salaries/${id}/unpost_salary/`);
      fetchData();
    } catch (err) {
      console.error('Error unposting salary:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold">
            <CheckCircle2 size={12} />
            نشط
          </span>
        );
      case 'inactive':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold">
            <XCircle size={12} />
            غير نشط
          </span>
        );
      case 'on_leave':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold">
            <Clock size={12} />
            في إجازة
          </span>
        );
      default:
        return null;
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.job_title && emp.job_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الموظفين والموارد البشرية</h1>
          <p className="text-gray-500">إدارة بيانات الموظفين والرواتب والحضور والسلف</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'employees' && (
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <UserPlus size={20} />
              <span>إضافة موظف</span>
            </button>
          )}
          {activeTab === 'attendance' && (
            <button 
              onClick={() => handleOpenAttendanceModal()}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200"
            >
              <Calendar size={20} />
              <span>تسجيل حضور/غياب</span>
            </button>
          )}
          {activeTab === 'loans' && (
            <button 
              onClick={() => handleOpenLoanModal()}
              className="flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200"
            >
              <CreditCard size={20} />
              <span>إضافة سلفة</span>
            </button>
          )}
          {activeTab === 'salaries' && (
            <button 
              onClick={() => handleOpenSalaryModal()}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Wallet size={20} />
              <span>إصدار راتب</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-4 border-b border-gray-100 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap ${
            activeTab === 'employees' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} />
            قائمة الموظفين ({employees.length})
          </div>
          {activeTab === 'employees' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap ${
            activeTab === 'attendance' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            سجلات الحضور ({attendanceRecords.length})
          </div>
          {activeTab === 'attendance' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap ${
            activeTab === 'loans' ? 'text-amber-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard size={18} />
            السلف ({loans.length})
          </div>
          {activeTab === 'loans' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('salaries')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap ${
            activeTab === 'salaries' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wallet size={18} />
            مسير الرواتب ({salaries.length})
          </div>
          {activeTab === 'salaries' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">إحصائيات سريعة</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl">
                <div className="text-blue-600 text-sm font-bold">إجمالي الموظفين</div>
                <div className="text-2xl font-black text-blue-700">{employees.length}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-2xl">
                <div className="text-green-600 text-sm font-bold">الموظفين النشطين</div>
                <div className="text-2xl font-black text-green-700">
                  {employees.filter(e => e.status === 'active').length}
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl">
                <div className="text-amber-600 text-sm font-bold">إجمالي الرواتب</div>
                <div className="text-2xl font-black text-amber-700">
                  {employees.reduce((sum, e) => sum + parseFloat(e.salary || 0), 0).toLocaleString()} ج.م
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {activeTab === 'employees' && (
            <>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text"
                  placeholder="بحث باسم الموظف أو المسمى الوظيفي..."
                  className="w-full pr-12 pl-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm">
                      <th className="px-6 py-4 font-bold">الموظف</th>
                      <th className="px-6 py-4 font-bold">القسم / الوظيفة</th>
                      <th className="px-6 py-4 font-bold">تاريخ التعيين</th>
                      <th className="px-6 py-4 font-bold">الراتب</th>
                      <th className="px-6 py-4 font-bold">الحالة</th>
                      <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{emp.name}</div>
                              <div className="text-xs text-gray-500">{emp.phone || 'بدون هاتف'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-700">{emp.job_title || '—'}</div>
                          <div className="text-xs text-gray-500">{emp.department || '—'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            {emp.hire_date}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-black text-gray-900">{parseFloat(emp.salary || 0).toLocaleString()} ج.م</div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(emp.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(emp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(emp.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredEmployees.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    <Users size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold">لا يوجد موظفين حالياً</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'attendance' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="px-6 py-4 font-bold">الموظف</th>
                    <th className="px-6 py-4 font-bold">التاريخ</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                    <th className="px-6 py-4 font-bold">الحضور</th>
                    <th className="px-6 py-4 font-bold">الانصراف</th>
                    <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendanceRecords.map((att) => (
                    <tr key={att.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-bold">{att.employee_name}</td>
                      <td className="px-6 py-4">{att.date}</td>
                      <td className="px-6 py-4">
                        {att.status === 'present' ? (
                          <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold">حاضر</span>
                        ) : att.status === 'absent' ? (
                          <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold">غائب</span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold">غائب بعذر</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{att.check_in || '—'}</td>
                      <td className="px-6 py-4">{att.check_out || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenAttendanceModal(att)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteAttendance(att.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attendanceRecords.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">لا توجد سجلات حضور حالياً</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'loans' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="px-6 py-4 font-bold">الموظف</th>
                    <th className="px-6 py-4 font-bold">المبلغ</th>
                    <th className="px-6 py-4 font-bold">التاريخ</th>
                    <th className="px-6 py-4 font-bold">الخزنة</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                    <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-bold">{loan.employee_name}</td>
                      <td className="px-6 py-4 font-black text-amber-600">{parseFloat(loan.amount).toLocaleString()} ج.م</td>
                      <td className="px-6 py-4">{loan.date}</td>
                      <td className="px-6 py-4">{loan.safe_name}</td>
                      <td className="px-6 py-4">
                        {loan.is_posted ? (
                          <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
                            <ShieldCheck size={12} /> مرحل
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold">غير مرحل</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {!loan.is_posted ? (
                            <>
                              <button onClick={() => handlePostLoan(loan.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="ترحيل">
                                <ShieldCheck size={16} />
                              </button>
                              <button onClick={() => handleOpenLoanModal(loan)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteLoan(loan.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleUnpostLoan(loan.id)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="إلغاء ترحيل">
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loans.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">لا توجد سلف حالياً</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'salaries' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="px-6 py-4 font-bold">الموظف</th>
                    <th className="px-6 py-4 font-bold">الشهر/السنة</th>
                    <th className="px-6 py-4 font-bold">صافي الراتب</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                    <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {salaries.map((sal) => (
                    <tr key={sal.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-bold">{sal.employee_name}</td>
                      <td className="px-6 py-4">{sal.month} / {sal.year}</td>
                      <td className="px-6 py-4 font-black text-indigo-600">{parseFloat(sal.net_salary).toLocaleString()} ج.م</td>
                      <td className="px-6 py-4">
                        {sal.is_posted ? (
                          <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
                            <ShieldCheck size={12} /> تم الصرف
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold">مسودة</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {!sal.is_posted ? (
                            <>
                              <button onClick={() => handlePostSalary(sal.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="صرف الراتب">
                                <DollarSign size={16} />
                              </button>
                              <button onClick={() => handleOpenSalaryModal(sal)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteSalary(sal.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleUnpostSalary(sal.id)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="إلغاء الصرف">
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {salaries.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <Wallet size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">لا توجد رواتب حالياً</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900">
                {editingEmployee ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">الاسم الكامل</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">الرقم القومي</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.national_id}
                    onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">رقم الهاتف</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">المسمى الوظيفي</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.job_title}
                    onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">القسم</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">تاريخ التعيين</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">الراتب الأساسي</label>
                  <div className="relative">
                    <input 
                      type="number"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">ج.م</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">الحالة</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="on_leave">في إجازة</option>
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">العنوان</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">ملاحظات</label>
                  <textarea 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-20 resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  حفظ البيانات
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900">
                {editingAttendance ? 'تعديل سجل حضور' : 'تسجيل حضور جديد'}
              </h2>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveAttendance} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">الموظف</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  value={attendanceFormData.employee}
                  onChange={(e) => setAttendanceFormData({...attendanceFormData, employee: e.target.value})}
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">التاريخ</label>
                <input 
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  value={attendanceFormData.date}
                  onChange={(e) => setAttendanceFormData({...attendanceFormData, date: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">الحالة</label>
                <select 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  value={attendanceFormData.status}
                  onChange={(e) => setAttendanceFormData({...attendanceFormData, status: e.target.value})}
                >
                  <option value="present">حاضر</option>
                  <option value="absent">غائب</option>
                  <option value="excused">غائب بعذر</option>
                </select>
              </div>
              {attendanceFormData.status === 'present' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">وقت الحضور</label>
                    <input 
                      type="time"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      value={attendanceFormData.check_in}
                      onChange={(e) => setAttendanceFormData({...attendanceFormData, check_in: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">وقت الانصراف</label>
                    <input 
                      type="time"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      value={attendanceFormData.check_out}
                      onChange={(e) => setAttendanceFormData({...attendanceFormData, check_out: e.target.value})}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">ملاحظات</label>
                <textarea 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all h-20 resize-none"
                  value={attendanceFormData.notes}
                  onChange={(e) => setAttendanceFormData({...attendanceFormData, notes: e.target.value})}
                ></textarea>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  حفظ السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Modal */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900">
                {editingLoan ? 'تعديل سلفة' : 'إضافة سلفة جديدة'}
              </h2>
              <button onClick={() => setIsLoanModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveLoan} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">الموظف</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={loanFormData.employee}
                  onChange={(e) => {
                    const emp = employees.find(ev => ev.id == e.target.value);
                    setLoanFormData({...loanFormData, employee: e.target.value});
                  }}
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">المبلغ</label>
                <div className="relative">
                  <input 
                    type="number"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    value={loanFormData.amount}
                    onChange={(e) => setLoanFormData({...loanFormData, amount: e.target.value})}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">ج.م</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">التاريخ</label>
                <input 
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={loanFormData.date}
                  onChange={(e) => setLoanFormData({...loanFormData, date: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">الخزنة</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={loanFormData.safe}
                  onChange={(e) => setLoanFormData({...loanFormData, safe: e.target.value})}
                >
                  <option value="">اختر الخزنة...</option>
                  {safes.map(safe => (
                    <option key={safe.id} value={safe.id}>{safe.name} (رصيد: {parseFloat(safe.current_balance).toLocaleString()})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">الوصف</label>
                <textarea 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all h-20 resize-none"
                  value={loanFormData.description}
                  onChange={(e) => setLoanFormData({...loanFormData, description: e.target.value})}
                ></textarea>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  حفظ السلفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900">
                {editingSalary ? 'تعديل مسودة راتب' : 'إصدار راتب جديد'}
              </h2>
              <button onClick={() => setIsSalaryModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSalary} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">الموظف</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={salaryFormData.employee}
                  onChange={(e) => {
                    const emp = employees.find(ev => ev.id == e.target.value);
                    setSalaryFormData({
                      ...salaryFormData, 
                      employee: e.target.value,
                      base_salary: emp ? emp.salary : 0
                    });
                  }}
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">الشهر</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={salaryFormData.month}
                    onChange={(e) => setSalaryFormData({...salaryFormData, month: e.target.value})}
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">السنة</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={salaryFormData.year}
                    onChange={(e) => setSalaryFormData({...salaryFormData, year: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">الراتب الأساسي</label>
                  <input 
                    type="number"
                    readOnly
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl outline-none"
                    value={salaryFormData.base_salary}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">الخصومات</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={salaryFormData.deductions}
                    onChange={(e) => setSalaryFormData({...salaryFormData, deductions: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">خصم السلف</label>
                <input 
                  type="number"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={salaryFormData.loans_deduction}
                  onChange={(e) => setSalaryFormData({...salaryFormData, loans_deduction: e.target.value})}
                />
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="text-indigo-600 text-xs font-bold mb-1">صافي المستحق</div>
                <div className="text-xl font-black text-indigo-700">
                  {(parseFloat(salaryFormData.base_salary || 0) - parseFloat(salaryFormData.deductions || 0) - parseFloat(salaryFormData.loans_deduction || 0)).toLocaleString()} ج.م
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">الخزنة (للتنفيذ الفوري)</label>
                <select 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={salaryFormData.safe}
                  onChange={(e) => setSalaryFormData({...salaryFormData, safe: e.target.value})}
                >
                  <option value="">اختر الخزنة...</option>
                  {safes.map(safe => (
                    <option key={safe.id} value={safe.id}>{safe.name} (رصيد: {parseFloat(safe.current_balance).toLocaleString()})</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  حفظ المسودة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
