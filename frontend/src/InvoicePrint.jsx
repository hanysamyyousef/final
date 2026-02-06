import React from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const InvoicePrint = React.forwardRef(({ invoice, settings }, ref) => {
  if (!invoice) return null;

  const getTypeLabel = (type) => {
    const types = {
      'sale': 'فاتورة مبيعات',
      'purchase': 'فاتورة مشتريات',
      'sale_return': 'مرتجع مبيعات',
      'purchase_return': 'مرتجع مشتريات',
    };
    return types[type] || type;
  };

  return (
    <div ref={ref} className="p-10 bg-white text-black font-sans print:p-5" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6 mb-8">
        <div className="flex gap-4">
          {settings?.logo && (
            <img src={settings.logo} alt="Logo" className="h-24 w-24 object-contain rounded-xl bg-gray-50 p-2" />
          )}
          <div>
            <div className="text-3xl font-black text-blue-600 mb-1">{settings?.company_name || 'المؤسسة التجارية'}</div>
            <div className="text-gray-600 text-sm space-y-1">
              {settings?.address && <p className="flex items-center gap-2">{settings.address}</p>}
              {settings?.phone && <p className="flex items-center gap-2">هاتف: {settings.phone}</p>}
              {settings?.tax_number && <p className="flex items-center gap-2">الرقم الضريبي: {settings.tax_number}</p>}
            </div>
          </div>
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{getTypeLabel(invoice.invoice_type)}</h1>
          <div className="text-sm space-y-1">
            <p><span className="font-bold">رقم الفاتورة:</span> {invoice.number}</p>
            <p><span className="font-bold">التاريخ:</span> {new Date(invoice.date).toLocaleString('ar-EG')}</p>
            <p><span className="font-bold">الحالة:</span> {invoice.is_posted ? 'مرحلة' : 'مسودة'}</p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-4 rounded-xl">
        <div>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">جهة الاتصال</h3>
          <p className="text-lg font-bold text-gray-800">{invoice.contact_name}</p>
          {invoice.contact_details && (
            <div className="text-sm text-gray-600 mt-1">
              <p>{invoice.contact_details.address}</p>
              <p>{invoice.contact_details.phone}</p>
            </div>
          )}
        </div>
        <div className="text-left">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">تفاصيل الشحن / الموقع</h3>
          <p className="text-sm font-bold text-gray-800">المخزن: {invoice.store_name}</p>
          {invoice.representative_name && <p className="text-sm">المندوب: {invoice.representative_name}</p>}
          {invoice.driver_name && <p className="text-sm">السائق: {invoice.driver_name}</p>}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="py-3 px-4 text-right rounded-r-lg">#</th>
            <th className="py-3 px-4 text-right">الصنف</th>
            <th className="py-3 px-4 text-center">الكمية</th>
            <th className="py-3 px-4 text-center">السعر</th>
            <th className="py-3 px-4 text-center">الخصم</th>
            <th className="py-3 px-4 text-center">الضريبة</th>
            <th className="py-3 px-4 text-left rounded-l-lg">الإجمالي</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoice.items?.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-4 text-sm text-gray-500">{index + 1}</td>
              <td className="py-4 px-4">
                <div className="font-bold text-gray-800">{item.product_name}</div>
                {item.notes && <div className="text-xs text-gray-400 mt-1">{item.notes}</div>}
              </td>
              <td className="py-4 px-4 text-center text-sm">{item.quantity} {item.unit_name}</td>
              <td className="py-4 px-4 text-center text-sm">{parseFloat(item.unit_price).toLocaleString()}</td>
              <td className="py-4 px-4 text-center text-sm">
                {parseFloat(item.discount_amount).toLocaleString()}
                <span className="text-[10px] text-gray-400 block">({item.discount_percentage}%)</span>
              </td>
              <td className="py-4 px-4 text-center text-sm">
                {parseFloat(item.tax_amount).toLocaleString()}
                <span className="text-[10px] text-gray-400 block">({item.tax_percentage}%)</span>
              </td>
              <td className="py-4 px-4 text-left font-bold text-gray-800">
                {parseFloat(item.net_price).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-72 space-y-3 bg-gray-50 p-6 rounded-2xl">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">الإجمالي قبل الخصم:</span>
            <span className="font-bold text-gray-800">{parseFloat(invoice.total_amount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-rose-600">
            <span>إجمالي الخصم:</span>
            <span className="font-bold">({parseFloat(invoice.discount_amount).toLocaleString()})</span>
          </div>
          <div className="flex justify-between text-sm text-blue-600">
            <span>إجمالي الضريبة:</span>
            <span className="font-bold">+{parseFloat(invoice.tax_amount).toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-lg font-black text-gray-800">الصافي النهائي:</span>
            <span className="text-xl font-black text-blue-600">
              {parseFloat(invoice.net_amount).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
            <span className="text-gray-500">المدفوع:</span>
            <span className="font-bold text-green-600">{parseFloat(invoice.paid_amount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">المتبقي:</span>
            <span className="font-bold text-rose-600">{parseFloat(invoice.remaining_amount).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-100 grid grid-cols-3 gap-8 text-center">
        <div className="space-y-8">
          <p className="font-bold text-gray-700">توقيع المستلم</p>
          <div className="border-b border-gray-300 w-32 mx-auto"></div>
        </div>
        <div className="space-y-8">
          <p className="font-bold text-gray-700">توقيع المحاسب</p>
          <div className="border-b border-gray-300 w-32 mx-auto"></div>
        </div>
        <div className="space-y-8">
          <p className="font-bold text-gray-700">توقيع المدير</p>
          <div className="border-b border-gray-300 w-32 mx-auto"></div>
        </div>
      </div>

      <div className="mt-12 text-center text-gray-400 text-[10px]">
        {settings?.company_name} - نظام إدارة المبيعات والمخازن المتكامل
      </div>
    </div>
  );
});

export default InvoicePrint;
