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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  
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

  useEffect(() => {
    fetchEntries();
  }, []);

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
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
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
    </div>
  );
};

export default JournalEntries;
