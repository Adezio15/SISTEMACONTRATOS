(function () {
  const refreshIntervalMs = 60000;
  const numberFormat = new Intl.NumberFormat('pt-BR');
  const dateFormat = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Fortaleza'
  });
  const dateOnlyFormat = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'America/Fortaleza'
  });
  const percentFormat = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function setText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
      element.textContent = value;
    }
  }

  function formatDateTime(value) {
    if (!value) {
      return '-';
    }

    return dateFormat.format(new Date(value));
  }

  function formatDate(value) {
    if (!value) {
      return '-';
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const [year, month, day] = value.slice(0, 10).split('-').map(Number);
      return dateOnlyFormat.format(new Date(year, month - 1, day));
    }

    return dateOnlyFormat.format(new Date(value));
  }

  function formatPercent(value) {
    if (value === null || value === undefined) {
      return '-';
    }

    return `${percentFormat.format(Number(value))}%`;
  }

  function renderMetrics(metrics) {
    document.querySelectorAll('[data-tv]').forEach((element) => {
      const key = element.dataset.tv;
      element.textContent = numberFormat.format(Number(metrics[key] || 0));
    });
  }

  function renderExpiring(items) {
    const container = document.querySelector('[data-tv-expiring]');

    if (!container) {
      return;
    }

    if (!items.length) {
      container.innerHTML = '<p class="tv-empty">Nenhum contrato vencendo em ate 90 dias.</p>';
      return;
    }

    container.innerHTML = items.slice(0, 6).map((item) => `
      <div class="tv-list-row">
        <div>
          <strong>${item.contract_key}</strong>
          <span>${item.supplier_name}</span>
        </div>
        <em>${formatDate(item.end_date)}</em>
      </div>
    `).join('');
  }

  function renderCritical(items) {
    const container = document.querySelector('[data-tv-critical]');

    if (!container) {
      return;
    }

    if (!items.length) {
      container.innerHTML = '<p class="tv-empty">Nenhum contrato com saldo critico.</p>';
      return;
    }

    container.innerHTML = items.slice(0, 6).map((item) => `
      <div class="tv-list-row">
        <div>
          <strong>${item.contract_key}</strong>
          <span>${item.supplier_name}</span>
        </div>
        <em>${formatPercent(item.balance_percentage)}</em>
      </div>
    `).join('');
  }

  function renderChart(selector, items) {
    const container = document.querySelector(selector);

    if (!container) {
      return;
    }

    if (!items.length) {
      container.innerHTML = '<p class="tv-empty">Sem dados para exibir.</p>';
      return;
    }

    const maxValue = Math.max(1, ...items.map((item) => Number(item.value || 0)));
    container.innerHTML = items.map((item) => {
      const value = Number(item.value || 0);
      const width = value > 0 ? Math.max((value / maxValue) * 100, 4) : 0;

      return `
        <div class="tv-bar-row">
          <span>${item.label}</span>
          <div><i style="width: ${width}%"></i></div>
          <strong>${numberFormat.format(value)}</strong>
        </div>
      `;
    }).join('');
  }

  function renderDashboard(data) {
    renderMetrics(data.metrics || {});
    renderExpiring(data.expiringContracts || []);
    renderCritical(data.criticalBalanceContracts || []);
    renderChart('[data-tv-chart-status]', data.charts?.byStatus || []);
    renderChart('[data-tv-chart-unit]', data.charts?.byUnit || []);

    const latestImport = data.latestImport;
    setText('[data-tv-last-update]', latestImport ? formatDateTime(latestImport.last_update_at) : 'Sem importacao concluida');
    setText('[data-tv-generated-at]', `Consulta: ${formatDateTime(data.generatedAt)}`);
  }

  async function refreshDashboard() {
    try {
      const response = await fetch('/api/dashboard/tv', {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      renderDashboard(data);
    } catch (error) {
      setText('[data-tv-generated-at]', 'Falha ao atualizar dados');
    }
  }

  renderDashboard(window.__TV_DASHBOARD__ || {});
  window.setInterval(refreshDashboard, refreshIntervalMs);
})();
