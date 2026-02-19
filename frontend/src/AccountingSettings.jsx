import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Calendar, 
  Lock, 
  ArrowRightLeft, 
  LayoutGrid, 
  FileText, 
  ChevronRight,
  Save,
  Loader2,
  X,
  CreditCard,
  ShoppingBag,
  Package,
  Wallet,
  UserCheck,
  Building2,
  ArrowLeftRight
} from 'lucide-react';
import api from './api';

const AccountingSettings = () => {
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'routing'
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [fiscalPeriods, setFiscalPeriods] = useState([]);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchAccounts();
    fetchFiscalPeriods();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/core/api/system-settings/current/');
      setSettings(response.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounting/api/accounts/');
      setAccounts(response.data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const fetchFiscalPeriods = async () => {
    try {
      const response = await api.get('/accounting/api/financial-periods/');
      setFiscalPeriods(response.data);
    } catch (err) {
      console.error('Error fetching fiscal periods:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/core/api/system-settings/current/', settings);
      alert('تم حفظ الإعدادات بنجاح');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePeriod = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const periodData = {
      name: formData.get('name'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      is_closed: formData.get('is_closed') === 'on'
    };

    try {
      if (editingPeriod) {
        await api.put(`/accounting/api/financial-periods/${editingPeriod.id}/`, periodData);
      } else {
        await api.post('/accounting/api/financial-periods/', periodData);
      }
      setShowPeriodModal(false);
      setEditingPeriod(null);
      fetchFiscalPeriods();
    } catch (err) {
      console.error('Error saving period:', err);
      alert('حدث خطأ أثناء حفظ الفترة المالية');
    }
  };

  const togglePeriodStatus = async (period) => {
    try {
      await api.patch(`/accounting/api/financial-periods/${period.id}/`, {
        is_closed: !period.is_closed
      });
      fetchFiscalPeriods();
    } catch (err) {
      console.error('Error toggling period status:', err);
    }
  };

  const deletePeriod = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفترة؟')) return;
    try {
      await api.delete(`/accounting/api/financial-periods/${id}/`);
      fetchFiscalPeriods();
    } catch (err) {
      console.error('Error deleting period:', err);
    }
  };

  const updateSetting = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const dashboardCards = [
    { id: 'fiscal_periods', title: 'الفترات المالية', icon: <Calendar size={32} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'closed_period', title: 'فترة مغلقة', icon: <Lock size={32} />, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'routing', title: 'توجيه الحسابات', icon: <ArrowRightLeft size={32} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'general', title: 'عام', icon: <Settings size={32} />, color: 'text-gray-600', bg: 'bg-gray-50' },
    { id: 'custom_fields_entries', title: 'الحقول المخصصة للقيود', icon: <FileText size={32} />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'custom_fields_assets', title: 'الحقول المخصصة للأصول', icon: <LayoutGrid size={32} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const routingTabs = [
    { id: 'sales', title: 'المبيعات', icon: <ShoppingBag size={18} /> },
    { id: 'purchases', title: 'المشتريات', icon: <CreditCard size={18} /> },
    { id: 'inventory', title: 'المخزون', icon: <Package size={18} /> },
    { id: 'safe', title: 'خزينة', icon: <Wallet size={18} /> },
    { id: 'store_permit', title: 'إذن مخزن', icon: <ArrowLeftRight size={18} /> },
    { id: 'employee', title: 'مرتب الموظف', icon: <UserCheck size={18} /> },
    { id: 'fiscal_year', title: 'سنة مالية', icon: <Calendar size={18} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (activeView === 'dashboard') {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">إعدادات الحسابات العامة</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map(card => (
            <button
              key={card.id}
              onClick={() => {
                if (card.id === 'routing') setActiveView('routing');
                if (card.id === 'general') setActiveView('general');
                if (card.id === 'fiscal_periods') setActiveView('fiscal_periods');
              }}
              className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group text-right flex flex-col items-center justify-center gap-4"
            >
              <div className={`${card.bg} ${card.color} p-4 rounded-xl group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <span className="text-lg font-bold text-gray-700">{card.title}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const renderGeneralContent = () => {
    const Toggle = ({ label, field }) => (
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <button
          onClick={() => updateSetting(field, !settings?.[field])}
          className={`w-12 h-6 rounded-full transition-colors relative ${settings?.[field] ? 'bg-green-500' : 'bg-gray-200'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings?.[field] ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Toggle label="عرض الضريبة فالقيود اليومية" field="show_tax_in_journal" />
          <Toggle label="عرض مركز التكلفة فالقيود اليومية" field="show_cost_center_in_journal" />
          <Toggle label="تعيين وسوم الى حركات القيود" field="assign_tags_to_entries" />
          <Toggle label="تحديث أسعار العملات لقيود اليومية" field="update_currency_rates_automatically" />
          <Toggle label="حدد حساباً لكل بند في الفواتير" field="per_item_account_in_invoices" />
          <Toggle label="حدد حساباً لكل بند في المشتريات" field="per_item_account_in_purchases" />
          <Toggle label="حدد حساباً لكل بند في الأذون المخزنية" field="per_item_account_in_inventory_permits" />
          <Toggle label="توزيع مراكز التكلفة في الفواتير حسب البند" field="distribute_cost_center_per_item_in_invoices" />
          <Toggle label="توزيع مراكز التكلفة في فواتير الشراء حسب البند" field="distribute_cost_center_per_item_in_purchases" />
          <Toggle label="توزيع مراكز التكلفة في الأذون المخزنية حسب البند" field="distribute_cost_center_per_item_in_inventory_permits" />
        </div>
      </div>
    );
  };

  const renderFiscalPeriodsContent = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">الفترات المالية</h3>
          <button 
            onClick={() => { setEditingPeriod(null); setShowPeriodModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            إضافة فترة جديدة
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">اسم الفترة</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">تاريخ البدء</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">تاريخ الانتهاء</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">الحالة</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fiscalPeriods.map(period => (
                <tr key={period.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{period.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{period.start_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{period.end_date}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePeriodStatus(period)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                        period.is_closed ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {period.is_closed ? 'مغلقة' : 'مفتوحة'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2 space-x-reverse">
                    <button 
                      onClick={() => { setEditingPeriod(period); setShowPeriodModal(true); }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      تعديل
                    </button>
                    <button 
                      onClick={() => deletePeriod(period.id)}
                      className="text-rose-600 hover:text-rose-800 font-medium"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showPeriodModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">{editingPeriod ? 'تعديل فترة' : 'إضافة فترة جديدة'}</h3>
                <button onClick={() => setShowPeriodModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSavePeriod} className="p-6 space-y-4 text-right">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">اسم الفترة</label>
                  <input 
                    name="name" 
                    defaultValue={editingPeriod?.name} 
                    required 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: يناير 2026"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">تاريخ البدء</label>
                    <input 
                      type="date" 
                      name="start_date" 
                      defaultValue={editingPeriod?.start_date} 
                      required 
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">تاريخ الانتهاء</label>
                    <input 
                      type="date" 
                      name="end_date" 
                      defaultValue={editingPeriod?.end_date} 
                      required 
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input 
                    type="checkbox" 
                    name="is_closed" 
                    id="is_closed"
                    defaultChecked={editingPeriod?.is_closed}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_closed" className="text-sm font-medium text-gray-700">تحديد الفترة كمغلقة</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm"
                  >
                    حفظ
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowPeriodModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition"
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

  const renderRoutingContent = () => {
    const AccountSelect = ({ label, field, description, showAll = false }) => {
      const filteredAccounts = showAll ? accounts : accounts.filter(a => a.is_selectable);
      
      return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">{label}</h3>
            {description && <span className="text-xs text-gray-400">{description}</span>}
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-500 block">نوع التوجيه</label>
            <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option>تعيين لكل منها</option>
              <option>تعيين تلقائي</option>
              <option>تعيين الحساب الرئيسي لكل منها</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-500 block">{showAll ? 'الحساب الأب (المجلد)' : 'حساب رئيسي'}</label>
            <select 
              value={settings?.[field] || ''}
              onChange={(e) => updateSetting(field, e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">اختر حساباً...</option>
              {filteredAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name} {!acc.is_selectable && ' (مجلد)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    };

    switch (activeTab) {
      case 'sales':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <AccountSelect label="العملاء" field="default_customer_account" showAll={true} description="سيتم إنشاء حسابات العملاء الجدد داخل هذا الحساب" />
            <AccountSelect label="المبيعات" field="sales_account" />
            <AccountSelect label="مرتجع المبيعات" field="sales_return_account" />
            <AccountSelect label="خصم مسموح به" field="default_discount_allowed_account" />
            <AccountSelect label="توجيه التسوية" field="default_adjustment_account" />
            <AccountSelect label="حساب مبيعات المنتج" field="product_sales_account" />
            <AccountSelect label="ضريبة القيمة المضافة" field="vat_output_account" />
          </div>
        );
      case 'purchases':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <AccountSelect label="الموردين" field="default_supplier_account" showAll={true} description="سيتم إنشاء حسابات الموردين الجدد داخل هذا الحساب" />
            <AccountSelect label="المشتريات" field="purchases_account" />
            <AccountSelect label="خصم مكتسب" field="default_discount_earned_account" />
            <AccountSelect label="توجيه التسوية" field="default_purchase_adjustment_account" />
            <AccountSelect label="مرتجعات المشتريات" field="purchase_returns_account" />
            <AccountSelect label="ضريبة القيمة المضافة" field="vat_input_account" />
          </div>
        );
      case 'inventory':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <AccountSelect label="المخزون" field="inventory_account" />
            <AccountSelect label="تكلفة البضاعة المباعة" field="cogs_account" />
          </div>
        );
      case 'safe':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <AccountSelect label="الخزائن" field="default_safe_account" showAll={true} description="سيتم إنشاء حسابات الخزائن الجديدة داخل هذا الحساب" />
            <AccountSelect label="البنوك" field="default_bank_account" showAll={true} description="سيتم إنشاء حسابات البنوك الجديدة داخل هذا الحساب" />
          </div>
        );
      case 'store_permit':
        return (
          <div className="flex justify-center p-6">
            <div className="w-full md:w-1/2">
              <AccountSelect label="المستودعات" field="default_warehouse_account" showAll={true} description="سيتم إنشاء حسابات المستودعات الجديدة داخل هذا الحساب" />
            </div>
          </div>
        );
      case 'employee':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <AccountSelect label="الرواتب والأجور" field="default_salaries_account" />
            <AccountSelect label="سلف الموظفين" field="default_loans_account" />
          </div>
        );
      case 'fiscal_year':
        return (
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm max-w-2xl mx-auto space-y-6">
            <h3 className="font-bold text-gray-800 border-b pb-4">إعدادات السنة المالية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">بداية السنة المالية</label>
                <input 
                  type="date"
                  value={settings?.fiscal_year_start || ''}
                  onChange={(e) => updateSetting('fiscal_year_start', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">تاريخ إغلاق العمليات</label>
                <input 
                  type="date"
                  value={settings?.lock_date || ''}
                  onChange={(e) => updateSetting('lock_date', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveView('dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
          <div className="h-8 w-px bg-gray-100 mx-2" />
          <h2 className="text-xl font-bold text-gray-800">
            {activeView === 'routing' ? 'توجيه الحسابات' : 
             activeView === 'general' ? 'الإعدادات العامة' : 
             activeView === 'fiscal_periods' ? 'الفترات المالية' : ''}
          </h2>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          <span className="font-bold">حفظ التغييرات</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - only show if not in dashboard and view is routing */}
        {activeView === 'routing' && (
          <div className="w-64 bg-white border-l border-gray-100 flex flex-col">
            <div className="flex-1 py-4 overflow-y-auto">
              {routingTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-6 py-4 transition-all relative ${
                    activeTab === tab.id 
                      ? 'text-blue-600 bg-blue-50/50 font-bold' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  <span className="text-sm">{tab.title}</span>
                  {activeTab === tab.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {activeView === 'routing' && renderRoutingContent()}
            {activeView === 'general' && renderGeneralContent()}
            {activeView === 'fiscal_periods' && renderFiscalPeriodsContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingSettings;
