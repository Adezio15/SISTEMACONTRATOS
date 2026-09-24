const { getPool } = require('../config/database');

function db(client) {
  return client || getPool();
}

async function createEvent(event, client) {
  const { rows } = await db(client).query(
    `
      insert into notification_events (
        contract_id,
        event_key,
        event_type,
        severity,
        title,
        message,
        metadata
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb)
      on conflict (event_key) do nothing
      returning *
    `,
    [
      event.contractId,
      event.eventKey,
      event.eventType,
      event.severity,
      event.title,
      event.message,
      JSON.stringify(event.metadata || {})
    ]
  );

  if (rows[0]) {
    return { event: rows[0], created: true };
  }

  const existing = await findEventByKey(event.eventKey, client);
  return { event: existing, created: false };
}

async function findEventByKey(eventKey, client) {
  const { rows } = await db(client).query(
    'select * from notification_events where event_key = $1 limit 1',
    [eventKey]
  );

  return rows[0] || null;
}

async function createNotificationsForUsers({ event, userIds, linkUrl }, client) {
  for (const userId of userIds) {
    await db(client).query(
      `
        insert into notifications (
          user_id,
          event_id,
          contract_id,
          title,
          message,
          link_url
        )
        values ($1, $2, $3, $4, $5, $6)
        on conflict do nothing
      `,
      [userId, event.id, event.contract_id, event.title, event.message, linkUrl]
    );
  }
}

async function getResponsibleUsersForContract(contractId, client) {
  const { rows } = await db(client).query(
    `
      select distinct u.id, u.email, u.full_name
      from contract_responsibles cr
      join users u on u.id = cr.user_id
      where cr.contract_id = $1
        and cr.active = true
        and u.active = true
      union
      select distinct u.id, u.email, u.full_name
      from users u
      join roles r on r.id = u.role_id
      where u.active = true
        and r.key in ('ADMINISTRADOR', 'GERENCIA')
    `,
    [contractId]
  );

  return rows;
}

async function listUserNotifications(userId, { limit = 30 } = {}) {
  const { rows } = await getPool().query(
    `
      select
        n.*,
        c.contract_key
      from notifications n
      left join contracts c on c.id = n.contract_id
      where n.user_id = $1
      order by n.created_at desc
      limit $2
    `,
    [userId, limit]
  );

  return rows;
}

async function countUnread(userId) {
  const { rows } = await getPool().query(
    'select count(*)::int as total from notifications where user_id = $1 and read_at is null',
    [userId]
  );

  return rows[0].total;
}

async function markAsRead(userId, notificationId) {
  await getPool().query(
    `
      update notifications
      set read_at = now()
      where id = $1 and user_id = $2
    `,
    [notificationId, userId]
  );
}

async function markAllAsRead(userId) {
  await getPool().query(
    'update notifications set read_at = now() where user_id = $1 and read_at is null',
    [userId]
  );
}

async function listPendingEmailNotifications({ limit = 50 } = {}) {
  const { rows } = await getPool().query(
    `
      select
        n.id,
        n.title,
        n.message,
        n.link_url,
        u.email,
        u.full_name
      from notifications n
      join users u on u.id = n.user_id
      where n.email_sent_at is null
        and u.email is not null
        and u.active = true
      order by n.created_at asc
      limit $1
    `,
    [limit]
  );

  return rows;
}

async function markEmailSent(notificationId) {
  await getPool().query(
    'update notifications set email_sent_at = now() where id = $1',
    [notificationId]
  );
}

module.exports = {
  createEvent,
  createNotificationsForUsers,
  getResponsibleUsersForContract,
  listUserNotifications,
  countUnread,
  markAsRead,
  markAllAsRead,
  listPendingEmailNotifications,
  markEmailSent
};
