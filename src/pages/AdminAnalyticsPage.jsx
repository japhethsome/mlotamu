import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';
import {
  DollarSign, ShoppingBag, Users, TrendingUp, Plus, Search, Shield, Download,
  CheckCircle2, AlertTriangle, Edit, X, RefreshCw, Sliders, FileText, Utensils,
  ChevronDown, ChefHat, ClipboardList, QrCode, ChevronRight, Activity, Layers,
  Filter, ArrowUpRight, Star, BarChart2, Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../lib/api.js';
import { getRealisticFoodImage } from '../lib/foodImages.js';

const CATEGORY_COLORS = { breakfast: '#f59e0b', lunch: '#ef4444', dinner: '#8b5cf6', supper: '#6366f1' };
const STATUS_COLORS = {
  pending:   { bg: 'bg-amber-100 dark:bg-amber-950',    text: 'text-amber-800 dark:text-amber-300',    dot: 'bg-amber-500'    },
  preparing: { bg: 'bg-blue-100 dark:bg-blue-950',      text: 'text-blue-800 dark:text-blue-300',      dot: 'bg-blue-500'     },
  ready:     { bg: 'bg-emerald-100 dark:bg-emerald-950',text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500'  },
  collected: { bg: 'bg-slate-100 dark:bg-slate-800',    text: 'text-slate-600 dark:text-slate-400',    dot: 'bg-slate-400'    },
  cancelled: { bg: 'bg-rose-100 dark:bg-rose-950',      text: 'text-rose-700 dark:text-rose-300',      dot: 'bg-rose-500'     },
};

function useAnimatedCount(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0; const step = target / (duration / 16);
    const timer = setInterval(() => { start += step; if (start >= target) { setCount(target); clearInterval(timer); } else setCount(Math.floor(start)); }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function Dropdown({ label, icon: Icon, options, value, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = options.find((o) => o.value === value);
  return (
    <div className={'relative ' + className} ref={ref}>
      <button type='button' onClick={() => setOpen((p) => !p)}
        className='flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:border-savori-orange/50 transition-all min-w-[130px]'>
        {Icon && <Icon size={13} className='text-slate-400' />}
        <span className='flex-1 text-left truncate'>{selected?.label || label}</span>
        <ChevronDown size={12} className={'transition-transform shrink-0 ' + (open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className='absolute z-50 mt-1.5 w-full min-w-[170px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden'>
          {options.map((opt) => (
            <button key={opt.value} type='button' onClick={() => { onChange(opt.value); setOpen(false); }}
              className={'w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center gap-2 ' + (value === opt.value ? 'bg-savori-orange/10 text-savori-orange' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800')}>
              {opt.dot && <span className={'h-2 w-2 rounded-full ' + opt.dot} />}
              {opt.label}
              {value === opt.value && <CheckCircle2 size={12} className='ml-auto text-savori-orange' />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, iconBg, trend, sub, prefix = '', animated = false }) {
  const animVal = useAnimatedCount(animated ? Number(value) : 0);
  const display = animated ? animVal : value;
  return (
    <div className='card-surface group p-5 border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative'>
      <div className='absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/30 dark:to-slate-800/30 opacity-0 group-hover:opacity-100 transition-opacity' />
      <div className='flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-3'>
        <span>{label}</span>
        <div className={'flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ' + iconBg}><Icon size={16} /></div>
      </div>
      <h3 className='text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums'>
        {prefix}{typeof display === 'number' ? display.toLocaleString() : display}
      </h3>
      {sub && (
        <p className={'mt-1.5 text-xs font-semibold flex items-center gap-1 ' + (trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500')}>
          {trend === 'up' && <ArrowUpRight size={12} />}{sub}
        </p>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState({ sales: [], bestSelling: [], byMeal: [], totals: {} });
  const [inventory, setInventory] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState({ priceLogs: [], auditLogs: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSortFilter, setOrderSortFilter] = useState('newest');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [newMealForm, setNewMealForm] = useState({ name: '', description: '', price: '', category: 'breakfast', stockQuantity: '30', image: '', startTime: '06:00', endTime: '09:00' });
  const [editingMeal, setEditingMeal] = useState(null);
  const [editPriceForm, setEditPriceForm] = useState({ price: '', reason: '' });

  const showNotification = (msg, type = 'success') => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3500); };

  const fetchAllData = async () => {
    if (!token) return;
    try {
      setRefreshing(true);
      const [analyticsData, inventoryData, usersData, ordersData, auditData] = await Promise.all([
        apiRequest('/admin/analytics', {}, token).catch(() => ({ sales: [], bestSelling: [], byMeal: [], totals: {} })),
        apiRequest('/admin/inventory', {}, token).catch(() => []),
        apiRequest('/admin/users', {}, token).catch(() => []),
        apiRequest('/admin/orders', {}, token).catch(() => []),
        apiRequest('/admin/audit-logs', {}, token).catch(() => ({ priceLogs: [], auditLogs: [] })),
      ]);
      setAnalytics(analyticsData); setInventory(inventoryData || []); setUsers(usersData || []);
      setOrders(ordersData || []); setAuditLogs(auditData || { priceLogs: [], auditLogs: [] });
    } catch (err) { console.error('Admin fetch error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchAllData(); }, [token]);

  const handleChangeRole = async (userId, newRole) => {
    try {
      await apiRequest('/admin/users/' + userId + '/role', { method: 'PATCH', body: JSON.stringify({ role: newRole }) }, token);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      showNotification('User role updated to ' + newRole);
    } catch (err) { showNotification(err.message || 'Failed to update role.', 'error'); }
  };

  const handleToggleMeal = async (meal) => {
    const nextState = !meal.is_available;
    try {
      await apiRequest('/menu/' + meal.id + '/availability', { method: 'PATCH', body: JSON.stringify({ isAvailable: nextState }) }, token);
      setInventory((prev) => prev.map((m) => m.id === meal.id ? { ...m, is_available: nextState ? 1 : 0 } : m));
      showNotification(meal.name + ' is now ' + (nextState ? 'available' : 'unavailable'));
    } catch (err) { showNotification(err.message || 'Failed to toggle.', 'error'); }
  };

  const handleDeleteMeal = async (meal) => {
    if (!window.confirm('Delete ' + meal.name + ' from the menu?')) return;
    try {
      await apiRequest('/menu/' + meal.id, { method: 'DELETE' }, token);
      setInventory((prev) => prev.filter((m) => m.id !== meal.id));
      showNotification(meal.name + ' removed from menu');
    } catch (err) { showNotification(err.message || 'Failed to delete.', 'error'); }
  };

  const handleCreateMeal = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/menu', { method: 'POST', body: JSON.stringify({
        name: newMealForm.name, description: newMealForm.description, price: Number(newMealForm.price), category: newMealForm.category,
        stockQuantity: Number(newMealForm.stockQuantity), image: newMealForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
        dietaryTags: [], allergens: [], isAvailable: true, servingHours: { start: newMealForm.startTime, end: newMealForm.endTime },
      }) }, token);
      setIsAddMealOpen(false);
      setNewMealForm({ name: '', description: '', price: '', category: 'breakfast', stockQuantity: '30', image: '', startTime: '06:00', endTime: '09:00' });
      fetchAllData(); showNotification('New dish added to the menu!');
    } catch (err) { showNotification(err.message || 'Failed to create meal.', 'error'); }
  };

  const handleSavePrice = async (e) => {
    e.preventDefault(); if (!editingMeal) return;
    try {
      await apiRequest('/menu/' + editingMeal.id + '/price', { method: 'PATCH', body: JSON.stringify({ newPrice: Number(editPriceForm.price), reason: editPriceForm.reason || 'Admin price update' }) }, token);
      setEditingMeal(null); fetchAllData(); showNotification('Price updated and audit log recorded.');
    } catch (err) { showNotification(err.message || 'Failed to update price.', 'error'); }
  };

  const handleExportCSV = () => {
    const h = 'Order Number,Customer,Total,Status,Payment Method,Date\n';
    const r = orders.map((o) => '"' + o.order_number + '","' + (o.customer_name || '') + '",' + o.total + ',"' + o.status + '","' + o.payment_method + '","' + o.created_at + '"').join('\n');
    const blob = new Blob([h + r], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'savori-orders-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
  };

  const totalRevenue = Number(analytics.totals?.revenue || 0);
  const totalOrdersCount = Number(analytics.totals?.orders || orders.length || 0);
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const activeOrdersCount = orders.filter((o) => o.status !== 'collected' && o.status !== 'cancelled').length;

  const filteredOrders = orders
    .filter((o) => { const ms = !searchQuery || o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) || o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()); const ms2 = orderStatusFilter === 'all' || o.status === orderStatusFilter; return ms && ms2; })
    .sort((a, b) => { if (orderSortFilter === 'newest') return new Date(b.created_at) - new Date(a.created_at); if (orderSortFilter === 'oldest') return new Date(a.created_at) - new Date(b.created_at); if (orderSortFilter === 'highest') return Number(b.total) - Number(a.total); if (orderSortFilter === 'lowest') return Number(a.total) - Number(b.total); return 0; });

  const filteredInventory = inventory.filter((item) => menuCategoryFilter === 'all' || item.category === menuCategoryFilter);

  const navItems = [
    { key: 'overview', label: 'Financial Analytics',  icon: BarChart2,  badge: null },
    { key: 'menu',     label: 'Menu & Dish Catalog',  icon: Utensils,   badge: inventory.length },
    { key: 'orders',   label: 'All Orders & Receipts',icon: ShoppingBag,badge: orders.length },
    { key: 'users',    label: 'User Roles & Access',  icon: Users,      badge: users.length },
    { key: 'audit',    label: 'Price Audit Logs',     icon: FileText,   badge: auditLogs.priceLogs?.length || 0 },
  ];

  return (
    <div className='space-y-5 pb-16'>
      {notification && (
        <div className={'fixed top-5 right-5 z-[100] flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-bold shadow-2xl border animate-in fade-in slide-in-from-top-4 ' + (notification.type === 'error' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-emerald-600 border-emerald-500 text-white')}>
          {notification.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}
          {notification.msg}
          <button type='button' onClick={() => setNotification(null)}><X size={14}/></button>
        </div>
      )}

      <div className='card-surface p-5 shadow-xl border border-slate-200/80 dark:border-savori-brownLight/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-r from-savori-brown/5 via-savori-orange/5 to-amber-500/5 pointer-events-none' />
        <div className='flex items-center gap-4 relative'>
          <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-savori-brown via-amber-800 to-amber-900 text-white shadow-lg shadow-savori-brown/40 ring-2 ring-savori-orange/20'>
            <Shield size={28} className='text-savori-orange'/>
          </div>
          <div>
            <div className='flex items-center gap-2 mb-0.5'>
              <h1 className='text-2xl sm:text-3xl font-black text-savori-brown dark:text-savori-cream'>Executive Admin Console</h1>
              <span className='hidden sm:flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide'>
                <span className='h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse'/>Live
              </span>
            </div>
            <p className='text-xs text-slate-500 dark:text-slate-400'>Revenue analytics · Menu control · User governance · Audit trail</p>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2 relative'>
          <button type='button' onClick={handleExportCSV} className='flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:border-savori-orange/40 hover:shadow-md transition-all'>
            <Download size={14}/> Export CSV
          </button>
          <button type='button' onClick={fetchAllData} disabled={refreshing} className='flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-savori-orange to-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-savori-orange/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-70'>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''}/>
            {refreshing ? 'Syncing…' : 'Sync Data'}
          </button>
        </div>
      </div>

      <div className='flex flex-col lg:flex-row gap-5 items-start'>
        <aside className='w-full lg:w-64 xl:w-72 shrink-0 lg:sticky lg:top-20'>
          <div className='card-surface p-4 border border-slate-200/80 dark:border-slate-800 shadow-xl rounded-3xl space-y-4'>
            <div className='p-3.5 rounded-2xl bg-gradient-to-r from-savori-brown/10 via-savori-orange/10 to-amber-400/10 border border-savori-orange/20 flex items-center gap-3'>
              <div className='h-10 w-10 rounded-xl bg-gradient-to-br from-savori-brown to-amber-900 flex items-center justify-center text-white shadow-md shrink-0 ring-2 ring-savori-orange/20'>
                <Shield size={18} className='text-savori-orange'/>
              </div>
              <div className='overflow-hidden'>
                <p className='text-[10px] font-black uppercase tracking-widest text-savori-orange'>Executive Console</p>
                <p className='text-xs font-bold text-slate-800 dark:text-slate-100 truncate'>Administrator Portal</p>
              </div>
            </div>
            <div className='space-y-1'>
              <p className='px-3 pt-1 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400'>Administrative Views</p>
              {navItems.map((item) => { const Icon = item.icon; const isSel = activeTab === item.key; return (
                <button key={item.key} type='button' onClick={() => setActiveTab(item.key)}
                  className={'w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left group ' + (isSel ? 'bg-gradient-to-r from-savori-orange to-amber-600 text-white shadow-lg shadow-savori-orange/25 translate-x-0.5' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white')}>
                  <div className='flex items-center gap-3 truncate'>
                    <Icon size={17} className={isSel ? 'text-white shrink-0' : 'text-slate-400 group-hover:text-savori-orange shrink-0'}/>
                    <span className='truncate'>{item.label}</span>
                  </div>
                  {item.badge !== null && <span className={'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ' + (isSel ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>{item.badge}</span>}
                </button>
              );})}
            </div>
            <div className='pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2'>
              <p className='px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400'>Quick Actions</p>
              <button type='button' onClick={() => { setActiveTab('menu'); setIsAddMealOpen(true); }} className='w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-savori-orange to-amber-600 py-2.5 px-3 text-xs font-black text-white shadow-md shadow-savori-orange/30 hover:scale-105 active:scale-95 transition-all'>
                <Plus size={15}/> + Add New Meal
              </button>
              <button type='button' onClick={handleExportCSV} className='w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors'>
                <Download size={14}/> Export Report
              </button>
            </div>
            <div className='pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1'>
              <p className='px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400'>Staff Portals</p>
              {[{to:'/staff',icon:ChefHat,label:'Kitchen Hub',color:'text-amber-500'},{to:'/staff/summary',icon:ClipboardList,label:'Prep Summary',color:'text-orange-500'},{to:'/scan',icon:QrCode,label:'QR Scanner',color:'text-emerald-500'}].map((lnk) => (
                <Link key={lnk.to} to={lnk.to} className='flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors group'>
                  <div className='flex items-center gap-2.5'><lnk.icon size={15} className={lnk.color}/><span>{lnk.label}</span></div>
                  <ChevronRight size={12} className='opacity-0 group-hover:opacity-100 text-savori-orange transition-opacity'/>
                </Link>
              ))}
            </div>
            <div className='pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 px-2 text-[11px] text-slate-500 font-medium'>
              <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0'/><span>POS &amp; DB Active</span>
            </div>
          </div>
        </aside>

        <main className='flex-1 w-full min-w-0 space-y-5'>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            <StatCard label='Total Revenue' value={totalRevenue} icon={DollarSign} prefix='KSh ' iconBg='bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' trend='up' sub='All completed transactions' animated/>
            <StatCard label='Total Orders' value={totalOrdersCount} icon={ShoppingBag} iconBg='bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' sub={activeOrdersCount + ' in fulfillment'} animated/>
            <StatCard label='Avg Order Value' value={Math.round(avgOrderValue)} prefix='KSh ' icon={Sliders} iconBg='bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' sub='Per customer checkout' animated/>
            <StatCard label='Registered Users' value={users.length} icon={Users} iconBg='bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' sub={users.filter((u)=>u.role==='staff').length+' staff · '+users.filter((u)=>u.role==='admin').length+' admins'} animated/>
          </div>
          <div className='flex lg:hidden overflow-x-auto gap-2 pb-1'>
            {navItems.map((tab) => { const Icon = tab.icon; return (<button key={tab.key} type='button' onClick={() => setActiveTab(tab.key)} className={'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all shrink-0 ' + (activeTab === tab.key ? 'bg-savori-orange text-white shadow-md' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}><Icon size={13}/> {tab.label}</button>); })}
          </div>

          {activeTab === 'overview' && (
            <div className='space-y-5'>
              <div className='grid gap-5 lg:grid-cols-2'>
                <div className='card-surface p-5 border border-slate-200/80 dark:border-slate-800 shadow-md'>
                  <div className='flex items-center justify-between mb-4'>
                    <div><h2 className='text-base font-bold text-slate-900 dark:text-slate-100'>Revenue Trend (14 Days)</h2><p className='text-xs text-slate-500 mt-0.5'>Gross daily intake across completed orders</p></div>
                    <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950 text-savori-orange'><BarChart2 size={18}/></div>
                  </div>
                  <div className='h-64'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <AreaChart data={analytics.sales.slice(0,14).reverse()}>
                        <defs><linearGradient id='revGrad' x1='0' y1='0' x2='0' y2='1'><stop offset='5%' stopColor='#FF6B00' stopOpacity={0.3}/><stop offset='95%' stopColor='#FF6B00' stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray='3 3' opacity={0.2}/>
                        <XAxis dataKey='day' tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/>
                        <Tooltip formatter={(v)=>['KSh '+Number(v).toLocaleString(),'Revenue']}/>
                        <Area type='monotone' dataKey='revenue' stroke='#FF6B00' strokeWidth={2.5} fill='url(#revGrad)' dot={{r:3,fill:'#FF6B00'}}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className='card-surface p-5 border border-slate-200/80 dark:border-slate-800 shadow-md'>
                  <div className='flex items-center justify-between mb-4'>
                    <div><h2 className='text-base font-bold text-slate-900 dark:text-slate-100'>Sales by Meal Window</h2><p className='text-xs text-slate-500 mt-0.5'>Revenue split by service category</p></div>
                    <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600'><Layers size={18}/></div>
                  </div>
                  <div className='h-64 flex items-center justify-center'>
                    {analytics.byMeal?.length ? (
                      <ResponsiveContainer width='100%' height='100%'>
                        <PieChart><Pie data={analytics.byMeal} dataKey='revenue' nameKey='category' cx='50%' cy='50%' outerRadius={90} innerRadius={48} paddingAngle={4} label={(e)=>e.category} labelLine={false}>
                          {analytics.byMeal.map((entry,i)=>(<Cell key={'c'+i} fill={CATEGORY_COLORS[entry.category]||'#4CAF50'}/>))}
                        </Pie><Tooltip formatter={(v)=>'KSh '+Number(v).toLocaleString()}/></PieChart>
                      </ResponsiveContainer>
                    ) : (<div className='flex flex-col items-center gap-3 text-slate-400'><BarChart2 size={36} className='opacity-30'/><p className='text-sm'>No breakdown data yet.</p></div>)}
                  </div>
                  {analytics.byMeal?.length > 0 && (<div className='flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800'>{analytics.byMeal.map((e)=>(<div key={e.category} className='flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400'><span className='h-2.5 w-2.5 rounded-full' style={{backgroundColor:CATEGORY_COLORS[e.category]||'#4CAF50'}}/><span className='capitalize'>{e.category}</span></div>))}</div>)}
                </div>
              </div>
              <div className='card-surface p-5 border border-slate-200/80 dark:border-slate-800 shadow-md'>
                <div className='flex items-center gap-2 mb-4'><Star size={18} className='text-amber-500'/><h3 className='text-base font-bold text-slate-900 dark:text-slate-100'>Top 5 Best-Selling Dishes</h3></div>
                {analytics.bestSelling?.length ? (<div className='grid gap-3 sm:grid-cols-5'>{analytics.bestSelling.map((dish,i)=>(<div key={dish.menu_name} className={'rounded-2xl border p-4 flex flex-col relative overflow-hidden transition-all hover:-translate-y-0.5 '+(i===0?'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 dark:border-amber-900 shadow-md':'border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60')}>{i===0&&<span className='absolute top-2 right-2 text-base'>🥇</span>}{i===1&&<span className='absolute top-2 right-2 text-base'>🥈</span>}{i===2&&<span className='absolute top-2 right-2 text-base'>🥉</span>}<span className='text-xs font-bold text-savori-orange'>#{i+1} Bestseller</span><h4 className='mt-1 font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2'>{dish.menu_name}</h4><p className='mt-2 text-xl font-black text-savori-brown dark:text-savori-cream'>{dish.quantity}<span className='text-xs font-normal text-slate-500 ml-1'>units</span></p></div>))}</div>) : (<p className='text-sm text-slate-400 text-center py-8'>No sales data yet.</p>)}
              </div>
              <div className='card-surface p-5 border border-slate-200/80 dark:border-slate-800 shadow-md'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center gap-2'><Activity size={16} className='text-savori-orange'/><h3 className='text-base font-bold text-slate-900 dark:text-slate-100'>Recent Orders Activity</h3></div>
                  <button type='button' onClick={()=>setActiveTab('orders')} className='text-xs font-bold text-savori-orange hover:underline flex items-center gap-1'>View all <ChevronRight size={12}/></button>
                </div>
                <div className='space-y-2'>
                  {orders.slice(0,6).map((o)=>{ const sc=STATUS_COLORS[o.status]||STATUS_COLORS.pending; return (<div key={o.id} className='flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors'><div className='flex items-center gap-3 min-w-0'><span className={'h-2 w-2 rounded-full shrink-0 '+sc.dot}/><div className='min-w-0'><p className='text-xs font-bold text-slate-800 dark:text-slate-200 truncate'>{o.customer_name||'Guest'}</p><p className='text-[11px] text-slate-400 font-mono'>{o.order_number}</p></div></div><div className='flex items-center gap-2 shrink-0'><span className={'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase '+sc.bg+' '+sc.text}>{o.status}</span><span className='text-xs font-black text-savori-brown dark:text-savori-cream'>KSh {Number(o.total).toLocaleString()}</span></div></div>); })}
                  {orders.length===0 && <p className='text-sm text-slate-400 text-center py-6'>No orders recorded yet.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className='card-surface p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                <div><h2 className='text-xl font-bold text-slate-900 dark:text-slate-100'>Menu &amp; Dish Catalog</h2><p className='text-xs text-slate-500'>Full catalog · pricing · serving hours · availability</p></div>
                <div className='flex items-center gap-2 flex-wrap'>
                  <Dropdown label='All Categories' icon={Filter} value={menuCategoryFilter} onChange={setMenuCategoryFilter} options={[{value:'all',label:'All Categories'},{value:'breakfast',label:'Breakfast',dot:'bg-amber-400'},{value:'lunch',label:'Lunch',dot:'bg-rose-500'},{value:'dinner',label:'Dinner',dot:'bg-purple-500'},{value:'supper',label:'Supper',dot:'bg-indigo-500'}]}/>
                  <button type='button' onClick={()=>setIsAddMealOpen(true)} className='flex items-center gap-2 rounded-xl bg-gradient-to-r from-savori-orange to-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-savori-orange/30 hover:scale-105 active:scale-95 transition-all'><Plus size={16}/> Add New Dish</button>
                </div>
              </div>
              <div className='overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800'>
                <table className='w-full text-left text-sm'>
                  <thead className='border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 bg-slate-50/80 dark:bg-slate-900/60'>
                    <tr><th className='py-3 px-4'>Item</th><th className='py-3 px-4'>Category</th><th className='py-3 px-4'>Hours</th><th className='py-3 px-4'>Price</th><th className='py-3 px-4'>Stock</th><th className='py-3 px-4'>Status</th><th className='py-3 px-4 text-right'>Actions</th></tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
                    {filteredInventory.map((item)=>(<tr key={item.id} className='hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors'><td className='py-3 px-4'><div className='flex items-center gap-3'><img src={getRealisticFoodImage(item.name, item.image)} alt={item.name} className='h-11 w-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm'/><div><p className='font-bold text-slate-900 dark:text-slate-100 text-sm'>{item.name}</p><p className='text-[11px] text-slate-400 line-clamp-1 max-w-[200px]'>{item.description}</p></div></div></td><td className='py-3 px-4'><span className='capitalize rounded-full px-2.5 py-0.5 text-xs font-bold' style={{backgroundColor:(CATEGORY_COLORS[item.category]||'#4CAF50')+'22',color:CATEGORY_COLORS[item.category]||'#4CAF50'}}>{item.category}</span></td><td className='py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400'>{item.serving_hours?JSON.parse(item.serving_hours).start:'06:00'} – {item.serving_hours?JSON.parse(item.serving_hours).end:'20:00'}</td><td className='py-3 px-4 font-black text-savori-brown dark:text-savori-cream text-sm'>KSh {Number(item.price).toLocaleString()}</td><td className='py-3 px-4'><span className={'font-bold text-sm '+(item.stock_quantity<5?'text-rose-600':item.stock_quantity<15?'text-amber-600':'text-slate-700 dark:text-slate-300')}>{item.stock_quantity}{item.stock_quantity<5&&<span className='ml-1 text-[10px] font-black text-rose-500'>LOW</span>}</span></td><td className='py-3 px-4'><button type='button' onClick={()=>handleToggleMeal(item)} className={'rounded-full px-3 py-1 text-xs font-bold transition-all hover:scale-105 '+(item.is_available?'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300':'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300')}>{item.is_available?'● Active':'○ Closed'}</button></td><td className='py-3 px-4 text-right'><div className='flex items-center justify-end gap-2'><button type='button' onClick={()=>{setEditingMeal(item);setEditPriceForm({price:item.price,reason:''}); }} className='flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-savori-orange/30 transition-all'><Edit size={12}/> Edit Price</button><button type='button' onClick={()=>handleDeleteMeal(item)} className='flex items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-900 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all'><Trash2 size={12}/></button></div></td></tr>))}
                    {filteredInventory.length===0&&(<tr><td colSpan={7} className='text-center py-10 text-slate-400 text-sm'><Utensils size={32} className='mx-auto mb-2 opacity-30'/>No menu items found.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className='card-surface p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4'>
              <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
                <div><h2 className='text-xl font-bold text-slate-900 dark:text-slate-100'>Complete Order Ledger</h2><p className='text-xs text-slate-500'>All cafeteria orders with items, references &amp; customer info</p></div>
                <div className='flex flex-wrap items-center gap-2'>
                  <div className='relative'><Search className='absolute left-3 top-2.5 text-slate-400' size={14}/><input type='text' value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder='Search orders…' className='w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-8 pr-3 text-xs outline-none focus:border-savori-orange/50'/></div>
                  <Dropdown label='All Statuses' icon={Filter} value={orderStatusFilter} onChange={setOrderStatusFilter} options={[{value:'all',label:'All Statuses'},{value:'pending',label:'Pending',dot:'bg-amber-500'},{value:'preparing',label:'Preparing',dot:'bg-blue-500'},{value:'ready',label:'Ready',dot:'bg-emerald-500'},{value:'collected',label:'Collected',dot:'bg-slate-400'},{value:'cancelled',label:'Cancelled',dot:'bg-rose-500'}]}/>
                  <Dropdown label='Newest First' icon={Sliders} value={orderSortFilter} onChange={setOrderSortFilter} options={[{value:'newest',label:'Newest First'},{value:'oldest',label:'Oldest First'},{value:'highest',label:'Highest Total'},{value:'lowest',label:'Lowest Total'}]}/>
                  <button type='button' onClick={handleExportCSV} className='flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-savori-orange/40 transition-all'><Download size={13}/> CSV</button>
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                {[{label:'Pending',status:'pending'},{label:'Preparing',status:'preparing'},{label:'Ready',status:'ready'},{label:'Collected',status:'collected'}].map((s)=>{ const sc=STATUS_COLORS[s.status]; const cnt=orders.filter((o)=>o.status===s.status).length; return (<button key={s.status} type='button' onClick={()=>setOrderStatusFilter(s.status)} className={'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border '+(orderStatusFilter===s.status?sc.bg+' '+sc.text+' border-current shadow-sm':'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-savori-orange/30')}><span className={'h-1.5 w-1.5 rounded-full '+sc.dot}/>{s.label} <span className='ml-0.5 font-mono'>{cnt}</span></button>); })}
              </div>
              <div className='space-y-2.5'>
                {filteredOrders.map((o)=>{ const sc=STATUS_COLORS[o.status]||STATUS_COLORS.pending; return (<div key={o.id} className='rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-white/60 dark:bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-md transition-shadow'><div className='flex items-start gap-3 min-w-0'><div className={'mt-0.5 h-8 w-8 flex items-center justify-center rounded-xl '+sc.bg+' shrink-0'}><ShoppingBag size={14} className={sc.text}/></div><div className='min-w-0'><div className='flex flex-wrap items-center gap-2 mb-1'><span className='rounded-lg bg-orange-100 dark:bg-orange-950 px-2 py-0.5 text-xs font-mono font-bold text-savori-orange'>#{o.order_number?.replace('ORD-','')}</span><span className='text-xs text-slate-400'>{new Date(o.created_at).toLocaleString()}</span></div><p className='font-bold text-sm text-slate-900 dark:text-slate-100'>{o.customer_name||'Guest'} · <span className='font-normal text-slate-500'>{o.customer_email||'N/A'}</span></p><p className='mt-1 text-xs text-slate-500 line-clamp-1'>{o.items?.map((it)=>it.quantity+'× '+it.menu_name).join(', ')||'No items'}</p></div></div><div className='flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 shrink-0'><div className='text-right'><p className='text-[10px] text-slate-400 uppercase font-bold'>Total</p><p className='text-lg font-black text-savori-brown dark:text-savori-cream'>KSh {Number(o.total).toLocaleString()}</p></div><span className={'rounded-xl px-3 py-1.5 text-xs font-bold uppercase '+sc.bg+' '+sc.text}>{o.status}</span></div></div>); })}
                {filteredOrders.length===0&&(<div className='text-center py-12 text-slate-400'><ShoppingBag size={36} className='mx-auto mb-2 opacity-30'/><p className='text-sm'>No orders match your filters.</p></div>)}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className='card-surface p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                <div><h2 className='text-xl font-bold text-slate-900 dark:text-slate-100'>User Management &amp; Access</h2><p className='text-xs text-slate-500'>Assign staff, admin, or customer roles to members</p></div>
                <Dropdown label='All Roles' icon={Users} value={roleFilter} onChange={setRoleFilter} options={[{value:'all',label:'All Roles'},{value:'customer',label:'Customers'},{value:'staff',label:'Kitchen Staff'},{value:'admin',label:'Administrators'}]}/>
              </div>
              <div className='flex flex-wrap gap-2'>
                {[{role:'all',label:'All Users',count:users.length,color:'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'},{role:'customer',label:'Customers',count:users.filter((u)=>u.role==='customer').length,color:'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'},{role:'staff',label:'Staff',count:users.filter((u)=>u.role==='staff').length,color:'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'},{role:'admin',label:'Admins',count:users.filter((u)=>u.role==='admin').length,color:'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'}].map((item)=>(<button key={item.role} type='button' onClick={()=>setRoleFilter(item.role)} className={'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border '+(roleFilter===item.role?item.color+' border-current':'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-savori-orange/30')}>{item.label} <span className='font-mono'>{item.count}</span></button>))}
              </div>
              <div className='overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800'>
                <table className='w-full text-left text-sm'>
                  <thead className='border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 bg-slate-50/80 dark:bg-slate-900/60'>
                    <tr><th className='py-3 px-4'>User</th><th className='py-3 px-4'>Role</th><th className='py-3 px-4'>Loyalty</th><th className='py-3 px-4'>Orders</th><th className='py-3 px-4'>Total Spent</th><th className='py-3 px-4 text-right'>Change Role</th></tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
                    {users.filter((u)=>roleFilter==='all'||u.role===roleFilter).map((u)=>(<tr key={u.id} className='hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors'><td className='py-3 px-4'><div className='flex items-center gap-3'><div className='h-9 w-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center font-black text-slate-600 dark:text-slate-300 text-sm shrink-0'>{u.name?.[0]?.toUpperCase()||'?'}</div><div><p className='font-bold text-slate-900 dark:text-slate-100 text-sm'>{u.name}</p><p className='text-xs text-slate-500'>{u.email}</p></div></div></td><td className='py-3 px-4'><span className={'rounded-full px-2.5 py-0.5 text-xs font-bold uppercase '+(u.role==='admin'?'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300':u.role==='staff'?'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300':'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>{u.role}</span></td><td className='py-3 px-4 font-semibold text-amber-600 dark:text-amber-400'>⭐ {u.loyalty_points||0} pts</td><td className='py-3 px-4 font-bold text-slate-800 dark:text-slate-200'>{u.order_count||0}</td><td className='py-3 px-4 font-bold text-savori-brown dark:text-savori-cream'>KSh {Number(u.total_spent||0).toLocaleString()}</td><td className='py-3 px-4 text-right'><select value={u.role} onChange={(e)=>handleChangeRole(u.id,e.target.value)} className='rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold outline-none hover:border-savori-orange/40 focus:border-savori-orange transition-colors cursor-pointer'><option value='customer'>Customer</option><option value='staff'>Kitchen Staff</option><option value='admin'>Administrator</option></select></td></tr>))}
                    {users.filter((u)=>roleFilter==='all'||u.role===roleFilter).length===0&&(<tr><td colSpan={6} className='text-center py-10 text-slate-400 text-sm'><Users size={32} className='mx-auto mb-2 opacity-30'/>No users found.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className='card-surface p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4'>
              <div className='flex items-center gap-2 mb-1'><FileText size={18} className='text-savori-orange'/><h2 className='text-xl font-bold text-slate-900 dark:text-slate-100'>Price Audit Trail</h2></div>
              <p className='text-xs text-slate-500'>Every price change logged with actor, reason &amp; timestamp for full regulatory compliance.</p>
              {auditLogs.priceLogs?.length>0?(
                <div className='overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800'>
                  <table className='w-full text-left text-sm'>
                    <thead className='border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 bg-slate-50/80 dark:bg-slate-900/60'>
                      <tr><th className='py-3 px-4'>Dish</th><th className='py-3 px-4'>Previous</th><th className='py-3 px-4'>New Price</th><th className='py-3 px-4'>Changed By</th><th className='py-3 px-4'>Reason</th><th className='py-3 px-4 text-right'>Timestamp</th></tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
                      {auditLogs.priceLogs.map((log)=>{ const isUp=Number(log.new_price)>Number(log.old_price); return (<tr key={log.id} className='hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors'><td className='py-3 px-4 font-bold text-slate-900 dark:text-slate-100'>{log.item_name}</td><td className='py-3 px-4 text-slate-400 line-through text-xs'>KSh {Number(log.old_price).toLocaleString()}</td><td className='py-3 px-4'><span className={'font-bold text-sm '+(isUp?'text-rose-600 dark:text-rose-400':'text-emerald-600 dark:text-emerald-400')}>{isUp?'▲':'▼'} KSh {Number(log.new_price).toLocaleString()}</span></td><td className='py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>{log.changed_by_name||'Admin'}</td><td className='py-3 px-4 text-xs italic text-slate-500 dark:text-slate-400 max-w-[180px] truncate'>{log.reason}</td><td className='py-3 px-4 text-right text-xs text-slate-400 font-mono'>{new Date(log.changed_at).toLocaleString()}</td></tr>); })}
                    </tbody>
                  </table>
                </div>
              ):(<div className='text-center py-14 text-slate-400'><FileText size={40} className='mx-auto mb-3 opacity-20'/><p className='text-sm font-semibold'>No price changes recorded yet.</p><p className='text-xs mt-1'>All future price edits will appear here.</p></div>)}
            </div>
          )}
        </main>
      </div>

      {isAddMealOpen&&(
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4' onClick={(e)=>e.target===e.currentTarget&&setIsAddMealOpen(false)}>
          <div className='card-surface w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative rounded-3xl animate-in fade-in zoom-in-95 duration-200'>
            <div className='absolute inset-0 bg-gradient-to-br from-savori-orange/5 via-transparent to-amber-500/5 rounded-3xl pointer-events-none'/>
            <button type='button' onClick={()=>setIsAddMealOpen(false)} className='absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'><X size={18}/></button>
            <div className='flex items-center gap-3 mb-4'>
              <div className='h-10 w-10 rounded-xl bg-gradient-to-br from-savori-orange to-amber-600 flex items-center justify-center text-white shadow-md'><Plus size={20}/></div>
              <div><h3 className='text-xl font-black text-slate-900 dark:text-slate-100'>Add New Dish</h3><p className='text-xs text-slate-500'>Will be immediately active in selected time window</p></div>
            </div>
            <form onSubmit={handleCreateMeal} className='space-y-3'>
              <div><label className='mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300'>Dish Name *</label><input type='text' value={newMealForm.name} onChange={(e)=>setNewMealForm({...newMealForm,name:e.target.value})} placeholder='e.g. Nyama Choma Deluxe' className='w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-savori-orange/60 transition-colors' required/></div>
              <div><label className='mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300'>Description *</label><textarea value={newMealForm.description} onChange={(e)=>setNewMealForm({...newMealForm,description:e.target.value})} placeholder='Short appetizing description...' className='w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-savori-orange/60 transition-colors resize-none' rows={2} required/></div>
              <div className='grid grid-cols-3 gap-3'>
                <div><label className='mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300'>Category</label><select value={newMealForm.category} onChange={(e)=>setNewMealForm({...newMealForm,category:e.target.value})} className='w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-savori-orange/60 transition-colors'><option value='breakfast'>Breakfast</option><option value='lunch'>Lunch</option><option value='dinner'>Dinner</option><option value='supper'>Supper</option></select></div>
                <div><label className='mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300'>Price (KSh) *</label><input type='number' value={newMealForm.price} onChange={(e)=>setNewMealForm({...newMealForm,price:e.target.value})} placeholder='750' className='w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-savori-orange/60 transition-colors' required/></div>
                <div><label className='mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300'>Initial Stock</label><input type='number' value={newMealForm.stockQuantity} onChange={(e)=>setNewMealForm({...newMealForm,stockQuantity:e.target.value})} className='w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-savori-orange/60 transition-colors' required/></div>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div><label className='mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300'>Serving Start</label><input type='time' value={newMealForm.startTime} onChange={(e)=>setNewMealForm({...newMealForm,startTime:e.target.value})} className='w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-savori-orange/60 transition-colors' required/></div>
                <div><label className='mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300'>Serving End</label><input type='time' value={newMealForm.endTime} onChange={(e)=>setNewMealForm({...newMealForm,endTime:e.target.value})} className='w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-savori-orange/60 transition-colors' required/></div>
              </div>
              <div><label className='mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300'>Image URL <span className='text-slate-400 font-normal'>(optional)</span></label><input type='url' value={newMealForm.image} onChange={(e)=>setNewMealForm({...newMealForm,image:e.target.value})} placeholder='https://...' className='w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-savori-orange/60 transition-colors'/></div>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={()=>setIsAddMealOpen(false)} className='flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'>Cancel</button>
                <button type='submit' className='flex-1 rounded-xl bg-gradient-to-r from-savori-orange to-amber-600 py-2.5 text-xs font-bold text-white shadow-md shadow-savori-orange/30 hover:scale-105 active:scale-95 transition-all'>Add Dish to Menu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingMeal&&(
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4' onClick={(e)=>e.target===e.currentTarget&&setEditingMeal(null)}>
          <div className='card-surface w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative rounded-3xl animate-in fade-in zoom-in-95 duration-200'>
            <div className='absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl pointer-events-none'/>
            <button type='button' onClick={()=>setEditingMeal(null)} className='absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'><X size={18}/></button>
            <div className='flex items-center gap-3 mb-4'>
              <div className='h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md'><Edit size={18}/></div>
              <div><h3 className='text-xl font-black text-slate-900 dark:text-slate-100'>Adjust Price</h3><p className='text-xs text-slate-500'>{editingMeal.name} · Current: <strong className='text-savori-brown dark:text-savori-cream'>KSh {Number(editingMeal.price).toLocaleString()}</strong></p></div>
            </div>
            <form onSubmit={handleSavePrice} className='space-y-4'>
              <div><label className='mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300'>New Price (KSh) *</label><input type='number' value={editPriceForm.price} onChange={(e)=>setEditPriceForm({...editPriceForm,price:e.target.value})} className='w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-savori-orange/60 transition-colors' required/></div>
              <div><label className='mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300'>Reason <span className='text-slate-400 font-normal'>(audit trail)</span></label><input type='text' value={editPriceForm.reason} onChange={(e)=>setEditPriceForm({...editPriceForm,reason:e.target.value})} placeholder='e.g. Seasonal ingredient cost increase' className='w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-savori-orange/60 transition-colors' required/></div>
              <div className='p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2'>
                <AlertTriangle size={14} className='shrink-0 mt-0.5'/>
                This change will be permanently recorded in the audit log with your account and timestamp.
              </div>
              <div className='flex gap-3'>
                <button type='button' onClick={()=>setEditingMeal(null)} className='flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'>Cancel</button>
                <button type='submit' className='flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 transition-all'>Update &amp; Log to Audit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}