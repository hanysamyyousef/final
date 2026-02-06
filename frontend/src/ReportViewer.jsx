import React, { useState, useEffect } from 'react';
import api from './api';
import { X, Download, Printer, Filter, Calendar } from 'lucide-react';

const ReportViewer = ({ reportType, title, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (reportType === 'trial_balance') endpoint = '/accounting/api/reports/trial_balance/';
      else if (reportType === 'profit_loss') endpoint = '/accounting/api/reports/profit_loss/';
      else if (reportType === 'balance_sheet') endpoint = '/accounting/api/reports/balance_sheet/';
      else if (reportType === 'vat_report') endpoint = '/accounting/api/reports/vat_report/';
      else if (reportType === 'sales_summary') endpoint = '/invoices/api/reports/sales_summary/';
      else if (reportType === 'purchases_summary') endpoint = '/invoices/api/reports/purchases_summary/';
      else if (reportType === 'product_sales') endpoint = '/invoices/api/reports/product_sales/';

      const response = await api.get(endpoint, { params: filters });
      setData(response.data);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [reportType, filters]);

  const renderTrialBalance = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-600 text-sm font-bold border-b">
            <th className="p-4">كود الحساب</th>
            <th className="p-4">اسم الحساب</th>
            <th className="p-4">مدين</th>
            <th className="p-4">دائن</th>
            <th className="p-4">رصيد مدين</th>
            <th className="p-4">رصيد دائن</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((item, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="p-4">{item.account.code}</td>
              <td className="p-4 font-bold">{item.account.name}</td>
              <td className="p-4 text-blue-600">{parseFloat(item.debit).toLocaleString()}</td>
              <td className="p-4 text-rose-600">{parseFloat(item.credit).toLocaleString()}</td>
              <td className="p-4 font-bold">{parseFloat(item.balance_debit).toLocaleString()}</td>
              <td className="p-4 font-bold">{parseFloat(item.balance_credit).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-blue-50 font-black text-blue-900">
            <td className="p-4" colSpan={4}>الإجمالي</td>
            <td className="p-4">{parseFloat(data.total_debit).toLocaleString()}</td>
            <td className="p-4">{parseFloat(data.total_credit).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  const renderProfitLoss = () => (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-bold text-green-700 mb-4 border-b pb-2">الإيرادات</h3>
        <table className="w-full text-right">
          <tbody>
            {data.income.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-3">{item.account.name}</td>
                <td className="p-3 font-bold text-green-600">{parseFloat(item.balance).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-green-50 font-black">
              <td className="p-3">إجمالي الإيرادات</td>
              <td className="p-3">{parseFloat(data.total_income).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section>
        <h3 className="text-lg font-bold text-rose-700 mb-4 border-b pb-2">المصروفات</h3>
        <table className="w-full text-right">
          <tbody>
            {data.expense.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-3">{item.account.name}</td>
                <td className="p-3 font-bold text-rose-600">{parseFloat(item.balance).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-rose-50 font-black">
              <td className="p-3">إجمالي المصروفات</td>
              <td className="p-3">{parseFloat(data.total_expense).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <div className={`p-6 rounded-2xl flex justify-between items-center font-black text-xl ${data.net_profit >= 0 ? 'bg-green-600 text-white' : 'bg-rose-600 text-white'}`}>
        <span>صافي {data.net_profit >= 0 ? 'الربح' : 'الخسارة'}</span>
        <span>{parseFloat(data.net_profit).toLocaleString()}</span>
      </div>
    </div>
  );

  const renderSalesSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
        <p className="text-blue-600 text-sm font-bold mb-1">إجمالي المبيعات</p>
        <h4 className="text-2xl font-black text-blue-900">{parseFloat(data.total_sales || 0).toLocaleString()}</h4>
      </div>
      <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
        <p className="text-green-600 text-sm font-bold mb-1">المبلغ المحصل</p>
        <h4 className="text-2xl font-black text-green-900">{parseFloat(data.total_paid || 0).toLocaleString()}</h4>
      </div>
      <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
        <p className="text-rose-600 text-sm font-bold mb-1">المبالغ المتبقية</p>
        <h4 className="text-2xl font-black text-rose-900">{parseFloat(data.total_remaining || 0).toLocaleString()}</h4>
      </div>
      <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
        <p className="text-amber-600 text-sm font-bold mb-1">عدد الفواتير</p>
        <h4 className="text-2xl font-black text-amber-900">{data.total_count}</h4>
      </div>
    </div>
  );

  const renderPurchasesSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
        <p className="text-blue-600 text-sm font-bold mb-1">إجمالي المشتريات</p>
        <h4 className="text-2xl font-black text-blue-900">{parseFloat(data.total_purchases || 0).toLocaleString()}</h4>
      </div>
      <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
        <p className="text-green-600 text-sm font-bold mb-1">المبلغ المدفوع</p>
        <h4 className="text-2xl font-black text-green-900">{parseFloat(data.total_paid || 0).toLocaleString()}</h4>
      </div>
      <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
        <p className="text-rose-600 text-sm font-bold mb-1">المبالغ المتبقية</p>
        <h4 className="text-2xl font-black text-rose-900">{parseFloat(data.total_remaining || 0).toLocaleString()}</h4>
      </div>
      <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
        <p className="text-amber-600 text-sm font-bold mb-1">عدد الفواتير</p>
        <h4 className="text-2xl font-black text-amber-900">{data.total_count}</h4>
      </div>
    </div>
  );

  const renderProductSales = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-600 text-sm font-bold border-b">
            <th className="p-4">اسم الصنف</th>
            <th className="p-4">الكمية المباعة</th>
            <th className="p-4">إجمالي الإيرادات</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="p-4 font-bold">{item.product__name}</td>
              <td className="p-4 text-blue-600">{parseFloat(item.total_quantity).toLocaleString()}</td>
              <td className="p-4 font-black">{parseFloat(item.total_revenue).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBalanceSheet = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-blue-700 border-b pb-2">الأصول</h3>
          <table className="w-full text-right">
            <tbody>
              {data.assets.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-3">{item.account.name}</td>
                  <td className="p-3 font-bold text-blue-600">{parseFloat(item.balance).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 font-black">
                <td className="p-3">إجمالي الأصول</td>
                <td className="p-3">{parseFloat(data.total_assets).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </section>
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-rose-700 border-b pb-2">الخصوم</h3>
            <table className="w-full text-right">
              <tbody>
                {data.liabilities.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3">{item.account.name}</td>
                    <td className="p-3 font-bold text-rose-600">{parseFloat(item.balance).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-rose-50 font-black">
                  <td className="p-3">إجمالي الخصوم</td>
                  <td className="p-3">{parseFloat(data.total_liabilities).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-indigo-700 border-b pb-2">حقوق الملكية</h3>
            <table className="w-full text-right">
              <tbody>
                {data.equity.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3">{item.account.name}</td>
                    <td className="p-3 font-bold text-indigo-600">{parseFloat(item.balance).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-indigo-50 font-black">
                  <td className="p-3">إجمالي حقوق الملكية</td>
                  <td className="p-3">{parseFloat(data.total_equity).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div className="bg-gray-800 text-white p-6 rounded-3xl flex justify-between items-center font-black text-xl">
        <span>إجمالي الخصوم وحقوق الملكية</span>
        <span>{(parseFloat(data.total_liabilities) + parseFloat(data.total_equity)).toLocaleString()}</span>
      </div>
    </div>
  );

  const renderVATReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
          <p className="text-blue-600 text-sm font-bold mb-1">ضريبة المخرجات (المبيعات)</p>
          <h4 className="text-2xl font-black text-blue-900">{parseFloat(data.total_output_vat).toLocaleString()}</h4>
        </div>
        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
          <p className="text-rose-600 text-sm font-bold mb-1">ضريبة المدخلات (المشتريات)</p>
          <h4 className="text-2xl font-black text-rose-900">{parseFloat(data.total_input_vat).toLocaleString()}</h4>
        </div>
        <div className={`p-6 rounded-3xl border font-black ${data.net_vat >= 0 ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-green-50 border-green-100 text-green-900'}`}>
          <p className="text-sm font-bold mb-1">{data.net_vat >= 0 ? 'ضريبة مستحقة للدفع' : 'رصيد ضريبي دائن'}</p>
          <h4 className="text-2xl">{Math.abs(parseFloat(data.net_vat)).toLocaleString()}</h4>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
        <header className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
              <X size={24} className="text-gray-500" />
            </button>
            <h2 className="text-xl font-black text-gray-800">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              <Printer size={18} />
              <span>طباعة</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
              <Download size={18} />
              <span>تصدير Excel</span>
            </button>
          </div>
        </header>

        <div className="p-6 bg-white border-b flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-gray-400" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">من:</span>
              <input 
                type="date" 
                value={filters.start_date}
                onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                className="border-none bg-gray-100 rounded-lg px-3 py-1 text-sm font-bold focus:ring-2 ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">إلى:</span>
              <input 
                type="date" 
                value={filters.end_date}
                onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                className="border-none bg-gray-100 rounded-lg px-3 py-1 text-sm font-bold focus:ring-2 ring-blue-500"
              />
            </div>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-colors">
            <Filter size={16} />
            <span>تحديث</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-bold">جاري تحميل التقرير...</p>
            </div>
          ) : data ? (
            <>
              {reportType === 'trial_balance' && renderTrialBalance()}
              {reportType === 'profit_loss' && renderProfitLoss()}
              {reportType === 'balance_sheet' && renderBalanceSheet()}
              {reportType === 'vat_report' && renderVATReport()}
              {reportType === 'sales_summary' && renderSalesSummary()}
              {reportType === 'purchases_summary' && renderPurchasesSummary()}
              {reportType === 'product_sales' && renderProductSales()}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 font-bold">لا توجد بيانات متاحة لهذا التقرير</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;
