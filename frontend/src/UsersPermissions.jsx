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
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-2">إجمالي المستخدمين</p>
                  <h3 className="text-4xl font-black text-gray-900">{users?.length || 0}</h3>
                </div>
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Users size={28} />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-2">مستخدمين نشطين</p>
                  <h3 className="text-4xl font-black text-green-600">{users?.filter(u => u.is_active).length || 0}</h3>
                </div>
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                  <CheckCircle size={28} />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-2">الأدوار المفعلة</p>
                  <h3 className="text-4xl font-black text-purple-600">{roles?.length || 0}</h3>
                </div>
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <Shield size={28} />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-2">غير نشط</p>
                  <h3 className="text-4xl font-black text-red-600">{users?.filter(u => !u.is_active).length || 0}</h3>
                </div>
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                  <XCircle size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Users Table Card */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="البحث عن مستخدم بالإسم أو البريد أو اسم المستخدم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50/50 border-none rounded-2xl pr-14 pl-6 py-4 text-sm font-bold focus:ring-2 ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">المستخدم</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">الدور الصلاحية</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">البريد الإلكتروني</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">الحالة</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-100">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{user.first_name} {user.last_name}</p>
                            <p className="text-xs font-bold text-gray-400">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          user.profile?.role === 'admin' 
                            ? 'bg-red-50 text-red-600' 
                            : user.profile?.role === 'manager'
                            ? 'bg-purple-50 text-purple-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {user.profile?.role_display || 'موظف'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-gray-600">{user.email}</td>
                      <td className="px-8 py-5">
                        <button 
                          onClick={() => handleToggleStatus(user.id)}
                          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${
                            user.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-600' : 'bg-red-600'}`}></div>
                          {user.is_active ? 'نشط' : 'غير نشط'}
                        </button>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => handleOpenUserModal(user)}
                            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all active:scale-90"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
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
        </>
      ) : (
        /* Roles Management Tab */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {roles.map((role) => (
            <div key={role.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
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
                    .slice(0, 10) // Show first 10 active permissions
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
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
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
    </div>
  );
};

export default UsersPermissions;
