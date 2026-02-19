import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';
import { 
  Plus, 
  Search, 
  ArrowRightLeft, 
  ClipboardList,
  Save,
  X,
  History,
  Store,
  Package,
  Calendar,
  AlertCircle,
  RefreshCcw,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const OpeningBalanceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [productUnits, setProductUnits] = useState({}); // Mapping product ID to units array

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
      setPendingCloseAction(null);
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

  const [formData, setFormData] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0],
    store: '',
    notes: '',
    items: []
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [productsRes, storesRes] = await Promise.all([
        api.get('/products/api/products/'),
        api.get('/core/api/stores/')
      ]);
      setProducts(productsRes.data);
      setStores(storesRes.data);

      if (id) {
        const res = await api.get(`/finances/api/opening-balances/${id}/`);
        setFormData(res.data);
        
        // Populate product units for existing items
        const unitsMap = {};
        res.data.items.forEach(item => {
          const product = productsRes.data.find(p => p.id === item.product);
          if (product) {
            unitsMap[item.product] = product.units || [];
          }
        });
        setProductUnits(prev => ({ ...prev, ...unitsMap }));
        // Ensure dirty state is false after loading existing document
        setTimeout(() => setIsDirty(false), 0);
      } else {
        // Fetch next number if possible
        try {
          // You might want to implement a next_number endpoint for opening balances too
          // const numRes = await api.get('/api/opening-balances/next_number/');
          // setFormData(prev => ({ ...prev, number: numRes.data.next_number }));
        } catch (e) {}
        // Ensure dirty state is false after initializing new document
        setTimeout(() => setIsDirty(false), 0);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
      setIsDirty(false);
    }
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
          price: 0,
          update_purchase_price: false
        }
      ]
    });
    markDirty();
  };

  const handleRemoveItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
    markDirty();
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };
    item[field] = value;

    if (field === 'product') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        setProductUnits(prev => ({ ...prev, [value]: product.units || [] }));
        if (product.units && product.units.length > 0) {
          item.product_unit = product.units[0].id;
          item.price = product.units[0].purchase_price || 0;
        }
      }
    }

    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
    markDirty();
  };

  const handleSave = async (isPost = false) => {
    if (!formData.store || formData.items.length === 0) {
      alert('الرجاء اختيار المخزن وإضافة أصناف');
      return;
    }

    // Validate that all items have product and unit
    const invalidItem = formData.items.find(item => !item.product || !item.product_unit);
    if (invalidItem) {
      alert('الرجاء التأكد من اختيار الصنف والوحدة لجميع البنود');
      return;
    }

    try {
        let res;
        // Clean data before sending
        const dataToSend = {
          ...formData,
          items: formData.items.map(item => ({
            product: item.product,
            product_unit: item.product_unit,
            quantity: item.quantity,
            price: item.price,
            update_purchase_price: item.update_purchase_price
          }))
        };

        if (id) {
          res = await api.put(`/finances/api/opening-balances/${id}/`, dataToSend);
        } else {
          res = await api.post('/finances/api/opening-balances/', dataToSend);
        }

        setIsDirty(false);

        if (isPost) {
          try {
            await api.post(`/finances/api/opening-balances/${res.data.id}/post_opening_balance/`);
          } catch (postErr) {
          console.error('Error posting opening balance:', postErr);
          const postErrorMessage = postErr.response?.data?.error || postErr.response?.data?.detail || 'تم الحفظ بنجاح ولكن فشل الترحيل';
          alert(postErrorMessage);
          navigate('/inventory-operations/opening-balances');
          return;
        }
      }

      navigate('/inventory-operations/opening-balances');
    } catch (err) {
      console.error('Error saving opening balance:', err);
      let errorMessage = 'حدث خطأ أثناء الحفظ';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else {
          // Handle field-specific errors
          const fieldErrors = Object.entries(err.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
          if (fieldErrors) {
            errorMessage = `خطأ في البيانات:\n${fieldErrors}`;
          }
        }
      }
      
      alert(errorMessage);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {id ? 'تعديل رصيد أول المدة' : 'إضافة رصيد أول المدة'}
          </h1>
          <p className="text-gray-500">ضبط الأرصدة الافتتاحية للمخزون</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSafeCloseModal(() => navigate('/inventory-operations/opening-balances'))}
            className="px-6 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            إلغاء
          </button>
          <button
            onClick={() => handleSave(false)}
            className="px-6 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition flex items-center gap-2"
          >
            <Save size={20} />
            حفظ كمسودة
          </button>
          <button
            onClick={() => handleSave(true)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <CheckCircle2 size={20} />
            حفظ وترحيل
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 mr-1">رقم المستند</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => { setFormData({...formData, number: e.target.value}); markDirty(); }}
                  className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="تلقائي"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 mr-1">التاريخ</label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-3 text-gray-400" size={18} />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => { setFormData({...formData, date: e.target.value}); markDirty(); }}
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 mr-1">المخزن</label>
                <div className="relative">
                  <Store className="absolute right-3 top-3 text-gray-400" size={18} />
                  <select
                    value={formData.store}
                    onChange={(e) => { setFormData({...formData, store: e.target.value}); markDirty(); }}
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none"
                    required
                  >
                    <option value="">اختر المخزن</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <h3 className="font-black text-gray-800 flex items-center gap-2">
                  <Package size={18} className="text-blue-600" />
                  بنود الرصيد
                </h3>
                <button 
                  onClick={handleAddItem}
                  className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1"
                >
                  <PlusCircle size={18} />
                  إضافة صنف جديد
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">الصنف</th>
                      <th className="px-4 py-3">الوحدة</th>
                      <th className="px-4 py-3">الكمية</th>
                      <th className="px-4 py-3">السعر</th>
                      <th className="px-4 py-3 text-center">تحديث السعر</th>
                      <th className="px-4 py-3">الإجمالي</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {formData.items.map((item, index) => (
                      <tr key={index} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-2 py-3 w-1/3">
                          <select
                            value={item.product}
                            onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                          >
                            <option value="">اختر الصنف</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          <select
                            value={item.product_unit}
                            onChange={(e) => handleItemChange(index, 'product_unit', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                          >
                            <option value="">الوحدة</option>
                            {(productUnits[item.product] || []).map(u => (
                              <option key={u.id} value={u.id}>{u.unit_name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-bold"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-bold"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.update_purchase_price}
                            onChange={(e) => handleItemChange(index, 'update_purchase_price', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-black text-blue-600">
                          {(parseFloat(item.quantity || 0) * parseFloat(item.price || 0)).toFixed(2)}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {formData.items.length === 0 && (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <Package size={32} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm">لم يتم إضافة أي أصناف بعد</p>
                    <button 
                      onClick={handleAddItem}
                      className="text-blue-600 font-bold text-sm hover:underline"
                    >
                      اضغط هنا لإضافة أول صنف
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 sticky top-6">
            <h3 className="font-black text-gray-800 border-b border-gray-50 pb-4">ملخص المستند</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">إجمالي عدد الأصناف</span>
                <span className="font-bold text-gray-800">{formData.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">إجمالي الكميات</span>
                <span className="font-bold text-gray-800">
                  {formData.items.reduce((acc, item) => acc + (parseFloat(item.quantity) || 0), 0)}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="font-black text-gray-900">الإجمالي الكلي</span>
                <span className="text-xl font-black text-blue-600">
                  {formData.items.reduce((acc, item) => acc + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0).toFixed(2)}
                  <span className="text-xs mr-1">ج.م</span>
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <label className="text-sm font-bold text-gray-700 mr-1">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => { setFormData({...formData, notes: e.target.value}); markDirty(); }}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                rows="4"
                placeholder="أدخل أي ملاحظات إضافية هنا..."
              ></textarea>
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
};

export default OpeningBalanceForm;
