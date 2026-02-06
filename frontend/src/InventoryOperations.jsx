import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const InventoryOperations = () => {
  const { type } = useParams();
  const [activeTab, setActiveTab] = useState(type || 'adjustments');

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    }
  }, [type]);

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [productMovements, setProductMovements] = useState([]);
  const [movementFilters, setMovementFilters] = useState({
    product: '',
    store: '',
    start_date: '',
    end_date: ''
  });
  
  // Modals
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productUnits, setProductUnits] = useState([]);

  // Form Data
  const [adjustmentFormData, setAdjustmentFormData] = useState({
    product: '',
    store: '',
    product_unit: '',
    quantity: '',
    adjustment_type: 'INCREASE',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [transferFormData, setTransferFormData] = useState({
    product: '',
    from_store: '',
    to_store: '',
    product_unit: '',
    quantity: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, storesRes, adjRes, transRes] = await Promise.all([
        api.get('/api/products/'),
        api.get('/api/stores/'),
        api.get('/api/inventory-adjustments/'),
        api.get('/api/stock-transfers/')
      ]);
      setProducts(productsRes.data);
      setStores(storesRes.data);
      setAdjustments(adjRes.data);
      setTransfers(transRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    if (!movementFilters.product) return;
    try {
      setLoading(true);
      const res = await api.get('/api/product-transactions/', {
        params: {
          product: movementFilters.product,
          store: movementFilters.store,
          start_date: movementFilters.start_date,
          end_date: movementFilters.end_date
        }
      });
      // Sort by date and id
      const sorted = res.data.sort((a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id);
      setProductMovements(sorted);
    } catch (err) {
      console.error('Error fetching movements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'movements') {
      fetchMovements();
    }
  }, [activeTab, movementFilters.product, movementFilters.store]);

  const handleProductChange = async (productId, type) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product) {
      setSelectedProduct(product);
      try {
        const res = await api.get(`/api/products/${productId}/units/`);
        setProductUnits(res.data);
        if (type === 'adjustment') {
          setAdjustmentFormData(prev => ({ ...prev, product: productId, product_unit: res.data[0]?.id || '' }));
        } else {
          setTransferFormData(prev => ({ ...prev, product: productId, product_unit: res.data[0]?.id || '' }));
        }
      } catch (err) {
        console.error('Error fetching units:', err);
      }
    }
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/inventory-adjustments/', adjustmentFormData);
      // Auto post the adjustment
      await api.post(`/api/inventory-adjustments/${res.data.id}/post_adjustment/`);
      setIsAdjustmentModalOpen(false);
      setAdjustmentFormData({
        product: '', store: '', product_unit: '', quantity: '', adjustment_type: 'INCREASE', reason: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) {
      console.error('Error saving adjustment:', err);
      alert('حدث خطأ أثناء حفظ التسوية');
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (transferFormData.from_store === transferFormData.to_store) {
      alert('لا يمكن التحويل لنفس المخزن');
      return;
    }
    try {
      const res = await api.post('/api/stock-transfers/', transferFormData);
      // Auto post the transfer
      await api.post(`/api/stock-transfers/${res.data.id}/post_transfer/`);
      setIsTransferModalOpen(false);
      setTransferFormData({
        product: '', from_store: '', to_store: '', product_unit: '', quantity: '', notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) {
      console.error('Error saving transfer:', err);
      alert('حدث خطأ أثناء حفظ التحويل');
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
          <h1 className="text-2xl font-bold text-gray-800">عمليات المخزون</h1>
          <p className="text-gray-500">إدارة تسويات وتحويلات المخزون</p>
        </div>
        <button 
          onClick={() => activeTab === 'adjustments' ? setIsAdjustmentModalOpen(true) : setIsTransferModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          {activeTab === 'adjustments' ? 'تسوية جديدة' : 'تحويل جديد'}
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-100 pb-px">
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 'adjustments' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <ClipboardList size={18} />
            تسويات المخزون ({adjustments.length})
          </div>
          {activeTab === 'adjustments' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 'transfers' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={18} />
            تحويلات المخازن ({transfers.length})
          </div>
          {activeTab === 'transfers' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 'movements' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <History size={18} />
            حركات المنتج (كارت الصنف)
          </div>
          {activeTab === 'movements' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {activeTab === 'movements' && (
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">المنتج</label>
              <select 
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                value={movementFilters.product}
                onChange={(e) => setMovementFilters({...movementFilters, product: e.target.value})}
              >
                <option value="">اختر المنتج...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">المخزن (اختياري)</label>
              <select 
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                value={movementFilters.store}
                onChange={(e) => setMovementFilters({...movementFilters, store: e.target.value})}
              >
                <option value="">كل المخازن</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        )}
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            {activeTab === 'adjustments' ? (
              <tr>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold">المنتج</th>
                <th className="p-4 font-bold">المخزن</th>
                <th className="p-4 font-bold">الكمية</th>
                <th className="p-4 font-bold">النوع</th>
                <th className="p-4 font-bold">السبب</th>
                <th className="p-4 font-bold">الحالة</th>
              </tr>
            ) : activeTab === 'transfers' ? (
              <tr>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold">المنتج</th>
                <th className="p-4 font-bold">من مخزن</th>
                <th className="p-4 font-bold">إلى مخزن</th>
                <th className="p-4 font-bold">الكمية</th>
                <th className="p-4 font-bold">الحالة</th>
              </tr>
            ) : (
              <tr>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold">العملية</th>
                <th className="p-4 font-bold">الوارد</th>
                <th className="p-4 font-bold">المنصرف</th>
                <th className="p-4 font-bold">الرصيد</th>
                <th className="p-4 font-bold">المخزن</th>
                <th className="p-4 font-bold">البيان</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activeTab === 'adjustments' ? (
              adjustments.map((adj) => (
                <tr key={adj.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-sm font-medium">{adj.date}</td>
                  <td className="p-4 text-sm font-bold text-gray-800">{adj.product_name}</td>
                  <td className="p-4 text-sm text-gray-600">{adj.store_name}</td>
                  <td className="p-4 text-sm font-bold">
                    {adj.quantity} {adj.unit_name}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                      adj.adjustment_type === 'INCREASE' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {adj.adjustment_type === 'INCREASE' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                      {adj.adjustment_type_display}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{adj.reason || '-'}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center gap-1 w-fit">
                      <CheckCircle2 size={14} />
                      تم التنفيذ
                    </span>
                  </td>
                </tr>
              ))
            ) : activeTab === 'transfers' ? (
              transfers.map((trf) => (
                <tr key={trf.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-sm font-medium">{trf.date}</td>
                  <td className="p-4 text-sm font-bold text-gray-800">{trf.product_name}</td>
                  <td className="p-4 text-sm text-gray-600">{trf.from_store_name}</td>
                  <td className="p-4 text-sm text-gray-600">{trf.to_store_name}</td>
                  <td className="p-4 text-sm font-bold">
                    {trf.quantity} {trf.unit_name}
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center gap-1 w-fit">
                      <CheckCircle2 size={14} />
                      تم التحويل
                    </span>
                  </td>
                </tr>
              ))
            ) : productMovements.length > 0 ? (
              productMovements.map((move) => {
                const isIncoming = ['PURCHASE', 'SALE_RETURN', 'ADJUSTMENT'].includes(move.transaction_type) && move.base_quantity > 0;
                const isOutgoing = ['SALE', 'PURCHASE_RETURN', 'ADJUSTMENT'].includes(move.transaction_type) && move.base_quantity < 0;
                
                return (
                  <tr key={move.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-sm font-medium">{move.date}</td>
                    <td className="p-4 text-sm font-bold text-gray-700">{move.transaction_type_display}</td>
                    <td className="p-4 text-sm font-bold text-green-600">
                      {isIncoming ? move.base_quantity : '-'}
                    </td>
                    <td className="p-4 text-sm font-bold text-red-600">
                      {isOutgoing ? Math.abs(move.base_quantity) : '-'}
                    </td>
                    <td className="p-4 text-sm font-black text-gray-900 bg-gray-50/30">
                      {move.balance_after}
                    </td>
                    <td className="p-4 text-sm text-gray-600">{move.store_name}</td>
                    <td className="p-4 text-xs text-gray-500 max-w-xs truncate">{move.description}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-400">
                  {movementFilters.product ? 'لا توجد حركات لهذا المنتج' : 'يرجى اختيار منتج لعرض حركاته'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsAdjustmentModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">إضافة تسوية مخزون</h2>
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المنتج *</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={adjustmentFormData.product}
                    onChange={(e) => handleProductChange(e.target.value, 'adjustment')}
                  >
                    <option value="">اختر المنتج</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المخزن *</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={adjustmentFormData.store}
                    onChange={(e) => setAdjustmentFormData({...adjustmentFormData, store: e.target.value})}
                  >
                    <option value="">اختر المخزن</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة *</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={adjustmentFormData.product_unit}
                    onChange={(e) => setAdjustmentFormData({...adjustmentFormData, product_unit: e.target.value})}
                  >
                    <option value="">اختر الوحدة</option>
                    {productUnits.map(u => (
                      <option key={u.id} value={u.id}>{u.unit_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكمية *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={adjustmentFormData.quantity}
                    onChange={(e) => setAdjustmentFormData({...adjustmentFormData, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع التسوية *</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={adjustmentFormData.adjustment_type}
                    onChange={(e) => setAdjustmentFormData({...adjustmentFormData, adjustment_type: e.target.value})}
                  >
                    <option value="INCREASE">زيادة مخزون</option>
                    <option value="DECREASE">نقص مخزون</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السبب / ملاحظات</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-20"
                  value={adjustmentFormData.reason}
                  onChange={(e) => setAdjustmentFormData({...adjustmentFormData, reason: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <Save size={20} />
                  تنفيذ التسوية
                </button>
                <button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsTransferModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">إضافة تحويل مخزني</h2>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المنتج *</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={transferFormData.product}
                  onChange={(e) => handleProductChange(e.target.value, 'transfer')}
                >
                  <option value="">اختر المنتج</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">من مخزن *</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={transferFormData.from_store}
                    onChange={(e) => setTransferFormData({...transferFormData, from_store: e.target.value})}
                  >
                    <option value="">اختر المخزن</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">إلى مخزن *</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={transferFormData.to_store}
                    onChange={(e) => setTransferFormData({...transferFormData, to_store: e.target.value})}
                  >
                    <option value="">اختر المخزن</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة *</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={transferFormData.product_unit}
                    onChange={(e) => setTransferFormData({...transferFormData, product_unit: e.target.value})}
                  >
                    <option value="">اختر الوحدة</option>
                    {productUnits.map(u => (
                      <option key={u.id} value={u.id}>{u.unit_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكمية *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={transferFormData.quantity}
                    onChange={(e) => setTransferFormData({...transferFormData, quantity: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-20"
                  value={transferFormData.notes}
                  onChange={(e) => setTransferFormData({...transferFormData, notes: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <ArrowRightLeft size={20} />
                  تنفيذ التحويل
                </button>
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
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

export default InventoryOperations;
