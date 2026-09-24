const { Pool } = require('pg');

const runtimeConnectionString = process.env.DATABASE_URL;
const directConnectionString = process.env.DATABASE_DIRECT_URL || runtimeConnectionString;

function createPool(connectionString) {
  if (!connectionString) {
    return null;
  }

  return new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined
  });
}

const pool = createPool(runtimeConnectionString);
const directPool = createPool(directConnectionString);

function hasDatabaseConfig() {
  return Boolean(runtimeConnectionString);
}

function getPool({ direct = false } = {}) {
  const selectedPool = direct ? directPool : pool;

  if (!selectedPool) {
    throw new Error('DATABASE_URL nao configurada.');
  }

  return selectedPool;
}

module.exports = {
  getPool,
  hasDatabaseConfig,
  pool,
  directPool
};
