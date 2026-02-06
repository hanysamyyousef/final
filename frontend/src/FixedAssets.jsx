import React, { useEffect, useState } from 'react';
import api from './api';
import { 
  Plus, 
  Search, 
  Calendar,
  DollarSign,
  TrendingDown,
  Activity,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const FixedAssets = () => {
  const [assets, setAssets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    asset_account: '',
    depreciation_account: '',
    expense_account: '',
    acquisition_date: new Date().toISOString().split('T')[0],
    acquisition_cost: '',
    salvage_value: '0',
    useful_life_years: '5',
    depreciation_method: 'SL',
    is_active: true
  });

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounting/api/fixed-assets/');
      setAssets(response.data);
    } catch (err) {
      console.error('Error fetching assets:', err);
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

  useEffect(() => {
    fetchAssets();
    fetchAccounts();
  }, []);

  const handleOpenModal = (asset = null) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        name: asset.name,
        code: asset.code,
        asset_account: asset.asset_account,
        depreciation_account: asset.depreciation_account,
        expense_account: asset.expense_account,
        acquisition_date: asset.acquisition_date,
        acquisition_cost: asset.acquisition_cost,
        salvage_value: asset.salvage_value,
        useful_life_years: asset.useful_life_years,
        depreciation_method: asset.depreciation_method,
        is_active: asset.is_active
      });
    } else {
      setEditingAsset(null);
      setFormData({
        name: '',
        code: '',
        asset_account: '',
        depreciation_account: '',
        expense_account: '',
        acquisition_date: new Date().toISOString().split('T')[0],
        acquisition_cost: '',
        salvage_value: '0',
        useful_life_years: '5',
        depreciation_method: 'SL',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await api.put(`/accounting/api/fixed-assets/${editingAsset.id}/`, formData);
      } else {
        await api.post('/accounting/api/fixed-assets/', formData);
      }
      setIsModalOpen(false);
      fetchAssets();
    } catch (err) {
      console.error('Error saving asset:', err);
      alert('حدث خطأ أثناء حفظ البيانات. تأكد من إدخال جميع البيانات بشكل صحيح.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الأصل؟')) {
      try {
        await api.delete(`/accounting/api/fixed-assets/${id}/`);
        fetchAssets();
      } catch (err) {
        console.error('Error deleting asset:', err);
        alert('لا يمكن حذف الأصل لوجود قيود إهلاك مرتبطة به');
      }
    }
  };

  const handleRunDepreciation = async (id) => {
    if (window.confirm('هل تريد تشغيل الإهلاك لهذا الأصل حتى تاريخ اليوم؟')) {
      try {
        const response = await api.post(`/accounting/api/fixed-assets/${id}/run_depreciation/`);
        if (response.data.status === 'depreciation posted') {
          alert(`تم إنشاء قيد إهلاك بمبلغ ${response.data.amount.toLocaleString('ar-EG')} ج.م`);
          fetchAssets();
        } else {
          alert('لا يوجد إهلاك مستحق لهذا الأصل حالياً');
        }
      } catch (err) {
        console.error('Error running depreciation:', err);
        alert('حدث خطأ أثناء معالجة الإهلاك');
      }
    }
  };

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">إدارة الأصول الثابتة</h1>
          <p className="text-gray-500 font-medium mt-1">تسجيل ومتابعة الأصول الثابتة وإهلاكاتها</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
        >
          <Plus size={18} />
          إضافة أصل جديد
        </button>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign size={24} />
            </div>
            <span className="text-xs font-bold text-gray-400">إجمالي التكلفة</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-gray-900">
              {assets.reduce((sum, a) => sum + parseFloat(a.acquisition_cost), 0).toLocaleString('ar-EG')}
              <span className="text-sm font-medium text-gray-500 mr-1">ج.م</span>
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity size={24} />
            </div>
            <span className="text-xs font-bold text-gray-400">القيمة الدفترية الحالية</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-gray-900">
              {assets.reduce((sum, a) => sum + parseFloat(a.current_value), 0).toLocaleString('ar-EG')}
              <span className="text-sm font-medium text-gray-500 mr-1">ج.م</span>
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown size={24} />
            </div>
            <span className="text-xs font-bold text-gray-400">مجمع الإهلاك</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-gray-900">
              {assets.reduce((sum, a) => sum + (parseFloat(a.acquisition_cost) - parseFloat(a.current_value)), 0).toLocaleString('ar-EG')}
              <span className="text-sm font-medium text-gray-500 mr-1">ج.م</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="بحث في الأصول..."
              className="w-full pr-12 pl-4 py-2.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">الأصل</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">تاريخ الاستحواذ</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-left">التكلفة</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-left">القيمة الحالية</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-left">آخر إهلاك</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium">
                    لا توجد أصول ثابتة مسجلة
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <Activity size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{asset.name}</div>
                          <div className="text-xs font-medium text-gray-400">{asset.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <Calendar size={14} />
                        {asset.acquisition_date}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm font-black text-gray-900">
                        {parseFloat(asset.acquisition_cost).toLocaleString('ar-EG')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm font-black text-blue-600">
                        {parseFloat(asset.current_value).toLocaleString('ar-EG')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-xs font-medium text-gray-500">
                        {asset.last_depreciation_date || 'لم يتم'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button 
                          onClick={() => handleRunDepreciation(asset.id)}
                          title="تشغيل الإهلاك"
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        >
                          <TrendingDown size={18} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(asset)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(asset.id)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900">
                {editingAsset ? 'تعديل بيانات الأصل' : 'إضافة أصل جديد'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">اسم الأصل</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">كود الأصل</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">حساب الأصل</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    value={formData.asset_account}
                    onChange={(e) => setFormData({...formData, asset_account: e.target.value})}
                  >
                    <option value="">اختر الحساب...</option>
                    {accounts.filter(a => a.account_type === 'asset' && a.is_selectable).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">حساب مجمع الإهلاك</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    value={formData.depreciation_account}
                    onChange={(e) => setFormData({...formData, depreciation_account: e.target.value})}
                  >
                    <option value="">اختر الحساب...</option>
                    {accounts.filter(a => a.account_type === 'liability' && a.is_selectable).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">حساب مصروف الإهلاك</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    value={formData.expense_account}
                    onChange={(e) => setFormData({...formData, expense_account: e.target.value})}
                  >
                    <option value="">اختر الحساب...</option>
                    {accounts.filter(a => a.account_type === 'expense' && a.is_selectable).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">تاريخ الاستحواذ</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    value={formData.acquisition_date}
                    onChange={(e) => setFormData({...formData, acquisition_date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">تكلفة الاستحواذ</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none text-left"
                    value={formData.acquisition_cost}
                    onChange={(e) => setFormData({...formData, acquisition_cost: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">قيمة الخردة</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none text-left"
                    value={formData.salvage_value}
                    onChange={(e) => setFormData({...formData, salvage_value: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">العمر الإنتاجي (سنوات)</label>
                  <input
                    required
                    type="number"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none text-left"
                    value={formData.useful_life_years}
                    onChange={(e) => setFormData({...formData, useful_life_years: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">طريقة الإهلاك</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    value={formData.depreciation_method}
                    onChange={(e) => setFormData({...formData, depreciation_method: e.target.value})}
                  >
                    <option value="SL">القسط الثابت - Straight Line</option>
                    <option value="DB">الرصيد المتناقص - Declining Balance</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-50 text-gray-600 py-3.5 rounded-2xl font-black hover:bg-gray-100 transition-all"
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

export default FixedAssets;
