import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from './api';
import { 
  ArrowLeft, 
  Edit2, 
  Package, 
  Tag, 
  Warehouse, 
  Barcode, 
  Info,
  Layers,
  Ruler,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';

const ProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/api/products/${id}/`);
        setProduct(res.data);
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">المنتج غير موجود</h2>
        <button 
          onClick={() => navigate('/products')}
          className="mt-4 text-blue-600 hover:underline flex items-center gap-2 justify-center"
        >
          <ArrowLeft size={20} />
          العودة لقائمة المنتجات
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/products')}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
            <p className="text-gray-500">تفاصيل المنتج والبيانات التقنية</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/products/edit/${id}`)}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            <Edit2 size={20} />
            تعديل المنتج
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image and Basic Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="aspect-square bg-gray-50 flex items-center justify-center">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package size={120} className="text-gray-200" strokeWidth={1} />
              )}
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">حالة المنتج</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {product.is_active ? 'نشط' : 'متوقف'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">كود المنتج</span>
                <span className="font-mono font-bold text-gray-800">{product.code || '---'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">الباركود</span>
                <span className="font-mono text-gray-800">{product.barcode || '---'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
              <Info size={18} className="text-blue-600" />
              تصنيف المنتج
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Tag size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">القسم</p>
                  <p className="text-sm font-bold text-gray-800">{product.category_name || 'عام'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <Warehouse size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">المخزن الافتراضي</p>
                  <p className="text-sm font-bold text-gray-800">{product.default_store_name || 'بدون مخزن'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <Layers size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">نوع المنتج</p>
                  <p className="text-sm font-bold text-gray-800">
                    {product.product_type === 'simple' ? 'منتج بسيط' : 'منتج تجميعي (باقة)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Units, Prices, and Components */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inventory Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-1">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">الرصيد الحالي</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-gray-900">{product.current_balance}</span>
                <span className="text-gray-500 mb-1 font-medium">
                  {product.units?.find(u => u.is_default_sale)?.unit_name || 'قطعة'}
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-1">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">سعر البيع الأساسي</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-blue-600">
                  {product.units?.find(u => u.is_default_sale)?.selling_price || 0}
                </span>
                <span className="text-gray-500 mb-1 font-medium">ج.م</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-1">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">سعر الشراء</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-emerald-600">
                  {product.units?.find(u => u.is_default_purchase)?.purchase_price || 0}
                </span>
                <span className="text-gray-500 mb-1 font-medium">ج.م</span>
              </div>
            </div>
          </div>

          {/* Units Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Ruler size={18} className="text-blue-600" />
                وحدات القياس والأسعار
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                    <th className="px-6 py-4">الوحدة</th>
                    <th className="px-6 py-4">معامل التحويل</th>
                    <th className="px-6 py-4">سعر الشراء</th>
                    <th className="px-6 py-4">سعر البيع</th>
                    <th className="px-6 py-4">الباركود</th>
                    <th className="px-6 py-4">الافتراضي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {product.units?.map((unit, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-bold text-gray-800">{unit.unit_name}</td>
                      <td className="px-6 py-4 text-gray-600">{unit.conversion_factor}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">{unit.purchase_price}</td>
                      <td className="px-6 py-4 text-blue-600 font-bold">{unit.selling_price}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-sm">{unit.barcode || '---'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {unit.is_default_purchase && (
                            <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-1 rounded-md font-bold">شراء</span>
                          )}
                          {unit.is_default_sale && (
                            <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-md font-bold">بيع</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assembly Components if applicable */}
          {product.product_type === 'assembly' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Layers size={18} className="text-blue-600" />
                  مكونات المنتج التجميعي
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.components?.map((comp, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 bg-gray-50/30">
                      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-gray-400 border border-gray-100">
                        <Package size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{comp.component_product_name}</p>
                        <p className="text-xs text-gray-500">الكمية: {comp.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {product.custom_field_values && product.custom_field_values.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Info size={18} className="text-blue-600" />
                  معلومات إضافية
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {product.custom_field_values.map((field, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-gray-50 pb-2">
                      <span className="text-gray-500 text-sm">{field.custom_field_name}</span>
                      <span className="font-bold text-gray-800">{field.value || '---'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
              <h3 className="font-bold text-gray-800">الوصف</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductView;
