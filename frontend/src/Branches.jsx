import React, { useState, useEffect } from 'react';
import api from './api';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Settings as SettingsIcon,
  ChevronLeft,
  Users,
  Package,
  Truck,
  Target,
  Calculator
} from 'lucide-react';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    address: '',
    phone: '',
    manager: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [branchesRes, companiesRes, settingsRes] = await Promise.all([
        api.get('/core/api/branches/'),
        api.get('/core/api/companies/'),
        api.get('/core/api/system-settings/current/')
      ]);
      setBranches(branchesRes.data);
      setCompanies(companiesRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        company: branch.company,
        address: branch.address || '',
        phone: branch.phone || '',
        manager: branch.manager || ''
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        company: companies.length > 0 ? companies[0].id : '',
        address: '',
        phone: '',
        manager: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await api.put(`/core/api/branches/${editingBranch.id}/`, formData);
      } else {
        await api.post('/core/api/branches/', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving branch:', err);
      alert('حدث خطأ أثناء حفظ الفرع');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفرع؟')) {
      try {
        await api.delete(`/core/api/branches/${id}/`);
        fetchData();
      } catch (err) {
        console.error('Error deleting branch:', err);
      }
    }
  };

  const handleSettingChange = async (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    setSettings(updatedSettings);
    
    setSavingSettings(true);
    try {
      await api.put('/core/api/system-settings/current/', updatedSettings);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.manager?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 font-['Cairo']" dir="rtl">
      {/* Settings Section - Matching the User's Image */}
      <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">إعدادات الفروع</h2>
            <p className="text-gray-500 font-bold text-sm">حدد الفرع الرئيسي واضبط إعدادات مشاركة البيانات والسجلات المالية بين الفروع.</p>
          </div>

          <div className="space-y-6">
            {/* Main Branch Selection */}
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 block">الفرع الرئيسي</label>
              <div className="relative max-w-md">
                <select
                  value={settings?.main_branch || ''}
                  onChange={(e) => handleSettingChange('main_branch', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-blue-500 font-bold appearance-none"
                >
                  <option value="">اختر الفرع الرئيسي...</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronLeft size={18} />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 font-bold">اختر الفرع الرئيسي ليكون المرجع الأساسي لإدارة البيانات والسجلات المالية عبر جميع الفروع.</p>
            </div>

            {/* Data Sharing Settings */}
            <div className="space-y-4">
              <h3 className="text-md font-black text-gray-800">مشاركة البيانات بين الفروع</h3>
              
              <div className="grid gap-4">
                {/* Customers Sharing */}
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">العملاء</p>
                      <p className="text-xs text-gray-500 font-bold max-w-xl">اسمح لجميع الفروع بالوصول إلى بيانات العملاء لتفادي التكرار وتسهيل التعامل مع نفس العميل من أي فرع. عند التعطيل، يحتفظ كل فرع ببيانات عملائه بشكل مستقل.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings?.share_customers || false}
                      onChange={(e) => handleSettingChange('share_customers', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                {/* Products Sharing */}
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">المنتجات</p>
                      <p className="text-xs text-gray-500 font-bold max-w-xl">اسمح بمشاركة بيانات المنتجات والخدمات بين جميع الفروع لضمان توحيد الأسعار والأوصاف وتفادي التكرار. عند التعطيل، سيحتاج كل فرع إلى إضافة منتجاته يدوياً بشكل منفصل.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings?.share_products || false}
                      onChange={(e) => handleSettingChange('share_products', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                {/* Suppliers Sharing */}
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                      <Truck size={20} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">الموردين</p>
                      <p className="text-xs text-gray-500 font-bold max-w-xl">اسمح بمشاركة قائمة الموردين بين الفروع لتوحيد التعاملات وتسهيل إنشاء طلبات الشراء وأوامر الشراء من قاعدة واحدة. عند التعطيل، يحتفظ كل فرع بقائمة الموردين الخاصة به.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings?.share_suppliers || false}
                      onChange={(e) => handleSettingChange('share_suppliers', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                {/* Cost Centers Linking */}
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Target size={20} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">مراكز التكلفة</p>
                      <p className="text-xs text-gray-500 font-bold max-w-xl">فعل لربط مراكز التكلفة بين الفروع ومتابعة النفقات والإيرادات لكل مركز، مما يتيح تحليلاً مالياً شاملاً على مستوى الشركة بالكامل. عند التعطيل، يتعامل كل فرع مع مراكز تكلفة مستقلة خاصة به.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings?.link_cost_centers || false}
                      onChange={(e) => handleSettingChange('link_cost_centers', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                {/* Per Branch Accounts Customization */}
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                      <Calculator size={20} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">تخصيص الحسابات على مستوى الفروع</p>
                      <p className="text-xs text-gray-500 font-bold max-w-xl">فعل هذا الخيار لتخصيص كل حساب على مستوى الفروع لتسجيل المعاملات المالية ومتابعة النتائج المحاسبية بشكل منفصل. يمكن تعيين الحساب لفرع واحد أو أكثر أو جميع الفروع.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings?.per_branch_accounts || false}
                      onChange={(e) => handleSettingChange('per_branch_accounts', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Branch Management Section */}
      <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900">إدارة الفروع</h2>
              <p className="text-gray-500 font-bold text-sm">عرض وإضافة وتعديل فروع الشركة.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="بحث عن فرع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-50 border-none rounded-2xl pr-10 pl-4 py-2.5 text-sm focus:ring-2 ring-blue-500 font-bold w-64"
                />
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
              >
                <Plus size={18} />
                إضافة فرع
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-6 py-4 text-sm font-black text-gray-400">اسم الفرع</th>
                  <th className="px-6 py-4 text-sm font-black text-gray-400">الشركة</th>
                  <th className="px-6 py-4 text-sm font-black text-gray-400">المدير</th>
                  <th className="px-6 py-4 text-sm font-black text-gray-400">رقم الهاتف</th>
                  <th className="px-6 py-4 text-sm font-black text-gray-400">العنوان</th>
                  <th className="px-6 py-4 text-sm font-black text-gray-400">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                          {branch.name[0]}
                        </div>
                        <span className="font-black text-gray-900">{branch.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-600">{branch.company_name}</td>
                    <td className="px-6 py-4 font-bold text-gray-600">{branch.manager || '-'}</td>
                    <td className="px-6 py-4 font-bold text-gray-600" dir="ltr">{branch.phone || '-'}</td>
                    <td className="px-6 py-4 font-bold text-gray-600 truncate max-w-xs">{branch.address || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenModal(branch)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(branch.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900">
                {editingBranch ? 'تعديل فرع' : 'إضافة فرع جديد'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-600 px-1">اسم الفرع</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-blue-500 font-bold"
                    placeholder="مثال: فرع القاهرة الرئيسي"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-600 px-1">الشركة</label>
                  <select 
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-blue-500 font-bold"
                  >
                    <option value="">اختر الشركة...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-600 px-1">المدير</label>
                  <input 
                    type="text"
                    value={formData.manager}
                    onChange={(e) => setFormData({...formData, manager: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-600 px-1">رقم الهاتف</label>
                  <input 
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-blue-500 font-bold"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-gray-600 px-1">العنوان</label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-blue-500 font-bold h-24"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                >
                  <Save size={20} />
                  {editingBranch ? 'حفظ التعديلات' : 'إضافة الفرع'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-4 rounded-2xl font-black transition-all"
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

export default Branches;
