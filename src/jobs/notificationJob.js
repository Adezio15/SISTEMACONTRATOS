const notificationRepository = require('../repositories/notificationRepository');
const emailService = require('../services/emailService');
const { logger } = require('../config/logger');

async function runNotificationJob() {
  const notifications = await notificationRepository.listPendingEmailNotifications();
  let sent = 0;
  let skipped = 0;

  for (const notification of notifications) {
    const result = await emailService.sendNotificationEmail({
      to: notification.email,
      subject: notification.title,
      message: notification.message,
      linkUrl: notification.link_url
    });

    if (result.sent || result.skipped) {
      await notificationRepository.markEmailSent(notification.id);
    }

    if (result.sent) {
      sent += 1;
    }

    if (result.skipped) {
      skipped += 1;
    }
  }

  logger.info('Job de notificacoes por e-mail executado.', {
    checked: notifications.length,
    sent,
    skipped
  });

  return { checked: notifications.length, sent, skipped };
}

module.exports = { runNotificationJob };
