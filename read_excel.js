const XLSX = require('xlsx');
const path = require('path');

// Check the first data file - 3 มิติ sheet 1
const f1 = 'data/ข้อมูลที่นำเข้า สแกน/2567-ครุภัณฑ์ 3 มิติ (IT).xlsx';
const wb1 = XLSX.readFile(path.join(__dirname, f1));

console.log('=== FILE 1: ครุภัณฑ์ 3 มิติ ===');
console.log('Sheets:', wb1.SheetNames);

// Sheet 1: ครุภัณฑ์ 3 มิติ IT 2567
const ws1 = wb1.Sheets[wb1.SheetNames[0]];
const data1 = XLSX.utils.sheet_to_json(ws1, { header: 1, defval: '' });
console.log('\n--- Sheet 1 header search ---');
for (let i = 0; i < Math.min(5, data1.length); i++) {
    const row = data1[i];
    const nonEmpty = row.filter(v => v !== '').length;
    console.log(`Row ${i}: ${nonEmpty} non-empty cells - ${JSON.stringify(row.filter(v => v !== '').slice(0, 5))}`);
}

// Show a data row fully from sheet 1
console.log('\n--- Sheet 1 Row 3 (first data row) - all non-empty ---');
const row3 = data1[3];
row3.forEach((v, i) => { if (v !== '') console.log(`  col[${i}] = ${JSON.stringify(v)}`); });

// Sheet 2
const ws2 = wb1.Sheets[wb1.SheetNames[1]];
const data2 = XLSX.utils.sheet_to_json(ws2, { header: 1, defval: '' });
console.log('\n--- Sheet 2 header search ---');
for (let i = 0; i < Math.min(5, data2.length); i++) {
    const row = data2[i];
    const nonEmpty = row.filter(v => v !== '').length;
    console.log(`Row ${i}: ${nonEmpty} non-empty cells - ${JSON.stringify(row.filter(v => v !== '').slice(0, 5))}`);
}
console.log('\n--- Sheet 2 Row 3 (first data row) - all non-empty ---');
const row3s2 = data2[3];
row3s2.forEach((v, i) => { if (v !== '') console.log(`  col[${i}] = ${JSON.stringify(v)}`); });

// File 2
const f2 = 'data/ข้อมูลที่นำเข้า สแกน/2567-ครุภัณฑ์ระบบเก่า (IT).xlsx';
const wb2 = XLSX.readFile(path.join(__dirname, f2));
console.log('\n\n=== FILE 2: ครุภัณฑ์ระบบเก่า ===');
console.log('Sheets:', wb2.SheetNames);

// Sheet 1
const ws3 = wb2.Sheets[wb2.SheetNames[0]];
const data3 = XLSX.utils.sheet_to_json(ws3, { header: 1, defval: '' });
console.log('\n--- Sheet 1 header search ---');
for (let i = 0; i < Math.min(5, data3.length); i++) {
    const row = data3[i];
    const nonEmpty = row.filter(v => v !== '').length;
    console.log(`Row ${i}: ${nonEmpty} non-empty cells - ${JSON.stringify(row.filter(v => v !== '').slice(0, 5))}`);
}
console.log('\n--- Sheet 1 header row (row 3) ---');
data3[3].forEach((v, i) => { if (v !== '') console.log(`  col[${i}] = ${JSON.stringify(v)}`); });
console.log('\n--- Sheet 1 Row 4 (first data row) - all non-empty ---');
data3[4].forEach((v, i) => { if (v !== '') console.log(`  col[${i}] = ${JSON.stringify(v)}`); });

// Check date format samples
console.log('\n\n=== DATE FORMAT SAMPLES ===');
console.log('File 1 Sheet2 Row3 dates:');
// From file1-sheet2: col[15] = วันที่รับเข้าคลัง, col[18] = วันที่เบิก, col[20] = วันที่ส่งของ
console.log('  received_date (col15):', data1[3][15]);
console.log('  เบิก (col18):', data1[3][18]);

console.log('File 2 Sheet1 Row4:');
console.log('  received_date (col15):', data3[4][15]);
console.log('  วันที่ส่งของ (col20):', data3[4][20]);

// Check what row 3 from file2 sheet2 looks like
const ws4 = wb2.Sheets[wb2.SheetNames[1]];
const data4 = XLSX.utils.sheet_to_json(ws4, { header: 1, defval: '' });
console.log('\n--- File 2 Sheet 2 header ---');
data4[2].forEach((v, i) => { if (v !== '') console.log(`  col[${i}] = ${JSON.stringify(v)}`); });
console.log('\n--- File 2 Sheet 2 Row 3 ---');
data4[3].forEach((v, i) => { if (v !== '') console.log(`  col[${i}] = ${JSON.stringify(v)}`); });
