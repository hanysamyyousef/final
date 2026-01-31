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
  MoreVertical
} from 'lucide-react';

const Inventory = () => {
  const [stores, setStores] = useState([]);
  const [safes, setSafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stores'); // 'stores', 'safes'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [storesRes, safesRes] = await Promise.all([
          api.get('/api/stores/'),
          api.get('/api/safes/')
        ]);
        setStores(storesRes.data);
        setSafes(safesRes.data);
      } catch (err) {
        console.error('Error fetching inventory data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200">
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
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical size={18} />
                </button>
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
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical size={18} />
                </button>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">{safe.name}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{safe.branch_name || 'فرع عام'}</span>
                </div>
                <div className="text-2xl font-black text-gray-900 mt-4">
                  {parseFloat(safe.balance || 0).toLocaleString('ar-EG')} <span className="text-xs text-gray-500 font-medium">ج.م</span>
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
    </div>
  );
};

export default Inventory;
