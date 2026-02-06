import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from './api';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Phone, 
  Mail, 
  MapPin, 
  Building2,
  Trash2,
  Edit2,
  X,
  Save,
  CreditCard
} from 'lucide-react';

const Contacts = () => {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  
  const [contacts, setContacts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [debtSummary, setDebtSummary] = useState({
    total_customers_balance: 0,
    total_suppliers_balance: 0,
    total_debt: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(typeParam || 'all');

  useEffect(() => {
    if (typeParam) {
      setActiveTab(typeParam);
    }
  }, [typeParam]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_type: 'customer',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    initial_balance: 0,
    initial_balance_date: new Date().toISOString().split('T')[0],
    initial_balance_type: 'debit',
    pricing_system: 'retail',
    notes: ''
  });

  const fetchContacts = async () => {
    try {
      setLoading(true);
      // Fetch contacts separately to ensure they show even if stats fail
      const contactsRes = await api.get('/api/contacts/');
      setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
      
      // Fetch stats separately
      try {
        const statsRes = await api.get('/api/dashboard-stats/');
        if (statsRes.data) {
          if (statsRes.data.top_customers) {
            setTopCustomers(statsRes.data.top_customers);
          }
          if (statsRes.data.debt_summary) {
            setDebtSummary(statsRes.data.debt_summary);
          }
        }
      } catch (statsErr) {
        console.error('Error fetching stats:', statsErr);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleOpenModal = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name || '',
        contact_type: contact.contact_type || 'customer',
        phone: contact.phone || '',
        email: contact.email || '',
        address: contact.address || '',
        tax_number: contact.tax_number || '',
        initial_balance: contact.initial_balance || 0,
        initial_balance_date: contact.initial_balance_date || new Date().toISOString().split('T')[0],
        initial_balance_type: contact.initial_balance_type || 'debit',
        pricing_system: contact.pricing_system || 'retail',
        notes: contact.notes || ''
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        contact_type: 'customer',
        phone: '',
        email: '',
        address: '',
        tax_number: '',
        initial_balance: 0,
        initial_balance_date: new Date().toISOString().split('T')[0],
        initial_balance_type: 'debit',
        pricing_system: 'retail',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await api.put(`/api/contacts/${editingContact.id}/`, formData);
      } else {
        await api.post('/api/contacts/', formData);
      }
      setIsModalOpen(false);
      fetchContacts();
    } catch (err) {
      console.error('Error saving contact:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطرف؟')) {
      try {
        await api.delete(`/api/contacts/${id}/`);
        fetchContacts();
      } catch (err) {
        console.error('Error deleting contact:', err);
      }
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (contact.phone && contact.phone.includes(searchTerm));
    const matchesTab = activeTab === 'all' || contact.contact_type === activeTab;
    return matchesSearch && matchesTab;
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
          <h1 className="text-2xl font-bold text-gray-800">العملاء والموردين</h1>
          <p className="text-gray-500">إدارة كافة جهات التعامل مع النظام</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <UserPlus size={20} />
          <span>إضافة طرف جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text"
                placeholder="بحث بالاسم أو رقم الهاتف..."
                className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-white p-1 rounded-xl border border-gray-200">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >الكل</button>
              <button 
                onClick={() => setActiveTab('customer')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'customer' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >العملاء</button>
              <button 
                onClick={() => setActiveTab('supplier')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'supplier' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >الموردين</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-xl transition-all group relative">
                <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(contact)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(contact.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${contact.contact_type === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Users size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900">{contact.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${contact.contact_type === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {contact.contact_type === 'customer' ? 'عميل' : 'مورد'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone size={14} />
                    <span>{contact.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail size={14} />
                    <span className="truncate">{contact.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span className="truncate">{contact.address || '—'}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                  <div className="text-xs text-gray-500 font-medium">الرصيد الحالي</div>
                  <div className={`text-sm font-black ${(contact.current_balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {contact.current_balance || 0} ج.م
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-200">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <CreditCard size={24} />
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm font-medium">إجمالي المديونية</p>
                <h2 className="text-2xl font-black">{debtSummary.total_debt.toLocaleString()} ج.م</h2>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-blue-100">مستحق للعملاء</span>
                <span className="font-bold">{debtSummary.total_customers_balance.toLocaleString()} ج.م</span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(debtSummary.total_customers_balance / (debtSummary.total_debt || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-100">مستحق للموردين</span>
                <span className="font-bold">{debtSummary.total_suppliers_balance.toLocaleString()} ج.م</span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(debtSummary.total_suppliers_balance / (debtSummary.total_debt || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">أعلى العملاء تعاملاً</h3>
            <div className="space-y-4">
              {topCustomers.length > 0 ? (
                topCustomers.map((customer, i) => (
                  <div key={customer.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900">{customer.name}</div>
                      <div className="text-xs text-gray-500">{customer.invoice_count} فاتورة بيع</div>
                    </div>
                    <div className="text-sm font-black text-blue-600">{customer.total_spent.toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">
                  لا توجد بيانات متاحة حالياً
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900">
                {editingContact ? 'تعديل بيانات الطرف' : 'إضافة طرف جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">الاسم</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">النوع</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.contact_type}
                    onChange={(e) => setFormData({...formData, contact_type: e.target.value})}
                  >
                    <option value="customer">عميل</option>
                    <option value="supplier">مورد</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">رقم الهاتف</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">البريد الإلكتروني</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">العنوان</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">الرقم الضريبي</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">نظام التسعير</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.pricing_system}
                    onChange={(e) => setFormData({...formData, pricing_system: e.target.value})}
                  >
                    <option value="retail">مستهلك</option>
                    <option value="wholesale">جملة</option>
                    <option value="distributor">مورد</option>
                    <option value="supplier">سعر المورد</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">الرصيد الافتتاحي</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({...formData, initial_balance: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">نوع الرصيد</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.initial_balance_type}
                    onChange={(e) => setFormData({...formData, initial_balance_type: e.target.value})}
                  >
                    <option value="debit">مدين</option>
                    <option value="credit">دائن</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">تاريخ الرصيد الافتتاحي</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.initial_balance_date}
                    onChange={(e) => setFormData({...formData, initial_balance_date: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">ملاحظات</label>
                  <textarea 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  حفظ البيانات
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
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

export default Contacts;
