// FILE: src/components/Assets/QRCodeModal.jsx
// รองรับทั้ง QR Code และ Barcode (Code128)
import { X, Download, Printer, QrCode, BarChart3 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useRef, useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';

export default function QRCodeModal({ asset, onClose }) {
  const qrRef = useRef();
  const barcodeRef = useRef();
  const [mode, setMode] = useState('qr'); // 'qr' หรือ 'barcode'

  // ข้อมูลที่จะใส่ใน QR Code
  const qrData = JSON.stringify({
    id: asset.asset_id,
    name: asset.asset_name,
    serial: asset.serial_number,
    barcode: asset.barcode,
    status: asset.status,
    dept: asset.department_name,
    faculty: asset.faculty_name,
    price: asset.price,
    date: asset.received_date
  });

  // ข้อมูลสำหรับ Barcode (ใช้ barcode หรือ asset_id)
  const barcodeData = asset.barcode || `A${asset.asset_id}`;

  // คำนวณปีงบประมาณจากวันที่ตรวจรับ
  const getFiscalYear = (dateStr) => {
    if (!dateStr) return '-';
    // ปีงบประมาณไทย เริ่ม 1 ต.ค. ของปีก่อนหน้า
    const date = new Date(dateStr);
    const year = date.getFullYear() + 543;
    const month = date.getMonth() + 1;
    return month >= 10 ? year + 1 : year;
  };

  // สร้าง Barcode เมื่อเปลี่ยนเป็น barcode mode
  useEffect(() => {
    if (mode === 'barcode' && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, barcodeData, {
          format: 'CODE128',
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 14,
          margin: 10,
          background: '#ffffff'
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [mode, barcodeData]);

  // ดาวน์โหลด QR/Barcode เป็นรูปภาพ
  const downloadCode = () => {
    let canvas;
    if (mode === 'qr') {
      canvas = qrRef.current.querySelector('canvas');
    } else {
      canvas = barcodeRef.current;
    }
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mode === 'qr' ? 'QR' : 'BAR'}_${asset.barcode || asset.asset_id}.png`;
    link.click();
  };

  // พิมพ์ QR/Barcode
  const printCode = () => {
    let imageUrl;
    if (mode === 'qr') {
      const canvas = qrRef.current.querySelector('canvas');
      imageUrl = canvas.toDataURL('image/png');
    } else {
      imageUrl = barcodeRef.current.toDataURL('image/png');
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print ${mode === 'qr' ? 'QR Code' : 'Barcode'} - ${asset.asset_name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
            body {
              display: flex; flex-direction: column; align-items: center;
              justify-content: center; min-height: 100vh; margin: 0;
              font-family: 'Sarabun', 'Segoe UI', Arial, sans-serif;
              background-color: white;
            }
            .container { 
              text-align: center; padding: 15px; border: 1px solid #000; 
              border-radius: 4px; width: 300px;
            }
            img { margin: 5px 0; max-width: 100%; height: auto; }
            h2 { margin: 8px 0; font-size: 14px; color: #000; font-weight: bold; line-height: 1.4; }
            .info-text { margin: 2px 0; font-size: 11px; color: #000; text-align: left; }
            .label { font-weight: bold; }
            .qr-image { width: 140px; height: 140px; }
            .barcode-image { width: 250px; }
            @media print { 
              .no-print { display: none; }
              body { min-height: auto; }
              .container { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- 1. QR Code / Barcode -->
            <img src="${imageUrl}" class="${mode === 'qr' ? 'qr-image' : 'barcode-image'}" />
            
            <!-- 2. ชื่อครุภัณฑ์ -->
            <h2>${asset.asset_name}</h2>
            
            <!-- 3. ราคาต่อหน่วย -->
            <p class="info-text"><span class="label">ราคา:</span> ${asset.price ? Number(asset.price).toLocaleString('th-TH') : '-'} บาท</p>
            
            <!-- 4. ปีงบประมาณ -->
            <p class="info-text"><span class="label">ปีงบประมาณ:</span> ${getFiscalYear(asset.received_date)}</p>
            
            <!-- 5. หน่วยงาน/คณะ -->
            <p class="info-text"><span class="label">หน่วยงาน:</span> ${asset.department_name || '-'}</p>
            <p class="info-text"><span class="label">คณะ:</span> ${asset.faculty_name || '-'}</p>
          </div>
          <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 25px; cursor: pointer; border: none; border-radius: 8px; background: #2563eb; color: white; font-weight: bold;">
              พิมพ์
            </button>
            <button onclick="window.close()" style="margin-left: 10px; padding: 10px 25px; cursor: pointer; border: 1px solid #ccc; border-radius: 8px; background: white; color: #333;">
              ปิด
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="border-b px-6 py-4 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {mode === 'qr' ? 'QR Code' : 'Barcode'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{asset.asset_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Toggle QR / Barcode */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            <button
              onClick={() => setMode('qr')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'qr'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <QrCode size={16} /> QR Code
            </button>
            <button
              onClick={() => setMode('barcode')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'barcode'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <BarChart3 size={16} /> Barcode
            </button>
          </div>

          {/* QR Code / Barcode Display */}
          <div className="flex justify-center mb-5 bg-white p-4 rounded-xl border-2 border-gray-200 min-h-[200px] items-center">
            {mode === 'qr' ? (
              <div ref={qrRef}>
                <QRCodeCanvas
                  value={qrData}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>
            ) : (
              <canvas ref={barcodeRef}></canvas>
            )}
          </div>

          {/* ข้อมูลครุภัณฑ์ */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs">รหัสครุภัณฑ์</span>
                <p className="font-semibold text-gray-800">{asset.asset_id}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Barcode</span>
                <p className="font-semibold text-gray-800">{asset.barcode || '-'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 text-xs">ชื่อครุภัณฑ์</span>
                <p className="font-semibold text-gray-800 line-clamp-2">{asset.asset_name}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 text-xs">Serial Number</span>
                <p className="font-semibold text-gray-800">{asset.serial_number || '-'}</p>
              </div>
            </div>
          </div>

          {/* ปุ่มดำเนินการ */}
          <div className="flex space-x-3">
            <button
              onClick={downloadCode}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              <span>ดาวน์โหลด</span>
            </button>
            <button
              onClick={printCode}
              className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              <Printer className="w-5 h-5" />
              <span>พิมพ์</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}