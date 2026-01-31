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
  BookOpen
} from 'lucide-react';

const Accounting = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
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
    fetchAccounts();
  }, []);

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
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200">
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
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="عرض الحركات">
                      <ArrowRightLeft size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Accounting;
