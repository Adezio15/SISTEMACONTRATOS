require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { getPool } = require('../src/config/database');

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists schema_migrations (
      id serial primary key,
      filename varchar(255) not null unique,
      executed_at timestamptz not null default now()
    )
  `);
}

async function migrate() {
  const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const pool = getPool({ direct: true });
  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);

    for (const file of files) {
      const alreadyExecuted = await client.query(
        'select 1 from schema_migrations where filename = $1',
        [file]
      );

      if (alreadyExecuted.rowCount > 0) {
        console.log(`Migration ignorada: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('begin');
      await client.query(sql);
      await client.query(
        'insert into schema_migrations (filename) values ($1)',
        [file]
      );
      await client.query('commit');

      console.log(`Migration executada: ${file}`);
    }
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
