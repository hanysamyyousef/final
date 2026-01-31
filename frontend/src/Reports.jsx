import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  FileSpreadsheet, 
  TrendingUp, 
  ArrowDownToLine,
  FileText,
  Calendar,
  ChevronLeft
} from 'lucide-react';

const ReportCard = ({ title, description, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 hover:shadow-xl transition-all cursor-pointer group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100 group-hover:scale-110 transition-transform`}>
        {React.cloneElement(icon, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
      </div>
      <button className="text-gray-400 hover:text-blue-600">
        <ArrowDownToLine size={20} />
      </button>
    </div>
    <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 mb-4">{description}</p>
    <div className="flex items-center gap-2 text-blue-600 text-xs font-black">
      <span>عرض التقرير</span>
      <ChevronLeft size={14} />
    </div>
  </div>
);

const Reports = () => {
  const financialReports = [
    { title: 'ميزان المراجعة', description: 'ملخص أرصدة كافة الحسابات المدينة والدائنة', icon: <FileSpreadsheet />, color: 'bg-blue-600' },
    { title: 'قائمة الدخل', description: 'تقرير الأرباح والخسائر خلال فترة زمنية محددة', icon: <TrendingUp />, color: 'bg-green-600' },
    { title: 'الميزانية العمومية', description: 'بيان بالمركز المالي للشركة (أصول، خصوم، حقوق ملكية)', icon: <PieChart />, color: 'bg-purple-600' },
    { title: 'كشف حساب تفصيلي', description: 'حركة حساب معين خلال فترة زمنية محددة', icon: <FileText />, color: 'bg-amber-600' },
  ];

  const salesReports = [
    { title: 'تقرير المبيعات', description: 'تحليل المبيعات حسب العميل، المنتج أو الفترة', icon: <BarChart3 />, color: 'bg-rose-600' },
    { title: 'تقرير المشتريات', description: 'تحليل المشتريات حسب المورد أو المنتج', icon: <BarChart3 />, color: 'bg-indigo-600' },
    { title: 'تقرير الضريبة', description: 'ملخص ضريبة القيمة المضافة للمبيعات والمشتريات', icon: <FileText />, color: 'bg-cyan-600' },
  ];

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">التقارير والنظام المالي</h1>
        <p className="text-gray-500">استخرج تقارير مفصلة عن أداء عملك</p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Calendar size={18} />
          <h2 className="font-bold text-sm uppercase tracking-wider">التقارير المحاسبية</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financialReports.map((report, idx) => (
            <ReportCard key={idx} {...report} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-gray-400">
          <BarChart3 size={18} />
          <h2 className="font-bold text-sm uppercase tracking-wider">تقارير المبيعات والمخازن</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {salesReports.map((report, idx) => (
            <ReportCard key={idx} {...report} />
          ))}
        </div>
      </section>

      <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-right">
          <h3 className="text-xl font-black text-blue-900">هل تحتاج لتقرير مخصص؟</h3>
          <p className="text-blue-700 font-medium">يمكننا مساعدتك في بناء تقارير مخصصة تناسب احتياجات عملك الخاصة</p>
        </div>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
          تواصل مع الدعم الفني
        </button>
      </div>
    </div>
  );
};

export default Reports;
