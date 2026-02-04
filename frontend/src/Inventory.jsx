import React, { useEffect, useState } from 'react';
import api from './api';
import { 
  Warehouse, 
  Wallet, 
  Plus, 
  Search, 
  MapPin, 
  User, 
  Database,
  ArrowRightLeft,
  MoreVertical,
  X,
  Save,
  Trash2
} from 'lucide-react';

const Inventory = () => {
  const [stores, setStores] = useState([]);
  const [safes, setSafes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stores');
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isSafeModalOpen, setIsSafeModalOpen] = useState(false);
  
  const [storeFormData, setStoreFormData] = useState({
    name: '',
    branch: '',
    address: '',
    keeper: '',
    notes: ''
  });

  const [safeFormData, setSafeFormData] = useState({
    name: '',
    branch: '',
    initial_balance: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [storesRes, safesRes, branchesRes] = await Promise.all([
        api.get('/api/stores/'),
        api.get('/api/safes/'),
        api.get('/api/branches/')
      ]);
      setStores(storesRes.data);
      setSafes(safesRes.data);
      setBranches(branchesRes.data);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/stores/', storeFormData);
      setIsStoreModalOpen(false);
      setStoreFormData({ name: '', branch: '', address: '', keeper: '', notes: '' });
      fetchData();
    } catch (err) {
      console.error('Error saving store:', err);
      alert('حدث خطأ أثناء إضافة المخزن');
    }
  };

  const handleSafeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/safes/', {
        ...safeFormData,
        current_balance: safeFormData.initial_balance // Initialize current balance
      });
      setIsSafeModalOpen(false);
      setSafeFormData({ name: '', branch: '', initial_balance: 0 });
      fetchData();
    } catch (err) {
      console.error('Error saving safe:', err);
      alert('حدث خطأ أثناء إضافة الخزنة');
    }
  };

  const handleDeleteStore = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المخزن؟')) {
      try {
        await api.delete(`/api/stores/${id}/`);
        fetchData();
      } catch (err) {
        console.error('Error deleting store:', err);
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const handleDeleteSafe = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الخزنة؟')) {
      try {
        await api.delete(`/api/safes/${id}/`);
        fetchData();
      } catch (err) {
        console.error('Error deleting safe:', err);
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المخازن والخزائن</h1>
          <p className="text-gray-500">إدارة مواقع التخزين والسيولة المالية</p>
        </div>
        <button 
          onClick={() => activeTab === 'stores' ? setIsStoreModalOpen(true) : setIsSafeModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          {activeTab === 'stores' ? 'إضافة مخزن' : 'إضافة خزنة'}
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-100 pb-px">
        <button
          onClick={() => setActiveTab('stores')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 'stores' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          المخازن ({stores.length})
          {activeTab === 'stores' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('safes')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 'safes' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          الخزائن ({safes.length})
          {activeTab === 'safes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'stores' ? (
          stores.map((store) => (
            <div key={store.id} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-blue-500/5 transition group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Warehouse size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDeleteStore(store.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">{store.name}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{store.branch_name || 'فرع عام'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <User size={16} className="text-gray-400" />
                  <span>أمين المخزن: {store.keeper || 'غير محدد'}</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-50">
                <button className="w-full py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2">
                  <Database size={16} />
                  عرض المخزون
                </button>
              </div>
            </div>
          ))
        ) : (
          safes.map((safe) => (
            <div key={safe.id} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-blue-500/5 transition group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Wallet size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDeleteSafe(safe.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">{safe.name}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{safe.branch_name || 'فرع عام'}</span>
                </div>
                <div className="text-2xl font-black text-gray-900 mt-4">
                  {parseFloat(safe.current_balance || 0).toLocaleString('ar-EG')} <span className="text-xs text-gray-500 font-medium">ج.م</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-50">
                <button className="w-full py-2 text-sm font-bold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition flex items-center justify-center gap-2">
                  <ArrowRightLeft size={16} />
                  سجل الحركات
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Store Modal */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsStoreModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">إضافة مخزن جديد</h2>
              <button onClick={() => setIsStoreModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleStoreSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المخزن *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={storeFormData.name}
                  onChange={(e) => setStoreFormData({...storeFormData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفرع *</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={storeFormData.branch}
                  onChange={(e) => setStoreFormData({...storeFormData, branch: e.target.value})}
                >
                  <option value="">اختر الفرع</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">أمين المخزن</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={storeFormData.keeper}
                  onChange={(e) => setStoreFormData({...storeFormData, keeper: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={storeFormData.address}
                  onChange={(e) => setStoreFormData({...storeFormData, address: e.target.value})}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <Save size={20} />
                  حفظ المخزن
                </button>
                <button type="button" onClick={() => setIsStoreModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Modal */}
      {isSafeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsSafeModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">إضافة خزنة جديدة</h2>
              <button onClick={() => setIsSafeModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSafeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الخزنة *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={safeFormData.name}
                  onChange={(e) => setSafeFormData({...safeFormData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفرع *</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={safeFormData.branch}
                  onChange={(e) => setSafeFormData({...safeFormData, branch: e.target.value})}
                >
                  <option value="">اختر الفرع</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرصيد الافتتاحي</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={safeFormData.initial_balance}
                  onChange={(e) => setSafeFormData({...safeFormData, initial_balance: e.target.value})}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">
                  <Save size={20} />
                  حفظ الخزنة
                </button>
                <button type="button" onClick={() => setIsSafeModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
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

export default Inventory;
