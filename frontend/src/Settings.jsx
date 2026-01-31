import React from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Lock, 
  Globe, 
  Shield, 
  Database,
  Cloud,
  ChevronLeft
} from 'lucide-react';

const SettingItem = ({ icon, title, description, color }) => (
  <button className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition border-b border-gray-100 last:border-0 group">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 ${color.replace('bg-', 'text-')}`}>
        {icon}
      </div>
      <div className="text-right">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
    <ChevronLeft size={18} className="text-gray-300 group-hover:text-gray-500 transition" />
  </button>
);

const Settings = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">الإعدادات</h1>
        <p className="text-gray-500">تخصيص النظام وإدارة الحسابات</p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">إعدادات الحساب</h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <SettingItem 
              icon={<User size={20} />} 
              title="الملف الشخصي" 
              description="تعديل بياناتك الشخصية وصورة الحساب" 
              color="bg-blue-600"
            />
            <SettingItem 
              icon={<Shield size={20} />} 
              title="الأمان" 
              description="تغيير كلمة المرور وإعدادات التحقق الثنائي" 
              color="bg-green-600"
            />
            <SettingItem 
              icon={<Bell size={20} />} 
              title="التنبيهات" 
              description="إدارة كيفية استلام الإشعارات والرسائل" 
              color="bg-amber-600"
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">إعدادات النظام</h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <SettingItem 
              icon={<Globe size={20} />} 
              title="اللغة والمنطقة" 
              description="تعديل لغة النظام والتوقيت المحلي" 
              color="bg-indigo-600"
            />
            <SettingItem 
              icon={<Database size={20} />} 
              title="قاعدة البيانات" 
              description="إدارة النسخ الاحتياطي واستيراد البيانات" 
              color="bg-rose-600"
            />
            <SettingItem 
              icon={<Cloud size={20} />} 
              title="التكامل البرمجي" 
              description="ربط النظام مع خدمات خارجية وتطبيقات أخرى" 
              color="bg-cyan-600"
            />
          </div>
        </section>

        <div className="bg-blue-50 p-6 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl">
              <Lock size={24} />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">نسخة النظام: 2.0.4-المطورة</h3>
              <p className="text-sm text-blue-700">جميع الحقوق محفوظة © 2026</p>
            </div>
          </div>
          <button className="text-blue-600 font-bold hover:underline">تحقق من التحديثات</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
