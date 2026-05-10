// Vercel Serverless Function to handle Fonnte Webhook
// This will live in /api/webhook.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { sender, message, file } = req.body;
    // Fonnte sends data in body: sender (phone), message (text), file (url)

    console.log(`Received message from ${sender}: ${message}`);

    // 1. Process Message (Text Parsing)
    const lowerText = message.toLowerCase();
    let responseMessage = "";

    if (lowerText.includes('hadir') || lowerText.split(',').length > 1) {
        let names = message.replace(/hadir/gi, '').replace(/[:\d\.]/g, '').split(/,|\n/);
        names = names.map(n => n.trim()).filter(n => n.length > 1);

        if (names.length > 0) {
            responseMessage = `✅ Terdeteksi ${names.length} peserta: ${names.join(', ')}. Balas "oke" untuk konfirmasi presensi ke Dashboard.`;
            // Note: In real app, you'd store this in a temporary "pending" table in Supabase
        } else {
            responseMessage = "Maaf formatnya salah. Contoh: Hadir: Andi, Budi";
        }
    } else if (lowerText === 'oke') {
        responseMessage = "🚀 Mantap! Presensi sudah masuk ke Dashboard Sky Circle.";
        // Note: Real app would move data from pending to final attendance table here
    } else {
        responseMessage = "Halo Kak Mentor! Silakan kirim daftar nama hadir untuk update presensi.";
    }

    // 2. Send Reply back to Fonnte
    // You'd use fetch() to Fonnte API here with your FONNTE_TOKEN

    return res.status(200).json({ 
        status: true,
        message: responseMessage 
    });
}
