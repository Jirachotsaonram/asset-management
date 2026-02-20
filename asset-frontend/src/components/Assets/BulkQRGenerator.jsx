import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';

export default function BulkQRGenerator({ assets, onClose }) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // ขนาด QR Code (mm)
      const qrSize = 40;
      const margin = 10;
      const cols = 4; // 4 คอลัมน์
      const rows = 6; // 6 แถว
      const spacing = 5;

      let currentPage = 0;
      let currentRow = 0;
      let currentCol = 0;

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];

        // คำนวณตำแหน่ง
        const x = margin + currentCol * (qrSize + spacing);
        const y = margin + currentRow * (qrSize + spacing + 10);

        // ถ้าเกินหน้า
        if (currentRow >= rows) {
          pdf.addPage();
          currentPage++;
          currentRow = 0;
          currentCol = 0;
        }

        // สร้าง QR Code โดยใช้ QRCodeCanvas component
        const qrData = JSON.stringify({
          id: asset.asset_id,
          name: asset.asset_name,
          barcode: asset.barcode,
          status: asset.status,
          dept: asset.department_name,
          faculty: asset.faculty_name,
          price: asset.price,
          date: asset.received_date
        });

        // สร้าง container ชั่วคราวสำหรับ QR Code
        const tempDiv = document.createElement('div');
        tempDiv.id = `qr-temp-${i}-${Date.now()}`;
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '200px';
        tempDiv.style.height = '200px';
        document.body.appendChild(tempDiv);

        // สร้าง QRCodeCanvas โดยใช้ React
        const { createRoot } = await import('react-dom/client');
        const React = await import('react');

        const qrElement = React.createElement(QRCodeCanvas, {
          value: qrData,
          size: 200,
          level: 'H',
          includeMargin: false
        });

        const root = createRoot(tempDiv);
        root.render(qrElement);

        // รอให้ render เสร็จ
        await new Promise(resolve => setTimeout(resolve, 300));

        // ดึง canvas จาก QRCodeCanvas
        const qrCanvas = tempDiv.querySelector('canvas');
        if (!qrCanvas) {
          root.unmount();
          document.body.removeChild(tempDiv);
          throw new Error('ไม่สามารถสร้าง QR Code ได้');
        }

        // แปลง canvas เป็นรูปภาพ
        const imgData = qrCanvas.toDataURL('image/png');

        // ลบ element ชั่วคราว
        root.unmount();
        document.body.removeChild(tempDiv);

        // วาด QR Code ลง PDF
        pdf.addImage(imgData, 'PNG', x, y, qrSize, qrSize);

        // เขียนข้อความใต้ QR
        pdf.setFontSize(8);
        pdf.text(asset.asset_name.substring(0, 20), x, y + qrSize + 4, {
          maxWidth: qrSize
        });
        pdf.setFontSize(7);
        pdf.text(`ID: ${asset.asset_id}`, x, y + qrSize + 8);

        // เลื่อนตำแหน่ง
        currentCol++;
        if (currentCol >= cols) {
          currentCol = 0;
          currentRow++;
        }
      }

      // บันทึก PDF
      pdf.save('QR_Codes_All.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">สร้าง QR Code ทั้งหมด ({assets.length} รายการ)</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">ข้อมูล:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• จำนวนครุภัณฑ์: {assets.length} รายการ</li>
              <li>• จำนวนหน้า: {Math.ceil(assets.length / 24)} หน้า (24 QR/หน้า)</li>
              <li>• ขนาดกระดาษ: A4</li>
              <li>• รูปแบบ: 4 คอลัมน์ x 6 แถว</li>
            </ul>
          </div>

          {/* Preview Grid */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">ตัวอย่าง QR Code:</h3>
            <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
              {assets.slice(0, 12).map((asset) => {
                const qrData = JSON.stringify({
                  id: asset.asset_id,
                  name: asset.asset_name,
                  barcode: asset.barcode,
                  status: asset.status,
                  dept: asset.department_name,
                  faculty: asset.faculty_name,
                  price: asset.price,
                  date: asset.received_date
                });

                return (
                  <div key={asset.asset_id} className="text-center">
                    <QRCodeCanvas
                      value={qrData}
                      size={100}
                      level="H"
                    />
                    <p className="text-xs mt-1 truncate">{asset.asset_name}</p>
                    <p className="text-xs text-gray-500">ID: {asset.asset_id}</p>
                  </div>
                );
              })}
            </div>
            {assets.length > 12 && (
              <p className="text-sm text-gray-500 text-center mt-2">
                ... และอีก {assets.length - 12} รายการ
              </p>
            )}
          </div>

          {/* ปุ่มดำเนินการ */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={generatePDF}
              disabled={generating}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              <span>{generating ? 'กำลังสร้าง...' : 'ดาวน์โหลด PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}