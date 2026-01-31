import React, { useEffect, useState } from 'react';
import api from './api';
import { 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Save,
  CheckCircle2,
  Clock,
  Building2,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const Finances = () => {
  const [activeTab, setActiveTab] = useState('safe');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      if (activeTab === 'safe') endpoint = '/finances/api/safe-transactions/';
      else if (activeTab === 'expenses') endpoint = '/finances/api/expenses/';
      else if (activeTab === 'income') endpoint = '/finances/api/incomes/';
      
      const response = await api.get(endpoint);
      setTransactions(response.data);
    } catch (err) {
      console.error('Error fetching financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      try {
        let endpoint = '';
        if (activeTab === 'safe') endpoint = `/finances/api/safe-transactions/${id}/`;
        else if (activeTab === 'expenses') endpoint = `/finances/api/expenses/${id}/`;
        else if (activeTab === 'income') endpoint = `/finances/api/incomes/${id}/`;
        
        await api.delete(endpoint);
        fetchData();
      } catch (err) {
        alert('خطأ في الحذف');
      }
    }
  };

  const filteredItems = transactions.filter(item => {
    const searchString = searchTerm.toLowerCase();
    if (activeTab === 'safe') {
      return (item.description?.toLowerCase().includes(searchString) || 
              item.transaction_type_display?.toLowerCase().includes(searchString));
    }
    return item.description?.toLowerCase().includes(searchString);
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المالية والخزينة</h1>
          <p className="text-gray-500">إدارة المصروفات، الإيرادات وحركات الصناديق</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          <span>
            {activeTab === 'safe' ? 'حركة خزينة جديدة' : 
             activeTab === 'expenses' ? 'تسجيل مصروف' : 'تسجيل إيراد'}
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
        <button 
          onClick={() => setActiveTab('safe')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'safe' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          حركات الخزينة
        </button>
        <button 
          onClick={() => setActiveTab('expenses')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          المصروفات
        </button>
        <button 
          onClick={() => setActiveTab('income')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'income' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          الإيرادات
        </button>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="بحث..."
            className="w-full pr-12 pl-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">إجمالي الداخل</div>
            <div className="text-lg font-black text-gray-900">
              {filteredItems
                .filter(i => activeTab === 'safe' ? ['deposit', 'collection', 'income', 'sale_invoice'].includes(i.transaction_type) : activeTab === 'income')
                .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0)
                .toLocaleString()} ج.م
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <TrendingDown size={20} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">إجمالي الخارج</div>
            <div className="text-lg font-black text-gray-900">
              {filteredItems
                .filter(i => activeTab === 'safe' ? ['withdrawal', 'payment', 'expense', 'purchase_invoice'].includes(i.transaction_type) : activeTab === 'expenses')
                .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0)
                .toLocaleString()} ج.م
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm">
              <th className="px-6 py-4 font-bold">التاريخ</th>
              <th className="px-6 py-4 font-bold">البيان / الوصف</th>
              {activeTab === 'safe' && <th className="px-6 py-4 font-bold">نوع العملية</th>}
              {(activeTab === 'expenses' || activeTab === 'income') && <th className="px-6 py-4 font-bold">القسم</th>}
              <th className="px-6 py-4 font-bold">المبلغ</th>
              {activeTab === 'safe' && <th className="px-6 py-4 font-bold">الرصيد بعد</th>}
              <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(item.date).toLocaleDateString('ar-EG')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{item.description || 'بدون بيان'}</div>
                  {item.safe_name && <div className="text-[10px] text-gray-400 font-medium">الخزينة: {item.safe_name}</div>}
                </td>
                {activeTab === 'safe' && (
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      ['deposit', 'collection', 'income', 'sale_invoice'].includes(item.transaction_type) 
                      ? 'bg-green-50 text-green-600' 
                      : 'bg-red-50 text-red-600'
                    }`}>
                      {['deposit', 'collection', 'income', 'sale_invoice'].includes(item.transaction_type) ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                      {item.transaction_type_display}
                    </span>
                  </td>
                )}
                {(activeTab === 'expenses' || activeTab === 'income') && (
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">
                    {item.category_name}
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className={`text-sm font-black ${
                    activeTab === 'safe' 
                    ? (['deposit', 'collection', 'income', 'sale_invoice'].includes(item.transaction_type) ? 'text-green-600' : 'text-red-600')
                    : (activeTab === 'income' ? 'text-green-600' : 'text-red-600')
                  }`}>
                    {parseFloat(item.amount).toLocaleString()} ج.م
                  </div>
                </td>
                {activeTab === 'safe' && (
                  <td className="px-6 py-4 text-sm font-bold text-gray-700">
                    {parseFloat(item.balance_after).toLocaleString()} ج.م
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                      className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <Wallet size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">لا توجد حركات مسجلة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finances;
