// FILE: asset-frontend/src/pages/CheckPage.jsx
import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckSquare, Search, ChevronDown, ChevronRight, Building, Layers,
  MapPin, Calendar, Bell, X, Save, Eye, BarChart3, TrendingUp,
  AlertCircle, AlertTriangle, Clock, Settings, EyeOff, Grid, List,
  Filter as FilterIcon, ChevronLeft, Sliders, RotateCcw
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIGS = {
  never_checked: { label: 'ยังไม่ได้ตรวจในรอบนี้', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, priority: 1 },
  overdue: { label: 'เลยกำหนด', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, priority: 1 },
  no_schedule: { label: 'ยังไม่กำหนดรอบ', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: Calendar, priority: 2 },
  due_soon: { label: 'ใกล้กำหนด', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, priority: 2 },
  checked: { label: 'ตรวจแล้วในรอบนี้', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckSquare, priority: 3 },
};

const CHECK_STATUSES = ['ใช้งานได้', 'รอซ่อม', 'รอจำหน่าย', 'จำหน่ายแล้ว', 'ไม่พบ'];
const ITEMS_PER_PAGE = 100;

// ==================== Helper: compute check status (pure function) ====================
function computeCheckStatus(asset, globalPeriod) {
  let checkDateStr = null;
  if (asset.last_check_date) checkDateStr = asset.last_check_date.split(' ')[0];

  if (!asset.last_check_date || (globalPeriod.start && checkDateStr < globalPeriod.start) || (globalPeriod.end && checkDateStr > globalPeriod.end)) {
    return { ...STATUS_CONFIGS.never_checked, status: 'never_checked', days: null, text: 'ยังไม่ได้ตรวจ' };
  }

  const today = Date.now();
  const nextCheck = asset.next_check_date ? new Date(asset.next_check_date).getTime() : null;

  if (!nextCheck) {
    // If it has been checked, but no future schedule is set, it's still "checked" for now.
    return { ...STATUS_CONFIGS.checked, status: 'checked', label: `ตรวจแล้ว ${checkDateStr}`, days: null };
  }

  const daysUntil = Math.floor((nextCheck - today) / 86400000);
  if (daysUntil < 0) {
    return { ...STATUS_CONFIGS.overdue, status: 'overdue', label: `เลย ${Math.abs(daysUntil)} วัน`, days: daysUntil };
  }
  if (daysUntil <= 7) {
    return { ...STATUS_CONFIGS.due_soon, status: 'due_soon', label: `อีก ${daysUntil} วัน`, days: daysUntil };
  }
  return { ...STATUS_CONFIGS.checked, status: 'checked', label: `ตรวจแล้ว ${checkDateStr}`, days: daysUntil };
}

