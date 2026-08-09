const fs = require('fs');
const { JSDOM } = require('jsdom');
const jsdom = new JSDOM(`<!DOCTYPE html><script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script><body></body>`, { runScripts: "dangerously", resources: "usable" });

setTimeout(() => {
    try {
        const { jsPDF } = jsdom.window.jspdf;
        const doc = new jsPDF({ unit: 'px', format: [400, 678] });
        
        const canvas = jsdom.window.document.createElement('canvas');
        canvas.width = 100; canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(0,0,100,100);
        
        doc.addImage(canvas, 'JPEG', 0, 0, 100, 100);
        
        // Also test base64
        const base64 = canvas.toDataURL('image/jpeg');
        doc.addImage(base64, 'JPEG', 100, 100, 100, 100);
        
        const output = doc.output('arraybuffer');
        console.log('PDF generated successfully, size:', output.byteLength);
    } catch(e) {
        console.error('Error generating PDF:', e);
    }
}, 3000);
