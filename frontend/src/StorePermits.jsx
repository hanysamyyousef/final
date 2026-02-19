import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from './api';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  FileText, 
  Search, 
  Filter, 
  ChevronRight, 
  MoreVertical, 
  Calendar, 
  User, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Printer, 
  Trash2, 
  X, 
  Save, 
  Package, 
  PlusCircle, 
  MinusCircle,
  Download,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

const StorePermits = () => {
  const { type } = useParams();
  
  // Mapping URL type to internal permit type
  const typeMap = {
    'issue': 'issue',
    'receive': 'receive'
  };

  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(typeMap[type] || 'all');
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingPermit, setEditingPermit] = useState(null);
  const [settings, setSettings] = useState(null);

  // DLP States
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState(null);

  const markDirty = () => setIsDirty(true);

  const handleSafeCloseModal = (closeAction) => {
    if (isDirty) {
      setPendingCloseAction(() => closeAction);
      setShowExitConfirm(true);
    } else {
      closeAction();
    }
  };

  const confirmExit = () => {
    if (pendingCloseAction) {
      pendingCloseAction();
    }
    setShowExitConfirm(false);
    setIsDirty(false);
  };

  // Browser tab closure protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Form data state
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [representatives, setRepresentatives] = useState([]);

  const [formData, setFormData] = useState({
    number: '',
    date: new Date().toISOString().slice(0, 16),
    permit_type: 'issue',
    store: '',
    person_name: '',
    driver: '',
    representative: '',
    reference_number: '',
    notes: '',
    items: []
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    const mappedType = type ? (typeMap[type] || 'all') : 'all';
    setActiveTab(mappedType);
    setView('list');
    setEditingPermit(null);
    setSearchTerm('');
    fetchPermits(mappedType);
  }, [type]);

  const fetchPermits = async (mappedType = activeTab) => {
    try {
      setLoading(true);
      let url = '/finances/api/store-permits/';
      if (mappedType !== 'all') {
        url += `?type=${mappedType}`;
      }
      const response = await api.get(url);
      setPermits(response.data);
    } catch (err) {
      console.error('Error fetching permits:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [storesRes, productsRes, driversRes, repsRes, settingsRes] = await Promise.all([
        api.get('/core/api/stores/'),
        api.get('/products/api/products/'),
        api.get('/core/api/drivers/'),
        api.get('/core/api/representatives/'),
        api.get('/core/api/system-settings/')
      ]);
      setStores(storesRes.data);
      setProducts(productsRes.data);
      setDrivers(driversRes.data);
      setRepresentatives(repsRes.data);
      setSettings(settingsRes.data[0] || {});
    } catch (err) {
      console.error('Error fetching form data:', err);
    }
  };

  const handleOpenForm = async (permit = null) => {
    setIsDirty(false);
    if (permit) {
      setEditingPermit(permit);
      const loadedFormData = {
        ...permit,
        date: permit.date.slice(0, 16),
        store: permit.store || '',
        driver: permit.driver || '',
        representative: permit.representative || '',
      };
      setFormData(loadedFormData);
    } else {
      setEditingPermit(null);
      
      const validTypes = ['issue', 'receive'];
      const defaultType = validTypes.includes(activeTab) ? activeTab : 'issue';
      
      let nextNumber = `PERMIT-${Date.now()}`;
      try {
        const response = await api.get('/finances/api/store-permits/next_number/', { params: { type: defaultType } });
        nextNumber = response.data.next_number;
      } catch (err) {
        console.error('Error fetching next number:', err);
      }

      setFormData({
        number: nextNumber,
        date: new Date().toISOString().slice(0, 16),
        permit_type: defaultType,
        store: stores[0]?.id || '',
        person_name: '',
        driver: '',
        representative: '',
        reference_number: '',
        notes: '',
        items: []
      });
    }
    setView('form');
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product: '',
          product_unit: '',
          quantity: 1,
          notes: ''
        }
      ]
    });
    markDirty();
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    markDirty();
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };
    item[field] = value;

    if (field === 'product') {
      const product = products.find(p => p.id === parseInt(value));
      if (product && product.units && product.units.length > 0) {
        item.product_unit = product.units[0].id;
      }
    }

    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
    markDirty();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.store) { alert('يرجى اختيار المخزن'); return; }
    if (formData.items.length === 0) { alert('يجب إضافة بند واحد على الأقل'); return; }

    const validItems = formData.items.filter(item => item.product && item.product !== '');
    if (validItems.length === 0) { alert('يرجى اختيار منتجات'); return; }

    try {
      const sanitizedData = {
        ...formData,
        items: validItems.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity) || 0,
        })),
        is_posted: true
      };

      if (editingPermit) {
        await api.put(`/finances/api/store-permits/${editingPermit.id}/`, sanitizedData);
      } else {
        await api.post('/finances/api/store-permits/', sanitizedData);
      }
      setView('list');
      setIsDirty(false);
      fetchPermits();
    } catch (err) {
      console.error('Error saving permit:', err);
      alert('حدث خطأ أثناء حفظ الإذن');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      try {
        await api.delete(`/finances/api/store-permits/${id}/`);
        fetchPermits();
      } catch (err) {
        console.error('Error deleting permit:', err);
      }
    }
  };

  const filteredPermits = permits.filter(p => 
    p.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.person_name && p.person_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && permits.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (view === 'form') {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => handleSafeCloseModal(() => setView('list'))} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"><X size={24} /></button>
            <h1 className="text-2xl font-black text-gray-800">
              {editingPermit ? 'تعديل إذن مخزني' : 'إضافة إذن مخزني جديد'}
            </h1>
          </div>
          <button onClick={handleSave} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2">
            <Save size={20} />
            حفظ وترحيل
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">نوع الإذن</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl"
                    value={formData.permit_type}
                    onChange={(e) => {
                      setFormData({...formData, permit_type: e.target.value});
                      markDirty();
                    }}
                  >
                    <option value="issue">إذن صرف</option>
                    <option value="receive">إذن استلام</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">رقم الإذن</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl" value={formData.number} readOnly />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">التاريخ</label>
                  <input type="datetime-local" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl" value={formData.date} onChange={(e) => {
                    setFormData({...formData, date: e.target.value});
                    markDirty();
                  }} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-black text-gray-800 flex items-center gap-2">
                  <Package className="text-blue-600" size={20} />
                  أصناف الإذن
                </h3>
                <button type="button" onClick={handleAddItem} className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors">
                  <PlusCircle size={20} />
                  إضافة صنف (+)
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">الصنف</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">الوحدة</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">الكمية</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">ملاحظات</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {formData.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 min-w-[250px]">
                          <select 
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={item.product}
                            onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                          >
                            <option value="">اختر الصنف...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 min-w-[150px]">
                          <select 
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg"
                            value={item.product_unit}
                            onChange={(e) => handleItemChange(index, 'product_unit', e.target.value)}
                          >
                            <option value="">الوحدة...</option>
                            {products.find(p => p.id === parseInt(item.product))?.units?.map(u => (
                              <option key={u.id} value={u.id}>{u.unit_name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 w-32">
                          <input 
                            type="number" 
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-center"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg"
                            value={item.notes}
                            onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                            placeholder="ملاحظات البند..."
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                            <MinusCircle size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">المخزن</label>
                <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl" value={formData.store} onChange={(e) => {
                  setFormData({...formData, store: e.target.value});
                  markDirty();
                }}>
                  <option value="">اختر المخزن...</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">المستلم / المرسل</label>
                <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl" value={formData.person_name} onChange={(e) => {
                  setFormData({...formData, person_name: e.target.value});
                  markDirty();
                }} placeholder="اسم الشخص..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">السائق</label>
                <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl" value={formData.driver} onChange={(e) => {
                  setFormData({...formData, driver: e.target.value});
                  markDirty();
                }}>
                  <option value="">اختر السائق...</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">المندوب</label>
                <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl" value={formData.representative} onChange={(e) => {
                  setFormData({...formData, representative: e.target.value});
                  markDirty();
                }}>
                  <option value="">اختر المندوب...</option>
                  {representatives.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">ملاحظات عامة</label>
                <textarea className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl" rows="3" value={formData.notes} onChange={(e) => {
                  setFormData({...formData, notes: e.target.value});
                  markDirty();
                }} placeholder="أدخل أي ملاحظات إضافية هنا..."></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Exit Confirmation Modal */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200 text-right">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 text-center">هل أنت متأكد من الخروج؟</h3>
              <p className="text-gray-500 font-medium mb-8 text-center">لديك تغييرات غير محفوظة، سيتم فقدانها إذا خرجت الآن.</p>
              <div className="flex gap-3">
                <button
                  onClick={confirmExit}
                  className="flex-1 bg-amber-500 text-white py-3 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
                >
                  نعم، خروج
                </button>
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  البقاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800">الأذونات المخزنية</h1>
          <p className="text-gray-400 font-bold mt-1">إدارة أذونات الصرف والاستلام</p>
        </div>
        <button onClick={() => handleOpenForm()} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2">
          <Plus size={20} />
          إذن جديد
        </button>
      </div>

      <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl w-fit">
        {['all', 'issue', 'receive'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); fetchPermits(tab); }}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'all' ? 'الكل' : tab === 'issue' ? 'أذونات صرف' : 'أذونات استلام'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="بحث برقم الإذن أو اسم الشخص..." className="w-full pr-12 pl-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">رقم الإذن</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">النوع</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">التاريخ</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">المستلم/المرسل</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">المخزن</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPermits.map((permit) => (
                <tr key={permit.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-gray-700">{permit.number}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${permit.permit_type === 'issue' ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'}`}>
                      {permit.permit_type === 'issue' ? 'إذن صرف' : 'إذن استلام'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{new Date(permit.date).toLocaleDateString('ar-EG')}</td>
                  <td className="px-6 py-4 text-gray-700 font-bold">{permit.person_name}</td>
                  <td className="px-6 py-4 text-gray-500">{permit.store_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenForm(permit)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(permit.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Edit2 = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);

export default StorePermits;
