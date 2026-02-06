import React, { useEffect, useState } from 'react';
import api from './api';
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
  MinusCircle 
} from 'lucide-react';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  
  // Form data state
  const [contacts, setContacts] = useState([]);
  const [stores, setStores] = useState([]);
  const [safes, setSafes] = useState([]);
  const [products, setProducts] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [formData, setFormData] = useState({
    number: '',
    date: new Date().toISOString().slice(0, 16),
    invoice_type: 'sale',
    payment_type: 'cash',
    contact: '',
    store: '',
    safe: '',
    representative: '',
    driver: '',
    notes: '',
    items: []
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = '/invoices/api/invoices/';
      if (activeTab !== 'all') {
        url += `?type=${activeTab}`;
      }
      const response = await api.get(url);
      setInvoices(response.data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [c, s, sf, p, r, d] = await Promise.all([
        api.get('/api/contacts/'),
        api.get('/api/stores/'),
        api.get('/api/safes/'),
        api.get('/products/api/products/'),
        api.get('/api/representatives/'),
        api.get('/api/drivers/')
      ]);
      setContacts(c.data);
      setStores(s.data);
      setSafes(sf.data);
      setProducts(p.data);
      setRepresentatives(r.data);
      setDrivers(d.data);
    } catch (err) {
      console.error('Error fetching form data:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchFormData();
  }, [activeTab]);

  const handleOpenModal = (invoice = null) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        ...invoice,
        date: invoice.date.slice(0, 16),
        contact: invoice.contact || '',
        store: invoice.store || '',
        safe: invoice.safe || '',
        representative: invoice.representative || '',
        driver: invoice.driver || '',
      });
    } else {
      setEditingInvoice(null);
      setFormData({
        number: `INV-${Date.now()}`,
        date: new Date().toISOString().slice(0, 16),
        invoice_type: 'sale',
        payment_type: 'cash',
        contact: '',
        store: stores[0]?.id || '',
        safe: safes[0]?.id || '',
        representative: '',
        driver: '',
        notes: '',
        items: []
      });
    }
    setIsModalOpen(true);
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
          unit_price: 0,
          total_price: 0,
          discount_percentage: 0,
          discount_amount: 0,
          tax_percentage: 0,
          tax_amount: 0,
          net_price: 0
        }
      ]
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };
    item[field] = value;

    if (field === 'product') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        item.unit_price = product.sale_price || 0;
        if (product.units && product.units.length > 0) {
          item.product_unit = product.units[0].id;
        }
      }
    }

    item.total_price = item.quantity * item.unit_price;
    item.discount_amount = (item.total_price * item.discount_percentage) / 100;
    const priceAfterDiscount = item.total_price - item.discount_amount;
    item.tax_amount = (priceAfterDiscount * item.tax_percentage) / 100;
    item.net_price = priceAfterDiscount + item.tax_amount;

    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const total_amount = formData.items.reduce((sum, item) => sum + item.total_price, 0);
      const discount_amount = formData.items.reduce((sum, item) => sum + item.discount_amount, 0);
      const tax_amount = formData.items.reduce((sum, item) => sum + item.tax_amount, 0);
      const net_amount = total_amount - discount_amount + tax_amount;

      const data = {
        ...formData,
        total_amount,
        discount_amount,
        tax_amount,
        net_amount,
        paid_amount: formData.payment_type === 'cash' ? net_amount : 0,
        remaining_amount: formData.payment_type === 'cash' ? 0 : net_amount,
        is_posted: true
      };

      if (editingInvoice) {
        await api.put(`/invoices/api/invoices/${editingInvoice.id}/`, data);
      } else {
        await api.post('/invoices/api/invoices/', data);
      }
      setIsModalOpen(false);
      fetchInvoices();
    } catch (err) {
      console.error('Error saving invoice:', err);
      alert('حدث خطأ أثناء حفظ الفاتورة');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        await api.delete(`/invoices/api/invoices/${id}/`);
        fetchInvoices();
      } catch (err) {
        console.error('Error deleting invoice:', err);
        alert('حدث خطأ أثناء حذف الفاتورة');
      }
    }
  };

  const filteredInvoices = invoices.filter(invoice => 
    invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.contact_name && invoice.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (invoice) => {
    if (invoice.is_posted) {
      return (
        <span className="bg-green-100 text-green-600 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
          <CheckCircle2 size={10} />
          مرحلة
        </span>
      );
    }
    return (
      <span className="bg-amber-100 text-amber-600 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
        <Clock size={10} />
        مسودة
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const types = {
      'sale': { label: 'بيع', color: 'text-blue-600 bg-blue-50' },
      'purchase': { label: 'شراء', color: 'text-rose-600 bg-rose-50' },
      'sale_return': { label: 'مرتجع بيع', color: 'text-amber-600 bg-amber-50' },
      'purchase_return': { label: 'مرتجع شراء', color: 'text-purple-600 bg-purple-50' },
    };
    const t = types[type] || { label: type, color: 'text-gray-600 bg-gray-50' };
    return <span className={`${t.color} px-2 py-1 rounded-md text-[10px] font-bold`}>{t.label}</span>;
  };

  if (loading && invoices.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الفواتير</h1>
          <p className="text-gray-500">إدارة مبيعات ومشتريات النظام</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            فاتورة جديدة
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-100 overflow-x-auto pb-px">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'sale', label: 'المبيعات' },
          { id: 'purchase', label: 'المشتريات' },
          { id: 'sale_return', label: 'مرتجع مبيعات' },
          { id: 'purchase_return', label: 'مرتجع مشتريات' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="البحث برقم الفاتورة أو اسم العميل..."
            className="w-full pr-10 pl-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-gray-600 hover:bg-gray-50 transition shadow-sm font-bold">
          <Filter size={18} />
          تصفية متقدمة
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-4 font-black text-gray-600 text-sm">رقم الفاتورة</th>
              <th className="p-4 font-black text-gray-600 text-sm">التاريخ</th>
              <th className="p-4 font-black text-gray-600 text-sm">النوع</th>
              <th className="p-4 font-black text-gray-600 text-sm">العميل/المورد</th>
              <th className="p-4 font-black text-gray-600 text-sm">الإجمالي</th>
              <th className="p-4 font-black text-gray-600 text-sm">الحالة</th>
              <th className="p-4 font-black text-gray-600 text-sm">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                <td className="p-4">
                  <span className="font-bold text-gray-900">#{invoice.number}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar size={14} />
                    {new Date(invoice.date).toLocaleDateString('ar-SA')}
                  </div>
                </td>
                <td className="p-4">{getTypeBadge(invoice.invoice_type)}</td>
                <td className="p-4 text-gray-700 font-medium">{invoice.contact_name}</td>
                <td className="p-4">
                  <div className="font-black text-blue-600">
                    {parseFloat(invoice.net_amount).toLocaleString()} ج.م
                  </div>
                </td>
                <td className="p-4">{getStatusBadge(invoice)}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => window.open(`/invoices/print/${invoice.id}/`, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Printer size={16} />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(invoice)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <FileText size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(invoice.id)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-800">
                {editingInvoice ? 'تعديل فاتورة' : 'إضافة فاتورة جديدة'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">رقم الفاتورة</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.number}
                    onChange={(e) => setFormData({...formData, number: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">التاريخ</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">نوع الفاتورة</label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.invoice_type}
                    onChange={(e) => setFormData({...formData, invoice_type: e.target.value})}
                  >
                    <option value="sale">بيع</option>
                    <option value="purchase">شراء</option>
                    <option value="sale_return">مرتجع بيع</option>
                    <option value="purchase_return">مرتجع شراء</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">نوع الدفع</label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.payment_type}
                    onChange={(e) => setFormData({...formData, payment_type: e.target.value})}
                  >
                    <option value="cash">نقدي</option>
                    <option value="credit">آجل</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">العميل/المورد</label>
                  <select
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  >
                    <option value="">اختر العميل/المورد</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">المخزن</label>
                  <select
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.store}
                    onChange={(e) => setFormData({...formData, store: e.target.value})}
                  >
                    <option value="">اختر المخزن</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">الخزنة</label>
                  <select
                    required={formData.payment_type === 'cash'}
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.safe}
                    onChange={(e) => setFormData({...formData, safe: e.target.value})}
                  >
                    <option value="">اختر الخزنة</option>
                    {safes.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-gray-800 flex items-center gap-2">
                    <Package size={18} className="text-blue-600" />
                    بنود الفاتورة
                  </h3>
                  <button 
                    type="button"
                    onClick={handleAddItem}
                    className="text-blue-600 font-bold flex items-center gap-1 hover:underline"
                  >
                    <PlusCircle size={18} />
                    إضافة صنف
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600">
                        <th className="p-2 text-right">الصنف</th>
                        <th className="p-2 text-right">الوحدة</th>
                        <th className="p-2 text-right w-24">الكمية</th>
                        <th className="p-2 text-right w-32">السعر</th>
                        <th className="p-2 text-right w-24">الخصم %</th>
                        <th className="p-2 text-right w-32">الإجمالي</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-50">
                          <td className="p-2">
                            <select
                              required
                              className="w-full px-2 py-1.5 bg-gray-50 border-none rounded-lg"
                              value={item.product}
                              onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                            >
                              <option value="">اختر صنف</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              required
                              className="w-full px-2 py-1.5 bg-gray-50 border-none rounded-lg"
                              value={item.product_unit}
                              onChange={(e) => handleItemChange(index, 'product_unit', e.target.value)}
                            >
                              <option value="">اختر وحدة</option>
                              {products.find(p => p.id === parseInt(item.product))?.units?.map(u => (
                                <option key={u.id} value={u.id}>{u.unit_name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              required
                              min="0.001"
                              step="0.001"
                              className="w-full px-2 py-1.5 bg-gray-50 border-none rounded-lg"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-1.5 bg-gray-50 border-none rounded-lg"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-full px-2 py-1.5 bg-gray-50 border-none rounded-lg"
                              value={item.discount_percentage}
                              onChange={(e) => handleItemChange(index, 'discount_percentage', parseFloat(e.target.value))}
                            />
                          </td>
                          <td className="p-2 font-bold text-gray-700">
                            {item.net_price.toLocaleString()}
                          </td>
                          <td className="p-2">
                            <button 
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <MinusCircle size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 mr-1">المندوب</label>
                      <select
                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                        value={formData.representative}
                        onChange={(e) => setFormData({...formData, representative: e.target.value})}
                      >
                        <option value="">بدون مندوب</option>
                        {representatives.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 mr-1">السائق</label>
                      <select
                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                        value={formData.driver}
                        onChange={(e) => setFormData({...formData, driver: e.target.value})}
                      >
                        <option value="">بدون سائق</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 mr-1">ملاحظات</label>
                    <textarea
                      rows="3"
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    ></textarea>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-3xl space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>إجمالي البنود:</span>
                    <span>{formData.items.reduce((sum, item) => sum + item.total_price, 0).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>إجمالي الخصم:</span>
                    <span>{formData.items.reduce((sum, item) => sum + item.discount_amount, 0).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-cyan-600 border-b border-gray-200 pb-3">
                    <span>إجمالي الضريبة:</span>
                    <span>{formData.items.reduce((sum, item) => sum + item.tax_amount, 0).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-xl font-black text-blue-600 pt-2">
                    <span>الصافي النهائي:</span>
                    <span>{(
                      formData.items.reduce((sum, item) => sum + item.total_price, 0) - 
                      formData.items.reduce((sum, item) => sum + item.discount_amount, 0) + 
                      formData.items.reduce((sum, item) => sum + item.tax_amount, 0)
                    ).toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  حفظ الفاتورة وترحيلها
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 bg-gray-100 text-gray-600 py-3 rounded-2xl font-black hover:bg-gray-200 transition"
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

export default Invoices;
