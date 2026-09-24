const LOCALE = 'pt-BR';
const TIME_ZONE = 'America/Fortaleza';

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: TIME_ZONE
  }).format(new Date(value));
}

module.exports = {
  TIME_ZONE,
  formatDateTime
};
