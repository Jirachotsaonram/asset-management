import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Upload, FileText, CheckCircle, AlertCircle, Loader, Camera,
    Eye, EyeOff, Package, Database, RotateCcw, Sparkles, Trash2,
    Image as ImageIcon, Plus, Edit3, Check, X
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ============================================================
// Helper: detect category code fragments from OCR noise
// OCR often reads [S30502-0004] as "530502-0004", "3050200004",
// "!530502-000411", "66100025000", etc. These are NOT asset codes.
// Real asset codes are 13 digits like 5130000070003, 6630000260009.
// ============================================================
function isCategoryCodeFragment(code) {
    if (!code) return false;
    // Pattern: starts with 30502 (the category/subcategory code in this document)
    if (/^30502/.test(code)) return true;
    // Pattern: looks like "530502..." — S30502 with S→5
    if (/^530502/.test(code)) return true;
    // Pattern: 10-11 digit codes are rarely real asset codes (real ones are 13 digits)
    if (code.length < 12) return true;
    // Pattern: starts with 00 — unlikely real asset code
    if (/^00/.test(code)) return true;
    return false;
}

// ============================================================
// TABLE PARSER — parse OCR text for ใบรับครุภัณฑ์เข้าคลัง format
// Robust multi-strategy parser for Tesseract OCR output
// ============================================================
function parseAssetTable(text) {
    if (!text) return [];

    // Debug: log raw OCR text to console for troubleshooting
    console.log('=== RAW OCR TEXT ===');
    console.log(text);
    console.log('=== END OCR TEXT ===');

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const assets = [];

    // --- Extract date from header ---
    let docDate = '';
    const dateMatch = text.match(/วันที่[^\d]*(\d{1,2})\s*(?:ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)\s*(\d{4})/i);
    if (dateMatch) {
        const thMonths = {
            'ม.ค': '01', 'มค': '01', 'ก.พ': '02', 'กพ': '02', 'มี.ค': '03', 'มีค': '03',
            'เม.ย': '04', 'เมย': '04', 'พ.ค': '05', 'พค': '05', 'มิ.ย': '06', 'มิย': '06',
            'ก.ค': '07', 'กค': '07', 'ส.ค': '08', 'สค': '08', 'ก.ย': '09', 'กย': '09',
            'ต.ค': '10', 'ตค': '10', 'พ.ย': '11', 'พย': '11', 'ธ.ค': '12', 'ธค': '12'
        };
        const monthStr = text.match(/วันที่[^\d]*\d{1,2}\s*(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)/i);
        if (monthStr) {
            const clean = monthStr[1].replace(/\./g, '').replace(/\s/g, '');
            for (const [k, v] of Object.entries(thMonths)) {
                if (k.replace(/\./g, '') === clean) {
                    let year = parseInt(dateMatch[2]);
                    if (year > 2500) year -= 543;
                    const day = dateMatch[1].padStart(2, '0');
                    docDate = `${year}-${v}-${day}`;
                    break;
                }
            }
        }
    }

    // =============================================================
    // STRATEGY: Multi-pass row detection with fallback
    // =============================================================
    const detectedRows = [];
    const usedLines = new Set();

    // --- Pass 1: "N  XXXXXXXXXXXXX" — row number + 12-15 digit asset code ---
    // Real asset codes are 13 digits (e.g., 5130000070003)
    for (let i = 0; i < lines.length; i++) {
        if (usedLines.has(i)) continue;
        const line = lines[i];
        const m = line.match(/(?:^|[^\d])(\d{1,3})\s+(\d{12,15})(?:\s|$|[^\d-])/);
        if (m) {
            const orderNum = parseInt(m[1]);
            const code = m[2];
            // Skip category code fragments (OCR reads [S30502-0004] as numbers)
            if (isCategoryCodeFragment(code)) continue;
            if (orderNum >= 1 && orderNum <= 500) {
                const matchEnd = m.index + m[0].length;
                detectedRows.push({ lineIdx: i, orderNum, assetCode: code, matchEnd });
                usedLines.add(i);
            }
        }
    }

    // --- Pass 2: Find rows by standalone 12-15 digit asset codes on any line ---
    // Real asset codes are 13 digits; using 12+ to allow OCR noise
    // This runs when Pass 1 found fewer than 3 rows
    if (detectedRows.length < 3) {
        detectedRows.length = 0;
        usedLines.clear();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip header/footer lines
            if (line.match(/ลำดับ|รหัสทรัพย์สิน|รหัสทรัพย์|ราคา.หน่วย|หน่วยนับ|ลงชื่อ|ผู้นำ|หัวหน้า|รวม.*ทั้งสิ้น|มหาวิทยาลัย|ใบรับครุภัณฑ์|คณะเทคโนโลยี|รหัสแผนงาน|รหัสกองทุน|กองทุน|แผนงาน|รหัสหมวด|หมวดครุภัณฑ์|แหล่งเงิน|หน่วยงาน|กิจกรรม|เล่มที่|ปีงบประมาณ|วันที่นำเข้า|รหัสงาน/)) continue;

            // Skip lines that look like category code fragments: [S30502-0004] → "530502-0004", "!530502-000411"
            if (line.match(/^[^a-zA-Z\u0E00-\u0E7F]*[S!|]?\s*30502\s*[-]?\s*0{2,}/i)) continue;

            // Find all 12-15 digit codes on this line (real asset codes are 13 digits)
            const codeMatches = [...line.matchAll(/(?<!\d)(\d{12,15})(?!\d)/g)];
            for (const cm of codeMatches) {
                const code = cm[1];

                // Skip if this code is part of a barcode (has dash after it)
                const afterCode = line.substring(cm.index + code.length);
                if (afterCode.match(/^\s*-\s*\d/)) continue;

                // Skip category code fragments
                if (isCategoryCodeFragment(code)) continue;

                // Skip if already detected
                if (detectedRows.some(r => r.assetCode === code && r.lineIdx === i)) continue;

                // Skip very unlikely codes (all zeros, etc.)
                if (/^0+$/.test(code)) continue;

                // Check surrounding context: price, unit, or sufficient Thai text
                const hasPrice = line.match(/\d{1,3}(?:,\d{3})*\.\d{2}/);
                const hasUnit = line.match(/(?:เครื่อง|ชุด|อัน|ตัว|ตู้|ชิ้น)/);

                if (hasPrice || hasUnit || line.length > 40) {
                    let orderNum = detectedRows.length + 1;
                    const beforeCode = line.substring(0, cm.index);
                    const orderMatch = beforeCode.match(/(\d{1,3})\s*$/);
                    if (orderMatch) {
                        const num = parseInt(orderMatch[1]);
                        if (num >= 1 && num <= 500) orderNum = num;
                    }

                    detectedRows.push({
                        lineIdx: i,
                        orderNum,
                        assetCode: code,
                        matchEnd: cm.index + code.length
                    });
                    usedLines.add(i);
                    break; // one asset code per line
                }
            }
        }
    }

    // --- Pass 3: Find rows by barcode patterns (XXXXX-XXXXX-XXXXX) ---
    // If we still have very few rows, try finding barcode patterns
    if (detectedRows.length === 0) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/ลำดับ|รหัสทรัพย์|ราคา.หน่วย|ลงชื่อ|ผู้นำ|หัวหน้า|รวม.*ทั้งสิ้น/)) continue;

            const barcodeMatch = line.match(/(\d{10,})-(\d{3,6})-(\d{3,6})/);
            if (barcodeMatch) {
                const assetCode = barcodeMatch[1];
                if (!detectedRows.some(r => r.lineIdx === i)) {
                    detectedRows.push({
                        lineIdx: i,
                        orderNum: detectedRows.length + 1,
                        assetCode,
                        matchEnd: barcodeMatch.index + barcodeMatch[0].length
                    });
                }
            }
        }
    }

    // --- Pass 4: Fallback — lines with price patterns ---
    if (detectedRows.length === 0) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/ลำดับ|รหัสทรัพย์|ราคา.หน่วย|ลงชื่อ|ผู้นำ|หัวหน้า|รวม.*ทั้งสิ้น/)) continue;

            const m = line.match(/(?<!\d)(\d{12,15})(?!\d|-)/);
            if (m && !isCategoryCodeFragment(m[1])) {
                const hasPrice = line.match(/\d{1,3}(?:,\d{3})*\.\d{2}/);
                if (hasPrice) {
                    detectedRows.push({
                        lineIdx: i,
                        orderNum: detectedRows.length + 1,
                        assetCode: m[1],
                        matchEnd: m.index + m[0].length
                    });
                }
            }
        }
    }

    // De-duplicate: remove rows where the same asset code appears on the same line
    // (can happen if barcode "5130000070003-30502-00002" is on same line as asset code)
    const uniqueRows = [];
    const seenLineIdx = new Set();
    for (const row of detectedRows) {
        if (!seenLineIdx.has(row.lineIdx)) {
            uniqueRows.push(row);
            seenLineIdx.add(row.lineIdx);
        }
    }

    // Sort by line index
    uniqueRows.sort((a, b) => a.lineIdx - b.lineIdx);

    console.log(`Detected ${uniqueRows.length} asset rows:`, uniqueRows.map(r => ({ line: r.lineIdx, order: r.orderNum, code: r.assetCode })));

    // --- For each detected row, collect text and extract fields ---
    for (let r = 0; r < uniqueRows.length; r++) {
        const row = uniqueRows[r];
        const nextLineIdx = r + 1 < uniqueRows.length ? uniqueRows[r + 1].lineIdx : lines.length;

        // Collect text from this line (after match) and following lines until next row
        let rowText = lines[row.lineIdx].substring(row.matchEnd);
        // Also include text before the asset code on the same line (may have item name)
        const beforeText = lines[row.lineIdx].substring(0, Math.max(0, row.matchEnd - row.assetCode.length - 5));

        for (let j = row.lineIdx + 1; j < nextLineIdx && j < lines.length; j++) {
            const line = lines[j];
            // Break on footer patterns
            if (line.match(/ลงชื่อ|ผู้นำเข้า|หัวหน้า|รวม.*ทั้งสิ้น/)) break;
            // Break on header patterns (next page header)
            if (line.match(/มหาวิทยาลัย|ใบรับครุภัณฑ์เข้าคลัง|คณะเทคโนโลยี/)) break;
            rowText += ' ' + line;
        }

        // Also prepend text before match if it's on the same line
        const fullRowText = (beforeText ? beforeText + ' ' : '') + row.assetCode + ' ' + rowText;

        // --- Extract fields from rowText ---
        const asset = {
            id: Date.now() + r + Math.random(),
            asset_name: '',
            serial_number: row.assetCode,
            quantity: 1,
            unit: 'เครื่อง',
            price: '',
            received_date: docDate,
            department_id: '',
            location_id: '',
            status: 'ใช้งานได้',
            barcode: '',
            description: '',
            reference_number: ''
        };

        // Price: number with commas and .00 (e.g., "5,000.00" or "20,000.00")
        const priceMatch = rowText.match(/(\d{1,3}(?:,\d{3})*\.\d{2})/);
        if (priceMatch) {
            asset.price = priceMatch[1].replace(/,/g, '');
        }

        // Unit: เครื่อง, ชุด, อัน, ตัว, ตู้, ชิ้น
        const unitMatch = rowText.match(/(เครื่อง|ชุด|อัน|ตัว|ตู้|ชิ้น)/);
        if (unitMatch) {
            asset.unit = unitMatch[1];
        }

        // Asset/barcode number (หมายเลขครุภัณฑ์): code with dashes like "5130000070003-30502-00003"
        // OCR often introduces spaces, wrong chars, or completely drops dashes
        // Strategy 1: strict match in row text
        let assetNumMatch = rowText.match(/(\d{10,})\s*[-–—]\s*(\d{3,6})\s*[-–—]\s*(\d{3,6})/);
        if (assetNumMatch) {
            asset.barcode = `${assetNumMatch[1]}-${assetNumMatch[2]}-${assetNumMatch[3]}`;
        }
        // Strategy 2: flexible separators (spaces only, no dash needed)
        if (!asset.barcode) {
            const bm2 = rowText.match(/(\d{12,15})\s+(\d{4,6})\s*[-–—]?\s*(\d{4,6})/);
            if (bm2 && !isCategoryCodeFragment(bm2[1])) {
                asset.barcode = `${bm2[1]}-${bm2[2]}-${bm2[3]}`;
            }
        }
        // Strategy 3: search ALL lines for any barcode pattern matching this row's asset code
        if (!asset.barcode) {
            const fullText = lines.join(' ');
            // Find all barcode-like patterns in the full text with flexible separators
            const barcodePatterns = [...fullText.matchAll(/(\d{12,15})\s*[-–—]\s*(\d{4,6})\s*[-–—]\s*(\d{4,6})/g)];
            for (const bp of barcodePatterns) {
                const bpCode = bp[1];
                // Match if the barcode starts with same first 7+ digits as the asset code
                if (bpCode === row.assetCode ||
                    (bpCode.length >= 12 && row.assetCode.length >= 12 &&
                        bpCode.substring(0, 7) === row.assetCode.substring(0, 7))) {
                    const candidateBarcode = `${bpCode}-${bp[2]}-${bp[3]}`;
                    // Don't use barcodes already assigned to earlier rows
                    const alreadyUsed = assets.some(a => a.barcode === candidateBarcode);
                    if (!alreadyUsed) {
                        asset.barcode = candidateBarcode;
                        break;
                    }
                }
            }
        }
        // Strategy 4: OCR may completely merge the barcode with no separators
        // e.g., "513000007000330502 00002" or "5130000070003 3050200002"
        if (!asset.barcode) {
            // Search for the asset code followed by department code (30502) within proximity
            const escapedCode = row.assetCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const merged = rowText.match(new RegExp(escapedCode + '\\s*[-–—]?\\s*3050[12]\\s*[-–—]?\\s*(\\d{4,6})'));
            if (merged) {
                const deptCode = rowText.match(new RegExp(escapedCode + '\\s*[-–—]?\\s*(3050[12])'));
                if (deptCode) {
                    asset.barcode = `${row.assetCode}-${deptCode[1]}-${merged[1]}`;
                }
            }
        }
        // Strategy 5: search full text for asset code near "30502" pattern 
        if (!asset.barcode) {
            for (const line of lines) {
                if (!line.includes(row.assetCode)) continue;
                // Find "30502" after the asset code on the same line
                const idx = line.indexOf(row.assetCode);
                const afterAsset = line.substring(idx + row.assetCode.length);
                const deptMatch = afterAsset.match(/\s*[-–—]?\s*(3050[012])\s*[-–—]?\s*(\d{4,6})/);
                if (deptMatch) {
                    const candidateBarcode = `${row.assetCode}-${deptMatch[1]}-${deptMatch[2]}`;
                    const alreadyUsed = assets.some(a => a.barcode === candidateBarcode);
                    if (!alreadyUsed) {
                        asset.barcode = candidateBarcode;
                        break;
                    }
                }
            }
        }

        console.log(`Row ${r + 1} (${row.assetCode}): barcode=${asset.barcode || 'NOT FOUND'}`);

        // Reference number (อ้างอิงใบตรวจรับ): typically 13-digit number
        // Look for it specifically — exclude the asset code itself
        const allNums = [...rowText.matchAll(/(?<!\d)(\d{13})(?!\d|-)/g)];
        for (const nm of allNums) {
            if (nm[1] !== row.assetCode && !nm[1].includes('-')) {
                asset.reference_number = nm[1];
                break;
            }
        }

        // Description: text after คุณสมบัติ or คุณสมบัต
        const descMatch = rowText.match(/คุณสมบัต[ิี]?\s*[:;\-]?\s*(.+?)(?=\d{10,}-|\b\d{13}\b|หมายเลข|$)/i);
        if (descMatch) {
            asset.description = descMatch[1].trim().replace(/\s+/g, ' ').substring(0, 500);
        }

        // Asset name: try to extract the item name from fullRowText
        // Remove known extracted parts to isolate the name
        let nameText = fullRowText;
        // Remove the asset code itself
        nameText = nameText.replace(new RegExp(row.assetCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
        // Remove price
        if (priceMatch) nameText = nameText.replace(priceMatch[0], '');
        // Remove barcode number
        if (asset.barcode) nameText = nameText.replace(asset.barcode, '');
        // Remove reference numbers
        if (asset.reference_number) nameText = nameText.replace(asset.reference_number, '');
        // Remove description part
        if (descMatch) nameText = nameText.replace(descMatch[0], '');
        // Remove unit words
        nameText = nameText.replace(/(เครื่อง|ชุด|อัน|ตัว|ตู้|ชิ้น)/g, '');
        // Remove คุณสมบัติ header and everything after
        nameText = nameText.replace(/คุณสมบัต[ิี]?.*/i, '');
        // Clean up numbers that look like asset codes (10+ digits)
        nameText = nameText.replace(/\b\d{10,}\b/g, '');
        // Remove order numbers at beginning
        nameText = nameText.replace(/^\s*\d{1,3}\s+/, '');
        // Clean leftover symbols and whitespace
        nameText = nameText.replace(/[|/\\[\]{}()]/g, ' ');
        nameText = nameText.replace(/\s+/g, ' ').trim();
        // Remove leading/trailing punctuation
        nameText = nameText.replace(/^[\s,.\-:;]+/, '').replace(/[\s,.\-:;]+$/, '');

        // Take only the first meaningful phrase as asset name (before long descriptions)
        // Split on common separators and take the first meaningful chunk
        const nameParts = nameText.split(/(?:ครุภัณฑ์ก่อสร้าง|ครุภัณฑ์สำนักงาน|ครุภัณฑ์โรงงาน|ครุภัณฑ์การศึกษา|\[S\d+)/);
        if (nameParts[0] && nameParts[0].trim().length > 2) {
            nameText = nameParts[0].trim();
        }

        if (nameText.length > 2) {
            asset.asset_name = nameText.substring(0, 200);
        }

        assets.push(asset);
    }

    return assets;
}

// ============================================================
// OCR IMPORT TAB COMPONENT — Multi-row version
// ============================================================
export default function OcrImportTab() {
    const [images, setImages] = useState([]);
    const [ocrText, setOcrText] = useState('');
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatus, setOcrStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showRawText, setShowRawText] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [parsedAssets, setParsedAssets] = useState([]);
    const [isValidated, setIsValidated] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [editingId, setEditingId] = useState(null);
    const fileInputRef = useRef(null);

    // Reference data
    const [departments, setDepartments] = useState([]);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [deptRes, locRes] = await Promise.all([
                    api.get('/departments'),
                    api.get('/locations')
                ]);
                if (deptRes.data.success) setDepartments(deptRes.data.data || []);
                if (locRes.data.success) setLocations(locRes.data.data || []);
            } catch (e) { console.error('Load refs error', e); }
        };
        load();
    }, []);

    // --- Drag & Drop ---
    const onDragEnter = useCallback(e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const onDragLeave = useCallback(e => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget.contains(e.relatedTarget)) return; setIsDragging(false); }, []);
    const onDragOver = useCallback(e => { e.preventDefault(); e.stopPropagation(); }, []);
    const onDrop = useCallback(e => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length) processImages(files);
    }, []);

    const handleFileSelect = e => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
        if (files.length) processImages(files);
    };

    // --- Process multiple images ---
    const processImages = async (files) => {
        const newImages = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
        setImages(prev => [...prev, ...newImages]);

        for (const file of files) {
            await runOcr(file);
        }
    };

    // --- Run Tesseract OCR ---
    const runOcr = async (file) => {
        setIsProcessing(true);
        setOcrProgress(0);
        setOcrStatus('กำลังเตรียม OCR...');

        try {
            const worker = await Tesseract.createWorker('tha+eng', 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setOcrProgress(Math.round((m.progress || 0) * 100));
                        setOcrStatus('กำลังอ่านข้อความ...');
                    } else if (m.status === 'loading language traineddata') {
                        setOcrStatus('กำลังโหลดภาษา...');
                        setOcrProgress(Math.round((m.progress || 0) * 50));
                    } else {
                        setOcrStatus(m.status || 'กำลังประมวลผล...');
                    }
                }
            });

            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            setOcrText(prev => prev ? prev + '\n---\n' + text : text);
            setOcrProgress(100);
            setOcrStatus('อ่านข้อความสำเร็จ');

            // Parse and add rows
            const newAssets = parseAssetTable(text);
            if (newAssets.length > 0) {
                setParsedAssets(prev => [...prev, ...newAssets]);
                toast.success(`พบ ${newAssets.length} รายการครุภัณฑ์`);
            } else {
                toast.error('ไม่พบรายการครุภัณฑ์ในเอกสาร — กรุณาตรวจสอบรูปภาพ');
            }
        } catch (err) {
            console.error('OCR error:', err);
            toast.error('ไม่สามารถอ่านข้อความจากรูปภาพได้');
            setOcrStatus('เกิดข้อผิดพลาด');
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Edit row ---
    const updateAsset = (id, field, value) => {
        setParsedAssets(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const removeAsset = (id) => {
        setParsedAssets(prev => prev.filter(a => a.id !== id));
        setIsValidated(false);
    };

    // --- Validate results ---
    const handleValidate = async () => {
        const rows = parsedAssets.map(({ id, ...rest }) => rest);
        if (rows.length === 0) return;

        setLoading(true);
        try {
            const res = await api.post('/import/validate', { rows });
            if (res.data.success) {
                const { invalid } = res.data.data;
                const errorsMap = {};
                invalid.forEach(item => {
                    // Match by index (rows share the same order)
                    const assetId = parsedAssets[item.row - 1]?.id;
                    if (assetId) {
                        errorsMap[assetId] = item.errors;
                    }
                });
                setValidationErrors(errorsMap);
                setIsValidated(true);

                if (Object.keys(errorsMap).length > 0) {
                    toast.error(`พบข้อมูลที่มีข้อผิดพลาด ${Object.keys(errorsMap).length} รายการ`);
                } else {
                    toast.success('ตรวจสอบข้อมูลเรียบร้อย ไม่พบรายการซ้ำ');
                }
            }
        } catch (err) {
            console.error('Validation error:', err);
            toast.error('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    // --- Import all ---
    const handleImport = async () => {
        const validAssets = parsedAssets.filter(a => a.asset_name.trim());
        if (validAssets.length === 0) {
            toast.error('ไม่มีรายการที่มีชื่อครุภัณฑ์');
            return;
        }

        if (!isValidated) {
            toast.error('กรุณากดปุ่ม "ตรวจสอบข้อมูล" ก่อนนำเข้า');
            return;
        }

        const hasErrors = Object.keys(validationErrors).length > 0;
        if (hasErrors) {
            if (!window.confirm(`พบข้อมูลที่มีข้อผิดพลาด ${Object.keys(validationErrors).length} รายการ (เช่น รายการซ้ำ) รายการเหล่านี้จะถูกข้ามไป ต้องการดำเนินการต่อหรือไม่?`)) {
                return;
            }
        }

        setLoading(true);
        try {
            const rows = validAssets.map(({ id, ...rest }) => rest);
            const importRes = await api.post('/import/assets', { rows });
            const summary = importRes.data.data?.summary;

            if (summary?.success_count > 0) {
                toast.success(`นำเข้าสำเร็จ ${summary.success_count} รายการ`);
                if (summary.failed_count > 0) {
                    toast.error(`ล้มเหลว ${summary.failed_count} รายการ`);
                }
                handleReset();
            } else {
                toast.error('นำเข้าไม่สำเร็จ');
            }
        } catch (err) {
            console.error('Import error:', err);
            toast.error('เกิดข้อผิดพลาดในการนำเข้า');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setImages([]);
        setOcrText('');
        setOcrProgress(0);
        setOcrStatus('');
        setIsProcessing(false);
        setParsedAssets([]);
        setIsValidated(false);
        setValidationErrors({});
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatLocation = loc => {
        if (!loc) return '';
        return `${loc.building_name || ''} ชั้น ${loc.floor || '-'} ห้อง ${loc.room_number || '-'}`;
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <div className="card p-8">
                <div className="max-w-3xl mx-auto">
                    {/* Info */}
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="bg-purple-100 p-2.5 rounded-xl">
                                <Camera className="text-purple-600" size={22} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">สแกนเอกสาร ใบรับครุภัณฑ์เข้าคลัง</h3>
                                <p className="text-sm text-gray-600">
                                    อัปโหลดรูปภาพเอกสารใบรับครุภัณฑ์ ระบบจะอ่านตารางอัตโนมัติ รองรับหลายภาพ/หลายหน้า
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Drop zone */}
                    <div
                        onDragEnter={onDragEnter}
                        onDragLeave={onDragLeave}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${isDragging
                            ? 'border-purple-500 bg-purple-50 scale-[1.02]'
                            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="ocr-upload"
                        />
                        <label htmlFor="ocr-upload" className="cursor-pointer block">
                            <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-purple-100' : 'bg-gray-100'
                                }`}>
                                <ImageIcon className={`w-8 h-8 ${isDragging ? 'text-purple-600' : 'text-gray-400'}`} />
                            </div>
                            <p className="text-base font-semibold text-gray-700 mb-1">
                                {isDragging ? 'วางรูปภาพที่นี่' : images.length > 0 ? 'เพิ่มรูปภาพอีก' : 'คลิกเพื่อเลือกรูปภาพเอกสาร'}
                            </p>
                            <p className="text-sm text-gray-500">หรือลากไฟล์มาวางที่นี่ • รองรับหลายภาพ</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP</p>
                        </label>
                    </div>
                </div>
            </div>

            {/* Processing indicator */}
            {isProcessing && (
                <div className="card p-6">
                    <div className="flex flex-col items-center py-4">
                        <div className="w-14 h-14 relative mb-3">
                            <div className="absolute inset-0 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            <Sparkles className="absolute inset-2.5 text-purple-600" size={24} />
                        </div>
                        <p className="text-gray-700 font-medium mb-2">{ocrStatus}</p>
                        <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${ocrProgress}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{ocrProgress}%</p>
                    </div>
                </div>
            )}

            {/* Image previews */}
            {images.length > 0 && !isProcessing && (
                <div className="card overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <ImageIcon size={18} className="text-purple-600" />
                            รูปภาพที่สแกน ({images.length} ภาพ)
                        </h3>
                        <div className="flex gap-2">
                            {ocrText && (
                                <button onClick={() => setShowRawText(!showRawText)} className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1">
                                    {showRawText ? <EyeOff size={14} /> : <Eye size={14} />}
                                    {showRawText ? 'ซ่อนข้อความดิบ' : 'ดูข้อความดิบ'}
                                </button>
                            )}
                            <button onClick={handleReset} className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1">
                                <RotateCcw size={14} /> เริ่มใหม่
                            </button>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {images.map((img, idx) => (
                                <img key={idx} src={img.preview} alt={`Page ${idx + 1}`}
                                    className="h-32 rounded-lg border border-gray-200 object-contain bg-gray-50 flex-shrink-0" />
                            ))}
                        </div>
                    </div>
                    {showRawText && ocrText && (
                        <div className="p-4 border-t border-gray-100">
                            <pre className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 whitespace-pre-wrap max-h-[250px] overflow-y-auto font-mono border border-gray-200">
                                {ocrText}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* Parsed Assets Table */}
            {parsedAssets.length > 0 && !isProcessing && (
                <div className="card overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Package size={20} className="text-purple-600" />
                                    รายการครุภัณฑ์ที่พบ ({parsedAssets.length} รายการ)
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">ตรวจสอบและแก้ไขข้อมูลก่อนนำเข้า คลิกที่แถวเพื่อแก้ไข</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleValidate}
                                    disabled={loading || isProcessing || parsedAssets.length === 0}
                                    className={`btn-secondary text-sm px-4 py-2 flex items-center gap-2 ${isValidated ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
                                >
                                    {loading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} className={isValidated ? 'text-green-500' : ''} />}
                                    {isValidated ? 'ตรวจสอบแล้ว' : 'ตรวจสอบข้อมูล / เช็ครายการซ้ำ'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">#</th>
                                    <th className="px-4 py-3 text-left font-medium">ชื่อครุภัณฑ์</th>
                                    <th className="px-4 py-3 text-left font-medium">รหัสทรัพย์สิน</th>
                                    <th className="px-4 py-3 text-right font-medium">ราคา</th>
                                    <th className="px-4 py-3 text-left font-medium">หน่วย</th>
                                    <th className="px-4 py-3 text-left font-medium">หมายเลขครุภัณฑ์</th>
                                    <th className="px-4 py-3 text-left font-medium">อ้างอิง</th>
                                    <th className="px-4 py-3 text-left font-medium">คุณสมบัติ</th>
                                    <th className="px-4 py-3 text-center font-medium w-20">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {parsedAssets.map((asset, idx) => (
                                    <tr key={asset.id}
                                        className={`hover:bg-purple-50 transition-colors ${editingId === asset.id ? 'bg-purple-50' : ''} ${validationErrors[asset.id] ? 'bg-red-50' : ''}`}
                                        onClick={() => setEditingId(editingId === asset.id ? null : asset.id)}
                                    >
                                        <td className="px-4 py-3 relative">
                                            {validationErrors[asset.id] && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" title={validationErrors[asset.id].join('\n')}></div>
                                            )}
                                            <span className={validationErrors[asset.id] ? 'text-red-600 font-bold' : 'text-gray-500'}>{idx + 1}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {editingId === asset.id ? (
                                                <input type="text" value={asset.asset_name}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={e => { updateAsset(asset.id, 'asset_name', e.target.value); setIsValidated(false); }}
                                                    className="w-full px-2 py-1 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{asset.asset_name || <span className="text-red-400 italic">ไม่มีชื่อ</span>}</span>
                                                    {validationErrors[asset.id] && (
                                                        <span className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                                                            <AlertCircle size={10} />
                                                            {validationErrors[asset.id][0]}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                            {editingId === asset.id ? (
                                                <input type="text" value={asset.serial_number}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={e => updateAsset(asset.id, 'serial_number', e.target.value)}
                                                    className="w-full px-2 py-1 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
                                            ) : asset.serial_number}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {editingId === asset.id ? (
                                                <input type="number" value={asset.price} step="0.01"
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={e => updateAsset(asset.id, 'price', e.target.value)}
                                                    className="w-24 px-2 py-1 border border-purple-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-purple-500" />
                                            ) : (
                                                asset.price ? Number(asset.price).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {editingId === asset.id ? (
                                                <select value={asset.unit}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={e => updateAsset(asset.id, 'unit', e.target.value)}
                                                    className="px-2 py-1 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                                                    <option value="เครื่อง">เครื่อง</option>
                                                    <option value="ชุด">ชุด</option>
                                                    <option value="อัน">อัน</option>
                                                    <option value="ตัว">ตัว</option>
                                                    <option value="ตู้">ตู้</option>
                                                </select>
                                            ) : asset.unit}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                            {editingId === asset.id ? (
                                                <input type="text" value={asset.barcode}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={e => updateAsset(asset.id, 'barcode', e.target.value)}
                                                    className="w-full px-2 py-1 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
                                            ) : (asset.barcode || '-')}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                            {editingId === asset.id ? (
                                                <input type="text" value={asset.reference_number}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={e => updateAsset(asset.id, 'reference_number', e.target.value)}
                                                    className="w-full px-2 py-1 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
                                            ) : (asset.reference_number || '-')}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                                            {editingId === asset.id ? (
                                                <input type="text" value={asset.description}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={e => updateAsset(asset.id, 'description', e.target.value)}
                                                    className="w-full px-2 py-1 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
                                            ) : (asset.description ? asset.description.substring(0, 50) + (asset.description.length > 50 ? '...' : '') : '-')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={e => { e.stopPropagation(); removeAsset(asset.id); }}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="ลบรายการ"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Batch settings */}
                    <div className="p-5 border-t border-gray-100 bg-gray-50">
                        <p className="text-sm font-medium text-gray-700 mb-3">ตั้งค่าเพิ่มเติม (ใช้กับทุกรายการ)</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">หน่วยงาน</label>
                                <select
                                    onChange={e => {
                                        const val = e.target.value;
                                        setParsedAssets(prev => prev.map(a => ({ ...a, department_id: val })));
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                                    <option value="">-- เลือกหน่วยงาน --</option>
                                    {departments.map(d => (
                                        <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">สถานที่</label>
                                <select
                                    onChange={e => {
                                        const val = e.target.value;
                                        setParsedAssets(prev => prev.map(a => ({ ...a, location_id: val })));
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                                    <option value="">-- เลือกสถานที่ --</option>
                                    {locations.map(l => (
                                        <option key={l.location_id} value={l.location_id}>{formatLocation(l)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">สถานะ</label>
                                <select
                                    onChange={e => {
                                        const val = e.target.value;
                                        setParsedAssets(prev => prev.map(a => ({ ...a, status: val })));
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                                    <option value="ใช้งานได้">ใช้งานได้</option>
                                    <option value="รอซ่อม">รอซ่อม</option>
                                    <option value="รอจำหน่าย">รอจำหน่าย</option>
                                    <option value="จำหน่ายแล้ว">จำหน่ายแล้ว</option>
                                    <option value="ไม่พบ">ไม่พบ</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-5 border-t border-gray-100 flex gap-3">
                        <button onClick={handleReset} className="btn-secondary flex-1">ยกเลิก</button>
                        <button
                            onClick={handleImport}
                            disabled={loading || parsedAssets.filter(a => a.asset_name.trim()).length === 0}
                            className="btn-primary flex-1 justify-center bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        >
                            {loading ? (
                                <><Loader size={18} className="animate-spin" /> กำลังนำเข้า...</>
                            ) : (
                                <><Database size={18} /> นำเข้า {parsedAssets.filter(a => a.asset_name.trim()).length} รายการ</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Empty state when scanned but no rows found */}
            {!isProcessing && images.length > 0 && parsedAssets.length === 0 && ocrText && (
                <div className="card p-8 text-center">
                    <AlertCircle size={48} className="mx-auto mb-3 text-amber-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่พบรายการครุภัณฑ์ในเอกสาร</h3>
                    <p className="text-sm text-gray-500 mb-4">ลองตรวจสอบว่ารูปภาพชัดและถ่ายตรง หรือเลือกรูปใหม่</p>
                    <button onClick={handleReset} className="btn-secondary mx-auto">
                        <RotateCcw size={16} /> เลือกรูปใหม่
                    </button>
                </div>
            )}
        </div>
    );
}
