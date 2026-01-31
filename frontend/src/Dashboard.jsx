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
        <StatCard title="إجمالي المبيعات" value={`${stats.sale_invoices_count} فاتورة`} icon={<FileText />} color="bg-blue-600" trend={12} />
        <StatCard title="إجمالي المشتريات" value={`${stats.purchase_invoices_count} فاتورة`} icon={<ArrowDownLeft />} color="bg-rose-600" trend={-5} />
        <StatCard title="عدد المنتجات" value={stats.products_count} icon={<Package />} color="bg-amber-600" trend={8} />
        <StatCard title="إجمالي العملاء" value={stats.customers_count} icon={<Users />} color="bg-indigo-600" trend={15} />
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
              <AreaChart data={stats.chart_data && stats.chart_data.length > 0 ? stats.chart_data : [{name: 'لا يوجد بيانات', sales: 0}]}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', direction: 'rtl'}}
                  itemStyle={{fontFamily: 'Cairo', fontWeight: 700}}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
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
    </div>
  );
};

export default Dashboard;
