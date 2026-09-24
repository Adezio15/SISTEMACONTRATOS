function normalizeRegistration(value) {
  return String(value || '').trim();
}

module.exports = { normalizeRegistration };
