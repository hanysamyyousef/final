import React, { useEffect, useState } from 'react';
import api from './api';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Save,
  ArrowLeftRight,
  FileText,
  Lock,
  Unlock
} from 'lucide-react';

const JournalEntries = () => {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    entry_number: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    items: [
      { account: '', debit: 0, credit: 0, memo: '' },
      { account: '', debit: 0, credit: 0, memo: '' }
    ]
  });
  
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounting/api/journal-entries/');
      setEntries(response.data);
    } catch (err) {
      console.error('Error fetching journal entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounting/api/accounts/');
      setAccounts(response.data.filter(a => a.is_selectable));
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchAccounts();
  }, []);

  const handleOpenModal = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        entry_number: entry.entry_number,
        date: entry.date.split('T')[0],
        description: entry.description,
        reference: entry.reference || '',
        items: entry.items.map(item => ({
          account: item.account,
          debit: parseFloat(item.debit),
          credit: parseFloat(item.credit),
          memo: item.memo || ''
        }))
      });
    } else {
      setEditingEntry(null);
      setFormData({
        entry_number: `JE-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        items: [
          { account: '', debit: 0, credit: 0, memo: '' },
          { account: '', debit: 0, credit: 0, memo: '' }
        ]
      });
    }
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { account: '', debit: 0, credit: 0, memo: '' }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Ensure if debit is set, credit is 0 and vice-versa (optional but common)
    if (field === 'debit' && value > 0) newItems[index].credit = 0;
    if (field === 'credit' && value > 0) newItems[index].debit = 0;
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const totalDebit = formData.items.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0);
    const totalCredit = formData.items.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0);
    return { totalDebit, totalCredit };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const { totalDebit, totalCredit } = calculateTotals();
    
    if (totalDebit !== totalCredit) {
      alert('يجب أن يكون إجمالي المدين مساوياً لإجمالي الدائن');
      return;
    }

    if (totalDebit === 0) {
      alert('يجب إدخال مبالغ في القيد');
      return;
    }

    try {
      if (editingEntry) {
        await api.put(`/accounting/api/journal-entries/${editingEntry.id}/`, formData);
      } else {
        await api.post('/accounting/api/journal-entries/', formData);
      }
      setIsModalOpen(false);
      fetchEntries();
    } catch (err) {
      console.error('Error saving entry:', err);
      alert(err.response?.data?.error || 'حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handlePost = async (id) => {
    try {
      await api.post(`/accounting/api/journal-entries/${id}/post_entry/`);
      fetchEntries();
    } catch (err) {
      alert(err.response?.data?.error || 'خطأ في الترحيل');
    }
  };

  const handleUnpost = async (id) => {
    try {
      await api.post(`/accounting/api/journal-entries/${id}/unpost_entry/`);
      fetchEntries();
    } catch (err) {
      alert(err.response?.data?.error || 'خطأ في إلغاء الترحيل');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القيد؟')) {
      try {
        await api.delete(`/accounting/api/journal-entries/${id}/`);
        fetchEntries();
      } catch (err) {
        alert(err.response?.data?.error || 'خطأ في الحذف');
      }
    }
  };

  const filteredEntries = entries.filter(entry => 
    entry.entry_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-800">القيود المحاسبية</h1>
          <p className="text-gray-500">تسجيل ومراجعة كافة الحركات المالية</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          <span>قيد يدوي جديد</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="بحث برقم القيد أو البيان..."
            className="w-full pr-12 pl-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          <button className="px-6 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white shadow-md">الكل</button>
          <button className="px-6 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">مرحلة</button>
          <button className="px-6 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">غير مرحلة</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm">
              <th className="px-6 py-4 font-bold">رقم القيد</th>
              <th className="px-6 py-4 font-bold">التاريخ</th>
              <th className="px-6 py-4 font-bold">البيان</th>
              <th className="px-6 py-4 font-bold text-left">إجمالي القيد</th>
              <th className="px-6 py-4 font-bold">الحالة</th>
              <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${entry.is_posted ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                      {entry.is_posted ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{entry.entry_number}</div>
                      <div className="text-[10px] text-gray-400 font-medium">REF: {entry.reference || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(entry.date).toLocaleDateString('ar-EG')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-700 max-w-xs truncate">{entry.description}</div>
                </td>
                <td className="px-6 py-4 text-left">
                  <div className="text-sm font-black text-gray-900">{parseFloat(entry.total_debit).toLocaleString()} ج.م</div>
                </td>
                <td className="px-6 py-4">
                  {entry.is_posted ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold">
                      <Lock size={12} />
                      مرحل
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold">
                      <Unlock size={12} />
                      مسودة
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    {!entry.is_posted ? (
                      <>
                        <button 
                          onClick={() => handlePost(entry.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                        >
                          ترحيل
                        </button>
                        <button 
                          onClick={() => handleOpenModal(entry)}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleUnpost(entry.id)}
                        className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
                      >
                        إلغاء ترحيل
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEntries.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">لا يوجد قيود محاسبية مسجلة</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-800">
                {editingEntry ? 'تعديل قيد محاسبي' : 'إضافة قيد يدوي جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">رقم القيد</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.entry_number}
                    onChange={(e) => setFormData({...formData, entry_number: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">التاريخ</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">البيان / الوصف</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: سداد مصروفات إدارية..."
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs">
                      <th className="px-4 py-3 font-bold">الحساب</th>
                      <th className="px-4 py-3 font-bold w-32">مدين</th>
                      <th className="px-4 py-3 font-bold w-32">دائن</th>
                      <th className="px-4 py-3 font-bold">البيان (اختياري)</th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {formData.items.map((item, index) => (
                      <tr key={index} className="group">
                        <td className="p-2">
                          <select
                            required
                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={item.account}
                            onChange={(e) => handleItemChange(index, 'account', e.target.value)}
                          >
                            <option value="">اختر الحساب...</option>
                            {accounts.map(a => (
                              <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm text-left font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={item.debit}
                            onChange={(e) => handleItemChange(index, 'debit', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm text-left font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={item.credit}
                            onChange={(e) => handleItemChange(index, 'credit', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={item.memo}
                            onChange={(e) => handleItemChange(index, 'memo', e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={formData.items.length <= 2}
                            className="p-2 text-gray-300 hover:text-red-500 disabled:opacity-0 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50/50 font-black text-sm">
                      <td className="px-4 py-3">الإجمالي</td>
                      <td className={`px-4 py-3 text-left font-mono ${calculateTotals().totalDebit !== calculateTotals().totalCredit ? 'text-red-600' : 'text-blue-600'}`}>
                        {calculateTotals().totalDebit.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 text-left font-mono ${calculateTotals().totalDebit !== calculateTotals().totalCredit ? 'text-red-600' : 'text-blue-600'}`}>
                        {calculateTotals().totalCredit.toLocaleString()}
                      </td>
                      <td colSpan="2" className="px-4 py-3">
                        {calculateTotals().totalDebit !== calculateTotals().totalCredit && (
                          <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            القيد غير متوازن
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors mr-1"
              >
                <Plus size={16} />
                إضافة سطر جديد
              </button>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  {editingEntry ? 'حفظ التعديلات' : 'حفظ القيد'}
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

export default JournalEntries;
