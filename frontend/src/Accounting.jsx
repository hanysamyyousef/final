import React, { useEffect, useState } from 'react';
import api from './api';
import { 
  Plus, 
  Calculator, 
  Search, 
  ChevronRight,
  MoreVertical,
  Calendar,
  DollarSign,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  ArrowRightLeft,
  BookOpen,
  Edit2,
  Trash2,
  X
} from 'lucide-react';

const Accounting = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    account_type: 'asset',
    parent: '',
    is_selectable: true
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounting/api/accounts/');
      setAccounts(response.data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        code: account.code,
        account_type: account.account_type,
        parent: account.parent || '',
        is_selectable: account.is_selectable
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        code: '',
        account_type: 'asset',
        parent: '',
        is_selectable: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.parent === '') data.parent = null;

      if (editingAccount) {
        await api.put(`/accounting/api/accounts/${editingAccount.id}/`, data);
      } else {
        await api.post('/accounting/api/accounts/', data);
      }
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err) {
      console.error('Error saving account:', err);
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الحساب؟')) {
      try {
        await api.delete(`/accounting/api/accounts/${id}/`);
        fetchAccounts();
      } catch (err) {
        console.error('Error deleting account:', err);
        alert('لا يمكن حذف الحساب لوجود حركات مرتبطة به أو حسابات فرعية');
      }
    }
  };

  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'asset': return 'bg-blue-50 text-blue-600';
      case 'liability': return 'bg-rose-50 text-rose-600';
      case 'equity': return 'bg-amber-50 text-amber-600';
      case 'income': return 'bg-green-50 text-green-600';
      case 'expense': return 'bg-purple-50 text-purple-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getAccountTypeLabel = (type) => {
    const types = {
      asset: 'أصول',
      liability: 'خصوم',
      equity: 'حقوق ملكية',
      income: 'إيرادات',
      expense: 'مصروفات'
    };
    return types[type] || type;
  };

  if (loading && accounts.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المحاسبة</h1>
          <p className="text-gray-500">إدارة شجرة الحسابات والتقارير المالية</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition">
            <FileSpreadsheet size={18} />
            تصدير
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            حساب جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-lg shadow-blue-200">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/10 rounded-2xl">
              <PieChart size={24} />
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">صافي الربح</span>
          </div>
          <div className="mt-4">
            <p className="text-blue-100 text-sm">إجمالي الدخل الصافي</p>
            <h3 className="text-3xl font-black mt-1">45,200.00 <span className="text-sm font-medium opacity-80">ج.م</span></h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <div className="mt-4">
            <p className="text-gray-500 text-sm">إجمالي الإيرادات</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">128,500.00 <span className="text-sm font-medium text-gray-400">ج.م</span></h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <Calculator size={24} />
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">+5%</span>
          </div>
          <div className="mt-4">
            <p className="text-gray-500 text-sm">إجمالي المصروفات</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">83,300.00 <span className="text-sm font-medium text-gray-400">ج.م</span></h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="البحث بكود أو اسم الحساب..."
            className="w-full pr-10 pl-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-bold text-gray-600 text-sm">كود الحساب</th>
              <th className="p-4 font-bold text-gray-600 text-sm">اسم الحساب</th>
              <th className="p-4 font-bold text-gray-600 text-sm text-center">النوع</th>
              <th className="p-4 font-bold text-gray-600 text-sm text-left">الرصيد</th>
              <th className="p-4 font-bold text-gray-600 text-sm text-center">الحالة</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredAccounts.map((account) => (
              <tr key={account.id} className="hover:bg-blue-50/30 transition group">
                <td className="p-4 text-sm font-mono text-gray-500">{account.code}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getAccountTypeColor(account.account_type)}`}>
                      <BookOpen size={16} />
                    </div>
                    <span className="font-bold text-gray-800">{account.name}</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${getAccountTypeColor(account.account_type)}`}>
                    {getAccountTypeLabel(account.account_type)}
                  </span>
                </td>
                <td className="p-4 text-left">
                  <span className={`font-black ${parseFloat(account.balance) < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                    {Math.abs(account.balance).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                    <span className="text-[10px] text-gray-400 font-medium mr-1">ج.م</span>
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${account.is_selectable ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {account.is_selectable ? 'نشط' : 'حساب أب'}
                  </span>
                </td>
                <td className="p-4 text-left">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(account)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                      title="تعديل"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(account.id)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-800">
                {editingAccount ? 'تعديل حساب' : 'إضافة حساب جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">كود الحساب</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">اسم الحساب</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 mr-1">نوع الحساب</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.account_type}
                  onChange={(e) => setFormData({...formData, account_type: e.target.value})}
                >
                  <option value="asset">أصول</option>
                  <option value="liability">خصوم</option>
                  <option value="equity">حقوق ملكية</option>
                  <option value="income">إيرادات</option>
                  <option value="expense">مصروفات</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 mr-1">الحساب الأب</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.parent}
                  onChange={(e) => setFormData({...formData, parent: e.target.value})}
                >
                  <option value="">-- بدون حساب أب --</option>
                  {accounts
                    .filter(a => !a.is_selectable && a.id !== editingAccount?.id)
                    .map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))
                  }
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <input
                  type="checkbox"
                  id="is_selectable"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  checked={formData.is_selectable}
                  onChange={(e) => setFormData({...formData, is_selectable: e.target.checked})}
                />
                <label htmlFor="is_selectable" className="text-sm font-bold text-blue-900 cursor-pointer">
                  قابل للتحديد في القيود (حساب فرعي)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  {editingAccount ? 'حفظ التعديلات' : 'إضافة الحساب'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
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

export default Accounting;
