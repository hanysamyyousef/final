import React, { useEffect, useState } from 'react';
import api from './api';
import { 
  Plus, 
  Package, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MoreVertical,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  Tag,
  Warehouse,
  Barcode,
  Info
} from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products/api/products/'),
          api.get('/products/api/categories/')
        ]);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && products.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المنتجات</h1>
          <p className="text-gray-500">إدارة المخزون والمنتجات والأسعار</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition">
            <Filter size={18} />
            تصفية
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200">
            <Plus size={20} />
            منتج جديد
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="البحث عن منتج بالاسم أو الكود..."
            className="w-full pr-10 pl-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-50 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
          >
            <ListIcon size={20} />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition group">
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package size={64} strokeWidth={1} />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {product.is_active ? 'نشط' : 'متوقف'}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">{product.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Barcode size={12} />
                      {product.code || 'بدون كود'}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1">
                    <Tag size={10} />
                    {product.category_name || 'عام'}
                  </span>
                  <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1">
                    <Warehouse size={10} />
                    {product.default_store_name || 'بدون مخزن'}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">الرصيد الحالي</p>
                    <p className="text-lg font-black text-gray-900">{product.current_balance} <span className="text-xs text-gray-500 font-medium">قطعة</span></p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-bold text-gray-600 text-sm">المنتج</th>
                <th className="p-4 font-bold text-gray-600 text-sm">الكود</th>
                <th className="p-4 font-bold text-gray-600 text-sm">القسم</th>
                <th className="p-4 font-bold text-gray-600 text-sm">المخزن الافتراضي</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-center">الرصيد</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-center">الحالة</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-blue-50/30 transition group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        {product.image ? (
                          <img src={product.image} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package size={20} />
                        )}
                      </div>
                      <span className="font-bold text-gray-800">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{product.code || '-'}</td>
                  <td className="p-4">
                    <span className="text-sm bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium">
                      {product.category_name || 'عام'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{product.default_store_name || '-'}</td>
                  <td className="p-4 text-center">
                    <span className="font-black text-gray-900">{product.current_balance}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${product.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {product.is_active ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td className="p-4 text-left">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={16} /></button>
                      <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Products;
