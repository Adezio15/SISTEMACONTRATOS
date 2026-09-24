const nodemailer = require('nodemailer');
const { logger } = require('../config/logger');

function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.EMAIL_FROM);
}

function createTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });
}

async function sendNotificationEmail({ to, subject, message, linkUrl }) {
  const transporter = createTransporter();

  if (!transporter) {
    logger.info('SMTP nao configurado; e-mail nao enviado.', { to, subject });
    return { sent: false, skipped: true };
  }

  const appUrl = process.env.APP_URL || '';
  const link = linkUrl && appUrl ? `${appUrl}${linkUrl}` : linkUrl;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text: link ? `${message}\n\nAcesse: ${link}` : message
  });

  return { sent: true, skipped: false };
}

module.exports = {
  isEmailConfigured,
  sendNotificationEmail
};
