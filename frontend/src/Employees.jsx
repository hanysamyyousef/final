import React, { useEffect, useState } from 'react';
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
  DollarSign
} from 'lucide-react';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
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

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees/api/employees/');
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/api/employees/${editingEmployee.id}/`, formData);
      } else {
        await api.post('/employees/api/employees/', formData);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error('Error saving employee:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      try {
        await api.delete(`/employees/api/employees/${id}/`);
        fetchEmployees();
      } catch (err) {
        console.error('Error deleting employee:', err);
      }
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
          <p className="text-gray-500">إدارة بيانات الموظفين والرواتب والحضور</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <UserPlus size={20} />
          <span>إضافة موظف جديد</span>
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

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">تنبيهات الموارد البشرية</h3>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                <AlertCircle className="text-rose-600 shrink-0" size={18} />
                <p className="text-xs text-rose-700 font-medium">3 موظفين لم يسجلوا حضور اليوم</p>
              </div>
              <div className="flex gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <Clock className="text-amber-600 shrink-0" size={18} />
                <p className="text-xs text-amber-700 font-medium">نهاية عقد موظف خلال أسبوع</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
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
    </div>
  );
};

export default Employees;
