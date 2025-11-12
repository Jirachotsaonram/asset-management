import { X, Download, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useRef } from 'react';

export default function QRCodeModal({ asset, onClose }) {
  const qrRef = useRef();

  // ข้อมูลที่จะใส่ใน QR Code
  const qrData = JSON.stringify({
    id: asset.asset_id,
    name: asset.asset_name,
    serial: asset.serial_number,
    barcode: asset.barcode
  });

  // ดาวน์โหลด QR Code เป็นรูปภาพ
  const downloadQR = () => {
    const canvas = qrRef.current.querySelector('canvas');
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${asset.barcode || asset.asset_id}.png`;
    link.click();
  };

  // พิมพ์ QR Code
  const printQR = () => {
    const canvas = qrRef.current.querySelector('canvas');
    const url = canvas.toDataURL('image/png');
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${asset.asset_name}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
              padding: 20px;
              border: 2px solid #000;
            }
            img {
              margin: 20px 0;
            }
            h2 {
              margin: 10px 0;
            }
            p {
              margin: 5px 0;
              font-size: 14px;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${asset.asset_name}</h2>
            <img src="${url}" width="256" height="256" />
            <p><strong>รหัส:</strong> ${asset.asset_id}</p>
            <p><strong>Barcode:</strong> ${asset.barcode || '-'}</p>
            <p><strong>Serial:</strong> ${asset.serial_number || '-'}</p>
          </div>
          <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
            พิมพ์
          </button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">QR Code - {asset.asset_name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* QR Code */}
          <div ref={qrRef} className="flex justify-center mb-6 bg-white p-4 rounded-lg border-2 border-gray-200">
            <QRCodeCanvas
              value={qrData}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* ข้อมูลครุภัณฑ์ */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">รหัสครุภัณฑ์:</span>
                <p className="font-semibold">{asset.asset_id}</p>
              </div>
              <div>
                <span className="text-gray-600">Barcode:</span>
                <p className="font-semibold">{asset.barcode || '-'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">ชื่อ:</span>
                <p className="font-semibold">{asset.asset_name}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Serial Number:</span>
                <p className="font-semibold">{asset.serial_number || '-'}</p>
              </div>
            </div>
          </div>

          {/* ปุ่มดำเนินการ */}
          <div className="flex space-x-3">
            <button
              onClick={downloadQR}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>ดาวน์โหลด</span>
            </button>
            <button
              onClick={printQR}
              className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
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