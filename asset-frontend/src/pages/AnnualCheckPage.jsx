import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import {
    Calendar, CheckCircle2, XCircle, Filter,
    RotateCcw, RefreshCw, Package, Search,
    Settings, Save, CheckSquare, Trash2, HelpCircle, Download,
    BarChart3, AlertCircle, AlertTriangle, Clock, TrendingUp
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import VirtualTable from "../components/Common/VirtualTable";

export default function AnnualCheckPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const canEdit = user?.role === 'Admin' || user?.role === 'Inspector';

    // Settings State
    const [settings, setSettings] = useState({
        annual_check_start: "",
        annual_check_end: ""
    });
    const [savingSettings, setSavingSettings] = useState(false);

    // Asset Data State
    const [assets, setAssets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [searchTerm, setSearchTerm] = useState("");

    // Selection State
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [bulkStatus, setBulkStatus] = useState("ใช้งานได้");
    const [bulkRemark, setBulkRemark] = useState("");

    // Filters
    const [viewFilter, setViewFilter] = useState("unchecked"); // all, checked, unchecked
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() + 543); // พ.ศ. ปัจจุบัน
    const [yearOptions, setYearOptions] = useState([]);

    const periodInfo = useMemo(() => {
        if (!settings.annual_check_start || !settings.annual_check_end) return null;

        const start = new Date(settings.annual_check_start);
        const end = new Date(settings.annual_check_end);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        let status = 'pending';
        let remainingDays = 0;

        if (today < start) {
            status = 'waiting';
            remainingDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
        } else if (today > end) {
            status = 'expired';
            remainingDays = Math.ceil((today - end) / (1000 * 60 * 60 * 24));
        } else {
            status = 'active';
            remainingDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        }

        return { totalDays, status, remainingDays };
    }, [settings.annual_check_start, settings.annual_check_end]);

    useEffect(() => {
        fetchSettings();
        fetchYears();
    }, []);

    const fetchYears = async () => {
        try {
            const response = await api.get("/checks/years");
            if (response.data.success) {
                setYearOptions(response.data.data);
                // ถ้าปีปัจจุบันอยู่ในรายการ ให้เลือกปีปัจจุบันเป็นค่าเริ่มต้น
                const currentBE = new Date().getFullYear() + 543;
                if (response.data.data.includes(currentBE)) {
                    setSelectedYear(currentBE);
                } else if (response.data.data.length > 0) {
                    setSelectedYear(response.data.data[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching years:", error);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, [currentPage, itemsPerPage, viewFilter]);

    const fetchSettings = async () => {
        try {
            const response = await api.get("/settings");
            if (response.data.success) {
                setSettings(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };

    const fetchStats = async () => {
        try {
            const params = new URLSearchParams();
            const currentBE = new Date().getFullYear() + 543;
            if (parseInt(selectedYear) === currentBE) {
                if (settings.annual_check_start) params.set('start_date', settings.annual_check_start);
                if (settings.annual_check_end) params.set('end_date', settings.annual_check_end);
            } else {
                const adYear = parseInt(selectedYear) - 543;
                params.set('start_date', `${adYear}-01-01`);
                params.set('end_date', `${adYear}-12-31`);
            }
            
            const response = await api.get(`/checks/annual-stats?${params.toString()}`);
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    useEffect(() => {
        // Fetch stats whenever settings change or year changes
        fetchStats();
    }, [settings.annual_check_start, settings.annual_check_end, selectedYear]);

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await api.post("/settings", settings);
            toast.success("บันทึกช่วงเวลาตรวจสอบสำเร็จ");
        } catch (error) {
            toast.error("ไม่สามารถบันทึกการตั้งค่าได้");
        } finally {
            setSavingSettings(false);
        }
    };

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', currentPage);
            params.set('limit', itemsPerPage);
            params.set('exclude_status', 'จำหน่ายแล้ว');
            if (searchTerm.trim()) params.set('search', searchTerm.trim());

            if (viewFilter === 'unchecked') {
                params.set('unchecked', '1');
                // ถ้าเลือกปีปัจจุบัน ให้ใช้ช่วงเวลาจาก settings แต่ถ้าไม่ใช่ ให้ใช้ตามปี พ.ศ. ที่เลือก
                const currentBE = new Date().getFullYear() + 543;
                if (parseInt(selectedYear) === currentBE) {
                    if (settings.annual_check_start) params.set('start_date', settings.annual_check_start);
                    if (settings.annual_check_end) params.set('end_date', settings.annual_check_end);
                } else {
                    const adYear = parseInt(selectedYear) - 543;
                    params.set('start_date', `${adYear}-01-01`);
                    params.set('end_date', `${adYear}-12-31`);
                }
            } else if (viewFilter === 'checked') {
                params.set('checked', '1');
                const currentBE = new Date().getFullYear() + 543;
                if (parseInt(selectedYear) === currentBE) {
                    if (settings.annual_check_start) params.set('start_date', settings.annual_check_start);
                    if (settings.annual_check_end) params.set('end_date', settings.annual_check_end);
                } else {
                    const adYear = parseInt(selectedYear) - 543;
                    params.set('start_date', `${adYear}-01-01`);
                    params.set('end_date', `${adYear}-12-31`);
                }
            }

            const response = await api.get(`/assets?${params.toString()}`);
            const data = response.data.data;

            if (data && data.items) {
                setAssets(data.items);
                setTotalItems(data.total);
            } else {
                setAssets(Array.isArray(data) ? data : []);
                setTotalItems(Array.isArray(data) ? data.length : 0);
            }
        } catch (error) {
            toast.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchAssets();
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === assets.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(assets.map(a => a.asset_id)));
        }
    };

    const toggleSelect = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleBulkUpdate = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`ต้องการอัปเดตสถานะครุภัณฑ์จำนวน ${selectedIds.size} รายการ เป็น "${bulkStatus}" หรือไม่?`)) return;

        setIsBulkUpdating(true);
        try {
            // ปรับ check_date ให้เข้าไปอยู่ในช่วงเวลาที่ตั้งไว้ เพื่อป้องกันบัคตรวจแล้วไม่เข้าเกณฑ์
            const today = new Date().toISOString().split('T')[0];
            let checkDate = today;

            if (settings.annual_check_start && settings.annual_check_end) {
                if (today < settings.annual_check_start) {
                    checkDate = settings.annual_check_start;
                } else if (today > settings.annual_check_end) {
                    checkDate = settings.annual_check_end;
                }
            }

            await api.post("/checks/bulk", {
                asset_ids: Array.from(selectedIds),
                check_status: bulkStatus,
                remark: bulkRemark,
                check_date: checkDate
            });
            toast.success("อัปเดตข้อมูลสำเร็จ");
            setSelectedIds(new Set());
            setBulkRemark("");
            fetchAssets();
            fetchStats();
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการอัปเดต");
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handleExportExcel = async (year = null) => {
        try {
            toast.loading("กำลังเตรียมไฟล์ Excel...", { id: 'export-excel' });
            let url = "/reports/export?type=annual_check_history";
            if (year) {
                const adYear = parseInt(year) - 543;
                url += `&year=${adYear}`;
            }

            const response = await api.get(url, {
                responseType: 'blob'
            });
            const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = downloadUrl;
            const filename = year ? `annual_check_history_${year}.xls` : `annual_check_history_all.xls`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("ดาวน์โหลดสำเร็จ", { id: 'export-excel' });
        } catch (error) {
            console.error("Export error:", error);
            toast.error("ไม่สามารถส่งออก Excel ได้", { id: 'export-excel' });
        }
    };

    const columns = useMemo(() => [
        {
            key: 'select',
            label: (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={assets.length > 0 && selectedIds.size === assets.length}
                    onChange={toggleSelectAll}
                />
            ),
            width: '40px',
            render: (val, row) => (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedIds.has(row.asset_id)}
                    onChange={() => toggleSelect(row.asset_id)}
                    onClick={(e) => e.stopPropagation()}
                />
            )
        },
        {
            key: 'barcode', label: 'หมายเลขครุภัณฑ์', minWidth: '150px',
            render: (val, row) => (
                <div>
                    <div className="font-mono text-sm font-bold text-gray-900">{val || row.asset_id}</div>
                    <div className="text-[10px] text-gray-400">ID: {row.asset_id}</div>
                </div>
            )
        },
        {
            key: 'asset_name', label: 'ชื่อครุภัณฑ์', minWidth: '250px',
            render: (val) => <div className="text-sm line-clamp-1">{val}</div>
        },
        {
            key: 'status', label: 'สถานะปัจจุบัน', width: '120px',
            render: (val) => {
                const colors = {
                    'ใช้งานได้': 'bg-green-100 text-green-700',
                    'รอซ่อม': 'bg-yellow-100 text-yellow-700',
                    'รอจำหน่าย': 'bg-orange-100 text-orange-700',
                    'จำหน่ายแล้ว': 'bg-gray-100 text-gray-600',
                    'ไม่พบ': 'bg-red-100 text-red-700',
                };
                return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[val] || 'bg-gray-100'}`}>{val}</span>;
            }
        },
        {
            key: 'department_name', label: 'หน่วยงาน', minWidth: '150px'
        },
        {
            key: 'last_check', label: 'ตรวจสอบล่าสุด', minWidth: '150px',
            render: (val, row) => (
                <div className="text-xs">
                    {row.last_check_date ? (
                        <div className="flex items-center gap-1 text-gray-600">
                            <Calendar size={12} /> {row.last_check_date}
                        </div>
                    ) : <span className="text-gray-400 italic">ยังไม่เคยตรวจ</span>}
                </div>
            )
        }
    ], [assets.length, selectedIds]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CheckSquare className="text-blue-600" />
                        การตรวจสอบครุภัณฑ์ประจำปี
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        ระบุช่วงเวลาและตรวจสอบครุภัณฑ์เพื่อความถูกต้องแม่นยำรายปี
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* ปุ่มเดิม: ประวัติรายปี (ทุกปี) */}
                    <button
                        onClick={() => handleExportExcel()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-bold shadow-lg shadow-emerald-600/20 text-sm"
                    >
                        <Download size={18} />
                        ส่งออก Excel (ประวัติรายปี)
                    </button>

                    {/* ปุ่มใหม่: เลือกปีเฉพาะ */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent font-bold text-blue-600 outline-none cursor-pointer text-sm"
                        >
                            {yearOptions.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => handleExportExcel(selectedYear)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                            title={`ดาวน์โหลดเฉพาะปี ${selectedYear}`}
                        >
                            <Download size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                { label: 'ทั้งหมด', value: stats.total, gradient: 'from-blue-500 to-blue-600', icon: BarChart3 },
                { label: 'ยังไม่ได้ตรวจ', value: stats.unchecked, gradient: 'from-red-500 to-red-600', icon: AlertCircle },
                { label: 'เลยกำหนด', value: stats.overdue, gradient: 'from-orange-500 to-orange-600', icon: AlertTriangle },
                { label: 'ใกล้กำหนด', value: stats.due_soon, gradient: 'from-yellow-500 to-yellow-600', icon: Clock },
                { label: 'ตรวจแล้วในรอบนี้', value: stats.checked, gradient: 'from-emerald-500 to-emerald-600', icon: TrendingUp, pct: stats.total > 0 ? ((stats.checked/stats.total)*100).toFixed(1) : 0 },
                ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.gradient} rounded-xl p-4 text-white shadow-lg`}>
                    <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/80 text-[11px] font-medium">{s.label}</p>
                        <p className="text-2xl font-bold mt-0.5">{s.value?.toLocaleString() || 0}</p>
                        {s.pct !== undefined && (
                        <div className="w-full bg-white/30 rounded-full h-1 mt-2">
                            <div className="bg-white h-1 rounded-full transition-all duration-700 w-full" style={{ maxWidth: `${s.pct}%` }} />
                        </div>
                        )}
                    </div>
                    <s.icon size={28} className="opacity-30" />
                    </div>
                </div>
                ))}
            </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Settings Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <Settings size={18} className="text-gray-400" />
                                กำหนดช่วงเวลาตรวจนับ
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    วันที่เริ่มต้น
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="date"
                                        value={settings.annual_check_start || ""}
                                        onChange={(e) => setSettings(s => ({ ...s, annual_check_start: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    วันที่สิ้นสุด
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="date"
                                        value={settings.annual_check_end || ""}
                                        onChange={(e) => setSettings(s => ({ ...s, annual_check_end: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="mt-2 mb-2">
                                <button onClick={() => {
                                    const y = new Date().getFullYear();
                                    setSettings(s => ({ ...s, annual_check_start: `${y}-01-01`, annual_check_end: `${y}-12-31` }))
                                }} className="w-full text-[11px] bg-blue-50 text-blue-600 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition border border-blue-100">ปีปฏิทินนี้</button>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={savingSettings}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 font-bold shadow-lg shadow-blue-600/20"
                                >
                                    {savingSettings ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                                    บันทึกช่วงเวลา
                                </button>
                            </div>

                            {periodInfo && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-xs font-bold text-gray-500 uppercase">ระยะเวลาทั้งหมด</span>
                                        <span className="text-sm font-bold text-blue-600">{periodInfo.totalDays} วัน</span>
                                    </div>

                                    {periodInfo.status === 'active' && (
                                        <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <span className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                กำลังดำเนินการ
                                            </span>
                                            <span className="text-sm font-bold text-emerald-700">เหลืออีก {periodInfo.remainingDays} วัน</span>
                                        </div>
                                    )}

                                    {periodInfo.status === 'waiting' && (
                                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <span className="text-xs font-bold text-blue-700 uppercase">รอเปิดรอบตรวจ</span>
                                            <span className="text-sm font-bold text-blue-700">ในอีก {periodInfo.remainingDays} วัน</span>
                                        </div>
                                    )}

                                    {periodInfo.status === 'expired' && (
                                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                                            <span className="text-xs font-bold text-red-700 uppercase">หมดเขตแล้ว</span>
                                            <span className="text-sm font-bold text-red-700">เกินมา {periodInfo.remainingDays} วัน</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    <strong>คำแนะนำ:</strong> เมื่อกำหนดช่วงเวลาแล้ว ระบบจะใช้ช่วงเวลานี้ในการคัดกรองครุภัณฑ์ที่ยังไม่ได้รับการตรวจสอบในรอบปีปัจจุบัน
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Action Panel - Visible only when items selected */}
                    {selectedIds.size > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-500 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="p-4 bg-blue-500 text-white flex items-center justify-between">
                                <h2 className="font-bold flex items-center gap-2">
                                    <CheckSquare size={18} />
                                    จัดการแบบกลุ่ม ({selectedIds.size})
                                </h2>
                                <button onClick={() => setSelectedIds(new Set())} className="hover:bg-white/20 p-1 rounded">
                                    <XCircle size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                                        เปลี่ยนสถานะเป็น
                                    </label>
                                    <select
                                        value={bulkStatus}
                                        onChange={(e) => setBulkStatus(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="ใช้งานได้">ใช้งานได้</option>
                                        <option value="รอซ่อม">รอซ่อม</option>
                                        <option value="รอจำหน่าย">รอจำหน่าย</option>
                                        <option value="จำหน่ายแล้ว">จำหน่ายแล้ว</option>
                                        <option value="ไม่พบ">ไม่พบ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                                        หมายเหตุ (ถ้ามี)
                                    </label>
                                    <textarea
                                        value={bulkRemark}
                                        onChange={(e) => setBulkRemark(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        placeholder="ใส่หมายเหตุสำหรับการตรวจสอบครั้งนี้..."
                                    />
                                </div>
                                <button
                                    onClick={handleBulkUpdate}
                                    disabled={isBulkUpdating}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 font-bold"
                                >
                                    {isBulkUpdating ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                    ยืนยันการอัปเดต
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Asset List Table */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="ค้นหาครุภัณฑ์..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={viewFilter}
                                    onChange={(e) => setViewFilter(e.target.value)}
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">ทั้งหมด</option>
                                    <option value="unchecked">ยังไม่ได้ตรวจในปีนี้</option>
                                    <option value="checked">ตรวจแล้วในปีนี้</option>
                                </select>
                                <button
                                    onClick={() => { setCurrentPage(1); fetchAssets(); }}
                                    className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition shadow-sm"
                                >
                                    <RefreshCw size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <VirtualTable
                            columns={columns}
                            data={assets}
                            loading={loading}
                            totalItems={totalItems}
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={setItemsPerPage}
                            maxHeight="calc(100vh - 350px)"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    function handlePageChange(page) {
        setCurrentPage(page);
    }
}
