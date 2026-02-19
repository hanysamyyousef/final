import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Package, 
  Tag, 
  Warehouse, 
  Barcode, 
  Info,
  ChevronRight,
  ChevronLeft,
  Percent,
  DollarSign,
  Briefcase,
  Layers,
  Search,
  Ruler,
  CheckCircle2,
  Eye,
  AlertTriangle
} from 'lucide-react';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState(null);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [stores, setStores] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // For assembly components
  const [customFields, setCustomFields] = useState([]); // All custom fields definitions

  const markDirty = () => setIsDirty(true);

  const initialFormState = {
    name: '',
    code: '',
    barcode: '',
    product_type: 'simple',
    category: '',
    default_store: '',
    initial_balance: 0,
    description: '',
    tax_type: 'percentage',
    tax_value: 0,
    is_active: true,
    image: null,
    imagePreview: null,
    units_data: [
      { 
        unit: '', 
        conversion_factor: 1, 
        purchase_price: 0, 
        selling_price: 0, 
        wholesale_price: 0,
        discount_type: 'percentage',
        purchase_discount: 0,
        selling_discount: 0,
        wholesale_discount: 0,
        unit_tax_type: '',
        unit_tax_value: 0,
        barcode: '', 
        is_default_purchase: true, 
        is_default_sale: true 
      }
    ],
    components_data: [],
    custom_fields_data: []
  };

  const [productForm, setProductForm] = useState(initialFormState);

  const resetForm = () => {
    setProductForm(initialFormState);
    // After resetting, we need to re-initialize custom fields with names from the definitions
    const customFieldsData = customFields.map(field => ({
      custom_field: field.id,
      name: field.name,
      value: ''
    }));
    setProductForm(prev => ({ ...prev, custom_fields_data: customFieldsData }));
  };

  const fetchData = async () => {
    try {
      const [categoriesRes, unitsRes, storesRes, productsRes, customFieldsRes] = await Promise.all([
        api.get('/products/api/categories/'),
        api.get('/products/api/units/'),
        api.get('/api/stores/'),
        api.get('/products/api/products/'),
        api.get('/products/api/custom-fields/')
      ]);
      setCategories(categoriesRes.data);
      setUnits(unitsRes.data);
      setStores(storesRes.data);
      setAllProducts(productsRes.data.filter(p => p.id !== parseInt(id)));
      setCustomFields(customFieldsRes.data);

      // Prepare custom fields data for new or existing product
      const existingValues = [];
      let productData = null;

      if (id) {
        setLoading(true);
        try {
          const productRes = await api.get(`/products/api/products/${id}/`);
          productData = productRes.data;
          if (productData && productData.custom_field_values) {
            existingValues.push(...productData.custom_field_values);
          }
        } catch (err) {
          console.error('Error fetching product details:', err);
          alert('حدث خطأ أثناء تحميل بيانات المنتج');
        }
      }

      // Only show active fields, or fields that already have a value
      const customFieldsData = customFieldsRes.data
        .filter(field => field.is_active || existingValues.some(v => v.custom_field === field.id))
        .map(field => {
          const found = existingValues.find(v => v.custom_field === field.id);
          return {
            custom_field: field.id,
            name: field.name,
            value: found ? found.value : ''
          };
        });

      if (id && productData) {
        setProductForm({
          ...productData,
          category: productData.category || '',
          default_store: productData.default_store || '',
          imagePreview: productData.image,
          units_data: productData.units.map(u => ({
            ...u,
            unit: u.unit,
            unit_tax_type: u.unit_tax_type || '',
            unit_tax_value: u.unit_tax_value || 0
          })),
          components_data: productData.components ? productData.components.map(c => ({
            component_product: c.component_product,
            quantity: c.quantity,
            component_purchase_price: c.component_purchase_price,
            component_selling_price: c.component_selling_price
          })) : [],
          custom_fields_data: customFieldsData
        });
        // Ensure dirty state is false after loading existing product
        setTimeout(() => setIsDirty(false), 0);
      } else {
        // Initialize custom fields for new product
        setProductForm(prev => ({
          ...prev,
          custom_fields_data: customFieldsData
        }));
        // Ensure dirty state is false after initializing new product
        setTimeout(() => setIsDirty(false), 0);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Handle browser back/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSafeCloseModal = (closeAction) => {
    if (isDirty) {
      setPendingCloseAction(() => closeAction);
      setShowExitConfirm(true);
    } else {
      closeAction();
    }
  };

  const confirmExit = () => {
    if (pendingCloseAction) {
      pendingCloseAction();
      setPendingCloseAction(null);
    }
    setShowExitConfirm(false);
    setIsDirty(false);
  };

  const handleFormChange = (updates) => {
    setProductForm(prev => ({ ...prev, ...updates }));
    markDirty();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFormChange({
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleCustomFieldChange = (fieldId, value) => {
    const newData = productForm.custom_fields_data.map(item => {
      if (item.custom_field === fieldId) {
        return { ...item, value };
      }
      return item;
    });
    handleFormChange({ custom_fields_data: newData });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Basic fields
      const simpleFields = ['name', 'code', 'barcode', 'product_type', 'category', 'default_store', 'initial_balance', 'description', 'tax_type', 'tax_value', 'is_active'];
      simpleFields.forEach(field => {
        let val = productForm[field];
        if (val === '' && (field === 'category' || field === 'default_store')) val = '';
        if (val !== null && val !== undefined) {
            formData.append(field, val);
        }
      });

      // JSON fields
      formData.append('units_data', JSON.stringify(productForm.units_data));
      formData.append('components_data', JSON.stringify(productForm.components_data));
      formData.append('custom_fields_data', JSON.stringify(productForm.custom_fields_data));

      // Image field
      if (productForm.image instanceof File) {
        formData.append('image', productForm.image);
      }

      // Validation for assembly
      if (productForm.product_type === 'assembly' && productForm.components_data.length === 0) {
        alert('يرجى إضافة مكونات للمنتج التجميعي');
        setLoading(false);
        return;
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      let response;
      if (id) {
        response = await api.patch(`/products/api/products/${id}/`, formData, config);
        setShowSuccess(true);
        setIsDirty(false);
        setTimeout(() => setShowSuccess(false), 3000);
        fetchData(); // Reload data to show changes
      } else {
        response = await api.post('/products/api/products/', formData, config);
        const newId = response.data.id;
        setShowSuccess(true);
        setIsDirty(false);
        setTimeout(() => {
          setShowSuccess(false);
          navigate(`/products/edit/${newId}`); // Redirect to edit page of the new product
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving product:', err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert('حدث خطأ أثناء حفظ المنتج: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUnitChange = (index, field, value) => {
    const newUnits = [...productForm.units_data];
    newUnits[index][field] = value;
    
    if (field === 'is_default_purchase' && value === true) {
      newUnits.forEach((u, i) => { if (i !== index) u.is_default_purchase = false; });
    }
    if (field === 'is_default_sale' && value === true) {
      newUnits.forEach((u, i) => { if (i !== index) u.is_default_sale = false; });
    }
    
    handleFormChange({ units_data: newUnits });
  };

  const addUnitRow = () => {
    handleFormChange({
      units_data: [...productForm.units_data, { 
        unit: '', 
        conversion_factor: 1, 
        purchase_price: 0, 
        selling_price: 0, 
        wholesale_price: 0,
        discount_type: 'percentage',
        purchase_discount: 0,
        selling_discount: 0,
        wholesale_discount: 0,
        barcode: '', 
        is_default_purchase: false, 
        is_default_sale: false 
      }]
    });
  };

  const removeUnitRow = (index) => {
    if (productForm.units_data.length === 1) return;
    const newUnits = productForm.units_data.filter((_, i) => i !== index);
    handleFormChange({ units_data: newUnits });
  };

  const addComponentRow = () => {
    handleFormChange({
      components_data: [...productForm.components_data, { component_product: '', quantity: 1 }]
    });
  };

  const removeComponentRow = (index) => {
    const newComponents = productForm.components_data.filter((_, i) => i !== index);
    handleFormChange({ components_data: newComponents });
  };

  const handleComponentChange = (index, field, value) => {
    const newComponents = [...productForm.components_data];
    newComponents[index][field] = value;
    
    // If product changed, update its prices in the local state
    if (field === 'component_product') {
      const selectedProd = allProducts.find(p => p.id === parseInt(value));
      if (selectedProd) {
        // Find default purchase price from its units
        const defaultUnit = selectedProd.units?.find(u => u.is_default_purchase) || selectedProd.units?.[0];
        newComponents[index].component_purchase_price = defaultUnit ? defaultUnit.purchase_price : 0;
        
        const defaultSaleUnit = selectedProd.units?.find(u => u.is_default_sale) || selectedProd.units?.[0];
        newComponents[index].component_selling_price = defaultSaleUnit ? defaultSaleUnit.selling_price : 0;
      }
    }
    
    handleFormChange({ components_data: newComponents });
  };

  const calculateTotalCost = () => {
    return productForm.components_data.reduce((sum, comp) => {
      return sum + (parseFloat(comp.component_purchase_price || 0) * parseFloat(comp.quantity || 0));
    }, 0);
  };

  const calculateTotalSelling = () => {
    return productForm.components_data.reduce((sum, comp) => {
      return sum + (parseFloat(comp.component_selling_price || 0) * parseFloat(comp.quantity || 0));
    }, 0);
  };

  if (loading && id) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-20 relative">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl shadow-emerald-200 flex items-center gap-3">
            <CheckCircle2 size={24} />
            <span className="font-bold">تم حفظ التعديلات بنجاح</span>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200 text-right">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 text-center">هل أنت متأكد من الخروج؟</h3>
            <p className="text-gray-500 font-medium mb-8 text-center">لديك تغييرات غير محفوظة، سيتم فقدانها إذا خرجت الآن.</p>
            <div className="flex gap-3">
              <button
                onClick={confirmExit}
                className="flex-1 bg-amber-500 text-white py-3 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
              >
                نعم، خروج
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                البقاء
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => handleSafeCloseModal(() => navigate('/products'))} className="text-blue-600 flex items-center gap-1 text-sm font-bold mb-2 hover:underline">
            <ChevronLeft size={16} />
            العودة للمنتجات
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {id ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {id && (
            <button
              onClick={() => handleSafeCloseModal(() => navigate(`/products/view/${id}`))}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition"
            >
              <Eye size={20} />
              عرض المنتج
            </button>
          )}
          <button 
            onClick={() => handleSafeCloseModal(() => navigate('/products'))}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition"
          >
            <X size={20} />
            إلغاء
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'جاري الحفظ...' : 'حفظ المنتج'}
          </button>
          {id && (
            <button
              onClick={() => handleSafeCloseModal(() => {
                resetForm();
                navigate('/products/add');
              })}
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
            >
              <Plus size={20} />
              إضافة جديد
            </button>
          )}
        </div>
      </div>

      <form className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center gap-2 text-blue-600 border-b border-gray-50 pb-4">
                <Info size={20} />
                <h2 className="font-bold text-lg">المعلومات الأساسية</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">اسم المنتج *</label>
                  <input 
                    type="text"
                    required
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={productForm.name}
                    onChange={(e) => handleFormChange({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">نوع المنتج</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={productForm.product_type}
                    onChange={(e) => handleFormChange({ product_type: e.target.value })}
                  >
                    <option value="simple">منتج بسيط</option>
                    <option value="service">خدمة</option>
                    <option value="assembly">منتج تجميعي (باقة)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">كود المنتج</label>
                  <input 
                    type="text"
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={productForm.code}
                    onChange={(e) => handleFormChange({ code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">القسم</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={productForm.category}
                    onChange={(e) => handleFormChange({ category: e.target.value })}
                  >
                    <option value="">اختر القسم...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Custom Fields Section */}
            {productForm.custom_fields_data.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-2 text-purple-600 border-b border-gray-50 pb-4">
                  <Tag size={20} />
                  <h2 className="font-bold text-lg">الحقول المخصصة</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {productForm.custom_fields_data.map((field) => (
                    <div key={field.custom_field} className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">{field.name}</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                        value={field.value}
                        onChange={(e) => handleCustomFieldChange(field.custom_field, e.target.value)}
                        placeholder={`أدخل ${field.name}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Image and Status */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center gap-2 text-blue-600 border-b border-gray-50 pb-4">
                <Package size={20} />
                <h2 className="font-bold text-lg">صورة المنتج</h2>
              </div>
              
              <div className="space-y-4">
                <div className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                  {productForm.imagePreview ? (
                    <>
                      <img src={productForm.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button 
                          type="button"
                          onClick={() => handleFormChange({ image: null, imagePreview: null })}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <Package size={48} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-xs text-gray-500">اسحب صورة هنا أو اضغط للرفع</p>
                    </div>
                  )}
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-gray-400 text-center">يدعم JPG, PNG. بحد أقصى 2 ميجابايت.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-700">حالة المنتج</label>
                <button 
                  type="button"
                  onClick={() => handleFormChange({ is_active: !productForm.is_active })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${productForm.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${productForm.is_active ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div className="pt-4 border-t border-gray-50 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">المخزن الافتراضي</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={productForm.default_store}
                    onChange={(e) => handleFormChange({ default_store: e.target.value })}
                  >
                    <option value="">اختر المخزن...</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">الرصيد الافتتاحي</label>
                  <input 
                    type="number"
                    disabled={productForm.product_type === 'service'}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
                    value={productForm.initial_balance}
                    onChange={(e) => handleFormChange({ initial_balance: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
             <div className="space-y-4">
               <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                 <Percent size={16} className="text-blue-500" />
                 إعدادات الضريبة العامة للمنتج
               </h3>
               <div className="grid grid-cols-2 gap-4">
                 <select 
                   className="p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                   value={productForm.tax_type}
                   onChange={(e) => handleFormChange({ tax_type: e.target.value })}
                 >
                   <option value="percentage">نسبة (%)</option>
                   <option value="value">قيمة ثابتة</option>
                 </select>
                 <input 
                   type="number"
                   placeholder="قيمة الضريبة"
                   className="p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                   value={productForm.tax_value}
                   onChange={(e) => handleFormChange({ tax_value: parseFloat(e.target.value) })}
                 />
               </div>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">الوصف</label>
                <textarea 
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition h-24 resize-none"
                  value={productForm.description}
                  onChange={(e) => handleFormChange({ description: e.target.value })}
                />
             </div>
          </div>

        {/* Units Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Ruler size={20} />
              <h2 className="font-bold text-lg">وحدات القياس والأسعار</h2>
            </div>
            <button 
              type="button"
              onClick={addUnitRow}
              className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
            >
              <Plus size={16} />
              إضافة وحدة
            </button>
          </div>

          <div className="space-y-4 overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[1000px]">
              <thead>
                <tr className="text-xs text-gray-400 font-bold border-b border-gray-50">
                  <th className="p-3">الوحدة</th>
                  <th className="p-3">معامل التحويل</th>
                  <th className="p-3">سعر الشراء</th>
                  <th className="p-3">مستهلك</th>
                  <th className="p-3">جملة</th>
                  <th className="p-3">الخصم (شراء/بيع/جملة)</th>
                  <th className="p-3">الضريبة</th>
                  <th className="p-3 text-center">افتراضي</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {productForm.units_data.map((unit, index) => (
                  <tr key={index} className="group hover:bg-gray-50/50 transition">
                    <td className="p-3">
                      <select 
                        required
                        className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={unit.unit}
                        onChange={(e) => handleUnitChange(index, 'unit', e.target.value)}
                      >
                        <option value="">الوحدة...</option>
                        {units.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <input 
                        type="number"
                        className="w-20 p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={unit.conversion_factor}
                        onChange={(e) => handleUnitChange(index, 'conversion_factor', parseFloat(e.target.value))}
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number"
                        className="w-24 p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        value={unit.purchase_price}
                        onChange={(e) => handleUnitChange(index, 'purchase_price', parseFloat(e.target.value))}
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number"
                        className="w-24 p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-green-600"
                        value={unit.selling_price}
                        onChange={(e) => handleUnitChange(index, 'selling_price', parseFloat(e.target.value))}
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number"
                        className="w-24 p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-amber-600"
                        value={unit.wholesale_price}
                        onChange={(e) => handleUnitChange(index, 'wholesale_price', parseFloat(e.target.value))}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <select 
                          className="text-[10px] p-1 bg-white border border-gray-100 rounded mb-1"
                          value={unit.discount_type}
                          onChange={(e) => handleUnitChange(index, 'discount_type', e.target.value)}
                        >
                          <option value="percentage">%</option>
                          <option value="value">قيمة</option>
                        </select>
                        <div className="flex gap-1">
                          <input type="number" title="خصم الشراء" className="w-12 p-1 bg-gray-100 rounded text-[10px]" value={unit.purchase_discount} onChange={(e) => handleUnitChange(index, 'purchase_discount', parseFloat(e.target.value))} />
                          <input type="number" title="خصم المستهلك" className="w-12 p-1 bg-green-50 rounded text-[10px]" value={unit.selling_discount} onChange={(e) => handleUnitChange(index, 'selling_discount', parseFloat(e.target.value))} />
                          <input type="number" title="خصم الجملة" className="w-12 p-1 bg-amber-50 rounded text-[10px]" value={unit.wholesale_discount} onChange={(e) => handleUnitChange(index, 'wholesale_discount', parseFloat(e.target.value))} />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <select 
                          className="text-[10px] p-1 bg-white border border-gray-100 rounded"
                          value={unit.unit_tax_type}
                          onChange={(e) => handleUnitChange(index, 'unit_tax_type', e.target.value)}
                        >
                          <option value="">عام</option>
                          <option value="percentage">%</option>
                          <option value="value">قيمة</option>
                        </select>
                        {unit.unit_tax_type && (
                          <input 
                            type="number" 
                            className="w-full p-1 bg-blue-50 rounded text-[10px]" 
                            value={unit.unit_tax_value} 
                            onChange={(e) => handleUnitChange(index, 'unit_tax_value', parseFloat(e.target.value))} 
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-2 items-center">
                        <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                          <input type="checkbox" checked={unit.is_default_purchase} onChange={(e) => handleUnitChange(index, 'is_default_purchase', e.target.checked)} />
                          شراء
                        </label>
                        <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                          <input type="checkbox" checked={unit.is_default_sale} onChange={(e) => handleUnitChange(index, 'is_default_sale', e.target.checked)} />
                          بيع
                        </label>
                      </div>
                    </td>
                    <td className="p-3">
                      <button 
                        type="button"
                        onClick={() => removeUnitRow(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assembly Components Section */}
        {productForm.product_type === 'assembly' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Layers size={20} />
                <h2 className="font-bold text-lg">مكونات المنتج التجميعي</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-400 font-bold">إجمالي تكلفة المكونات</span>
                  <span className="text-sm font-black text-red-600">{calculateTotalCost().toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end border-r border-gray-100 pr-4">
                  <span className="text-[10px] text-gray-400 font-bold">إجمالي سعر بيع المكونات</span>
                  <span className="text-sm font-black text-green-600">{calculateTotalSelling().toLocaleString()}</span>
                </div>
                <button 
                  type="button"
                  onClick={addComponentRow}
                  className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                >
                  <Plus size={16} />
                  إضافة مكون
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productForm.components_data.map((comp, index) => (
                <div key={index} className="flex gap-3 p-4 bg-gray-50 rounded-2xl items-end group relative">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold text-gray-500">المنتج المكون</label>
                    <select 
                      required
                      className="w-full p-2.5 bg-white border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={comp.component_product}
                      onChange={(e) => handleComponentChange(index, 'component_product', e.target.value)}
                    >
                      <option value="">اختر منتجاً...</option>
                      {allProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24 space-y-2">
                    <label className="text-xs font-bold text-gray-500">الكمية</label>
                    <input 
                      type="number"
                      required
                      className="w-full p-2.5 bg-white border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={comp.quantity}
                      onChange={(e) => handleComponentChange(index, 'quantity', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <label className="text-xs font-bold text-gray-500">التكلفة</label>
                    <div className="p-2.5 bg-white border border-gray-100 rounded-xl text-sm text-red-600 font-bold text-center">
                      {(parseFloat(comp.component_purchase_price || 0) * parseFloat(comp.quantity || 0)).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeComponentRow(index)}
                    className="p-2.5 text-red-400 hover:text-red-600 hover:bg-white rounded-xl transition"
                  >
                    <Trash2 size={20} />
                  </button>
                  {comp.component_purchase_price > 0 && (
                    <div className="absolute top-2 left-4 flex gap-2">
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">
                        شراء: {comp.component_purchase_price}
                      </span>
                      <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold">
                        بيع: {comp.component_selling_price}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {productForm.components_data.length === 0 && (
                <div className="col-span-full py-10 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <Layers size={48} strokeWidth={1} className="mb-2" />
                  <p className="font-bold">لم يتم إضافة مكونات بعد</p>
                  <p className="text-xs">اضغط على زر "إضافة مكون" للبدء في تجميع الباقة</p>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProductForm;