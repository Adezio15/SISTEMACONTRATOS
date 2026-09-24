require('dotenv').config();

const { directPool } = require('../src/config/database');
const { seed } = require('../database/seeds/001_seed_defaults');

seed()
  .then(async () => {
    console.log('Seeds executados com sucesso.');
    if (directPool) {
      await directPool.end();
    }
  })
  .catch(async (error) => {
    console.error(error);
    if (directPool) {
      await directPool.end();
    }
    process.exit(1);
  });
