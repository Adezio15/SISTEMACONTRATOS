function getChartMaxValue(items) {
  return Math.max(1, ...items.map((item) => Number(item.value || 0)));
}

function getBarWidth(value, maxValue) {
  const numericValue = Number(value || 0);

  if (numericValue <= 0) {
    return 0;
  }

  return Math.max((numericValue / Math.max(maxValue, 1)) * 100, 4);
}

module.exports = {
  getChartMaxValue,
  getBarWidth
};
