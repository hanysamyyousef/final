import React, { useState, useEffect } from 'react';
import api from './api';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Lock, 
  Globe, 
  Shield, 
  Database,
  Cloud,
  ChevronLeft,
  Save,
  Building,
  Printer,
  FileText
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  
  // Data for dropdowns
  const [contacts, setContacts] = useState([]);
  const [stores, setStores] = useState([]);
  const [safes, setSafes] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, companyRes, c, s, sf, a] = await Promise.all([
        api.get('/core/api/system-settings/current/'),
        api.get('/core/api/companies/'),
        api.get('/core/api/contacts/'),
        api.get('/core/api/stores/'),
        api.get('/core/api/safes/'),
        api.get('/accounting/api/accounts/')
      ]);
      
      setSettings(settingsRes.data);
      if (companyRes.data && companyRes.data.length > 0) {
        setCompany(companyRes.data[0]);
      } else {
        setCompany({ name: '', address: '', phone: '', email: '', tax_number: '' });
      }
      
      setContacts(c.data);
      setStores(s.data);
      setSafes(sf.data);
      setAccounts(a.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = [
        api.put(`/core/api/system-settings/${settings.id}/`, settings)
      ];

      if (company.id) {
        promises.push(api.put(`/core/api/companies/${company.id}/`, company));
      } else {
        promises.push(api.post('/core/api/companies/', company));
      }

      await Promise.all(promises);
      alert('تم حفظ الإعدادات وبيانات الشركة بنجاح');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const response = await api.post('/core/api/system-settings/backup/');
      alert(`تم إنشاء النسخة الاحتياطية بنجاح: ${response.data.filename}`);
    } catch (err) {
      console.error('Error during backup:', err);
      alert('فشل إنشاء النسخة الاحتياطية');
    } finally {
      setBackingUp(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleCompanyChange = (field, value) => {
    setCompany({ ...company, [field]: value });
  };

  if (loading) return <div className="p-10 text-center">جاري تحميل الإعدادات...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إعدادات النظام</h1>
          <p className="text-gray-500">تخصيص النظام وإدارة الخيارات الافتراضية</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          <Save size={20} />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* بيانات الشركة */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 px-2">
            <Building size={20} />
            <h2 className="font-bold text-sm uppercase tracking-wider">بيانات الشركة والشعار</h2>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 px-1">اسم الشركة</label>
              <input 
                type="text"
                value={company.name}
                onChange={(e) => handleCompanyChange('name', e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                placeholder="أدخل اسم الشركة"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">رقم الهاتف</label>
                <input 
                  type="text"
                  value={company.phone || ''}
                  onChange={(e) => handleCompanyChange('phone', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">الرقم الضريبي</label>
                <input 
                  type="text"
                  value={company.tax_number || ''}
                  onChange={(e) => handleCompanyChange('tax_number', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 px-1">البريد الإلكتروني</label>
              <input 
                type="email"
                value={company.email || ''}
                onChange={(e) => handleCompanyChange('email', e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 px-1">العنوان</label>
              <textarea 
                value={company.address || ''}
                onChange={(e) => handleCompanyChange('address', e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium h-20"
              />
            </div>
          </div>
        </section>

        {/* إعدادات الفواتير */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 px-2">
            <FileText size={20} />
            <h2 className="font-bold text-sm uppercase tracking-wider">إعدادات الفواتير</h2>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">نوع الفاتورة الافتراضي</label>
                <select 
                  value={settings.default_invoice_type}
                  onChange={(e) => handleChange('default_invoice_type', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="cash">نقدي</option>
                  <option value="credit">آجل</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">تكرار الأصناف</label>
                <select 
                  value={settings.duplicate_item_handling}
                  onChange={(e) => handleChange('duplicate_item_handling', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="increase_quantity">زيادة الكمية تلقائياً</option>
                  <option value="allow_duplicate">السماح بالتكرار كبند منفصل</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.update_purchase_price}
                  onChange={(e) => handleChange('update_purchase_price', e.target.checked)}
                  className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">تحديث سعر الشراء من آخر فاتورة</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.update_sale_price}
                  onChange={(e) => handleChange('update_sale_price', e.target.checked)}
                  className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">تحديث سعر البيع من آخر فاتورة</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.alert_below_sale_price}
                  onChange={(e) => handleChange('alert_below_sale_price', e.target.checked)}
                  className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">تنبيه عند البيع بأقل من سعر البيع</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">العميل الافتراضي</label>
                <select 
                  value={settings.default_customer || ''}
                  onChange={(e) => handleChange('default_customer', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="">اختر عميل...</option>
                  {contacts.filter(c => c.contact_type === 'customer').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">المورد الافتراضي</label>
                <select 
                  value={settings.default_supplier || ''}
                  onChange={(e) => handleChange('default_supplier', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="">اختر مورد...</option>
                  {contacts.filter(c => c.contact_type === 'supplier').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">المخزن الافتراضي</label>
                <select 
                  value={settings.default_store || ''}
                  onChange={(e) => handleChange('default_store', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="">اختر مخزن...</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">الخزنة الافتراضية</label>
                <select 
                  value={settings.default_safe || ''}
                  onChange={(e) => handleChange('default_safe', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="">اختر خزنة...</option>
                  {safes.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* إعدادات المحاسبة */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 px-2">
            <Database size={20} />
            <h2 className="font-bold text-sm uppercase tracking-wider">إعدادات المحاسبة والضرائب</h2>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">نسبة ضريبة القيمة المضافة (%)</label>
                <input 
                  type="number"
                  value={settings.vat_percentage}
                  onChange={(e) => handleChange('vat_percentage', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">طريقة الإهلاك الافتراضية</label>
                <select 
                  value={settings.default_depreciation_method}
                  onChange={(e) => handleChange('default_depreciation_method', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="straight_line">القسط الثابت</option>
                  <option value="reducing_balance">القسط المتناقص</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">بداية السنة المالية</label>
                <input 
                  type="date"
                  value={settings.fiscal_year_start || ''}
                  onChange={(e) => handleChange('fiscal_year_start', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">تاريخ إغلاق العمليات</label>
                <input 
                  type="date"
                  value={settings.lock_date || ''}
                  onChange={(e) => handleChange('lock_date', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium"
                />
                <p className="text-[10px] text-red-400 px-2">لا يمكن إضافة أو تعديل قيود قبل هذا التاريخ</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.require_journal_approval}
                  onChange={(e) => handleChange('require_journal_approval', e.target.checked)}
                  className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">طلب الموافقة على القيود اليدوية</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">حساب المبيعات</label>
                <select 
                  value={settings.sales_account || ''}
                  onChange={(e) => handleChange('sales_account', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="">اختر حساب...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">حساب المشتريات</label>
                <select 
                  value={settings.purchases_account || ''}
                  onChange={(e) => handleChange('purchases_account', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="">اختر حساب...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">حساب ضريبة المبيعات</label>
                <select 
                  value={settings.vat_output_account || ''}
                  onChange={(e) => handleChange('vat_output_account', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="">اختر حساب...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">حساب ضريبة المشتريات</label>
                <select 
                  value={settings.vat_input_account || ''}
                  onChange={(e) => handleChange('vat_input_account', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="">اختر حساب...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">حساب الرواتب والأجور الافتراضي</label>
                <select 
                  value={settings.default_salaries_account || ''}
                  onChange={(e) => handleChange('default_salaries_account', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="">اختر حساب...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">حساب سلف الموظفين الافتراضي</label>
                <select 
                  value={settings.default_loans_account || ''}
                  onChange={(e) => handleChange('default_loans_account', e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 ring-blue-500 font-medium"
                >
                  <option value="">اختر حساب...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* إعدادات الطباعة */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 px-2">
            <Printer size={20} />
            <h2 className="font-bold text-sm uppercase tracking-wider">إعدادات الطباعة</h2>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 px-1">نص رأس الفاتورة</label>
              <textarea 
                value={settings.invoice_header_text || ''}
                onChange={(e) => handleChange('invoice_header_text', e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium h-24"
                placeholder="أدخل النص الذي يظهر في أعلى الفاتورة..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 px-1">نص ذيل الفاتورة</label>
              <textarea 
                value={settings.invoice_footer_text || ''}
                onChange={(e) => handleChange('invoice_footer_text', e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 font-medium h-24"
                placeholder="أدخل النص الذي يظهر في أسفل الفاتورة..."
              />
            </div>
            <div className="space-y-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.hide_company_info}
                  onChange={(e) => handleChange('hide_company_info', e.target.checked)}
                  className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">إخفاء بيانات الشركة في الفاتورة</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.show_previous_balance}
                  onChange={(e) => handleChange('show_previous_balance', e.target.checked)}
                  className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">إظهار الرصيد السابق للعميل</span>
              </label>
            </div>
          </div>
        </section>

        {/* النسخ الاحتياطي والنظام */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-orange-600 px-2">
            <Cloud size={20} />
            <h2 className="font-bold text-sm uppercase tracking-wider">النسخ الاحتياطي والنظام</h2>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl">
              <div>
                <h3 className="font-bold text-orange-900">النسخ الاحتياطي اليدوي</h3>
                <p className="text-xs text-orange-700">إنشاء نسخة احتياطية من قاعدة البيانات الآن</p>
              </div>
              <button 
                onClick={handleBackup}
                disabled={backingUp}
                className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {backingUp ? 'جاري النسخ...' : 'بدء النسخ'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="text-gray-400" size={20} />
                  <span className="text-gray-700 font-medium">لغة النظام</span>
                </div>
                <select 
                  value={settings.system_language || 'ar'}
                  onChange={(e) => handleChange('system_language', e.target.value)}
                  className="bg-gray-100 border-none rounded-xl px-3 py-1 text-sm font-bold"
                >
                  <option value="ar">العربية (Arabic)</option>
                  <option value="en" disabled>English (Soon)</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="text-gray-400" size={20} />
                  <span className="text-gray-700 font-medium">تنبيهات النظام</span>
                </div>
                <button 
                  onClick={() => handleChange('enable_notifications', !settings.enable_notifications)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${settings.enable_notifications ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enable_notifications ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* نسخة النظام */}
      <div className="bg-blue-50 p-6 rounded-3xl flex items-center justify-between border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl">
            <Lock size={24} />
          </div>
          <div>
            <h3 className="font-bold text-blue-900">نسخة النظام: 2.0.4-المطورة</h3>
            <p className="text-sm text-blue-700">جميع الحقوق محفوظة © 2026</p>
          </div>
        </div>
        <div className="text-xs font-bold text-blue-400 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-widest">
          Enterprise Edition
        </div>
      </div>
    </div>
  );
};

export default Settings;
