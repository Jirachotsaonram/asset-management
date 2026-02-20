// FILE: src/components/Common/VirtualTable.jsx
// ตารางประสิทธิภาพสูง - รองรับ horizontal scroll, column toggle, sorting, pagination
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Settings, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// ==================== Column Configuration Modal ====================
function ColumnConfigModal({ columns, visibleColumns, onToggle, onClose }) {
    return (
        <div className="absolute right-0 top-12 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-72 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-800">แสดงคอลัมน์</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <div className="space-y-2">
                {columns.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={visibleColumns.includes(col.key)}
                            onChange={() => onToggle(col.key)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{col.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

// ==================== Main VirtualTable Component ====================
export default function VirtualTable({
    columns = [],
    data = [],
    loading = false,
    // Pagination
    totalItems = 0,
    currentPage = 1,
    itemsPerPage = 50,
    onPageChange,
    onItemsPerPageChange,
    // Sorting
    sortKey = null,
    sortOrder = 'asc',
    onSort,
    // Actions
    onRowClick,
    rowActions,
    // Features
    searchable = true,
    searchValue = '',
    onSearchChange,
    showColumnConfig = true,
    stickyFirstColumn = true,
    emptyIcon,
    emptyMessage = 'ไม่พบข้อมูล',
    headerActions,
    // Selection
    selectable = false,
    selectedRows = [],
    onSelectRow,
    onSelectAll,
    // Custom
    rowClassName,
    // Height limit - use this to limit the table height
    maxHeight,
}) {
    const [visibleColumns, setVisibleColumns] = useState(columns.map(c => c.key));
    const [showColumnConfig_, setShowColumnConfig_] = useState(false);
    const tableContainerRef = useRef(null);

    // Reset visible columns when columns change
    useEffect(() => {
        setVisibleColumns(columns.map(c => c.key));
    }, [columns.length]);

    const toggleColumn = useCallback((key) => {
        setVisibleColumns(prev => {
            if (prev.includes(key)) {
                // ต้องมีอย่างน้อย 1 คอลัมน์
                if (prev.length <= 1) return prev;
                return prev.filter(k => k !== key);
            }
            return [...prev, key];
        });
    }, []);

    const activeColumns = useMemo(() => {
        return columns.filter(c => visibleColumns.includes(c.key));
    }, [columns, visibleColumns]);

    // Pagination calculations
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Loading skeleton
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="animate-pulse">
                    <div className="h-12 bg-gray-100 border-b"></div>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-14 border-b border-gray-100 flex items-center px-4 gap-4">
                            {Array.from({ length: 5 }).map((_, j) => (
                                <div key={j} className="h-4 bg-gray-200 rounded flex-1"></div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Header Bar */}
            {(searchable || showColumnConfig || headerActions) && (
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center gap-3">
                    {/* Search */}
                    {searchable && onSearchChange && (
                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="ค้นหา..."
                                className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {searchValue && (
                                <button onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Header Actions */}
                    {headerActions && <div className="flex gap-2">{headerActions}</div>}

                    {/* Column Config */}
                    {showColumnConfig && (
                        <div className="relative ml-auto">
                            <button
                                onClick={() => setShowColumnConfig_(!showColumnConfig_)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                            >
                                <Settings size={14} />
                                <span className="hidden sm:inline">คอลัมน์</span>
                            </button>
                            {showColumnConfig_ && (
                                <ColumnConfigModal
                                    columns={columns}
                                    visibleColumns={visibleColumns}
                                    onToggle={toggleColumn}
                                    onClose={() => setShowColumnConfig_(false)}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Table Container with Horizontal Scroll */}
            <div
                ref={tableContainerRef}
                className="overflow-x-auto scrollbar-light"
                style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
            >
                <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            {/* Select All Checkbox */}
                            {selectable && (
                                <th className="w-10 px-3 py-3 text-center border-b border-gray-200">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.length === data.length && data.length > 0}
                                        onChange={() => onSelectAll?.()}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                </th>
                            )}
                            {activeColumns.map((col, idx) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap
                    ${idx === 0 && stickyFirstColumn ? 'sticky left-0 bg-gray-50 z-20' : ''}
                    ${col.sortable !== false && onSort ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                  `}
                                    style={col.width ? { width: col.width, minWidth: col.width } : { minWidth: col.minWidth || '100px' }}
                                    onClick={() => {
                                        if (col.sortable !== false && onSort) {
                                            onSort(col.key, sortKey === col.key && sortOrder === 'asc' ? 'desc' : 'asc');
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        <span>{col.label}</span>
                                        {col.sortable !== false && onSort && (
                                            <span className="text-gray-400">
                                                {sortKey === col.key ? (
                                                    sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                                ) : (
                                                    <ChevronsUpDown size={12} />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {/* Actions Column */}
                            {rowActions && (
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 sticky right-0 bg-gray-50 z-20 min-w-[120px]">
                                    จัดการ
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.length > 0 ? data.map((row, rowIdx) => (
                            <tr
                                key={row.id || row.asset_id || row.user_id || row.audit_id || row.borrow_id || row.check_id || row.history_id || rowIdx}
                                className={`hover:bg-blue-50/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName ? rowClassName(row) : ''}`}
                                onClick={() => onRowClick?.(row)}
                            >
                                {/* Checkbox */}
                                {selectable && (
                                    <td className="w-10 px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(row.asset_id || row.id)}
                                            onChange={() => onSelectRow?.(row.asset_id || row.id)}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                    </td>
                                )}
                                {activeColumns.map((col, colIdx) => (
                                    <td
                                        key={col.key}
                                        className={`px-4 py-3 text-sm text-gray-700 ${colIdx === 0 && stickyFirstColumn ? 'sticky left-0 bg-white z-10' : ''}`}
                                        style={col.width ? { width: col.width, minWidth: col.width } : { minWidth: col.minWidth || '100px' }}
                                    >
                                        {col.render
                                            ? col.render(row[col.key], row)
                                            : (row[col.key] ?? '-')
                                        }
                                    </td>
                                ))}
                                {/* Actions */}
                                {rowActions && (
                                    <td className="px-4 py-3 text-center sticky right-0 bg-white z-10" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-1">
                                            {rowActions(row)}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={activeColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-4 py-16 text-center">
                                    <div className="flex flex-col items-center text-gray-400">
                                        {emptyIcon && <div className="mb-3">{emptyIcon}</div>}
                                        <p className="text-lg font-medium">{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {onPageChange && totalItems > 0 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>แสดง {startItem.toLocaleString()} - {endItem.toLocaleString()} จาก {totalItems.toLocaleString()} รายการ</span>
                        {onItemsPerPageChange && (
                            <select
                                value={itemsPerPage}
                                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {[25, 50, 100, 200].map(n => (
                                    <option key={n} value={n}>{n} / หน้า</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPageChange(1)}
                            disabled={currentPage <= 1}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {/* Page Numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage >= totalPages}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
