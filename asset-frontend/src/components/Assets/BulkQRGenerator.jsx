import { useState, useRef, useEffect } from 'react';
import { X, Download, FileText, Tag, Check, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

export default function BulkQRGenerator({ assets, onClose, onClear }) {
  const [generating, setGenerating] = useState(false);
  const [printStyle, setPrintStyle] = useState('detailed');

  const getFiscalYear = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear() + 543;
      const month = date.getMonth() + 1;
      return month >= 10 ? year + 1 : year;
    } catch (e) { return '-'; }
  };

  // Helper สำหรับวาดข้อความภาษาไทยเป็นรูปภาพ (Render Thai as Image to avoid font issues in jsPDF)
  const drawThaiText = (text, fontSize = 10, isBold = false) => {
    if (!text) return null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 5; // เพิ่มความละเอียดเพื่อความคมชัด
    const fontName = '"Sarabun", "Tahoma", "leelawadee", "sans-serif"';
    ctx.font = `${isBold ? 'bold' : ''} ${fontSize * scale}px ${fontName}`;

    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * scale * 1.4;

    canvas.width = textWidth + 10;
    canvas.height = textHeight;

    // ต้องเซ็ต font ใหม่หลังจาก resize canvas
    ctx.font = `${isBold ? 'bold' : ''} ${fontSize * scale}px ${fontName}`;
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, canvas.height / 2);

    // แปลงกลับเป็น mm (1mm ~= 3.78px ที่ 96dpi)
    // แต่เราสเกลไว้ 5 เท่า ดังนั้นหารสเกลออกด้วย
    return {
      dataUrl: canvas.toDataURL('image/png'),
      w: (canvas.width / scale) / 3.78,
      h: (canvas.height / scale) / 3.78
    };
  };

  const generatePDF = async () => {
    setGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;

      if (printStyle === 'detailed') {
        const cardWidth = 90;
        const cardHeight = 55;   // เพิ่มความสูงรองรับข้อมูลหน่วยงาน
        const cols = 2;
        const rowsPerPage = 5;
        const spacingX = 5;
        const spacingY = 2;

        for (let i = 0; i < assets.length; i++) {
          const asset = assets[i];
          if (i > 0 && i % (cols * rowsPerPage) === 0) pdf.addPage();

          const col = i % cols;
          const row = Math.floor(i / cols) % rowsPerPage;
          const x = margin + col * (cardWidth + spacingX);
          const y = margin + row * (cardHeight + spacingY);

          pdf.setDrawColor(200);
          pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');

          // ---- Barcode (ไม่แสดงตัวเลขใน canvas เพื่อป้องกันทับกัน) ----
          const barcodeValue = asset.barcode || `${asset.asset_id}`;
          const textLength = barcodeValue.length;
          let dynamicWidth = 2;
          if (textLength > 12) dynamicWidth = 1.6;
          if (textLength > 18) dynamicWidth = 1.3;
          if (textLength > 24) dynamicWidth = 1.0;
          if (textLength > 30) dynamicWidth = 0.8;
          if (textLength > 40) dynamicWidth = 0.6;

          const canvas = document.createElement('canvas');
          JsBarcode(canvas, barcodeValue, {
            format: 'CODE128',
            width: dynamicWidth,
            height: 50,
            displayValue: false,   // ปิดข้อความ เพื่อจัดเองด้านล่าง
            margin: 3,
          });
          const imgBarcode = canvas.toDataURL('image/png');

          const maxBarcodeW = cardWidth - 10;
          const barcodeImgProps = pdf.getImageProperties(imgBarcode);
          const barcodeDisplayW = Math.min(70, maxBarcodeW);
          const barcodeDisplayH = barcodeImgProps.height * (barcodeDisplayW / barcodeImgProps.width);

          const barcodeY = y + 2;
          pdf.addImage(imgBarcode, 'PNG', x + (cardWidth - barcodeDisplayW) / 2, barcodeY, barcodeDisplayW, barcodeDisplayH);

          let currentY = barcodeY + barcodeDisplayH + 1;

          // ---- หมายเลขบาร์โค้ด (กึ่งกลาง, ตัวเล็ก) ----
          const barcodeNumImg = drawThaiText(barcodeValue, 8, false);
          if (barcodeNumImg) {
            const w = Math.min(barcodeNumImg.w, cardWidth - 6);
            const h = barcodeNumImg.h * (w / barcodeNumImg.w);
            pdf.addImage(barcodeNumImg.dataUrl, 'PNG', x + (cardWidth - w) / 2, currentY, w, h);
            currentY += h + 1;
          }

          // ---- ชื่อครุภัณฑ์ (กึ่งกลาง, ตัวหนา) ----
          const nameImg = drawThaiText(asset.asset_name, 10, true);
          if (nameImg) {
            const w = Math.min(nameImg.w, cardWidth - 6);
            const h = nameImg.h * (w / nameImg.w);
            pdf.addImage(nameImg.dataUrl, 'PNG', x + (cardWidth - w) / 2, currentY, w, h);
            currentY += h + 2;
          }

          // ---- ข้อมูลเพิ่มเติม (ชิดซ้าย) ----
          const priceText = `ราคา ${asset.price ? Number(asset.price).toLocaleString('th-TH') : '0'} บาท`;
          const priceImg = drawThaiText(priceText, 9);
          if (priceImg) { pdf.addImage(priceImg.dataUrl, 'PNG', x + 5, currentY, priceImg.w, priceImg.h); currentY += 4.5; }

          const fiscalText = `ปีงบประมาณ ${getFiscalYear(asset.received_date)}`;
          const fiscalImg = drawThaiText(fiscalText, 9);
          if (fiscalImg) { pdf.addImage(fiscalImg.dataUrl, 'PNG', x + 5, currentY, fiscalImg.w, fiscalImg.h); currentY += 4.5; }

          const deptText = `หน่วยงาน ${asset.department_name || '-'}`;
          const deptImg = drawThaiText(deptText, 9);
          if (deptImg) { pdf.addImage(deptImg.dataUrl, 'PNG', x + 5, currentY, deptImg.w, deptImg.h); }
        }    // เอา "คณะ" หรือ "หน่วยงาน" ออกตามที่ผู้ใช้แจ้ง
      } else {
        const barcodeWidth = 55;
        const barcodeHeight = 22;
        const cols = 3;
        const rowsPerPage = 10;
        const spacingX = 8;
        const spacingY = 10;

        for (let i = 0; i < assets.length; i++) {
          const asset = assets[i];
          if (i > 0 && i % (cols * rowsPerPage) === 0) pdf.addPage();

          const col = i % cols;
          const row = Math.floor(i / cols) % rowsPerPage;
          const x = margin + col * (barcodeWidth + spacingX);
          const y = margin + row * (barcodeHeight + spacingY);

          // Barcode Tag Only
          const barcodeValue = asset.barcode || `${asset.asset_id}`;
          const textLength = barcodeValue.length;
          let dynamicWidth = 2;
          if (textLength > 12) dynamicWidth = 1.5;
          if (textLength > 20) dynamicWidth = 1.0;
          if (textLength > 30) dynamicWidth = 0.7;

          const canvas = document.createElement('canvas');
          JsBarcode(canvas, barcodeValue, {
            format: 'CODE128', width: dynamicWidth, height: 60, displayValue: true, fontSize: 18, margin: 5
          });
          const imgBarcode = canvas.toDataURL('image/png');

          // จัดบาร์โค้ดให้พอดีช่อง
          const barcodeImgProps = pdf.getImageProperties(imgBarcode);
          const bW = Math.min(barcodeWidth, barcodeWidth);
          const bH = barcodeImgProps.height * (bW / barcodeImgProps.width);
          pdf.addImage(imgBarcode, 'PNG', x, y, bW, bH);

          // ชื่อครุภัณฑ์ (จัดกลางเสมอ - Standard Font)
          const nameImg = drawThaiText(asset.asset_name, 10, true);
          if (nameImg) {
            const finalW = Math.min(nameImg.w, barcodeWidth);
            const finalH = nameImg.h * (finalW / nameImg.w);
            pdf.addImage(nameImg.dataUrl, 'PNG', x + (barcodeWidth - finalW) / 2, y + bH + 1, finalW, finalH);
          }
        }
      }

      pdf.save(`Assets_Barcodes.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-8 py-5 flex justify-between items-center bg-white border-b">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">พิมพ์บาร์โค้ด ({assets.length})</h2>
            <p className="text-gray-500 text-sm font-medium mt-0.5">เลือกรูปแบบการพิมพ์ที่ต้องการ</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('ต้องการล้างรายการที่รอพิมพ์ทั้งหมดหรือไม่?')) {
                  onClear();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-bold"
            >
              <Trash2 size={16} /> ล้างรายการ
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto bg-gray-50/50 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div
              onClick={() => setPrintStyle('detailed')}
              className={`relative p-6 rounded-2xl cursor-pointer transition-all border-2 flex flex-col gap-4 ${printStyle === 'detailed' ? 'bg-blue-50 border-blue-500 ring-4 ring-blue-500/10' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
            >
              {printStyle === 'detailed' && <div className="absolute top-4 right-4 bg-blue-500 text-white p-1 rounded-full"><Check size={16} /></div>}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${printStyle === 'detailed' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">แบบต้นขั้ว (Detailed)</h3>
                <p className="text-sm text-gray-500">ข้อมูลครบพร้อมชื่อหน่วยงาน (2 คอลัมน์)</p>
              </div>
            </div>

            <div
              onClick={() => setPrintStyle('simple')}
              className={`relative p-6 rounded-2xl cursor-pointer transition-all border-2 flex flex-col gap-4 ${printStyle === 'simple' ? 'bg-blue-50 border-blue-500 ring-4 ring-blue-500/10' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
            >
              {printStyle === 'simple' && <div className="absolute top-4 right-4 bg-blue-500 text-white p-1 rounded-full"><Check size={16} /></div>}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${printStyle === 'simple' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <Tag size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">แบบติดพัสดุ (Tag Only)</h3>
                <p className="text-sm text-gray-500">บาร์โค้ดขนาดมาตรฐาน (3 คอลัมน์)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">ตัวอย่างรายการ</h4>
            <div className="flex flex-wrap gap-4">
              {assets.slice(0, 10).map((asset) => (
                <div key={asset.asset_id} className="p-2 bg-gray-50 rounded-lg border border-gray-100 w-28 flex flex-col items-center">
                  <BarcodePreview value={asset.barcode || `A${asset.asset_id}`} />
                  <p className="text-[9px] font-bold text-gray-800 mt-1 truncate w-full text-center">{asset.asset_name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-white border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-8 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-2xl transition-all">
            ยกเลิก
          </button>
          <button
            onClick={generatePDF}
            disabled={generating}
            className={`px-10 py-3 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/25 hover:bg-blue-700 transition-all flex items-center gap-3 ${generating ? 'opacity-50' : ''}`}
          >
            {generating ? <span>กำลังสร้าง...</span> : <><Download size={22} /><span>ดาวน์โหลด PDF</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}

function BarcodePreview({ value }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: 'CODE128', width: 1, height: 35, displayValue: true, fontSize: 10, background: '#ffffff', margin: 2
        });
      } catch (e) { }
    }
  }, [value]);
  return <canvas ref={canvasRef} className="max-w-full h-auto"></canvas>;
}