import React, { useState, useEffect } from 'react';
import api from './api';
import { 
  Users, 
  Shield, 
  Lock, 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  CheckCircle,
  XCircle,
  ShieldAlert,
  ChevronLeft
} from 'lucide-react';

const UsersPermissions = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'roles'
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'employee',
    is_active: true
  });
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isUserPermissionsModalOpen, setIsUserPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [isCustomRoleModalOpen, setIsCustomRoleModalOpen] = useState(false);
  const [editingCustomRole, setEditingCustomRole] = useState(null);
  const [customRoleData, setCustomRoleData] = useState({
    name: '',
    description: '',
    permissions: {}
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, rolesRes, customRolesRes] = await Promise.all([
        api.get('/users/api/users/'),
        api.get('/users/api/users/roles_list/'),
        api.get('/users/api/custom-roles/')
      ]);
      
      // Handle potential paginated response
      const usersData = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.results || [];
      const rolesData = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data.results || [];
      const customRolesData = Array.isArray(customRolesRes.data) ? customRolesRes.data : customRolesRes.data.results || [];
      
      setUsers(usersData);
      setRoles(rolesData);
      setCustomRoles(customRolesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('حدث خطأ أثناء جلب البيانات من الخادم. يرجى التأكد من اتصالك بالإنترنت أو المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserPermissions = async (user) => {
    try {
      setSelectedUser(user);
      const res = await api.get(`/users/api/users/${user.id}/user_permissions/`);
      setUserPermissions(res.data);
      setIsUserPermissionsModalOpen(true);
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      alert('حدث خطأ أثناء جلب صلاحيات المستخدم');
    }
  };

  const handleToggleUserPermission = (permKey) => {
    setUserPermissions(prev => prev.map(p => 
      p.key === permKey ? { ...p, granted: !p.granted } : p
    ));
  };

  const handleSaveUserPermissions = async () => {
    try {
      const permissionsMap = {};
      userPermissions.forEach(p => {
        permissionsMap[p.key] = p.granted;
      });
      
      await api.post(`/users/api/users/${selectedUser.id}/update_user_permissions/`, {
        permissions: permissionsMap
      });
      
      setIsUserPermissionsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving user permissions:', err);
      alert('حدث خطأ أثناء حفظ الصلاحيات');
    }
  };

  const handleOpenCustomRoleModal = (role = null) => {
    if (role) {
      setEditingCustomRole(role);
      setCustomRoleData({
        name: role.name,
        description: role.description,
        permissions: role.permissions || {}
      });
    } else {
      setEditingCustomRole(null);
      // Initialize with all permissions from any existing role but false
      const initialPerms = {};
      if (roles.length > 0) {
        Object.keys(roles[0].permissions).forEach(k => initialPerms[k] = false);
      }
      setCustomRoleData({
        name: '',
        description: '',
        permissions: initialPerms
      });
    }
    setIsCustomRoleModalOpen(true);
  };

  const handleSaveCustomRole = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomRole) {
        await api.put(`/users/api/custom-roles/${editingCustomRole.id}/`, customRoleData);
      } else {
        await api.post('/users/api/custom-roles/', customRoleData);
      }
      setIsCustomRoleModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving custom role:', err);
      alert('حدث خطأ أثناء حفظ الدور المخصص');
    }
  };

  const handleDeleteCustomRole = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدور المخصص؟')) {
      try {
        await api.delete(`/users/api/custom-roles/${id}/`);
        fetchData();
      } catch (err) {
        console.error('Error deleting custom role:', err);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password: '', // Don't show password
        role: user.profile?.role || 'employee',
        is_active: user.is_active
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'employee',
        is_active: true
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        profile: { role: formData.role }
      };
      
      if (editingUser) {
        await api.put(`/users/api/users/${editingUser.id}/`, payload);
      } else {
        await api.post('/users/api/users/', payload);
      }
      
      setIsUserModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving user:', err);
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await api.delete(`/users/api/users/${id}/`);
        fetchData();
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.post(`/users/api/users/${id}/toggle_status/`);
      fetchData();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.profile?.role_display || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/30 p-8">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-red-50 flex flex-col items-center text-center max-w-lg">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">خطأ في جلب البيانات</h2>
          <p className="text-gray-500 font-bold mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-100">
              <Users size={32} />
            </div>
            المستخدمين والصلاحيات
          </h1>
          <p className="text-gray-500 font-bold mt-2 mr-16">إدارة مستخدمي النظام وصلاحيات الوصول والأدوار</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenUserModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
          >
            <UserPlus size={22} />
            إضافة مستخدم جديد
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-gray-100 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${
            activeTab === 'users' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          المستخدمين
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${
            activeTab === 'roles' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          الأدوار والصلاحيات
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">إجمالي المستخدمين</p>
                  <h3 className="text-2xl font-black text-gray-900">{users.length}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">نشط حالياً</p>
                  <h3 className="text-2xl font-black text-gray-900">{users.filter(u => u.is_active).length}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                  <XCircle size={24} />
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">غير نشط</p>
                  <h3 className="text-2xl font-black text-gray-900">{users.filter(u => !u.is_active).length}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <Shield size={24} />
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">مدراء النظام</p>
                  <h3 className="text-2xl font-black text-gray-900">{users.filter(u => u.profile?.role === 'admin').length}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="البحث عن مستخدم بالاسم أو البريد أو الدور..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl pr-12 pl-4 py-3 text-sm font-bold focus:ring-2 ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-3xl flex items-center justify-center mb-6">
                  <Search size={40} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">لا يوجد نتائج للبحث</h3>
                <p className="text-gray-500 font-bold">جرب استخدام كلمات بحث أخرى</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${
                          user.is_active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900">{user.username}</h3>
                          <p className="text-gray-500 font-bold text-sm">{user.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggleStatus(user.id)}
                        className={`p-2 rounded-xl transition-all ${
                          user.is_active 
                            ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                        title={user.is_active ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                      >
                        {user.is_active ? <CheckCircle size={20} /> : <XCircle size={20} />}
                      </button>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 font-bold">الاسم بالكامل:</span>
                        <span className="text-gray-900 font-black">
                          {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : 'غير محدد'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 font-bold">الدور:</span>
                        <span className={`px-3 py-1 rounded-lg font-black text-xs ${
                          user.profile?.role === 'admin' ? 'bg-red-50 text-red-600' :
                          user.profile?.role === 'manager' ? 'bg-purple-50 text-purple-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {user.profile?.role_display || user.profile?.role || 'موظف'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 font-bold">تاريخ الانضمام:</span>
                        <span className="text-gray-900 font-black">
                          {new Date(user.date_joined).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-6 border-t border-gray-50">
                      <button 
                        onClick={() => handleOpenUserModal(user)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-600 rounded-xl font-black text-sm hover:bg-blue-50 hover:text-blue-600 transition-all"
                      >
                        <Edit2 size={16} />
                        تعديل
                      </button>
                      <button 
                        onClick={() => handleOpenUserPermissions(user)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-600 rounded-xl font-black text-sm hover:bg-purple-50 hover:text-purple-600 transition-all"
                      >
                        <Shield size={16} />
                        الصلاحيات
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Roles Management Tab */
        <div className="space-y-12">
          {/* System Roles Section */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  <Shield size={28} className="text-blue-600" />
                  أدوار النظام الأساسية
                </h2>
                <p className="text-gray-500 font-bold mt-1">الأدوار الافتراضية المدمجة في النظام</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {roles.map((role) => (
                <div key={role.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                  {/* ... same role card content ... */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${
                      role.id === 'admin' ? 'bg-red-50 text-red-600' : 
                      role.id === 'manager' ? 'bg-purple-50 text-purple-600' : 
                      'bg-blue-50 text-blue-600'
                    }`}>
                      <Shield size={32} />
                    </div>
                    <div className="text-right">
                      <h3 className="text-xl font-black text-gray-900 mb-1">{role.name}</h3>
                      <p className="text-xs font-bold text-gray-400">معرف الدور: {role.id}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-500 font-bold text-sm mb-6 leading-relaxed">
                    {role.description}
                  </p>
                  
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">الصلاحيات المتاحة:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(role.permissions || {})
                        .filter(([_, value]) => value.granted === true)
                        .slice(0, 10)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            {value.name}
                          </div>
                        ))
                      }
                      {Object.keys(role.permissions || {}).length > 10 && (
                        <div className="text-xs font-black text-blue-600 mt-2 px-3 py-2">
                          +{Object.keys(role.permissions || {}).length - 10} صلاحيات إضافية...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">المستخدمين</span>
                      <span className="text-lg font-black text-gray-900 mr-2">{users.filter(u => u.profile?.role === role.id).length}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedRole(role);
                        setIsPermissionsModalOpen(true);
                      }}
                      className="flex items-center gap-2 text-blue-600 font-black text-sm hover:gap-3 transition-all"
                    >
                      عرض كافة الصلاحيات
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Roles Section */}
          <div className="pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  <Lock size={28} className="text-purple-600" />
                  الأدوار المخصصة
                </h2>
                <p className="text-gray-500 font-bold mt-1">أدوار إضافية تم إنشاؤها لتلبية احتياجات خاصة</p>
              </div>
              <button 
                onClick={() => handleOpenCustomRoleModal()}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all active:scale-95 text-sm"
              >
                <UserPlus size={18} />
                إضافة دور مخصص
              </button>
            </div>

            {customRoles.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-3xl flex items-center justify-center mb-6">
                  <ShieldAlert size={40} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">لا يوجد أدوار مخصصة حالياً</h3>
                <p className="text-gray-500 font-bold max-w-sm mb-8">يمكنك إنشاء أدوار جديدة بصلاحيات محددة وتعيينها للموظفين</p>
                <button 
                  onClick={() => handleOpenCustomRoleModal()}
                  className="text-purple-600 font-black hover:underline"
                >
                  اضغط هنا لإنشاء أول دور مخصص
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {customRoles.map((role) => (
                  <div key={role.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Lock size={32} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenCustomRoleModal(role)}
                          className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                          title="تعديل الدور"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomRole(role.id)}
                          className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                          title="حذف الدور"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right mb-6">
                      <h3 className="text-xl font-black text-gray-900 mb-1">{role.name}</h3>
                      <p className="text-gray-500 font-bold text-sm leading-relaxed">{role.description || 'لا يوجد وصف لهذا الدور'}</p>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">الصلاحيات المختارة:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(role.permissions || {})
                          .filter(([_, granted]) => granted === true)
                          .map(([key, _]) => {
                            // Find permission name from system roles if possible
                            let permName = key;
                            for (const r of roles) {
                              if (r.permissions[key]) {
                                permName = r.permissions[key].name;
                                break;
                              }
                            }
                            return (
                              <div key={key} className="flex items-center gap-2 text-[10px] font-black text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                                {permName}
                              </div>
                            );
                          })
                        }
                        {Object.values(role.permissions || {}).filter(v => v === true).length === 0 && (
                          <span className="text-xs font-bold text-gray-400 italic">لم يتم اختيار صلاحيات بعد</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">المستخدمين</span>
                        <span className="text-lg font-black text-gray-900 mr-2">{users.filter(u => u.profile?.role === `custom_${role.id}`).length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                {editingUser ? <Edit2 className="text-blue-600" /> : <UserPlus className="text-blue-600" />}
                {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
              </h2>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="p-3 bg-white text-gray-400 hover:text-red-600 rounded-2xl shadow-sm transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 block mr-2">اسم المستخدم</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-blue-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 block mr-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-blue-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 block mr-2">الاسم الأول</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 block mr-2">اسم العائلة</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 block mr-2">كلمة المرور {editingUser && '(اتركها فارغة لعدم التغيير)'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-blue-500 transition-all"
                    required={!editingUser}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 block mr-2">الدور / الصلاحية</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-blue-500 transition-all appearance-none"
                  >
                    <optgroup label="الأدوار الأساسية">
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </optgroup>
                    {customRoles.length > 0 && (
                      <optgroup label="الأدوار المخصصة">
                        {customRoles.map(role => (
                          <option key={role.id} value={`custom_${role.id}`}>{role.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-8 bg-blue-50 p-6 rounded-3xl">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-6 h-6 rounded-lg border-none text-blue-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm font-black text-blue-900 cursor-pointer select-none">المستخدم نشط ويمكنه تسجيل الدخول للنظام</label>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
                >
                  <Save size={20} />
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Permissions Modal */}
      {isPermissionsModalOpen && selectedRole && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  selectedRole.id === 'admin' ? 'bg-red-50 text-red-600' : 
                  selectedRole.id === 'manager' ? 'bg-purple-50 text-purple-600' : 
                  'bg-blue-50 text-blue-600'
                }`}>
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">صلاحيات دور: {selectedRole.name}</h2>
                  <p className="text-xs font-bold text-gray-400">قائمة بكافة الصلاحيات الممنوحة لهذا الدور</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPermissionsModalOpen(false)}
                className="p-3 bg-white text-gray-400 hover:text-red-600 rounded-2xl shadow-sm transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedRole.permissions || {}).map(([key, value]) => (
                  <div key={key} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    value.granted ? 'bg-green-50/50 border-green-100' : 'bg-gray-50 border-gray-100 opacity-60'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${value.granted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={`text-sm font-bold ${value.granted ? 'text-green-700' : 'text-gray-500'}`}>
                        {value.name}
                      </span>
                    </div>
                    {value.granted ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <Lock size={18} className="text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex justify-end">
              <button 
                onClick={() => setIsPermissionsModalOpen(false)}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User Permissions Modal */}
      {isUserPermissionsModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">تخصيص صلاحيات: {selectedUser.first_name} {selectedUser.last_name}</h2>
                  <p className="text-xs font-bold text-gray-400">تعديل الصلاحيات الفردية لهذا المستخدم بعيداً عن دوره الأساسي</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUserPermissionsModalOpen(false)}
                className="p-3 bg-white text-gray-400 hover:text-red-600 rounded-2xl shadow-sm transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userPermissions.map((perm) => (
                  <div 
                    key={perm.key} 
                    onClick={() => handleToggleUserPermission(perm.key)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      perm.granted 
                        ? 'bg-green-50/50 border-green-100' 
                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${perm.granted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div>
                        <span className={`text-sm font-bold block ${perm.granted ? 'text-green-700' : 'text-gray-500'}`}>
                          {perm.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{perm.key}</span>
                      </div>
                    </div>
                    {perm.granted ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : (
                      <XCircle size={20} className="text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400">
                * التغييرات هنا ستؤثر على هذا المستخدم فقط ولن تغير صلاحيات الدور الأساسي.
              </p>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleSaveUserPermissions}
                  className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Save size={18} />
                  حفظ التغييرات
                </button>
                <button 
                  onClick={() => setIsUserPermissionsModalOpen(false)}
                  className="px-8 py-3 bg-white text-gray-500 border border-gray-100 rounded-xl font-black hover:bg-gray-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Custom Role Modal */}
      {isCustomRoleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Lock size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{editingCustomRole ? 'تعديل دور مخصص' : 'إنشاء دور مخصص جديد'}</h2>
                  <p className="text-xs font-bold text-gray-400">حدد اسم الدور والصلاحيات التي سيتمتع بها</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCustomRoleModalOpen(false)}
                className="p-3 bg-white text-gray-400 hover:text-red-600 rounded-2xl shadow-sm transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomRole} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-8 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 block mr-2">اسم الدور</label>
                    <input
                      type="text"
                      value={customRoleData.name}
                      onChange={(e) => setCustomRoleData({...customRoleData, name: e.target.value})}
                      placeholder="مثلاً: مشرف مبيعات، مدير مستودع..."
                      className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-purple-500 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 block mr-2">وصف الدور</label>
                    <textarea
                      value={customRoleData.description}
                      onChange={(e) => setCustomRoleData({...customRoleData, description: e.target.value})}
                      placeholder="اشرح مهام هذا الدور باختصار..."
                      className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-purple-500 transition-all h-24 resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2">اختر الصلاحيات الممنوحة لهذا الدور:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(roles[0]?.permissions || {}).map(([key, value]) => (
                      <div 
                        key={key} 
                        onClick={() => {
                          setCustomRoleData({
                            ...customRoleData,
                            permissions: {
                              ...customRoleData.permissions,
                              [key]: !customRoleData.permissions[key]
                            }
                          });
                        }}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                          customRoleData.permissions[key] 
                            ? 'bg-purple-50/50 border-purple-100' 
                            : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${customRoleData.permissions[key] ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-xs font-bold ${customRoleData.permissions[key] ? 'text-purple-700' : 'text-gray-500'}`}>
                            {value.name}
                          </span>
                        </div>
                        {customRoleData.permissions[key] && (
                          <CheckCircle size={18} className="text-purple-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex items-center gap-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-3 bg-purple-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-purple-100 hover:bg-purple-700 transition-all active:scale-95"
                >
                  <Save size={20} />
                  {editingCustomRole ? 'تحديث الدور' : 'إنشاء الدور'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomRoleModalOpen(false)}
                  className="flex-1 bg-white text-gray-500 py-4 rounded-2xl font-black border border-gray-100 hover:bg-gray-50 transition-all active:scale-95"
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

export default UsersPermissions;
