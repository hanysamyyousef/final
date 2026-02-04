import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Warehouse, 
  Package, 
  FileText, 
  Users, 
  Calculator, 
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
  BarChart3,
  Wallet,
  Truck,
  ChevronDown
} from 'lucide-react';

const NavItem = ({ icon, label, to, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 whitespace-nowrap ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
    }`}
  >
    {icon}
    <span className="font-bold text-sm">{label}</span>
  </Link>
);

const Layout = ({ children, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'الرئيسية', to: '/', icon: <LayoutDashboard size={18} /> },
    { id: 'companies', label: 'الشركات', to: '/companies', icon: <Building2 size={18} /> },
    { id: 'contacts', label: 'العملاء', to: '/contacts', icon: <Users size={18} /> },
    { id: 'inventory', label: 'المخازن', to: '/inventory', icon: <Warehouse size={18} /> },
    { id: 'products', label: 'المنتجات', to: '/products', icon: <Package size={18} /> },
    { id: 'invoices', label: 'الفواتير', to: '/invoices', icon: <FileText size={18} /> },
    { id: 'employees', label: 'الموظفين', to: '/employees', icon: <Users size={18} /> },
    { id: 'representatives', label: 'المناديب', to: '/representatives', icon: <Users size={18} /> },
    { id: 'drivers', label: 'السائقين', to: '/drivers', icon: <Truck size={18} /> },
    { id: 'finances', label: 'المالية', to: '/finances', icon: <Wallet size={18} /> },
    { id: 'accounting', label: 'الحسابات', to: '/accounting', icon: <Calculator size={18} /> },
    { id: 'journal', label: 'القيود', to: '/journal-entries', icon: <BookOpen size={18} /> },
    { id: 'reports', label: 'التقارير', to: '/reports', icon: <BarChart3 size={18} /> },
    { id: 'settings', label: 'الإعدادات', to: '/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-['Cairo'] flex flex-col" dir="rtl">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto">
          {/* Upper Header: Logo & User Profile */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <button 
                className="xl:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-2xl font-black text-blue-600 tracking-tight">
                ERP <span className="text-gray-900 font-bold text-lg">SYSTEM</span>
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-3 text-right">
                <div>
                  <p className="text-sm font-black text-gray-900 leading-none">أهلاً بك، أدمن</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">مدير النظام</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-100">
                  أ
                </div>
              </div>
              
              <button
                onClick={onLogout}
                className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="تسجيل الخروج"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Lower Header: Navigation Items (Desktop) */}
          <nav className="hidden xl:flex items-center gap-1 p-2 overflow-x-auto no-scrollbar">
            {menuItems.map((item) => (
              <NavItem 
                key={item.id}
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.to}
              />
            ))}
          </nav>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`xl:hidden transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-screen border-t border-gray-50' : 'max-h-0'}`}>
          <div className="p-4 grid grid-cols-2 gap-2 bg-white">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  location.pathname === item.to 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm min-h-full">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-400 text-xs font-bold border-t border-gray-100 bg-white">
        جميع الحقوق محفوظة © {new Date().getFullYear()} نظام ERP المطور
      </footer>
    </div>
  );
};

export default Layout;
