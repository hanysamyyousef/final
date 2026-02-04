import React, { useEffect, useState } from 'react';
import api from './api';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Phone, 
  MapPin, 
  CreditCard,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Save,
  Truck
} from 'lucide-react';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    id_number: '',
    license_number: '',
    notes: ''
  });

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/drivers/');
      setDrivers(response.data);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpenModal = (driver = null) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        name: driver.name || '',
        phone: driver.phone || '',
        address: driver.address || '',
        id_number: driver.id_number || '',
        license_number: driver.license_number || '',
        notes: driver.notes || ''
      });
    } else {
      setEditingDriver(null);
      setFormData({
        name: '',
        phone: '',
        address: '',
        id_number: '',
        license_number: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await api.put(`/api/drivers/${editingDriver.id}/`, formData);
      } else {
        await api.post('/api/drivers/', formData);
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      console.error('Error saving driver:', err);
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السائق؟')) {
      try {
        await api.delete(`/api/drivers/${id}/`);
        fetchDrivers();
      } catch (err) {
        console.error('Error deleting driver:', err);
        alert('حدث خطأ أثناء حذف البيانات');
      }
    }
  };

  const filteredDrivers = drivers.filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.phone && driver.phone.includes(searchTerm)) ||
    (driver.id_number && driver.id_number.includes(searchTerm)) ||
    (driver.license_number && driver.license_number.includes(searchTerm))
  );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">السائقين</h1>
          <p className="text-gray-500 text-sm font-bold">إدارة سائقي أسطول النقل والتوصيل</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg shadow-blue-100"
        >
          <UserPlus size={20} />
          <span>إضافة سائق جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Truck size={20} />
            <span className="font-black">إجمالي السائقين</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{drivers.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="البحث بالاسم، الهاتف، رقم الهوية، أو رقم الرخصة..."
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all font-bold text-sm">
            <Filter size={18} />
            <span>تصفية</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-sm font-black text-gray-500">الاسم</th>
                <th className="px-6 py-4 text-sm font-black text-gray-500">الهاتف</th>
                <th className="px-6 py-4 text-sm font-black text-gray-500">رقم الهوية</th>
                <th className="px-6 py-4 text-sm font-black text-gray-500">رقم الرخصة</th>
                <th className="px-6 py-4 text-sm font-black text-gray-500">العنوان</th>
                <th className="px-6 py-4 text-sm font-black text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-bold">جاري التحميل...</td>
                </tr>
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-bold">لا يوجد سائقين مضافين</td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">
                          {driver.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{driver.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600 font-bold">
                        <Phone size={14} className="text-gray-400" />
                        {driver.phone || '---'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600 font-bold">
                        <CreditCard size={14} className="text-gray-400" />
                        {driver.id_number || '---'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-blue-600 font-black bg-blue-50 px-2 py-1 rounded-lg w-fit">
                        <Truck size={14} />
                        {driver.license_number || '---'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600 font-bold">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="truncate max-w-[150px]">{driver.address || '---'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenModal(driver)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(driver.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900">
                {editingDriver ? 'تعديل بيانات السائق' : 'إضافة سائق جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 block px-1">الاسم</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 block px-1">رقم الهاتف</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 block px-1">رقم الهوية</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                    value={formData.id_number}
                    onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 block px-1">رقم الرخصة</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                    value={formData.license_number}
                    onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-black text-gray-700 block px-1">العنوان</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-black text-gray-700 block px-1">ملاحظات</label>
                  <textarea 
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-blue-100"
                >
                  <Save size={20} />
                  <span>حفظ البيانات</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black transition-all"
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

export default Drivers;