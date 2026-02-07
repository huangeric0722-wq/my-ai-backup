const nodemailer = require('nodemailer');

// 🛠️ Config placeholders - Eric will provide these later.
// Using process.env is better practice than hardcoding, but defaults help show structure.
const config = {
    host: process.env.SMTP_HOST || 'YOUR_SMTP_HOST',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'YOUR_EMAIL@example.com',
        pass: process.env.SMTP_PASS || 'YOUR_APP_PASSWORD'
    }
};

async function sendReport(to, subject, htmlContent, attachments = []) {
    if (config.host === 'YOUR_SMTP_HOST') {
        console.log('⚠️  SMTP config missing. Please provide SMTP settings to enable real sending.');
        console.log('--- SIMULATED EMAIL ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('Content length:', htmlContent.length);
        console.log('Attachments:', attachments.length);
        return { success: false, message: 'Simulated send (Config missing)' };
    }

    try {
        let transporter = nodemailer.createTransport(config);
        
        // Verify connection config
        await transporter.verify();

        let info = await transporter.sendMail({
            from: `"Jarvis" <${config.auth.user}>`,
            to: to,
            subject: subject,
            html: htmlContent,
            attachments: attachments
        });

        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message };
    }
}

// CLI usage for testing
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node send_email.js <to> <subject> <body>');
    } else {
        sendReport(args[0], args[1], args[2]);
    }
}

module.exports = { sendReport };
