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
  Info,
  X,
  Save,
  Ruler
} from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'units'

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    code: '',
    barcode: '',
    category: '',
    default_store: '',
    initial_balance: 0,
    description: '',
    is_active: true,
    units_data: [{ unit: '', conversion_factor: 1, purchase_price: 0, selling_price: 0, barcode: '', is_default_purchase: true, is_default_sale: true }]
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    parent: '',
    description: ''
  });

  const [unitForm, setUnitForm] = useState({
    name: '',
    symbol: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, unitsRes, storesRes] = await Promise.all([
        api.get('/products/api/products/'),
        api.get('/products/api/categories/'),
        api.get('/products/api/units/'),
        api.get('/api/stores/')
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setUnits(unitsRes.data);
      setStores(storesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...productForm };
      if (data.category === '') data.category = null;
      if (data.default_store === '') data.default_store = null;
      
      // Filter out empty units if any
      data.units_data = data.units_data.filter(u => u.unit !== '');

      if (editingItem) {
        await api.patch(`/products/api/products/${editingItem.id}/`, data);
      } else {
        await api.post('/products/api/products/', data);
      }
      setIsProductModalOpen(false);
      setEditingItem(null);
      setProductForm({ name: '', code: '', barcode: '', category: '', default_store: '', initial_balance: 0, description: '', is_active: true, units_data: [{ unit: '', conversion_factor: 1, purchase_price: 0, selling_price: 0, barcode: '', is_default_purchase: true, is_default_sale: true }] });
      fetchData();
    } catch (err) {
      console.error('Error saving product:', err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert('حدث خطأ أثناء حفظ المنتج: ' + errorMsg);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...categoryForm };
      if (data.parent === '') data.parent = null;

      if (editingItem) {
        await api.patch(`/products/api/categories/${editingItem.id}/`, data);
      } else {
        await api.post('/products/api/categories/', data);
      }
      setIsCategoryModalOpen(false);
      setEditingItem(null);
      setCategoryForm({ name: '', parent: '', description: '' });
      fetchData();
    } catch (err) {
      console.error('Error saving category:', err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert('حدث خطأ أثناء حفظ القسم: ' + errorMsg);
    }
  };

  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.patch(`/products/api/units/${editingItem.id}/`, unitForm);
      } else {
        await api.post('/products/api/units/', unitForm);
      }
      setIsUnitModalOpen(false);
      setEditingItem(null);
      setUnitForm({ name: '', symbol: '' });
      fetchData();
    } catch (err) {
      console.error('Error saving unit:', err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert('حدث خطأ أثناء حفظ الوحدة: ' + errorMsg);
    }
  };

  const handleUnitChange = (index, field, value) => {
     const newUnits = [...productForm.units_data];
     
     // Check for duplicate units
     if (field === 'unit' && value !== '') {
       const isDuplicate = newUnits.some((u, i) => i !== index && u.unit === value);
       if (isDuplicate) {
         alert('هذه الوحدة مضافة بالفعل للمنتج');
         return;
       }
     }

     newUnits[index][field] = value;
    
    // If setting as default purchase, uncheck others
    if (field === 'is_default_purchase' && value === true) {
      newUnits.forEach((u, i) => {
        if (i !== index) u.is_default_purchase = false;
      });
    }
    
    // If setting as default sale, uncheck others
    if (field === 'is_default_sale' && value === true) {
      newUnits.forEach((u, i) => {
        if (i !== index) u.is_default_sale = false;
      });
    }
    
    setProductForm({ ...productForm, units_data: newUnits });
  };

  const addUnitRow = () => {
    setProductForm({
      ...productForm,
      units_data: [...productForm.units_data, { unit: '', conversion_factor: 1, purchase_price: 0, selling_price: 0, barcode: '', is_default_purchase: false, is_default_sale: false }]
    });
  };

  const removeUnitRow = (index) => {
    if (productForm.units_data.length === 1) return;
    const newUnits = productForm.units_data.filter((_, i) => i !== index);
    setProductForm({ ...productForm, units_data: newUnits });
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('هل أنت متأكد من عملية الحذف؟')) return;
    try {
      let endpoint = '';
      if (type === 'product') endpoint = `/products/api/products/${id}/`;
      if (type === 'category') endpoint = `/products/api/categories/${id}/`;
      if (type === 'unit') endpoint = `/products/api/units/${id}/`;
      
      await api.delete(endpoint);
      fetchData();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const openEditModal = (type, item) => {
    setEditingItem(item);
    if (type === 'product') {
      setProductForm({
        name: item.name,
        code: item.code || '',
        barcode: item.barcode || '',
        category: item.category || '',
        default_store: item.default_store || '',
        initial_balance: item.initial_balance || 0,
        description: item.description || '',
        is_active: item.is_active,
        units_data: item.units && item.units.length > 0 ? item.units.map(u => ({
          unit: u.unit,
          conversion_factor: u.conversion_factor,
          purchase_price: u.purchase_price,
          selling_price: u.selling_price,
          barcode: u.barcode || '',
          is_default_purchase: u.is_default_purchase,
          is_default_sale: u.is_default_sale
        })) : [{ unit: '', conversion_factor: 1, purchase_price: 0, selling_price: 0, barcode: '', is_default_purchase: true, is_default_sale: true }]
      });
      setIsProductModalOpen(true);
    } else if (type === 'category') {
      setCategoryForm({
        name: item.name,
        parent: item.parent || '',
        description: item.description || ''
      });
      setIsCategoryModalOpen(true);
    } else if (type === 'unit') {
      setUnitForm({
        name: item.name,
        symbol: item.symbol || ''
      });
      setIsUnitModalOpen(true);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.symbol.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-800">المنتجات والمخزون</h1>
          <p className="text-gray-500">إدارة المنتجات، الأقسام، ووحدات القياس</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition">
            <Filter size={18} />
            تصفية
          </button>
          <button 
            onClick={() => {
              setEditingItem(null);
              if (activeTab === 'products') {
                setProductForm({ name: '', code: '', barcode: '', category: '', default_store: '', initial_balance: 0, description: '', is_active: true, units_data: [{ unit: '', conversion_factor: 1, purchase_price: 0, selling_price: 0, barcode: '', is_default_purchase: true, is_default_sale: true }] });
                setIsProductModalOpen(true);
              } else if (activeTab === 'categories') {
                setCategoryForm({ name: '', parent: '', description: '' });
                setIsCategoryModalOpen(true);
              } else if (activeTab === 'units') {
                setUnitForm({ name: '', symbol: '' });
                setIsUnitModalOpen(true);
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            {activeTab === 'products' ? 'منتج جديد' : activeTab === 'categories' ? 'قسم جديد' : 'وحدة جديدة'}
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-100 pb-px">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 'products' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          المنتجات ({products.length})
          {activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 'categories' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          الأقسام ({categories.length})
          {activeTab === 'categories' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 'units' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          وحدات القياس ({units.length})
          {activeTab === 'units' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder={
              activeTab === 'products' ? "البحث عن منتج بالاسم أو الكود..." :
              activeTab === 'categories' ? "البحث عن قسم..." : "البحث عن وحدة قياس..."
            }
            className="w-full pr-10 pl-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {activeTab === 'products' && (
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
        )}
      </div>

      {activeTab === 'products' ? (
        viewMode === 'grid' ? (
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
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal('product', product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete('product', product.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
                      <p className="text-lg font-black text-gray-900">
                        {product.current_balance}{' '}
                        <span className="text-xs text-gray-500 font-medium">
                          {product.units?.find(u => u.is_default_sale)?.unit_name || 'قطعة'}
                        </span>
                      </p>
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
                        <button 
                          onClick={() => openEditModal('product', product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete('product', product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === 'categories' ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-bold text-gray-600 text-sm">اسم القسم</th>
                <th className="p-4 font-bold text-gray-600 text-sm">القسم الرئيسي</th>
                <th className="p-4 font-bold text-gray-600 text-sm">الوصف</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-blue-50/30 transition group">
                  <td className="p-4 font-bold text-gray-800">{cat.name}</td>
                  <td className="p-4 text-sm text-gray-500">{cat.parent_name || '-'}</td>
                  <td className="p-4 text-sm text-gray-600">{cat.description || '-'}</td>
                  <td className="p-4 text-left">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal('category', cat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete('category', cat.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-bold text-gray-600 text-sm">اسم الوحدة</th>
                <th className="p-4 font-bold text-gray-600 text-sm">الرمز</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-blue-50/30 transition group">
                  <td className="p-4 font-bold text-gray-800">{unit.name}</td>
                  <td className="p-4 text-sm text-gray-500">{unit.symbol}</td>
                  <td className="p-4 text-left">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal('unit', unit)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete('unit', unit.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{editingItem ? 'تعديل منتج' : 'إضافة منتج جديد'}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كود المنتج</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={productForm.code}
                  onChange={(e) => setProductForm({...productForm, code: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الباركود</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={productForm.barcode}
                  onChange={(e) => setProductForm({...productForm, barcode: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={productForm.category}
                  onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                >
                  <option value="">اختر القسم</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المخزن الافتراضي</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={productForm.default_store}
                  onChange={(e) => setProductForm({...productForm, default_store: e.target.value})}
                >
                  <option value="">اختر المخزن</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرصيد الافتتاحي</label>
                <input
                  type="number"
                  step="0.001"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={productForm.initial_balance}
                  onChange={(e) => setProductForm({...productForm, initial_balance: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Ruler size={20} className="text-blue-600" />
                    وحدات القياس والتسعير
                  </h3>
                  <button 
                    type="button"
                    onClick={addUnitRow}
                    className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold hover:bg-blue-100 transition flex items-center gap-1"
                  >
                    <Plus size={16} />
                    إضافة وحدة
                  </button>
                </div>
                
                <div className="space-y-4">
                  {productForm.units_data.map((unitData, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative group/row">
                      {productForm.units_data.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeUnitRow(index)}
                          className="absolute -left-2 -top-2 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition shadow-sm hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">الوحدة *</label>
                          <select
                            required
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                            value={unitData.unit}
                            onChange={(e) => handleUnitChange(index, 'unit', e.target.value)}
                          >
                            <option value="">اختر الوحدة</option>
                            {units.map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">معامل التحويل</label>
                          <input
                            type="number"
                            step="0.001"
                            required
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                            value={unitData.conversion_factor}
                            onChange={(e) => handleUnitChange(index, 'conversion_factor', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">سعر الشراء</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                            value={unitData.purchase_price}
                            onChange={(e) => handleUnitChange(index, 'purchase_price', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">سعر البيع</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                            value={unitData.selling_price}
                            onChange={(e) => handleUnitChange(index, 'selling_price', e.target.value)}
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">باركود الوحدة</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                            value={unitData.barcode}
                            onChange={(e) => handleUnitChange(index, 'barcode', e.target.value)}
                          />
                        </div>

                        <div className="flex flex-col justify-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              checked={unitData.is_default_purchase}
                              onChange={(e) => handleUnitChange(index, 'is_default_purchase', e.target.checked)}
                            />
                            <span className="text-[10px] font-bold text-gray-500 group-hover:text-blue-600 transition">شراء افتراضي</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              checked={unitData.is_default_sale}
                              onChange={(e) => handleUnitChange(index, 'is_default_sale', e.target.checked)}
                            />
                            <span className="text-[10px] font-bold text-gray-500 group-hover:text-blue-600 transition">بيع افتراضي</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition h-20"
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={productForm.is_active}
                  onChange={(e) => setProductForm({...productForm, is_active: e.target.checked})}
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">منتج نشط</label>
              </div>
              <div className="md:col-span-2 flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <Save size={20} />
                  {editingItem ? 'تحديث المنتج' : 'حفظ المنتج'}
                </button>
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{editingItem ? 'تعديل قسم' : 'إضافة قسم جديد'}</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم القسم *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القسم الرئيسي</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={categoryForm.parent}
                  onChange={(e) => setCategoryForm({...categoryForm, parent: e.target.value})}
                >
                  <option value="">لا يوجد (قسم رئيسي)</option>
                  {categories.filter(c => c.id !== editingItem?.id).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition h-20"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <Save size={20} />
                  {editingItem ? 'تحديث القسم' : 'حفظ القسم'}
                </button>
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unit Modal */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsUnitModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{editingItem ? 'تعديل وحدة' : 'إضافة وحدة جديدة'}</h2>
              <button onClick={() => setIsUnitModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUnitSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الوحدة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قطعة، كجم، متر"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({...unitForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرمز *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: pcs, kg, m"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={unitForm.symbol}
                  onChange={(e) => setUnitForm({...unitForm, symbol: e.target.value})}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <Save size={20} />
                  {editingItem ? 'تحديث الوحدة' : 'حفظ الوحدة'}
                </button>
                <button type="button" onClick={() => setIsUnitModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
