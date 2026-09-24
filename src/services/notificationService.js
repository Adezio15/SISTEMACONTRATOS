const notificationRepository = require('../repositories/notificationRepository');
const { hasDatabaseConfig } = require('../config/database');

async function createContractNotification(event, client) {
  if (!hasDatabaseConfig()) {
    return { created: false, recipients: [] };
  }

  const result = await notificationRepository.createEvent(event, client);

  if (!result.created) {
    return { created: false, recipients: [] };
  }

  const users = await notificationRepository.getResponsibleUsersForContract(event.contractId, client);
  const userIds = users.map((user) => user.id);

  await notificationRepository.createNotificationsForUsers({
    event: result.event,
    userIds,
    linkUrl: `/contratos/${event.contractId}`
  }, client);

  return {
    created: true,
    recipients: users
  };
}

async function listUserNotifications(userId) {
  if (!hasDatabaseConfig()) {
    return {
      notifications: [],
      unreadCount: 0
    };
  }

  const [notifications, unreadCount] = await Promise.all([
    notificationRepository.listUserNotifications(userId),
    notificationRepository.countUnread(userId)
  ]);

  return {
    notifications,
    unreadCount
  };
}

async function countUnread(userId) {
  if (!hasDatabaseConfig()) {
    return 0;
  }

  return notificationRepository.countUnread(userId);
}

async function markAsRead(userId, notificationId) {
  if (!hasDatabaseConfig()) {
    return;
  }

  await notificationRepository.markAsRead(userId, notificationId);
}

async function markAllAsRead(userId) {
  if (!hasDatabaseConfig()) {
    return;
  }

  await notificationRepository.markAllAsRead(userId);
}

module.exports = {
  createContractNotification,
  listUserNotifications,
  countUnread,
  markAsRead,
  markAllAsRead
};
