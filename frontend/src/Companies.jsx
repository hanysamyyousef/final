import React, { useEffect, useState } from 'react';
import api from './api';
import { Plus, Building2, Phone, Mail, MapPin, Trash2, Edit2, X, Save } from 'lucide-react';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [branches, setBranches] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null);
  const [branchFormData, setBranchFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager: ''
  });

  const fetchBranches = async (companyId) => {
    try {
      const response = await api.get(`/api/branches/?company=${companyId}`);
      setBranches(response.data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const handleOpenBranchModal = (company) => {
    setSelectedCompany(company);
    fetchBranches(company.id);
    setBranchFormData({ name: '', address: '', phone: '', manager: '' });
    setIsBranchModalOpen(true);
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/branches/', { ...branchFormData, company: selectedCompany.id });
      fetchBranches(selectedCompany.id);
      setBranchFormData({ name: '', address: '', phone: '', manager: '' });
    } catch (err) {
      console.error('Error saving branch:', err);
      alert('حدث خطأ أثناء حفظ الفرع');
    }
  };

  const handleBranchDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفرع؟')) {
      try {
        await api.delete(`/api/branches/${id}/`);
        fetchBranches(selectedCompany.id);
      } catch (err) {
        console.error('Error deleting branch:', err);
      }
    }
  };
  const [formData, setFormData] = useState({
    name: '',
    tax_number: '',
    address: '',
    phone: '',
    email: '',
    notes: ''
  });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/companies/');
      setCompanies(response.data);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleOpenModal = (company = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name || '',
        tax_number: company.tax_number || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        notes: company.notes || ''
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        tax_number: '',
        address: '',
        phone: '',
        email: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await api.put(`/api/companies/${editingCompany.id}/`, formData);
      } else {
        await api.post('/api/companies/', formData);
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err) {
      console.error('Error saving company:', err);
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الشركة؟')) {
      try {
        await api.delete(`/api/companies/${id}/`);
        fetchCompanies();
      } catch (err) {
        console.error('Error deleting company:', err);
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  if (loading && companies.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الشركات</h1>
          <p className="text-gray-500">إدارة الشركات المسجلة في النظام</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          إضافة شركة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{company.name}</h3>
                  <p className="text-sm text-gray-500">{company.tax_number || 'بدون رقم ضريبي'}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(company)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="تعديل"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(company.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="حذف"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin size={16} className="text-gray-400" />
                <span>{company.address || 'لا يوجد عنوان'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone size={16} className="text-gray-400" />
                <span>{company.phone || 'لا يوجد هاتف'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail size={16} className="text-gray-400" />
                <span>{company.email || 'لا يوجد بريد'}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex gap-2">
              <button 
                onClick={() => handleOpenModal(company)}
                className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                تعديل البيانات
              </button>
              <button 
                onClick={() => handleOpenBranchModal(company)}
                className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                الفروع
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editingCompany ? 'تعديل شركة' : 'إضافة شركة جديدة'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الضريبي</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsBranchModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                فروع شركة {selectedCompany?.name}
              </h2>
              <button onClick={() => setIsBranchModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleBranchSubmit} className="mb-6 bg-gray-50 p-4 rounded-xl space-y-4">
                <h3 className="font-bold text-gray-700">إضافة فرع جديد</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="اسم الفرع"
                    required
                    className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={branchFormData.name}
                    onChange={(e) => setBranchFormData({...branchFormData, name: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="المدير"
                    className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={branchFormData.manager}
                    onChange={(e) => setBranchFormData({...branchFormData, manager: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="الهاتف"
                    className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={branchFormData.phone}
                    onChange={(e) => setBranchFormData({...branchFormData, phone: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="العنوان"
                    className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={branchFormData.address}
                    onChange={(e) => setBranchFormData({...branchFormData, address: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                  إضافة الفرع
                </button>
              </form>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {branches.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">لا توجد فروع مضافة بعد</p>
                ) : (
                  branches.map(branch => (
                    <div key={branch.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                      <div>
                        <h4 className="font-bold text-gray-800">{branch.name}</h4>
                        <p className="text-xs text-gray-500">{branch.manager} - {branch.phone}</p>
                      </div>
                      <button onClick={() => handleBranchDelete(branch.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
