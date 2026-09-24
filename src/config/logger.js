function log(level, message, meta = {}) {
  const payload = {
    level,
    message,
    ...meta,
    timestamp: new Date().toISOString()
  };

  const line = JSON.stringify(payload);

  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
}

const logger = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta)
};

module.exports = { logger };
