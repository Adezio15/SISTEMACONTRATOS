function daysUntil(dateValue, today = new Date()) {
  if (!dateValue) {
    return null;
  }

  let date;

  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
    const [year, month, day] = dateValue.slice(0, 10).split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateValue);
  }

  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const end = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function expirationBucket(dateValue, today = new Date()) {
  const days = daysUntil(dateValue, today);

  if (days === null || days < 0) {
    return null;
  }

  if (days <= 30) {
    return '0-30';
  }

  if (days <= 60) {
    return '31-60';
  }

  if (days <= 90) {
    return '61-90';
  }

  return null;
}

module.exports = {
  daysUntil,
  expirationBucket
};
