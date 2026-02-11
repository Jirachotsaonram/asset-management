import Tesseract from 'tesseract.js';

const imagePath = 'C:/Users/jirac/.gemini/antigravity/brain/tempmediaStorage/media__1770797129638.jpg';

console.log('Starting OCR on:', imagePath);

try {
    const worker = await Tesseract.createWorker('tha+eng', 1, {
        logger: (m) => {
            if (m.status === 'recognizing text') {
                process.stdout.write(`\rProgress: ${Math.round((m.progress || 0) * 100)}%`);
            }
        }
    });

    const { data: { text } } = await worker.recognize(imagePath);
    await worker.terminate();

    console.log('\n\n=== RAW OCR TEXT ===');
    console.log(text);
    console.log('=== END OCR TEXT ===');

    // Show lines with numbers
    const lines = text.split('\n');
    console.log('\n=== LINES WITH 10+ DIGIT NUMBERS ===');
    lines.forEach((line, i) => {
        if (line.match(/\d{10,}/)) {
            console.log(`Line ${i}: ${line}`);
        }
    });

    console.log('\n=== LINES WITH PRICE PATTERNS ===');
    lines.forEach((line, i) => {
        if (line.match(/\d{1,3}(?:,\d{3})*\.\d{2}/)) {
            console.log(`Line ${i}: ${line}`);
        }
    });

    console.log('\n=== ALL NON-EMPTY LINES ===');
    lines.forEach((line, i) => {
        if (line.trim()) {
            console.log(`Line ${i}: ${line.trim()}`);
        }
    });

} catch (err) {
    console.error('OCR Error:', err);
}