// ==================== Main Component ====================
export default function CheckPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings for global annual check period
  const [globalPeriod, setGlobalPeriod] = useState({ start: null, end: null });

  // UI
  const [activeTab, setActiveTab] = useState('check');
  const [viewMode, setViewMode] = useState('grouped');
  const [expanded, setExpanded] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [notifUrgentPage, setNotifUrgentPage] = useState(1);
  const [notifDueSoonPage, setNotifDueSoonPage] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', building: 'all', floor: 'all', department: 'all' });
  const [searchParams] = useSearchParams();

  // Modals
  const [modal, setModal] = useState({ type: null, data: null }); // { type: 'check'|'roomCheck', data: ... }
  const [checkForm, setCheckForm] = useState({ status: 'ใช้งานได้', remark: '' });

  const computeCheckStatusWrapper = useCallback((asset) => {
    return computeCheckStatus(asset, globalPeriod);
  }, [globalPeriod]);

  // URL params
  useEffect(() => {
    const f = searchParams.get('filter');
    if (!f) return;
    const map = { overdue: 'overdue', unchecked: 'never_checked', today: 'today', urgent: 'due_soon', due_soon: 'due_soon' };
    if (map[f]) setFilters(p => ({ ...p, status: map[f] }));
  }, [searchParams]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aR, dR, settingsRes] = await Promise.all([
        api.get('/assets?limit=0'), api.get('/departments'), api.get('/settings').catch(() => ({ data: { data: [] } }))
      ]);

      const settingsData = settingsRes.data.data || {};
      const startDate = settingsData.annual_check_start || null;
      const endDate = settingsData.annual_check_end || null;
      setGlobalPeriod({ start: startDate, end: endDate });

      let a = aR.data.data || [];
      if (a && a.items) a = a.items;
      if (!Array.isArray(a)) a = [];
      setAssets(a);
      setDepartments(dR.data.data || []);
    } catch { toast.error('ไม่สามารถโหลดข้อมูลได้'); }
    finally { setLoading(false); }
  };

  // ==================== Memoized: pre-compute statuses once ====================
  const assetsWithStatus = useMemo(() =>
    assets.map(a => ({ ...a, _status: computeCheckStatusWrapper(a) })),
    [assets, computeCheckStatusWrapper]
  );

  // ==================== Memoized: stats ====================
  const stats = useMemo(() => {
    let neverChecked = 0, overdue = 0, dueSoon = 0, checked = 0;
    assetsWithStatus.forEach(a => {
      const s = a._status.status;
      if (s === 'never_checked') neverChecked++;
      else if (s === 'overdue') overdue++;
      else if (s === 'due_soon') dueSoon++;
      else if (s === 'checked') checked++;
    });

    if (globalPeriod.end) {
        overdue = 0;
        dueSoon = 0;
        const endDay = new Date(globalPeriod.end);
        const nowDay = new Date();
        const diffMs = endDay - nowDay;
        const days = Math.floor(diffMs / 86400000);
        
        if (days < 0) {
            overdue = neverChecked;
        } else if (days <= 7) {
            dueSoon = neverChecked;
        }
    }

    const total = assetsWithStatus.length;
    return { neverChecked, overdue, dueSoon, checked, total, needsAction: neverChecked + overdue + dueSoon, percentage: total > 0 ? ((checked / total) * 100).toFixed(1) : 0 };
  }, [assetsWithStatus, globalPeriod]);

  // ==================== Memoized: filtered assets ====================
  const filteredAssets = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return assetsWithStatus.filter(a => {
      if (term && !(
        a.asset_name?.toLowerCase().includes(term) ||
        a.barcode?.toLowerCase().includes(term) ||
        a.serial_number?.toLowerCase().includes(term) ||
        String(a.asset_id).includes(term) ||
        a.room_number?.toLowerCase().includes(term) ||
        a.building_name?.toLowerCase().includes(term)
      )) return false;
      if (filters.status !== 'all') {
        if (filters.status === 'today') { if (a._status.days !== 0) return false; }
        else if (a._status.status !== filters.status) return false;
      }
      if (filters.building !== 'all' && a.building_name !== filters.building) return false;
      if (filters.floor !== 'all' && a.floor !== filters.floor) return false;
      if (filters.department !== 'all' && a.department_id != filters.department) return false;
      return true;
    });
  }, [assetsWithStatus, searchTerm, filters]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filters]);

  // ==================== Memoized: grouped assets ====================
  const groupedAssets = useMemo(() => {
    const g = {};
    filteredAssets.forEach(a => {
      const b = a.building_name || 'ไม่ระบุอาคาร', f = a.floor || 'ไม่ระบุชั้น', r = a.room_number || 'ไม่ระบุห้อง';
      if (!g[b]) g[b] = {};
      if (!g[b][f]) g[b][f] = {};
      if (!g[b][f][r]) g[b][f][r] = [];
      g[b][f][r].push(a);
    });
    return g;
  }, [filteredAssets]);

  // ==================== Memoized: notifications ====================
  const notifications = useMemo(() => {
    const urgent = [], dueSoon = [];
    assetsWithStatus.forEach(a => {
      if (a._status.status === 'never_checked' || a._status.status === 'overdue') urgent.push(a);
      else if (a._status.status === 'due_soon') dueSoon.push(a);
    });
    return { urgent, dueSoon };
  }, [assetsWithStatus]);

  // Filter values
  const uniqueBuildings = useMemo(() => [...new Set(assets.map(a => a.building_name).filter(Boolean))], [assets]);
  const uniqueFloors = useMemo(() => [...new Set(assets.map(a => a.floor).filter(Boolean))].sort((a, b) => a - b), [assets]);

  // ==================== Pagination (list view) ====================
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssets, currentPage, ITEMS_PER_PAGE]);

  // ==================== Handlers ====================
  const toggle = useCallback((key) => setExpanded(p => ({ ...p, [key]: !p[key] })), []);

  const openCheckModal = (asset) => { setCheckForm({ status: 'ใช้งานได้', remark: '' }); setModal({ type: 'check', data: asset }); };
  const openRoomCheck = (building, floor, room, roomAssets) => { setCheckForm({ status: 'ใช้งานได้', remark: '' }); setModal({ type: 'roomCheck', data: { building, floor, room, assets: roomAssets } }); };
  const closeModal = () => setModal({ type: null, data: null });

  const saveCheck = async () => {
    try {
      setSaving(true);
      await api.post('/checks', {
        asset_id: modal.data.asset_id, user_id: user.user_id,
        check_date: new Date().toISOString().split('T')[0],
        check_status: checkForm.status, remark: checkForm.remark
      });
      toast.success('บันทึกการตรวจสอบสำเร็จ');
      closeModal(); fetchData();
    } catch { toast.error('ไม่สามารถบันทึกได้'); }
    finally { setSaving(false); }
  };

  const saveRoomCheck = async () => {
    try {
      setSaving(true);
      const promises = modal.data.assets.map(a =>
        api.post('/checks', {
          asset_id: a.asset_id, user_id: user.user_id,
          check_date: new Date().toISOString().split('T')[0],
          check_status: checkForm.status, remark: checkForm.remark
        })
      );
      await Promise.all(promises);
      toast.success(`บันทึกการตรวจทั้งห้องสำเร็จ (${modal.data.assets.length} รายการ)`);
      closeModal(); fetchData();
    } catch { toast.error('ไม่สามารถบันทึกได้'); }
    finally { setSaving(false); }
  };

  const clearFilters = () => { setFilters({ status: 'all', building: 'all', floor: 'all', department: 'all' }); setSearchTerm(''); };
  const hasActiveFilters = searchTerm || filters.status !== 'all' || filters.building !== 'all' || filters.floor !== 'all' || filters.department !== 'all';

  // ==================== Loading ====================
  if (loading && assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-3 text-gray-500 text-sm">กำลังโหลด...</p>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบครุภัณฑ์</h1>
        <p className="text-sm text-gray-500 mt-0.5">จัดการและติดตามการตรวจสอบครุภัณฑ์ทั้งหมด</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex">
          {[
            { key: 'check', icon: CheckSquare, label: 'ตรวจสอบครุภัณฑ์' },
            { key: 'notifications', icon: Bell, label: 'การแจ้งเตือน', badge: stats.needsAction },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-3 text-center text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'
                }`}>
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px]">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'check' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'ทั้งหมด', value: stats.total, gradient: 'from-blue-500 to-blue-600', icon: BarChart3 },
              { label: 'ยังไม่เคยตรวจ', value: stats.neverChecked, gradient: 'from-red-500 to-red-600', icon: AlertCircle },
              { label: 'เลยกำหนด', value: stats.overdue, gradient: 'from-orange-500 to-orange-600', icon: AlertTriangle },
              { label: 'ใกล้กำหนด', value: stats.dueSoon, gradient: 'from-yellow-500 to-yellow-600', icon: Clock },
              { label: 'ตรวจแล้ว', value: stats.checked, gradient: 'from-green-500 to-green-600', icon: TrendingUp, pct: stats.percentage },
            ].map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.gradient} rounded-xl p-4 text-white shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-xs">{s.label}</p>
                    <p className="text-2xl font-bold mt-0.5">{s.value.toLocaleString()}</p>
                    {s.pct && (
                      <div className="w-full bg-white/30 rounded-full h-1 mt-2">
                        <div className="bg-white h-1 rounded-full transition-all duration-700" style={{ width: `${s.pct}%` }} />
                      </div>
                    )}
                  </div>
                  <s.icon size={28} className="opacity-40" />
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filter Bar */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text"
                  placeholder="ค้นหา ชื่อ / หมายเลขครุภัณฑ์ / ซีเรียล / ห้อง..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border transition ${showFilters || hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                <Sliders size={15} /> ตัวกรอง
                {hasActiveFilters && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
              </button>

              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {[{ key: 'grouped', icon: Grid, label: 'จัดกลุ่ม' }, { key: 'list', icon: List, label: 'รายการ' }].map(v => (
                  <button key={v.key} onClick={() => setViewMode(v.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition ${viewMode === v.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}>
                    <v.icon size={16} /> <span className="font-medium">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inline Filters */}
            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">สถานะการตรวจ</label>
                  <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="all">ทั้งหมด</option>
                    <option value="never_checked">ยังไม่เคยตรวจ</option>
                    <option value="overdue">เลยกำหนด</option>
                    <option value="due_soon">ใกล้กำหนด</option>
                    <option value="checked">ตรวจแล้ว</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">อาคาร</label>
                  <select value={filters.building} onChange={e => setFilters(p => ({ ...p, building: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="all">ทั้งหมด</option>
                    {uniqueBuildings.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ชั้น</label>
                  <select value={filters.floor} onChange={e => setFilters(p => ({ ...p, floor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="all">ทั้งหมด</option>
                    {uniqueFloors.map(f => <option key={f} value={f}>ชั้น {f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">หน่วยงาน</label>
                  <select value={filters.department} onChange={e => setFilters(p => ({ ...p, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="all">ทั้งหมด</option>
                    {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                  </select>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="col-span-2 md:col-span-4 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 justify-center py-1">
                    <RotateCcw size={12} /> ล้างตัวกรอง
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="text-xs text-gray-500 px-1">
            แสดง {filteredAssets.length} จาก {assets.length} รายการ
          </div>

          {/* Display */}
          {viewMode === 'grouped' ? (
            <GroupedView
              groupedAssets={groupedAssets} expanded={expanded} toggle={toggle}
              onCheck={openCheckModal}
              onRoomCheck={openRoomCheck}
            />
          ) : (
            <ListView
              assets={paginatedAssets} onCheck={openCheckModal}
              currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage}
              totalCount={filteredAssets.length}
            />
          )}
        </>
      ) : (
        <NotificationsTab
          notifications={notifications}
          onCheck={openCheckModal}
          urgentPage={notifUrgentPage}
          setUrgentPage={setNotifUrgentPage}
          dueSoonPage={notifDueSoonPage}
          setDueSoonPage={setNotifDueSoonPage}
        />
      )}

      {/* ==================== Modals ==================== */}
      {modal.type === 'check' && (
        <ModalWrapper title="บันทึกการตรวจสอบ" onClose={closeModal}>
          <div className="flex gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 shadow-sm items-start">
            {modal.data.image ? (
              <img src={`${api.defaults.baseURL.replace('/api', '')}/${modal.data.image}`} alt={modal.data.asset_name} 
                   className="w-16 h-16 rounded-lg border border-gray-200 object-cover bg-white flex-shrink-0"
                   onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <Grid size={24} className="text-gray-300" />
              </div>
            )}
            <div className="flex-1 space-y-1.5 min-w-0">
              <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{modal.data.asset_name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 mt-1">
                <p className="text-xs text-slate-600 truncate"><span className="font-medium text-slate-500">บาร์โค้ด:</span> <span className="font-mono">{modal.data.barcode || '-'}</span></p>
                <p className="text-xs text-slate-600 truncate"><span className="font-medium text-slate-500">S/N:</span> <span className="font-mono">{modal.data.serial_number || '-'}</span></p>
                <p className="text-xs text-slate-600 truncate sm:col-span-2">
                  <span className="font-medium text-slate-500">สถานที่:</span> {modal.data.building_name || 'ไม่ระบุอาคาร'}
                  {modal.data.floor ? ` ชั้น ${modal.data.floor}` : ''}
                  {modal.data.room_number ? ` ห้อง ${modal.data.room_number}` : ''}
                </p>
                <p className="text-xs text-slate-600 truncate sm:col-span-2">
                  <span className="font-medium text-slate-500">หน่วยงาน:</span> {departments.find(d => d.department_id == modal.data.department_id)?.department_name || 'ไม่ระบุ'}
                </p>
              </div>
            </div>
          </div>
          <CheckFormFields checkForm={checkForm} setCheckForm={setCheckForm} />
          <ModalActions onSave={saveCheck} onClose={closeModal} saving={saving} color="green" label="บันทึกการตรวจสอบ" />
        </ModalWrapper>
      )}

      {modal.type === 'roomCheck' && (
        <ModalWrapper title="ตรวจสอบทั้งห้อง" onClose={closeModal}>
          <RoomInfo room={modal.data} />
          <RoomAssetList assets={modal.data.assets} />
          <CheckFormFields checkForm={checkForm} setCheckForm={setCheckForm} isRoom />
          <ModalActions onSave={saveRoomCheck} onClose={closeModal} saving={saving} color="blue" label={`บันทึกทั้งห้อง (${modal.data.assets.length})`} />
        </ModalWrapper>
      )}
    </div>
  );
}

// ==================== Grouped View ====================
function GroupedView({ groupedAssets, expanded, toggle, onCheck, onRoomCheck }) {
  if (Object.keys(groupedAssets).length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {Object.entries(groupedAssets).map(([building, floors]) => {
        const bAssets = Object.values(floors).flatMap(f => Object.values(f)).flat();
        const bKey = `b-${building}`;
        const isExpanded = expanded[bKey];

        return (
          <div key={building} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div onClick={() => toggle(bKey)}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-lg"><Building className="text-white" size={22} /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{building}</h3>
                  <p className="text-xs text-gray-500">{bAssets.length} รายการ • {Object.keys(floors).length} ชั้น</p>
                </div>
              </div>
              {isExpanded ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
            </div>

            {isExpanded && (
              <div className="p-3 space-y-2">
                {Object.entries(floors).map(([floor, rooms]) => {
                  const fKey = `f-${building}-${floor}`;
                  const fExpanded = expanded[fKey];
                  return (
                    <div key={fKey} className="border-l-3 border-indigo-400 bg-gray-50 rounded-lg overflow-hidden">
                      <div onClick={() => toggle(fKey)}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="bg-indigo-500 p-1.5 rounded"><Layers className="text-white" size={16} /></div>
                          <span className="font-semibold text-sm text-gray-800">ชั้น {floor}</span>
                          <span className="text-xs text-gray-400">{Object.keys(rooms).length} ห้อง</span>
                        </div>
                        {fExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                      </div>

                      {fExpanded && (
                        <div className="p-3 space-y-2 bg-white">
                          {Object.entries(rooms).map(([room, roomAssets]) => {
                            const rKey = `r-${building}-${floor}-${room}`;
                            const rExpanded = expanded[rKey];
                            return (
                              <div key={rKey} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 p-2.5 border-b border-gray-200 flex items-center justify-between">
                                  <div onClick={() => toggle(rKey)} className="flex items-center gap-2 flex-1 cursor-pointer">
                                    <MapPin className="text-purple-600" size={16} />
                                    <span className="font-semibold text-sm text-gray-800">ห้อง {room}</span>
                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">{roomAssets.length}</span>
                                    {rExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button onClick={() => onRoomCheck(building, floor, room, roomAssets)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1">
                                      <CheckSquare size={12} /> ตรวจทั้งห้อง
                                    </button>
                                  </div>
                                </div>

                                {rExpanded && (
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-10">#</th>
                                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-10">รูป</th>
                                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">ชื่อ</th>
                                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-24">หมายเลขครุภัณฑ์</th>
                                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-28">สถานะการตรวจ</th>
                                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-16"></th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {(() => {
                                          // Group assets by name
                                          const nameGroups = {};
                                          roomAssets.forEach(a => {
                                            if (!nameGroups[a.asset_name]) nameGroups[a.asset_name] = [];
                                            nameGroups[a.asset_name].push(a);
                                          });

                                          let rowIdx = 1;
                                          return Object.entries(nameGroups).map(([name, items]) => {
                                            const isGroup = items.length > 1;
                                            const subKey = `sub-${building}-${floor}-${room}-${name}`;
                                            const subExpanded = expanded[subKey];

                                            if (!isGroup) {
                                              const asset = items[0];
                                              const Icon = asset._status.icon;
                                              return (
                                                <tr key={asset.asset_id} className="hover:bg-blue-50/40 transition-colors border-b border-gray-100 last:border-0">
                                                  <td className="px-3 py-2 text-[10px] text-gray-400">{rowIdx++}</td>
                                                  <td className="px-3 py-2">
                                                    {asset.image ? (
                                                      <img src={`${api.defaults.baseURL.replace('/api', '')}/${asset.image}`} alt="" className="h-7 w-7 rounded object-cover border border-gray-200"
                                                        onError={(e) => { e.target.style.display = 'none'; }} />
                                                    ) : <div className="h-7 w-7 bg-gray-100 rounded flex items-center justify-center border border-gray-200"><Grid size={10} className="text-gray-300" /></div>}
                                                  </td>
                                                  <td className="px-3 py-2 text-[11px] text-gray-900">
                                                    <div className="line-clamp-1" title={asset.asset_name}>{asset.asset_name}</div>
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <div className="text-[10px] text-gray-600 font-mono leading-tight">{asset.barcode || '-'}</div>
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${asset._status.color} whitespace-nowrap`}>
                                                      <Icon size={10} /> {asset._status.label}
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <div className="flex gap-2">
                                                      <button onClick={() => onCheck(asset)} className="text-blue-600 hover:text-blue-800 transition" title="ตรวจสอบ"><CheckSquare size={14} /></button>
                                                    </div>
                                                  </td>
                                                </tr>
                                              );
                                            } else {
                                              // Render Expandable Group Header
                                              const currentIdx = rowIdx++;
                                              const firstAsset = items[0];
                                              return (
                                                <Fragment key={`group-${currentIdx}`}>
                                                  <tr onClick={() => toggle(subKey)} className="hover:bg-purple-50/30 transition-colors border-b border-gray-200 cursor-pointer bg-gray-50 group shadow-sm">
                                                    <td className="px-3 py-2 text-[10px] text-gray-500 font-medium">{currentIdx}</td>
                                                    <td className="px-3 py-2">
                                                      {firstAsset.image ? (
                                                        <img src={`${api.defaults.baseURL.replace('/api', '')}/${firstAsset.image}`} alt="" className="h-7 w-7 rounded object-cover border border-gray-200 opacity-80"
                                                          onError={(e) => { e.target.style.display = 'none'; }} />
                                                      ) : <div className="h-7 w-7 bg-gray-100 rounded flex items-center justify-center border border-gray-200"><Grid size={10} className="text-gray-300" /></div>}
                                                    </td>
                                                    <td className="px-3 py-2" colSpan={4}>
                                                      <div className="flex items-center gap-2">
                                                        <div className="text-[11px] text-gray-900 font-bold line-clamp-1">{name}</div>
                                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{items.length} รายการ</span>
                                                        {subExpanded ? <ChevronDown size={14} className="text-gray-500 ml-1" /> : <ChevronRight size={14} className="text-gray-400 ml-1" />}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                  {/* Render Group Items if Expanded */}
                                                  {subExpanded && items.map((asset) => {
                                                    const Icon = asset._status.icon;
                                                    return (
                                                      <tr key={asset.asset_id} className="hover:bg-blue-50/30 transition-colors border-b border-gray-50 bg-white">
                                                        <td className="px-3 py-2 text-right text-purple-300" colSpan={3}>
                                                          <div className="flex items-center justify-end pr-2 text-[10px] font-medium tracking-wider">
                                                            ↳ รายการย่อย
                                                          </div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                          <div className="text-[10px] text-gray-800 font-mono font-medium leading-tight">{asset.barcode || '-'}</div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${asset._status.color} whitespace-nowrap`}>
                                                            <Icon size={10} /> {asset._status.label}
                                                          </span>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                          <div className="flex gap-2">
                                                            <button onClick={() => onCheck(asset)} className="text-blue-600 hover:text-blue-800 transition" title="ตรวจสอบ"><CheckSquare size={14} /></button>
                                                          </div>
                                                        </td>
                                                      </tr>
                                                    );
                                                  })}
                                                </Fragment>
                                              );
                                            }
                                          });
                                        })()}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==================== List View ====================
function ListView({ assets, onCheck, currentPage, totalPages, setCurrentPage, totalCount }) {
  if (assets.length === 0) return <EmptyState />;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-10">#</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">ชื่อ</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-28">หมายเลขครุภัณฑ์</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">สถานที่</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-28">สถานะ</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assets.map((asset, idx) => {
              const Icon = asset._status.icon;
              return (
                <tr key={asset.asset_id} className="hover:bg-blue-50/40 transition-colors group">
                  <td className="px-3 py-2 text-[10px] text-gray-400">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                  <td className="px-3 py-2 text-xs text-gray-900"><div className="line-clamp-1" title={asset.asset_name}>{asset.asset_name}</div></td>
                  <td className="px-3 py-2 text-[10px] text-gray-500 font-mono">{asset.barcode || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{asset.building_name} ชั้น {asset.floor} ห้อง {asset.room_number}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${asset._status.color}`}>
                      <Icon size={10} /> {asset._status.label}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5 opacity-50 group-hover:opacity-100 transition">
                      <button onClick={() => onCheck(asset)} className="text-blue-600 hover:text-blue-800" title="ตรวจสอบ"><Eye size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
          <p className="text-xs text-gray-500">
            {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} จาก {totalCount}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30"><ChevronLeft size={16} /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-600'}`}>{page}</button>
              );
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Notifications Tab ====================
function NotificationsTab({ notifications, onCheck, urgentPage, setUrgentPage, dueSoonPage, setDueSoonPage }) {
  const ITEMS_PER_PAGE = 50;

  const urgentTotalPages = Math.ceil(notifications.urgent.length / ITEMS_PER_PAGE);
  const paginatedUrgent = notifications.urgent.slice((urgentPage - 1) * ITEMS_PER_PAGE, urgentPage * ITEMS_PER_PAGE);

  const dueSoonTotalPages = Math.ceil(notifications.dueSoon.length / ITEMS_PER_PAGE);
  const paginatedDueSoon = notifications.dueSoon.slice((dueSoonPage - 1) * ITEMS_PER_PAGE, dueSoonPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      {notifications.urgent.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
          <div className="bg-red-50 border-b border-red-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-red-600" />
              <h2 className="font-bold text-red-800">ต้องดำเนินการด่วน ({notifications.urgent.length})</h2>
            </div>
            {urgentTotalPages > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-700 font-medium">หน้า {urgentPage}/{urgentTotalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => setUrgentPage(p => Math.max(1, p - 1))} disabled={urgentPage === 1}
                    className="p-1 rounded bg-white border border-red-200 text-red-600 disabled:opacity-30 hover:bg-red-50 transition"><ChevronLeft size={16} /></button>
                  <button onClick={() => setUrgentPage(p => Math.min(urgentTotalPages, p + 1))} disabled={urgentPage === urgentTotalPages}
                    className="p-1 rounded bg-white border border-red-200 text-red-600 disabled:opacity-30 hover:bg-red-50 transition"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>
          <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
            {paginatedUrgent.map(asset => (
              <NotifRow key={asset.asset_id} asset={asset} onCheck={onCheck} />
            ))}
          </div>
        </div>
      )}

      {notifications.dueSoon.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
          <div className="bg-yellow-50 border-b border-yellow-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-yellow-600" />
              <h2 className="font-bold text-yellow-800">ใกล้กำหนด 7 วัน ({notifications.dueSoon.length})</h2>
            </div>
            {dueSoonTotalPages > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-yellow-700 font-medium">หน้า {dueSoonPage}/{dueSoonTotalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => setDueSoonPage(p => Math.max(1, p - 1))} disabled={dueSoonPage === 1}
                    className="p-1 rounded bg-white border border-yellow-200 text-yellow-600 disabled:opacity-30 hover:bg-yellow-50 transition"><ChevronLeft size={16} /></button>
                  <button onClick={() => setDueSoonPage(p => Math.min(dueSoonTotalPages, p + 1))} disabled={dueSoonPage === dueSoonTotalPages}
                    className="p-1 rounded bg-white border border-yellow-200 text-yellow-600 disabled:opacity-30 hover:bg-yellow-50 transition"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>
          <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
            {paginatedDueSoon.map(asset => (
              <NotifRow key={asset.asset_id} asset={asset} onCheck={onCheck} />
            ))}
          </div>
        </div>
      )}

      {notifications.urgent.length === 0 && notifications.dueSoon.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-green-300" />
          <p className="text-lg text-gray-500 font-medium">ไม่มีการแจ้งเตือน</p>
          <p className="text-sm text-gray-400 mt-1">ทุกอย่างเรียบร้อย</p>
        </div>
      )}
    </div>
  );
}

function NotifRow({ asset, onCheck }) {
  const Icon = asset._status.icon;
  return (
    <div className="p-3 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon size={14} className="text-red-600 flex-shrink-0" />
          <span className="font-semibold text-sm text-gray-800 truncate">{asset.asset_name}</span>
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${asset._status.color}`}>{asset._status.label}</span>
        </div>
        <p className="text-xs text-gray-500 ml-6 truncate">
          {asset.building_name} {asset.floor ? `ชั้น ${asset.floor}` : ''} {asset.room_number ? `ห้อง ${asset.room_number}` : ''}
        </p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <button onClick={() => onCheck(asset)} className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded text-xs font-medium transition">ตรวจ</button>
      </div>
    </div>
  );
}

// ==================== Shared Components ====================
function EmptyState() {
  return (
    <div className="bg-white rounded-xl shadow-md p-12 text-center">
      <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <p className="text-lg text-gray-500">ไม่พบข้อมูลครุภัณฑ์</p>
    </div>
  );
}

function ModalWrapper({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function RoomInfo({ room }) {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
      <p className="font-bold text-gray-800 text-sm">
        {room.building}
        {room.floor ? ` ชั้น ${room.floor}` : ''}
        {room.room ? ` ห้อง ${room.room}` : ''}
      </p>
      <p className="text-xs text-gray-600">{room.assets.length} รายการ</p>
    </div>
  );
}

function RoomAssetList({ assets, icon: Icon = CheckSquare }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto mb-4">
      <p className="text-[10px] font-medium text-gray-500 uppercase mb-2">รายการ:</p>
      <ul className="space-y-1">
        {assets.map(a => (
          <li key={a.asset_id} className="text-xs text-gray-700 flex items-center gap-1.5 py-0.5 border-b border-gray-100 last:border-0">
            <Icon size={12} className="text-blue-600 flex-shrink-0" />
            <span className="truncate flex-1">{a.asset_name}</span>
            <span className="text-[10px] text-gray-500 font-mono pl-2">{a.barcode || '-'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckFormFields({ checkForm, setCheckForm, isRoom }) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">สถานะ{isRoom ? 'ทั้งห้อง' : 'หลังตรวจสอบ'}</label>
        <select value={checkForm.status} onChange={e => setCheckForm(p => ({ ...p, status: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
          {CHECK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">หมายเหตุ</label>
        <textarea value={checkForm.remark} onChange={e => setCheckForm(p => ({ ...p, remark: e.target.value }))}
          placeholder="ระบุรายละเอียดเพิ่มเติม..." rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
    </>
  );
}

function ModalActions({ onSave, onClose, saving, color = 'blue', label }) {
  const colors = {
    blue: 'bg-blue-600 hover:bg-blue-700', green: 'bg-green-600 hover:bg-green-700', purple: 'bg-purple-600 hover:bg-purple-700',
  };
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onSave} disabled={saving}
        className={`flex-1 ${colors[color]} text-white py-2.5 rounded-lg transition font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50`}>
        <Save size={16} /> {saving ? 'กำลังบันทึก...' : label}
      </button>
      <button onClick={onClose}
        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-lg transition font-semibold text-sm">ยกเลิก</button>
    </div>
  );
}