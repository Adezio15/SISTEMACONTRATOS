(() => {
  const chartData = window.__MANAGEMENT_DASHBOARD_CHARTS__ || [];

  if (!window.Chart || chartData.length === 0) {
    return;
  }

  const palette = [
    '#2f8f6b',
    '#3c6f9f',
    '#d79a25',
    '#c5463a',
    '#6d5a9c',
    '#2b9e9a',
    '#8d9aa7',
    '#5b7c99'
  ];

  const centerTextPlugin = {
    id: 'centerText',
    afterDraw(chart) {
      const total = chart.config.options.plugins.centerText?.total || 0;
      const label = chart.config.options.plugins.centerText?.label || '';
      const { ctx, chartArea } = chart;

      if (!chartArea) {
        return;
      }

      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#17212b';
      ctx.font = '700 24px Inter, Arial, sans-serif';
      ctx.fillText(String(total), x, y - 8);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#657486';
      ctx.font = '600 12px Inter, Arial, sans-serif';
      ctx.fillText(label, x, y + 14);
      ctx.restore();
    }
  };

  window.Chart.register(centerTextPlugin);

  function percent(value, total) {
    if (!total) {
      return '0%';
    }

    return `${Math.round((value / total) * 100)}%`;
  }

  function cssVar(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  chartData.forEach((chart) => {
    const canvas = document.querySelector(`[data-dashboard-chart="${chart.key}"]`);

    if (!canvas) {
      return;
    }

    const entries = chart.labels
      .map((label, index) => ({
        label,
        value: Number(chart.values[index] || 0),
        url: chart.urls[index] || null
      }))
      .filter((entry) => entry.value > 0);
    const total = entries.reduce((sum, entry) => sum + entry.value, 0);

    if (entries.length === 0) {
      canvas.closest('.doughnut-card')?.classList.add('doughnut-card-empty');
      return;
    }

    const chartInstance = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: entries.map((entry) => entry.label),
        datasets: [{
          data: entries.map((entry) => entry.value),
          backgroundColor: entries.map((entry, index) => palette[index % palette.length]),
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        animation: {
          duration: 700,
          easing: 'easeOutQuart'
        },
        onClick(event, elements) {
          if (elements.length === 0) {
            return;
          }

          const entry = entries[elements[0].index];

          if (entry?.url) {
            window.location.href = entry.url;
          }
        },
        plugins: {
          centerText: {
            total,
            label: chart.centerLabel
          },
          legend: {
            position: 'bottom',
            labels: {
              color: cssVar('--text', '#17212b'),
              usePointStyle: true,
              boxWidth: 8,
              padding: 16,
              generateLabels(chartInstance) {
                const data = chartInstance.data;

                return data.labels.map((label, index) => {
                  const value = data.datasets[0].data[index];

                  return {
                    text: `${label}: ${value} (${percent(value, total)})`,
                    fillStyle: data.datasets[0].backgroundColor[index],
                    strokeStyle: data.datasets[0].backgroundColor[index],
                    lineWidth: 0,
                    hidden: false,
                    index
                  };
                });
              }
            }
          },
          tooltip: {
            callbacks: {
              label(context) {
                const value = Number(context.parsed || 0);
                return `${context.label}: ${value} (${percent(value, total)})`;
              }
            }
          }
        }
      }
    });

    canvas.addEventListener('mousemove', (event) => {
      const points = chartInstance.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
      const entry = points.length ? entries[points[0].index] : null;
      canvas.style.cursor = entry?.url ? 'pointer' : 'default';
    });
  });
})();
