const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const { pool } = require('./database');

const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'development-only-change-me';
}

const store = pool
  ? new pgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: false
    })
  : undefined;

const sessionMiddleware = session({
  store,
  name: 'sesc_contratos.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8
  }
});

module.exports = { sessionMiddleware };
