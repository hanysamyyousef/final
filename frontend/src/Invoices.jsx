import React, { useEffect, useState } from 'react';
import api from './api';
import { 
  Plus, 
  FileText, 
  Search, 
  Filter, 
  ChevronRight,
  MoreVertical,
  Calendar,
  User,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Printer
} from 'lucide-react';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'sale', 'purchase'

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        let url = '/invoices/api/invoices/';
        if (activeTab !== 'all') {
          url += `?type=${activeTab}`;
        }
        const response = await api.get(url);
        setInvoices(response.data);
      } catch (err) {
        console.error('Error fetching invoices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [activeTab]);

  const filteredInvoices = invoices.filter(invoice => 
    invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.contact_name && invoice.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (invoice) => {
    if (invoice.is_posted) {
      return (
        <span className="bg-green-100 text-green-600 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
          <CheckCircle2 size={10} />
          مرحلة
        </span>
      );
    }
    return (
      <span className="bg-amber-100 text-amber-600 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
        <Clock size={10} />
        مسودة
      </span>
    );
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'sale':
        return <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-[10px] font-bold">بيع</span>;
      case 'purchase':
        return <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-[10px] font-bold">شراء</span>;
      default:
        return <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded-md text-[10px] font-bold">{type}</span>;
    }
  };

  if (loading && invoices.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الفواتير</h1>
          <p className="text-gray-500">إدارة مبيعات ومشتريات النظام</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200">
            <Plus size={20} />
            فاتورة جديدة
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-100 overflow-x-auto pb-px">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'sale', label: 'المبيعات' },
          { id: 'purchase', label: 'المشتريات' },
          { id: 'sale_return', label: 'مرتجع مبيعات' },
          { id: 'purchase_return', label: 'مرتجع مشتريات' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="البحث برقم الفاتورة أو اسم العميل..."
            className="w-full pr-10 pl-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-gray-50 text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition">
          <Filter size={20} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-bold text-gray-600 text-sm">رقم الفاتورة</th>
              <th className="p-4 font-bold text-gray-600 text-sm">التاريخ</th>
              <th className="p-4 font-bold text-gray-600 text-sm">العميل / المورد</th>
              <th className="p-4 font-bold text-gray-600 text-sm text-center">النوع</th>
              <th className="p-4 font-bold text-gray-600 text-sm text-center">طريقة الدفع</th>
              <th className="p-4 font-bold text-gray-600 text-sm text-left">الإجمالي</th>
              <th className="p-4 font-bold text-gray-600 text-sm text-center">الحالة</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-blue-50/30 transition group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      invoice.invoice_type === 'sale' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      <FileText size={20} />
                    </div>
                    <span className="font-bold text-gray-800">{invoice.number}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    {new Date(invoice.date).toLocaleDateString('ar-EG')}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{invoice.contact_name}</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  {getTypeBadge(invoice.invoice_type)}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500">
                    <CreditCard size={14} />
                    {invoice.payment_type === 'cash' ? 'نقدي' : 'آجل'}
                  </div>
                </td>
                <td className="p-4 text-left">
                  <span className="font-black text-gray-900">{invoice.net_amount} <span className="text-[10px] text-gray-400 font-medium">ج.م</span></span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center">
                    {getStatusBadge(invoice)}
                  </div>
                </td>
                <td className="p-4 text-left">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="طباعة">
                      <Printer size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoices;
