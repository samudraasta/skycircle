const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = `<!DOCTYPE html>
<html>
<head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
    <script>
        setTimeout(() => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'px', format: [400, 678] });
            console.log('jsPDF initialized successfully:', !!doc);
        }, 1000);
    </script>
</body>
</html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
