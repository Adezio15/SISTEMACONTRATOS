const { TIME_ZONE } = require('./time');

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value));
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: TIME_ZONE
  }).format(new Date(value));
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return `${Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`;
}

module.exports = {
  formatCurrency,
  formatDate,
  formatPercent
};
