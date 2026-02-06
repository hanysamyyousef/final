import React, { useEffect, useState } from 'react';
import api from './api';
import { 
  Users, 
  Building2, 
  Warehouse, 
  Package, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const StatCard = ({ title, value, icon, color, trend }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group">
    <div className="flex justify-between items-start">
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
        {React.cloneElement(icon, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="mt-4">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-gray-900">{value}</span>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/dashboard-stats/');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!stats) return (
    <div className="flex items-center justify-center h-full text-gray-500">
      حدث خطأ أثناء تحميل البيانات
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">لوحة المؤشرات</h1>
          <p className="text-gray-500 font-medium mt-1">أهلاً بك مجدداً، إليك ملخص أداء النظام اليوم</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">تنزيل التقرير</button>
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">تحديث البيانات</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي المبيعات" value={`${stats.sale_invoices_count || 0} فاتورة`} icon={<FileText />} color="bg-blue-600" trend={12} />
    <StatCard title="إجمالي المشتريات" value={`${stats.purchase_invoices_count || 0} فاتورة`} icon={<ArrowDownLeft />} color="bg-rose-600" trend={-5} />
    <StatCard title="عدد المنتجات" value={stats.products_count || 0} icon={<Package />} color="bg-amber-600" trend={8} />
    <StatCard title="إجمالي العملاء" value={stats.customers_count || 0} icon={<Users />} color="bg-indigo-600" trend={15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-gray-900">تحليل المبيعات والمصروفات</h3>
            <select className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-600 outline-none">
              <option>آخر 6 أشهر</option>
              <option>آخر سنة</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chart_data && stats.chart_data.length > 0 ? stats.chart_data : [{name: 'لا يوجد بيانات', sales: 0, expenses: 0}]}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', direction: 'rtl'}}
                  itemStyle={{fontFamily: 'Cairo', fontWeight: 700}}
                />
                <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="expenses" name="المصروفات" stroke="#e11d48" strokeWidth={4} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 mb-8">إحصائيات سريعة</h3>
          <div className="space-y-6">
            {[
              { label: 'الشركات', value: stats.companies_count, icon: <Building2 />, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'الفروع', value: stats.branches_count, icon: <Activity />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'المخازن', value: stats.stores_count, icon: <Warehouse />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'الخزن', value: stats.safes_count, icon: <DollarSign />, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-2xl transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                    {React.cloneElement(item.icon, { size: 20 })}
                  </div>
                  <span className="font-bold text-gray-700">{item.label}</span>
                </div>
                <span className="text-xl font-black text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-4 bg-gray-50 text-gray-600 font-black rounded-2xl hover:bg-gray-100 transition-all">
            عرض كافة التفاصيل
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ملخص المديونيات */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="text-blue-600" size={20} />
            ملخص المديونيات
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <p className="text-sm font-bold text-blue-600 mb-1">مديونيات العملاء</p>
              <p className="text-2xl font-black text-blue-900">
                {(stats.debt_summary?.total_customers_balance || 0).toLocaleString('ar-EG')}
                <span className="text-xs font-bold mr-1">ج.م</span>
              </p>
            </div>
            <div className="bg-rose-50 p-6 rounded-2xl">
              <p className="text-sm font-bold text-rose-600 mb-1">مديونيات الموردين</p>
              <p className="text-2xl font-black text-rose-900">
                {(stats.debt_summary?.total_suppliers_balance || 0).toLocaleString('ar-EG')}
                <span className="text-xs font-bold mr-1">ج.م</span>
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
            <span className="font-bold text-gray-600">إجمالي المديونية العامة</span>
            <span className="text-xl font-black text-gray-900">
              {(stats.debt_summary?.total_debt || 0).toLocaleString('ar-EG')}
              <span className="text-xs font-bold mr-1">ج.م</span>
            </span>
          </div>
        </div>

        {/* أفضل العملاء */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <Users className="text-indigo-600" size={20} />
            أفضل العملاء (حسب المشتريات)
          </h3>
          <div className="space-y-4">
            {(stats.top_customers || []).map((customer, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.invoice_count} فاتورة</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-900">{customer.total_spent.toLocaleString('ar-EG')} ج.م</p>
                </div>
              </div>
            ))}
            {(!stats.top_customers || stats.top_customers.length === 0) && (
              <div className="text-center py-8 text-gray-400 font-medium">
                لا يوجد بيانات عملاء حالياً
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
