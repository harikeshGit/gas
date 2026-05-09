import nodemailer from 'nodemailer';

function isSmtpConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendOtpEmail({ to, otp, subject }) {
    if (!isSmtpConfigured()) {
        return {
            demo: true,
            message: 'SMTP not configured; returning demo OTP',
            demoOtp: otp,
        };
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
        from,
        to,
        subject: subject || 'Your OTP',
        text: `Your OTP is: ${otp}. It expires soon.`,
    });

    return { demo: false, message: 'OTP email sent' };
}
