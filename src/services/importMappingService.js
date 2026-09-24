function normalizeHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const columnAliases = {
  contract_number: ['numero_contrato', 'n_contrato', 'contrato', 'numero', 'n'],
  contract_year: ['exercicio', 'ano', 'contract_year'],
  supplier_name: ['empresa', 'fornecedor', 'razao_social', 'contratada', 'supplier_name'],
  document_number: ['cnpj_cpf', 'cnpj', 'cpf', 'documento', 'document_number'],
  object: ['objeto', 'object', 'descricao_objeto'],
  unit: ['unidade', 'unidade_sesc', 'departamento', 'unit'],
  initial_value: ['valor_inicial', 'valor_original', 'valor_contratado', 'initial_value'],
  updated_value: ['valor_atualizado', 'valor_atual', 'updated_value'],
  current_balance: ['saldo_atual', 'saldo', 'current_balance'],
  start_date: ['data_inicial', 'inicio_vigencia', 'data_inicio', 'start_date'],
  end_date: ['data_final', 'fim_vigencia', 'data_fim', 'vencimento', 'end_date'],
  status: ['status', 'situacao'],
  external_status: ['status_externo', 'situacao_externa', 'external_status'],
  analyst_name: ['analista', 'analista_responsavel'],
  fiscal_name: ['fiscal'],
  manager_name: ['gestor'],
  contractor_name: ['contratante']
};

function buildHeaderMap(row) {
  const available = {};

  Object.keys(row).forEach((key) => {
    available[normalizeHeader(key)] = key;
  });

  return Object.entries(columnAliases).reduce((map, [field, aliases]) => {
    const originalKey = aliases.map(normalizeHeader).map((alias) => available[alias]).find(Boolean);

    if (originalKey) {
      map[field] = originalKey;
    }

    return map;
  }, {});
}

module.exports = {
  buildHeaderMap,
  normalizeHeader,
  columnAliases
};
