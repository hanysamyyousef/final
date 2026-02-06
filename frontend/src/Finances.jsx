import React, { useEffect, useState } from 'react';
import api from './api';
import { 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Save,
  CheckCircle2,
  Clock,
  Building2,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const Finances = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [moneyTransfers, setMoneyTransfers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [safes, setSafes] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [bankFormData, setBankFormData] = useState({
    name: '',
    branch: '',
    account_number: '',
    iban: '',
    address: '',
    initial_balance: 0,
    account: ''
  });

  const [safeFormData, setSafeFormData] = useState({
    name: '',
    branch: '',
    initial_balance: 0,
    account: ''
  });

  const [expenseFormData, setExpenseFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '',
    safe: '',
    bank: '',
    payee: '',
    notes: '',
    reference_number: ''
  });

  const [incomeFormData, setIncomeFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '',
    safe: '',
    bank: '',
    payer: '',
    notes: '',
    reference_number: ''
  });

  const [safeTransactionFormData, setSafeTransactionFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    type: 'deposit', // 'deposit' or 'withdrawal'
    safe: '',
    bank: '',
    source_destination: '', // maps to source for deposit, destination for withdrawal
    notes: '',
    reference_number: ''
  });

  const [moneyTransferFormData, setMoneyTransferFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    from_safe: '',
    from_bank: '',
    to_safe: '',
    to_bank: '',
    notes: '',
    reference_number: ''
  });

  const [paymentSource, setPaymentSource] = useState('safe'); // 'safe' or 'bank'
  const [transferSourceType, setTransferSourceType] = useState('safe'); // 'safe' or 'bank'
  const [transferDestType, setTransferDestType] = useState('safe'); // 'safe' or 'bank'

  const handleOpenModal = (item = null) => {
    if (activeTab === 'banks') {
      if (item) {
        setEditingItem(item);
        setBankFormData({
          name: item.name,
          branch: item.branch,
          account_number: item.account_number || '',
          iban: item.iban || '',
          address: item.address || '',
          initial_balance: item.initial_balance,
          account: item.account || ''
        });
      } else {
        setEditingItem(null);
        setBankFormData({
          name: '',
          branch: branches[0]?.id || '',
          account_number: '',
          iban: '',
          address: '',
          initial_balance: 0,
          account: ''
        });
      }
    } else if (activeTab === 'safes') {
      if (item) {
        setEditingItem(item);
        setSafeFormData({
          name: item.name,
          branch: item.branch,
          initial_balance: item.initial_balance,
          account: item.account || ''
        });
      } else {
        setEditingItem(null);
        setSafeFormData({
          name: '',
          branch: branches[0]?.id || '',
          initial_balance: 0,
          account: ''
        });
      }
    } else if (activeTab === 'expenses') {
      if (item) {
        setEditingItem(item);
        setExpenseFormData({
          date: item.date.split('T')[0],
          amount: item.amount,
          category: item.category,
          safe: item.safe || '',
          bank: item.bank || '',
          payee: item.payee,
          notes: item.notes || '',
          reference_number: item.reference_number || ''
        });
        setPaymentSource(item.bank ? 'bank' : 'safe');
      } else {
        setEditingItem(null);
        setExpenseFormData({
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          category: '',
          safe: safes[0]?.id || '',
          bank: '',
          payee: '',
          notes: '',
          reference_number: ''
        });
        setPaymentSource('safe');
      }
    } else if (activeTab === 'income') {
      if (item) {
        setEditingItem(item);
        setIncomeFormData({
          date: item.date.split('T')[0],
          amount: item.amount,
          category: item.category,
          safe: item.safe || '',
          bank: item.bank || '',
          payer: item.payer,
          notes: item.notes || '',
          reference_number: item.reference_number || ''
        });
        setPaymentSource(item.bank ? 'bank' : 'safe');
      } else {
        setEditingItem(null);
        setIncomeFormData({
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          category: '',
          safe: safes[0]?.id || '',
          bank: '',
          payer: '',
          notes: '',
          reference_number: ''
        });
        setPaymentSource('safe');
      }
    } else if (activeTab === 'transactions') {
      if (item) {
        setEditingItem(item);
        setSafeTransactionFormData({
          date: item.date.split('T')[0],
          amount: item.amount,
          type: item.transaction_type === 'deposit' ? 'deposit' : 'withdrawal',
          safe: item.safe || '',
          bank: item.bank || '',
          source_destination: item.description || '',
          notes: item.notes || '',
          reference_number: item.reference_number || ''
        });
        setPaymentSource(item.bank ? 'bank' : 'safe');
      } else {
        setEditingItem(null);
        setSafeTransactionFormData({
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          type: 'deposit',
          safe: safes[0]?.id || '',
          bank: '',
          source_destination: '',
          notes: '',
          reference_number: ''
        });
        setPaymentSource('safe');
      }
    } else if (activeTab === 'money_transfers') {
      if (item) {
        setEditingItem(item);
        setMoneyTransferFormData({
          date: item.date.split('T')[0],
          amount: item.amount,
          from_safe: item.from_safe || '',
          from_bank: item.from_bank || '',
          to_safe: item.to_safe || '',
          to_bank: item.to_bank || '',
          notes: item.notes || '',
          reference_number: item.reference_number || ''
        });
        setTransferSourceType(item.from_bank ? 'bank' : 'safe');
        setTransferDestType(item.to_bank ? 'bank' : 'safe');
      } else {
        setEditingItem(null);
        setMoneyTransferFormData({
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          from_safe: safes[0]?.id || '',
          from_bank: '',
          to_safe: '',
          to_bank: '',
          notes: '',
          reference_number: ''
        });
        setTransferSourceType('safe');
        setTransferDestType('safe');
      }
    } else {
      setEditingItem(item);
    }
    setIsModalOpen(true);
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/core/api/banks/${editingItem.id}/`, bankFormData);
      } else {
        await api.post('/core/api/banks/', bankFormData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving bank:', err);
      alert('حدث خطأ أثناء حفظ بيانات البنك');
    }
  };

  const handleSafeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/core/api/safes/${editingItem.id}/`, safeFormData);
      } else {
        await api.post('/core/api/safes/', safeFormData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving safe:', err);
      alert('حدث خطأ أثناء حفظ بيانات الخزنة');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...expenseFormData };
      if (paymentSource === 'safe') data.bank = null;
      else data.safe = null;

      if (editingItem) {
        await api.put(`/finances/api/expenses/${editingItem.id}/`, data);
      } else {
        await api.post('/finances/api/expenses/', data);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('حدث خطأ أثناء حفظ المصروف');
    }
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...incomeFormData };
      if (paymentSource === 'safe') data.bank = null;
      else data.safe = null;

      if (editingItem) {
        await api.put(`/finances/api/incomes/${editingItem.id}/`, data);
      } else {
        await api.post('/finances/api/incomes/', data);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving income:', err);
      alert('حدث خطأ أثناء حفظ الإيراد');
    }
  };

  const handleSafeTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...safeTransactionFormData };
      if (paymentSource === 'safe') data.bank = null;
      else data.safe = null;

      // Handle source/destination mapping
      if (data.type === 'deposit') {
        data.source = data.source_destination;
      } else {
        data.destination = data.source_destination;
      }

      const endpoint = data.type === 'deposit' ? '/finances/api/safe-deposits/' : '/finances/api/safe-withdrawals/';
      
      if (editingItem) {
        // Find the original deposit/withdrawal ID if it was linked to this transaction
        // In this simplified version, we might need a more robust way to link them
        // For now, let's assume we are creating new ones or we have the ID
        const id = editingItem.id;
        // The backend should handle updating the corresponding deposit/withdrawal
        // Actually, SafeTransaction is read-only in many ways, we should update the source model
        // But if editingItem is a SafeTransaction, we need to know if it's a deposit or withdrawal
        
        // Check if editingItem has created_by_deposit or created_by_withdrawal
        let sourceEndpoint = '';
        let sourceId = null;
        
        if (editingItem.transaction_type === 'deposit') {
            sourceEndpoint = '/finances/api/safe-deposits/';
            // We need to fetch the deposit ID or have it in the transaction serializer
            // Let's assume the backend allows updating via the transaction ID or we fetch it
        } else if (editingItem.transaction_type === 'withdrawal') {
            sourceEndpoint = '/finances/api/safe-withdrawals/';
        }
        
        // For now, if editing, we'll try to find the source ID or just warn
        // Re-fetching might be needed. Let's simplify: if it's a manual transaction, 
        // we might not allow editing from here yet, or we'll need to update the serializers.
        // Let's just implement POST for now and see if we can handle PUT.
        
        if (editingItem.source_id) {
            await api.put(`${sourceEndpoint}${editingItem.source_id}/`, data);
        } else {
            alert('لا يمكن تعديل هذه العملية من هنا حالياً');
            return;
        }
      } else {
        await api.post(endpoint, data);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving safe transaction:', err);
      alert('حدث خطأ أثناء حفظ العملية');
    }
  };

  const handleMoneyTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...moneyTransferFormData };
      if (transferSourceType === 'safe') data.from_bank = null;
      else data.from_safe = null;
      
      if (transferDestType === 'safe') data.to_bank = null;
      else data.to_safe = null;

      if (editingItem) {
        await api.put(`/finances/api/money-transfers/${editingItem.id}/`, data);
      } else {
        await api.post('/finances/api/money-transfers/', data);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving money transfer:', err);
      alert('حدث خطأ أثناء حفظ التحويل');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch common data
      const [banksRes, safesRes, accountsRes, branchesRes, expCatRes, incCatRes] = await Promise.all([
        api.get('/api/banks/'),
        api.get('/api/safes/'),
        api.get('/accounting/api/accounts/'),
        api.get('/api/branches/'),
        api.get('/finances/api/expense-categories/'),
        api.get('/finances/api/income-categories/')
      ]);

      setBanks(banksRes.data);
      setSafes(safesRes.data);
      setAccounts(accountsRes.data);
      setBranches(branchesRes.data);
      setExpenseCategories(expCatRes.data);
      setIncomeCategories(incCatRes.data);

      let endpoint = '';
      if (activeTab === 'transactions') endpoint = '/finances/api/safe-transactions/';
      else if (activeTab === 'expenses') endpoint = '/finances/api/expenses/';
      else if (activeTab === 'income') endpoint = '/finances/api/incomes/';
      else if (activeTab === 'money_transfers') endpoint = '/finances/api/money-transfers/';
      else if (activeTab === 'banks' || activeTab === 'safes') {
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      const response = await api.get(endpoint);
      if (activeTab === 'money_transfers') setMoneyTransfers(response.data);
      else setTransactions(response.data);

    } catch (err) {
      console.error('Error fetching financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      try {
        let endpoint = '';
        if (activeTab === 'transactions') endpoint = `/finances/api/safe-transactions/${id}/`;
        else if (activeTab === 'expenses') endpoint = `/finances/api/expenses/${id}/`;
        else if (activeTab === 'income') endpoint = `/finances/api/incomes/${id}/`;
        else if (activeTab === 'money_transfers') endpoint = `/finances/api/money-transfers/${id}/`;
        else if (activeTab === 'banks') endpoint = `/core/api/banks/${id}/`;
        else if (activeTab === 'safes') endpoint = `/core/api/safes/${id}/`;
        
        await api.delete(endpoint);
        fetchData();
      } catch (err) {
        alert('خطأ في الحذف');
      }
    }
  };

  const filteredItems = (
    activeTab === 'banks' ? banks : 
    (activeTab === 'safes' ? safes : 
    (activeTab === 'money_transfers' ? moneyTransfers : transactions))
  ).filter(item => {
    const searchString = searchTerm.toLowerCase();
    if (activeTab === 'transactions') {
      return (item.description?.toLowerCase().includes(searchString) || 
              item.transaction_type_display?.toLowerCase().includes(searchString));
    }
    if (activeTab === 'money_transfers') {
      return (item.notes?.toLowerCase().includes(searchString) || 
              item.reference_number?.toLowerCase().includes(searchString) ||
              item.from_safe_name?.toLowerCase().includes(searchString) ||
              item.from_bank_name?.toLowerCase().includes(searchString) ||
              item.to_safe_name?.toLowerCase().includes(searchString) ||
              item.to_bank_name?.toLowerCase().includes(searchString));
    }
    if (activeTab === 'banks' || activeTab === 'safes') {
      return (item.name?.toLowerCase().includes(searchString) || 
              item.account_number?.toLowerCase().includes(searchString) ||
              item.iban?.toLowerCase().includes(searchString));
    }
    return item.description?.toLowerCase().includes(searchString);
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المالية والخزينة</h1>
          <p className="text-gray-500">إدارة المصروفات، الإيرادات وحركات الصناديق</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          <span>
            {activeTab === 'transactions' ? 'حركة مالية جديدة' : 
             activeTab === 'expenses' ? 'تسجيل مصروف' : 
             activeTab === 'banks' ? 'إضافة بنك جديد' : 
             activeTab === 'safes' ? 'إضافة خزنة جديدة' : 
             activeTab === 'money_transfers' ? 'تحويل أموال جديد' : 'تسجيل إيراد'}
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit overflow-x-auto max-w-full">
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'transactions' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          الحركات المالية
        </button>
        <button 
          onClick={() => setActiveTab('money_transfers')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'money_transfers' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          تحويلات الأموال
        </button>
        <button 
          onClick={() => setActiveTab('safes')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'safes' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          الخزن
        </button>
        <button 
          onClick={() => setActiveTab('banks')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'banks' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          البنوك
        </button>
        <button 
          onClick={() => setActiveTab('expenses')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          المصروفات
        </button>
        <button 
          onClick={() => setActiveTab('income')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'income' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          الإيرادات
        </button>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="بحث..."
            className="w-full pr-12 pl-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">إجمالي الداخل</div>
            <div className="text-lg font-black text-gray-900">
              {filteredItems
                .filter(i => activeTab === 'transactions' ? ['deposit', 'collection', 'income', 'sale_invoice'].includes(i.transaction_type) : activeTab === 'income')
                .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0)
                .toLocaleString()} ج.م
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <TrendingDown size={20} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">إجمالي الخارج</div>
            <div className="text-lg font-black text-gray-900">
              {filteredItems
                .filter(i => activeTab === 'transactions' ? ['withdrawal', 'payment', 'expense', 'purchase_invoice'].includes(i.transaction_type) : activeTab === 'expenses')
                .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0)
                .toLocaleString()} ج.م
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm">
              {activeTab === 'banks' || activeTab === 'safes' ? (
                <>
                  <th className="px-6 py-4 font-bold">{activeTab === 'banks' ? 'اسم البنك' : 'اسم الخزنة'}</th>
                  <th className="px-6 py-4 font-bold">{activeTab === 'banks' ? 'رقم الحساب / IBAN' : 'المسؤول'}</th>
                  <th className="px-6 py-4 font-bold">الفرع</th>
                  <th className="px-6 py-4 font-bold">الحساب المحاسبي</th>
                  <th className="px-6 py-4 font-bold">الرصيد الحالي</th>
                </>
              ) : activeTab === 'money_transfers' ? (
                <>
                  <th className="px-6 py-4 font-bold">التاريخ</th>
                  <th className="px-6 py-4 font-bold">من</th>
                  <th className="px-6 py-4 font-bold">إلى</th>
                  <th className="px-6 py-4 font-bold">المبلغ</th>
                  <th className="px-6 py-4 font-bold">رقم المرجع</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4 font-bold">التاريخ</th>
                  <th className="px-6 py-4 font-bold">البيان / الوصف</th>
                  {activeTab === 'transactions' && <th className="px-6 py-4 font-bold">نوع العملية</th>}
                  {(activeTab === 'expenses' || activeTab === 'income') && <th className="px-6 py-4 font-bold">القسم</th>}
                  <th className="px-6 py-4 font-bold">المبلغ</th>
                  {activeTab === 'transactions' && <th className="px-6 py-4 font-bold">الرصيد بعد</th>}
                </>
              )}
              <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                {activeTab === 'banks' || activeTab === 'safes' ? (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {activeTab === 'banks' ? <Building2 size={16} className="text-blue-600" /> : <Wallet size={16} className="text-blue-600" />}
                        <div className="text-sm font-bold text-gray-900">{item.name}</div>
                      </div>
                      {activeTab === 'banks' && <div className="text-[10px] text-gray-400 mr-6">{item.address}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {activeTab === 'banks' ? (
                        <>
                          <div className="text-sm text-gray-700 font-medium">{item.account_number || '---'}</div>
                          <div className="text-[10px] text-gray-400">{item.iban || '---'}</div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-700 font-medium">---</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.branch_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {accounts.find(a => a.id === item.account)?.name || 'غير مربوط'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-blue-600">
                        {parseFloat(item.current_balance).toLocaleString()} ج.م
                      </div>
                      <div className="text-[10px] text-gray-400">افتتاحي: {parseFloat(item.initial_balance).toLocaleString()}</div>
                    </td>
                  </>
                ) : activeTab === 'money_transfers' ? (
                  <>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(item.date).toLocaleDateString('ar-EG')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${item.from_bank ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                {item.from_bank ? <Building2 size={14} /> : <Wallet size={14} />}
                            </div>
                            <span className="text-sm font-bold text-gray-900">{item.from_bank_name || item.from_safe_name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${item.to_bank ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                {item.to_bank ? <Building2 size={14} /> : <Wallet size={14} />}
                            </div>
                            <span className="text-sm font-bold text-gray-900">{item.to_bank_name || item.to_safe_name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-gray-900">
                        {parseFloat(item.amount).toLocaleString()} ج.م
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-mono">{item.reference_number || '---'}</td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(item.date).toLocaleDateString('ar-EG')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{item.description || 'بدون بيان'}</div>
                      {item.safe_name && <div className="text-[10px] text-gray-400 font-medium">الخزينة: {item.safe_name}</div>}
                      {item.bank_name && <div className="text-[10px] text-blue-400 font-medium">البنك: {item.bank_name}</div>}
                    </td>
                    {activeTab === 'transactions' && (
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          ['deposit', 'collection', 'income', 'sale_invoice'].includes(item.transaction_type) 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-red-50 text-red-600'
                        }`}>
                          {['deposit', 'collection', 'income', 'sale_invoice'].includes(item.transaction_type) ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                          {item.transaction_type_display}
                        </span>
                      </td>
                    )}
                    {(activeTab === 'expenses' || activeTab === 'income') && (
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {item.category_name}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className={`text-sm font-black ${
                        activeTab === 'transactions' 
                        ? (['deposit', 'collection', 'income', 'sale_invoice'].includes(item.transaction_type) ? 'text-green-600' : 'text-red-600')
                        : (activeTab === 'income' ? 'text-green-600' : 'text-red-600')
                      }`}>
                        {parseFloat(item.amount).toLocaleString()} ج.م
                      </div>
                    </td>
                    {activeTab === 'transactions' && (
                      <td className="px-6 py-4 text-sm font-bold text-gray-700">
                        {parseFloat(item.balance_after).toLocaleString()} ج.م
                      </td>
                    )}
                  </>
                )}
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <Wallet size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">لا توجد حركات مسجلة</p>
          </div>
        )}
      </div>

      {/* Bank Modal */}
      {isModalOpen && activeTab === 'banks' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Building2 size={24} />
                {editingItem ? 'تعديل بيانات البنك' : 'إضافة بنك جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleBankSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">اسم البنك</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={bankFormData.name}
                    onChange={(e) => setBankFormData({...bankFormData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">الفرع</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={bankFormData.branch}
                    onChange={(e) => setBankFormData({...bankFormData, branch: e.target.value})}
                  >
                    <option value="">اختر الفرع</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">رقم الحساب</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-left"
                    dir="ltr"
                    value={bankFormData.account_number}
                    onChange={(e) => setBankFormData({...bankFormData, account_number: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">IBAN</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-left"
                    dir="ltr"
                    value={bankFormData.iban}
                    onChange={(e) => setBankFormData({...bankFormData, iban: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">الرصيد الافتتاحي</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    disabled={!!editingItem}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={bankFormData.initial_balance}
                    onChange={(e) => setBankFormData({...bankFormData, initial_balance: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">الحساب المحاسبي (دليل الحسابات)</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={bankFormData.account}
                    onChange={(e) => setBankFormData({...bankFormData, account: e.target.value})}
                  >
                    <option value="">اختر الحساب المحاسبي</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">العنوان / ملاحظات</label>
                <textarea 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  rows="2"
                  value={bankFormData.address}
                  onChange={(e) => setBankFormData({...bankFormData, address: e.target.value})}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  <span>حفظ البيانات</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Modal */}
      {isModalOpen && activeTab === 'safes' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Wallet size={24} />
                {editingItem ? 'تعديل بيانات الخزنة' : 'إضافة خزنة جديدة'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSafeSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase mr-2">اسم الخزنة</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={safeFormData.name}
                  onChange={(e) => setSafeFormData({...safeFormData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase mr-2">الفرع</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={safeFormData.branch}
                    onChange={(e) => setSafeFormData({...safeFormData, branch: e.target.value})}
                  >
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase mr-2">الرصيد الافتتاحي</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                    value={safeFormData.initial_balance}
                    onChange={(e) => setSafeFormData({...safeFormData, initial_balance: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase mr-2">ربط بحساب محاسبي</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={safeFormData.account}
                  onChange={(e) => setSafeFormData({...safeFormData, account: e.target.value})}
                >
                  <option value="">اختر حساباً...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
                >
                  {editingItem ? 'تحديث البيانات' : 'إضافة الخزنة'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isModalOpen && activeTab === 'expenses' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-red-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ArrowDownCircle size={24} />
                {editingItem ? 'تعديل مصروف' : 'تسجيل مصروف جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">تاريخ المصروف</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={expenseFormData.date}
                    onChange={(e) => setExpenseFormData({...expenseFormData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">المبلغ</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={expenseFormData.amount}
                    onChange={(e) => setExpenseFormData({...expenseFormData, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">القسم</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={expenseFormData.category}
                    onChange={(e) => setExpenseFormData({...expenseFormData, category: e.target.value})}
                  >
                    <option value="">اختر القسم</option>
                    {expenseCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">المستفيد</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={expenseFormData.payee}
                    onChange={(e) => setExpenseFormData({...expenseFormData, payee: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="paymentSource" 
                        checked={paymentSource === 'safe'} 
                        onChange={() => setPaymentSource('safe')}
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="text-sm font-bold text-gray-700">دفع من الخزينة</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="paymentSource" 
                        checked={paymentSource === 'bank'} 
                        onChange={() => setPaymentSource('bank')}
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="text-sm font-bold text-gray-700">دفع من البنك</span>
                    </label>
                  </div>

                  {paymentSource === 'safe' ? (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 mr-2">الخزينة</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        value={expenseFormData.safe}
                        onChange={(e) => setExpenseFormData({...expenseFormData, safe: e.target.value})}
                      >
                        <option value="">اختر الخزينة</option>
                        {safes.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 mr-2">البنك</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        value={expenseFormData.bank}
                        onChange={(e) => setExpenseFormData({...expenseFormData, bank: e.target.value})}
                      >
                        <option value="">اختر البنك</option>
                        {banks.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">رقم المرجع</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={expenseFormData.reference_number}
                    onChange={(e) => setExpenseFormData({...expenseFormData, reference_number: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">ملاحظات</label>
                <textarea 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  rows="2"
                  value={expenseFormData.notes}
                  onChange={(e) => setExpenseFormData({...expenseFormData, notes: e.target.value})}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  <span>حفظ المصروف</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Income Modal */}
      {isModalOpen && activeTab === 'income' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-green-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ArrowUpCircle size={24} />
                {editingItem ? 'تعديل إيراد' : 'تسجيل إيراد جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleIncomeSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">تاريخ الإيراد</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    value={incomeFormData.date}
                    onChange={(e) => setIncomeFormData({...incomeFormData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">المبلغ</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    value={incomeFormData.amount}
                    onChange={(e) => setIncomeFormData({...incomeFormData, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">القسم</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    value={incomeFormData.category}
                    onChange={(e) => setIncomeFormData({...incomeFormData, category: e.target.value})}
                  >
                    <option value="">اختر القسم</option>
                    {incomeCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">الدافع</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    value={incomeFormData.payer}
                    onChange={(e) => setIncomeFormData({...incomeFormData, payer: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="incomeSource" 
                        checked={paymentSource === 'safe'} 
                        onChange={() => setPaymentSource('safe')}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm font-bold text-gray-700">تحصيل في الخزينة</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="incomeSource" 
                        checked={paymentSource === 'bank'} 
                        onChange={() => setPaymentSource('bank')}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm font-bold text-gray-700">تحصيل في البنك</span>
                    </label>
                  </div>

                  {paymentSource === 'safe' ? (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 mr-2">الخزينة</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                        value={incomeFormData.safe}
                        onChange={(e) => setIncomeFormData({...incomeFormData, safe: e.target.value})}
                      >
                        <option value="">اختر الخزينة</option>
                        {safes.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 mr-2">البنك</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                        value={incomeFormData.bank}
                        onChange={(e) => setIncomeFormData({...incomeFormData, bank: e.target.value})}
                      >
                        <option value="">اختر البنك</option>
                        {banks.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">رقم المرجع</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    value={incomeFormData.reference_number}
                    onChange={(e) => setIncomeFormData({...incomeFormData, reference_number: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">ملاحظات</label>
                <textarea 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  rows="2"
                  value={incomeFormData.notes}
                  onChange={(e) => setIncomeFormData({...incomeFormData, notes: e.target.value})}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  <span>حفظ الإيراد</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Transaction Modal (Deposit/Withdrawal) */}
      {isModalOpen && activeTab === 'safe' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ArrowLeftRight size={24} />
                {editingItem ? 'تعديل عملية' : 'تسجيل عملية جديدة'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSafeTransactionSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex bg-gray-100 p-1 rounded-xl w-fit mb-2">
                    <button 
                        type="button"
                        onClick={() => setSafeTransactionFormData({...safeTransactionFormData, type: 'deposit'})}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${safeTransactionFormData.type === 'deposit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        إيداع
                    </button>
                    <button 
                        type="button"
                        onClick={() => setSafeTransactionFormData({...safeTransactionFormData, type: 'withdrawal'})}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${safeTransactionFormData.type === 'withdrawal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        سحب
                    </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">التاريخ</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={safeTransactionFormData.date}
                    onChange={(e) => setSafeTransactionFormData({...safeTransactionFormData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">المبلغ</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={safeTransactionFormData.amount}
                    onChange={(e) => setSafeTransactionFormData({...safeTransactionFormData, amount: e.target.value})}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">
                    {safeTransactionFormData.type === 'deposit' ? 'مصدر الإيداع' : 'جهة السحب'}
                  </label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={safeTransactionFormData.source_destination}
                    onChange={(e) => setSafeTransactionFormData({...safeTransactionFormData, source_destination: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="transSource" 
                        checked={paymentSource === 'safe'} 
                        onChange={() => setPaymentSource('safe')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-bold text-gray-700">الخزينة</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="transSource" 
                        checked={paymentSource === 'bank'} 
                        onChange={() => setPaymentSource('bank')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-bold text-gray-700">البنك</span>
                    </label>
                  </div>

                  {paymentSource === 'safe' ? (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 mr-2">اختر الخزينة</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={safeTransactionFormData.safe}
                        onChange={(e) => setSafeTransactionFormData({...safeTransactionFormData, safe: e.target.value})}
                      >
                        <option value="">اختر الخزينة</option>
                        {safes.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 mr-2">اختر البنك</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={safeTransactionFormData.bank}
                        onChange={(e) => setSafeTransactionFormData({...safeTransactionFormData, bank: e.target.value})}
                      >
                        <option value="">اختر البنك</option>
                        {banks.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">رقم المرجع</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={safeTransactionFormData.reference_number}
                    onChange={(e) => setSafeTransactionFormData({...safeTransactionFormData, reference_number: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">ملاحظات</label>
                <textarea 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  rows="2"
                  value={safeTransactionFormData.notes}
                  onChange={(e) => setSafeTransactionFormData({...safeTransactionFormData, notes: e.target.value})}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  <span>حفظ العملية</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Money Transfer Modal */}
      {isModalOpen && activeTab === 'money_transfers' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ArrowLeftRight size={24} />
                {editingItem ? 'تعديل تحويل' : 'تحويل أموال جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleMoneyTransferSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">تاريخ التحويل</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={moneyTransferFormData.date}
                    onChange={(e) => setMoneyTransferFormData({...moneyTransferFormData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">المبلغ المراد تحويله</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={moneyTransferFormData.amount}
                    onChange={(e) => setMoneyTransferFormData({...moneyTransferFormData, amount: e.target.value})}
                  />
                </div>

                {/* Source */}
                <div className="p-4 bg-red-50/30 rounded-2xl border border-red-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-red-600">من (المصدر)</span>
                    <div className="flex bg-white p-1 rounded-lg border border-red-100">
                      <button 
                        type="button"
                        onClick={() => setTransferSourceType('safe')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${transferSourceType === 'safe' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                      >خزينة</button>
                      <button 
                        type="button"
                        onClick={() => setTransferSourceType('bank')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${transferSourceType === 'bank' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                      >بنك</button>
                    </div>
                  </div>
                  {transferSourceType === 'safe' ? (
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-white border border-red-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      value={moneyTransferFormData.from_safe}
                      onChange={(e) => setMoneyTransferFormData({...moneyTransferFormData, from_safe: e.target.value})}
                    >
                      <option value="">اختر الخزينة</option>
                      {safes.map(s => <option key={s.id} value={s.id}>{s.name} ({parseFloat(s.current_balance).toLocaleString()} ج.م)</option>)}
                    </select>
                  ) : (
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-white border border-red-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      value={moneyTransferFormData.from_bank}
                      onChange={(e) => setMoneyTransferFormData({...moneyTransferFormData, from_bank: e.target.value})}
                    >
                      <option value="">اختر البنك</option>
                      {banks.map(b => <option key={b.id} value={b.id}>{b.name} ({parseFloat(b.current_balance).toLocaleString()} ج.م)</option>)}
                    </select>
                  )}
                </div>

                {/* Destination */}
                <div className="p-4 bg-green-50/30 rounded-2xl border border-green-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-green-600">إلى (الوجهة)</span>
                    <div className="flex bg-white p-1 rounded-lg border border-green-100">
                      <button 
                        type="button"
                        onClick={() => setTransferDestType('safe')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${transferDestType === 'safe' ? 'bg-green-600 text-white' : 'text-gray-400'}`}
                      >خزينة</button>
                      <button 
                        type="button"
                        onClick={() => setTransferDestType('bank')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${transferDestType === 'bank' ? 'bg-green-600 text-white' : 'text-gray-400'}`}
                      >بنك</button>
                    </div>
                  </div>
                  {transferDestType === 'safe' ? (
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-white border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      value={moneyTransferFormData.to_safe}
                      onChange={(e) => setMoneyTransferFormData({...moneyTransferFormData, to_safe: e.target.value})}
                    >
                      <option value="">اختر الخزينة</option>
                      {safes.map(s => <option key={s.id} value={s.id}>{s.name} ({parseFloat(s.current_balance).toLocaleString()} ج.م)</option>)}
                    </select>
                  ) : (
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-white border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      value={moneyTransferFormData.to_bank}
                      onChange={(e) => setMoneyTransferFormData({...moneyTransferFormData, to_bank: e.target.value})}
                    >
                      <option value="">اختر البنك</option>
                      {banks.map(b => <option key={b.id} value={b.id}>{b.name} ({parseFloat(b.current_balance).toLocaleString()} ج.م)</option>)}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">رقم المرجع</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={moneyTransferFormData.reference_number}
                    onChange={(e) => setMoneyTransferFormData({...moneyTransferFormData, reference_number: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 mr-2">ملاحظات</label>
                  <textarea 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    rows="1"
                    value={moneyTransferFormData.notes}
                    onChange={(e) => setMoneyTransferFormData({...moneyTransferFormData, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  <span>تأكيد التحويل</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
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

export default Finances;
