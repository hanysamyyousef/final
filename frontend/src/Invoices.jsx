import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from './api';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import InvoicePrint from './InvoicePrint';
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
  FileSpreadsheet
} from 'lucide-react';

const Invoices = () => {
  const { type } = useParams();
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(type || 'all');

  useEffect(() => {
    if (type) {
      setActiveTab(type === 'sales' ? 'sale' : type === 'sales-return' ? 'sale_return' : type === 'purchase' ? 'purchase' : type === 'purchase-return' ? 'purchase_return' : type === 'damaged' ? 'damaged' : 'all');
    }
  }, [type]);
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [settings, setSettings] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null);
  
  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `فاتورة_${printingInvoice?.number || ''}`,
  });

  const triggerPrint = (invoice) => {
    setPrintingInvoice(invoice);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const exportToExcel = (invoice = null) => {
    const dataToExport = invoice ? [invoice] : invoices;
    const worksheetData = dataToExport.map(inv => ({
      'رقم الفاتورة': inv.number,
      'التاريخ': new Date(inv.date).toLocaleString('ar-EG'),
      'النوع': inv.invoice_type_display,
      'العميل/المورد': inv.contact_name,
      'المخزن': inv.store_name,
      'الإجمالي': inv.total_amount,
      'الخصم': inv.discount_amount,
      'الضريبة': inv.tax_amount,
      'الصافي': inv.net_amount,
      'المدفوع': inv.paid_amount,
      'المتبقي': inv.remaining_amount,
      'الحالة': inv.is_posted ? 'مرحلة' : 'مسودة'
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.utils.writeFile(wb, invoice ? `فاتورة_${invoice.number}.xlsx` : 'كشف_الفواتير.xlsx');
  };

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
    total_amount: 0,
    discount_type: 'value',
    discount_value: 0,
    discount_amount: 0,
    tax_type: 'value',
    tax_value: 0,
    tax_amount: 0,
    net_amount: 0,
    paid_amount: 0,
    remaining_amount: 0,
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
      const [c, s, sf, p, r, d, sett, comp] = await Promise.all([
        api.get('/core/api/contacts/'),
        api.get('/core/api/stores/'),
        api.get('/core/api/safes/'),
        api.get('/products/api/products/'),
        api.get('/core/api/representatives/'),
        api.get('/core/api/drivers/'),
        api.get('/core/api/system-settings/'),
        api.get('/core/api/companies/')
      ]);
      setContacts(c.data);
      setStores(s.data);
      setSafes(sf.data);
      setProducts(p.data);
      setRepresentatives(r.data);
      setDrivers(d.data);
      
      let finalSettings = {};
      if (sett.data && sett.data.length > 0) {
        finalSettings = { ...sett.data[0] };
      }
      
      // دمج بيانات الشركة في الإعدادات لتظهر في الطباعة
      if (comp.data && comp.data.length > 0) {
        const mainCompany = comp.data[0];
        finalSettings.company_name = mainCompany.name;
        finalSettings.address = mainCompany.address;
        finalSettings.phone = mainCompany.phone;
        finalSettings.logo = mainCompany.logo;
        finalSettings.tax_number = mainCompany.tax_number;
      }
      
      setSettings(finalSettings);
    } catch (err) {
      console.error('Error fetching form data:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchFormData();
  }, [activeTab]);

  const handleOpenForm = async (invoice = null) => {
    if (invoice) {
      setEditingInvoice(invoice);
      const loadedFormData = {
        ...invoice,
        date: invoice.date.slice(0, 16),
        contact: invoice.contact || '',
        store: invoice.store || '',
        safe: invoice.safe || '',
        representative: invoice.representative || '',
        driver: invoice.driver || '',
        discount_type: invoice.discount_type || 'value',
        discount_value: invoice.discount_value || 0,
        tax_type: invoice.tax_type || 'value',
        tax_value: invoice.tax_value || 0,
      };
      
      const totals = calculateInvoiceTotals(invoice.items, loadedFormData.discount_value, loadedFormData.discount_type, loadedFormData.tax_value, loadedFormData.tax_type);
      setFormData({ ...loadedFormData, ...totals });
      
      if (invoice.contact) {
        try {
          const contactRes = await api.get(`/core/api/contacts/${invoice.contact}/`);
          setPreviousBalance(parseFloat(contactRes.data.current_balance) - parseFloat(invoice.remaining_amount));
        } catch (err) {
          console.error('Error fetching contact balance:', err);
        }
      }
    } else {
      setEditingInvoice(null);
      
      // جلب الرقم التالي من الخادم
      let nextNumber = `INV-${Date.now()}`;
      try {
        const response = await api.get('/invoices/api/invoices/next_number/', { params: { type: 'sale' } });
        nextNumber = response.data.next_number;
      } catch (err) {
        console.error('Error fetching next number:', err);
      }

      setFormData({
        number: nextNumber,
        date: new Date().toISOString().slice(0, 16),
        invoice_type: 'sale',
        payment_type: 'cash',
        contact: '',
        store: stores[0]?.id || '',
        safe: safes[0]?.id || '',
        representative: '',
        driver: '',
        notes: '',
        total_amount: 0,
        discount_type: 'value',
        discount_value: 0,
        discount_amount: 0,
        tax_type: 'value',
        tax_value: 0,
        tax_amount: 0,
        net_amount: 0,
        paid_amount: 0,
        remaining_amount: 0,
        items: []
      });
      setPreviousBalance(0);
    }
    setView('form');
  };

  const handleContactChange = async (contactId) => {
    setFormData({ ...formData, contact: contactId });
    if (contactId) {
      try {
        const response = await api.get(`/core/api/contacts/${contactId}/`);
        setPreviousBalance(parseFloat(response.data.current_balance));
      } catch (err) {
        console.error('Error fetching contact balance:', err);
      }
    } else {
      setPreviousBalance(0);
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
          unit_price: 0,
          total_price: 0,
          discount_percentage: 0,
          discount_amount: 0,
          tax_percentage: 0,
          tax_amount: 0,
          net_price: 0,
          notes: ''
        }
      ]
    });
  };

  const calculateInvoiceTotals = (items, discountValue = null, discountType = null, taxValue = null, taxType = null) => {
    const total_amount = items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
    const items_discount = items.reduce((sum, item) => sum + (parseFloat(item.discount_amount) || 0), 0);
    const items_tax = items.reduce((sum, item) => sum + (parseFloat(item.tax_amount) || 0), 0);
    
    const dValue = discountValue !== null ? parseFloat(discountValue) : parseFloat(formData.discount_value || 0);
    const dType = discountType !== null ? discountType : formData.discount_type;
    const tValue = taxValue !== null ? parseFloat(taxValue) : parseFloat(formData.tax_value || 0);
    const tType = taxType !== null ? taxType : formData.tax_type;

    let global_discount_amount = 0;
    if (dType === 'percent') {
      global_discount_amount = (total_amount * dValue) / 100;
    } else {
      global_discount_amount = dValue;
    }

    let global_tax_amount = 0;
    if (tType === 'percent') {
      global_tax_amount = ((total_amount - global_discount_amount) * tValue) / 100;
    } else {
      global_tax_amount = tValue;
    }

    const discount_total = items_discount + global_discount_amount;
    const tax_total = items_tax + global_tax_amount;
    const net_amount = total_amount - discount_total + tax_total;
    
    let paid_amount = parseFloat(formData.paid_amount || 0);
    if (formData.payment_type === 'cash') {
      paid_amount = net_amount;
    }
    
    const remaining_amount = net_amount - paid_amount;
    
    return {
      total_amount,
      discount_value: dValue,
      discount_type: dType,
      discount_amount: discount_total,
      tax_value: tValue,
      tax_type: tType,
      tax_amount: tax_total,
      net_amount,
      paid_amount,
      remaining_amount,
      global_discount_amount: global_discount_amount,
      global_tax_amount: global_tax_amount
    };
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };
    item[field] = value;

    if (field === 'product') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        item.unit_price = product.sale_price || 0;
        item.tax_percentage = product.tax_rate || 0;
        if (product.units && product.units.length > 0) {
          item.product_unit = product.units[0].id;
        }
      }
    }

    item.total_price = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    item.discount_amount = (item.total_price * (parseFloat(item.discount_percentage) || 0)) / 100;
    const priceAfterDiscount = item.total_price - item.discount_amount;
    item.tax_amount = (priceAfterDiscount * (parseFloat(item.tax_percentage) || 0)) / 100;
    item.net_price = priceAfterDiscount + item.tax_amount;

    newItems[index] = item;
    
    const totals = calculateInvoiceTotals(newItems);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const handleGlobalChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    let totals;
    if (field === 'discount_value') {
      totals = calculateInvoiceTotals(formData.items, value, formData.discount_type, formData.tax_value, formData.tax_type);
    } else if (field === 'discount_type') {
      totals = calculateInvoiceTotals(formData.items, formData.discount_value, value, formData.tax_value, formData.tax_type);
    } else if (field === 'tax_value') {
      totals = calculateInvoiceTotals(formData.items, formData.discount_value, formData.discount_type, value, formData.tax_type);
    } else if (field === 'tax_type') {
      totals = calculateInvoiceTotals(formData.items, formData.discount_value, formData.discount_type, formData.tax_value, value);
    } else {
      totals = calculateInvoiceTotals(formData.items);
    }
    setFormData({ ...newFormData, ...totals });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (view === 'form' && e.key === '+') {
        e.preventDefault();
        handleAddItem();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, formData.items]);

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const totals = calculateInvoiceTotals(newItems);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // التحقق من البيانات الأساسية
    if (!formData.contact) {
      alert('يرجى اختيار العميل أو المورد');
      return;
    }
    if (!formData.store) {
      alert('يرجى اختيار المخزن');
      return;
    }
    if (formData.items.length === 0) {
      alert('يجب إضافة بند واحد على الأقل للفاتورة');
      return;
    }

    // تصفية البنود الفارغة (بدون منتج)
    const validItems = formData.items.filter(item => item.product && item.product !== '');
    if (validItems.length === 0) {
      alert('يرجى اختيار منتجات لبنود الفاتورة');
      return;
    }

    try {
      // تجهيز البيانات للإرسال
      const sanitizedData = {
        ...formData,
        items: validItems,
        is_posted: true,
        // تحويل القيم الفارغة إلى null للحقول الاختيارية فقط
        contact: formData.contact,
        store: formData.store,
        safe: formData.safe || null,
        representative: formData.representative || null,
        driver: formData.driver || null,
      };

      // حذف الحقول التي لا يحتاجها السيريالايزر أو التي تخص الواجهة فقط
      const fieldsToRemove = [
        'contact_name', 'store_name', 'safe_name', 
        'representative_name', 'driver_name', 
        'invoice_type_display', 'payment_type_display',
        'global_discount_amount', 'global_tax_amount'
      ];
      
      fieldsToRemove.forEach(field => delete sanitizedData[field]);

      // التأكد من بنود الفاتورة
      sanitizedData.items = sanitizedData.items.map(item => {
        const sanitizedItem = { ...item };
        // التأكد من أن القيم العددية صحيحة
        sanitizedItem.quantity = parseFloat(item.quantity) || 0;
        sanitizedItem.unit_price = parseFloat(item.unit_price) || 0;
        sanitizedItem.discount_percentage = parseFloat(item.discount_percentage) || 0;
        sanitizedItem.tax_percentage = parseFloat(item.tax_percentage) || 0;
        
        // حذف الحقول الإضافية من البنود إن وجدت
        delete sanitizedItem.product_name;
        delete sanitizedItem.unit_name;
        delete sanitizedItem.net_price; // سيتم إعادة حسابه في الخلفية
        return sanitizedItem;
      });

      if (editingInvoice) {
        await api.put(`/invoices/api/invoices/${editingInvoice.id}/`, sanitizedData);
      } else {
        await api.post('/invoices/api/invoices/', sanitizedData);
      }
      setView('list');
      fetchInvoices();
    } catch (err) {
      console.error('Error saving invoice:', err.response?.data || err);
      let errorMsg = 'حدث خطأ أثناء حفظ الفاتورة';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          errorMsg = Object.entries(err.response.data)
            .map(([key, val]) => {
              const displayVal = typeof val === 'object' ? JSON.stringify(val) : val;
              return `${key}: ${displayVal}`;
            })
            .join('\n');
        } else {
          errorMsg = err.response.data;
        }
      }
      alert(errorMsg);
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

  if (view === 'form') {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('list')}
              className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600 shadow-sm"
            >
              <X size={24} />
            </button>
            <h1 className="text-2xl font-black text-gray-800">
              {editingInvoice ? 'تعديل فاتورة' : 'إضافة فاتورة جديدة'}
            </h1>
          </div>
          <div className="flex gap-3">
            {editingInvoice && (
              <>
                <button 
                  type="button"
                  onClick={() => triggerPrint(formData)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition shadow-sm flex items-center gap-2"
                >
                  <Printer size={20} />
                  طباعة
                </button>
                <button 
                  type="button"
                  onClick={() => exportToExcel(formData)}
                  className="px-6 py-2.5 bg-green-50 text-green-700 rounded-xl font-bold hover:bg-green-100 transition shadow-sm flex items-center gap-2"
                >
                  <FileSpreadsheet size={20} />
                  إكسل
                </button>
              </>
            )}
            <button 
              type="button"
              onClick={() => setView('list')}
              className="px-6 py-2.5 bg-white text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm"
            >
              إلغاء
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <Save size={20} />
              حفظ الفاتورة
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {/* Main Info */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
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
                    onChange={async (e) => {
                      const newType = e.target.value;
                      setFormData({...formData, invoice_type: newType});
                      // جلب الرقم التالي للنوع الجديد
                      try {
                        const response = await api.get('/invoices/api/invoices/next_number/', { params: { type: newType } });
                        setFormData(prev => ({...prev, invoice_type: newType, number: response.data.next_number}));
                      } catch (err) {
                        console.error('Error fetching next number:', err);
                      }
                    }}
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
                    onChange={(e) => {
                      const newType = e.target.value;
                      const totals = calculateInvoiceTotals(formData.items, formData.discount_amount, formData.tax_amount);
                      setFormData({...formData, payment_type: newType, ...totals});
                    }}
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
                    onChange={(e) => handleContactChange(e.target.value)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 mr-1">المندوب</label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.representative}
                    onChange={(e) => setFormData({...formData, representative: e.target.value})}
                  >
                    <option value="">اختر المندوب</option>
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
                    <option value="">اختر السائق</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-800 flex items-center gap-2">
                  <Package size={18} className="text-blue-600" />
                  بنود الفاتورة
                  <span className="text-xs text-gray-400 font-normal">(اضغط + لإضافة سطر جديد)</span>
                </h3>
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold flex items-center gap-1 hover:bg-blue-100 transition"
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
                      <th className="p-2 text-right w-24">الضريبة %</th>
                      <th className="p-2 text-right w-32">الإجمالي</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <React.Fragment key={index}>
                        <tr className="border-b border-gray-50">
                          <td className="p-2">
                            <select
                              className="w-full p-2 bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                              value={item.product}
                              onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                            >
                              <option value="">اختر الصنف</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              className="w-full p-2 bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                              value={item.product_unit}
                              onChange={(e) => handleItemChange(index, 'product_unit', e.target.value)}
                            >
                              <option value="">الوحدة</option>
                              {products.find(p => p.id === parseInt(item.product))?.units?.map(u => (
                                <option key={u.id} value={u.id}>{u.unit_name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              className="w-full px-2 py-1.5 bg-gray-50 border-none rounded-lg"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              className="w-full px-2 py-1.5 bg-gray-50 border-none rounded-lg"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              className="w-full px-2 py-1.5 bg-gray-50 border-none rounded-lg"
                              value={item.discount_percentage}
                              onChange={(e) => handleItemChange(index, 'discount_percentage', parseFloat(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              className="w-full px-2 py-1.5 bg-gray-50 border-none rounded-lg"
                              value={item.tax_percentage}
                              onChange={(e) => handleItemChange(index, 'tax_percentage', parseFloat(e.target.value))}
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
                        <tr>
                          <td colSpan="8" className="p-2">
                            <input 
                              type="text"
                              placeholder="ملاحظات البند..."
                              className="w-full px-4 py-1.5 bg-gray-50/50 border-none rounded-lg text-xs"
                              value={item.notes || ''}
                              onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                            />
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                {formData.items.length === 0 && (
                  <div className="p-10 text-center border-2 border-dashed border-gray-100 rounded-3xl mt-4">
                    <Package className="mx-auto text-gray-200 mb-2" size={48} />
                    <p className="text-gray-400">لا توجد بنود في الفاتورة بعد</p>
                    <button 
                      onClick={handleAddItem}
                      className="text-blue-600 text-sm font-bold mt-2 hover:underline"
                    >
                      أضف صنفك الأول
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <label className="text-sm font-bold text-gray-700 mr-1 block mb-2">ملاحظات عامة</label>
              <textarea
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          {/* Totals Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 sticky top-6">
              <h3 className="font-black text-gray-800 border-b border-gray-50 pb-4">ملخص الحساب</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">الرصيد السابق</span>
                  <span className={`font-bold ${previousBalance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                    {previousBalance.toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">إجمالي الفاتورة</span>
                  <span className="font-bold text-gray-800">
                    {formData.total_amount.toLocaleString()} ج.م
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">خصم إضافي</label>
                    <div className="flex bg-gray-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleGlobalChange('discount_type', 'value')}
                        className={`px-2 py-0.5 text-[10px] rounded-md transition-all ${formData.discount_type === 'value' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-400'}`}
                      >
                        قيمة
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGlobalChange('discount_type', 'percent')}
                        className={`px-2 py-0.5 text-[10px] rounded-md transition-all ${formData.discount_type === 'percent' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-400'}`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                    value={formData.discount_value}
                    onChange={(e) => handleGlobalChange('discount_value', e.target.value)}
                  />
                  {formData.discount_type === 'percent' && (
                    <div className="text-[10px] text-gray-400 text-left mt-1">
                      المبلغ: {formData.global_discount_amount?.toLocaleString()} ج.م
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ضريبة إضافية</label>
                    <div className="flex bg-gray-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleGlobalChange('tax_type', 'value')}
                        className={`px-2 py-0.5 text-[10px] rounded-md transition-all ${formData.tax_type === 'value' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-400'}`}
                      >
                        قيمة
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGlobalChange('tax_type', 'percent')}
                        className={`px-2 py-0.5 text-[10px] rounded-md transition-all ${formData.tax_type === 'percent' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-400'}`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                    value={formData.tax_value}
                    onChange={(e) => handleGlobalChange('tax_value', e.target.value)}
                  />
                  {formData.tax_type === 'percent' && (
                    <div className="text-[10px] text-gray-400 text-left mt-1">
                      المبلغ: {formData.global_tax_amount?.toLocaleString()} ج.م
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500 text-sm font-bold">صافي الفاتورة</span>
                    <span className="text-xl font-black text-blue-600">
                      {formData.net_amount.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-rose-600">
                    <span>الإجمالي المستحق</span>
                    <span>
                      {(previousBalance + formData.net_amount).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-4 border-t border-gray-50">
                  <label className="text-sm font-bold text-gray-700">المبلغ المدفوع</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-blue-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-black text-blue-700"
                    value={formData.paid_amount}
                    disabled={formData.payment_type === 'cash'}
                    onChange={(e) => {
                      const paid = parseFloat(e.target.value) || 0;
                      setFormData({...formData, paid_amount: paid, remaining_amount: formData.net_amount - paid});
                    }}
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-gray-500">المبلغ المتبقي</span>
                  <span className="text-lg font-black text-rose-600">
                    {formData.remaining_amount.toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mt-4"
              >
                <Save size={24} />
                حفظ الفاتورة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الفواتير</h1>
          <p className="text-gray-500">إدارة مبيعات ومشتريات النظام</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => exportToExcel()}
            className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-200"
          >
            <FileSpreadsheet size={20} />
            تصدير الكل
          </button>
          <button 
            onClick={() => handleOpenForm()}
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
              <th className="p-4 font-black text-gray-600 text-sm">المندوب</th>
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
                <td className="p-4 text-gray-500 text-sm">{invoice.representative_name || '-'}</td>
                <td className="p-4">
                  <div className="font-black text-blue-600">
                    {parseFloat(invoice.net_amount).toLocaleString()} ج.م
                  </div>
                </td>
                <td className="p-4">{getStatusBadge(invoice)}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => triggerPrint(invoice)}
                      title="طباعة"
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Printer size={16} />
                    </button>
                    <button 
                      onClick={() => exportToExcel(invoice)}
                      title="تصدير إكسل"
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                    >
                      <FileSpreadsheet size={16} />
                    </button>
                    <button 
                      onClick={() => handleOpenForm(invoice)}
                      title="تعديل"
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <FileText size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(invoice.id)}
                      title="حذف"
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

      {/* Hidden Print Component */}
      <div style={{ display: 'none' }}>
        <InvoicePrint 
          ref={printRef} 
          invoice={printingInvoice} 
          settings={settings} 
        />
      </div>
    </div>
  );
};

export default Invoices;
