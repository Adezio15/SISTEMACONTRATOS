const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const XLSX = require('xlsx');

const { hashPassword, verifyPassword } = require('../src/utils/password');
const { requirePermission } = require('../src/middlewares/permissions');
const {
  buildContractKey,
  calculateBalancePercentage,
  classifyBalance,
  normalizeDocumentNumber,
  identifyDocumentType,
  calculateContractStatus
} = require('../src/utils/contractRules');
const {
  parseMoney,
  parseDate,
  normalizeStatus,
  normalizeContractImportRow,
  inferContractYear
} = require('../src/services/contractImportNormalizer');
const { readContractsFromSpreadsheet } = require('../src/dataSources/excelContractSource');
const { buildHeaderMap } = require('../src/services/importMappingService');
const {
  compareContract,
  summarizeRows
} = require('../src/services/contractImportService');
const {
  daysUntil,
  expirationBucket
} = require('../src/utils/dashboardRules');
const {
  getChartMaxValue,
  getBarWidth
} = require('../src/utils/chartRules');
const {
  buildExpirationEventKey,
  buildBalanceEventKey,
  classifyBalanceAlert,
  expirationWarningForDays
} = require('../src/utils/alertRules');

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function runMiddleware(middleware, user) {
  return new Promise((resolve) => {
    const req = { session: { user } };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      render(view) {
        resolve({ blocked: true, statusCode: this.statusCode, view });
      }
    };

    middleware(req, res, () => resolve({ blocked: false, statusCode: 200 }));
  });
}

test('hashPassword nao retorna a senha em texto puro', async () => {
  const hash = await hashPassword('Senha@123');

  assert.notEqual(hash, 'Senha@123');
  assert.match(hash, /^\$2[aby]\$/);
});

test('verifyPassword valida senha correta e rejeita senha incorreta', async () => {
  const hash = await hashPassword('Senha@123');

  assert.equal(await verifyPassword('Senha@123', hash), true);
  assert.equal(await verifyPassword('OutraSenha', hash), false);
});

test('requirePermission libera usuario com permissao', async () => {
  const result = await runMiddleware(
    requirePermission('users.manage'),
    { permissions: ['users.manage'] }
  );

  assert.equal(result.blocked, false);
});

test('requirePermission bloqueia usuario sem permissao', async () => {
  const result = await runMiddleware(
    requirePermission('users.manage'),
    { permissions: ['contracts.view'] }
  );

  assert.equal(result.blocked, true);
  assert.equal(result.statusCode, 403);
});

test('buildContractKey cria chave logica numero/exercicio', () => {
  assert.equal(buildContractKey('045', '2026'), '045/2026');
  assert.equal(buildContractKey('', '2026'), null);
});

test('calculateBalancePercentage usa valor atualizado quando existir', () => {
  const result = calculateBalancePercentage({
    initial_value: 1000,
    updated_value: 2000,
    current_balance: 500
  });

  assert.equal(result, 25);
});

test('classifyBalance classifica saldo normal, atencao e critico', () => {
  assert.equal(classifyBalance({ initial_value: 100, current_balance: 40 }), 'NORMAL');
  assert.equal(classifyBalance({ initial_value: 100, current_balance: 20 }), 'ATENCAO');
  assert.equal(classifyBalance({ initial_value: 100, current_balance: 10 }), 'CRITICO');
});

test('normalizeDocumentNumber remove mascara de CNPJ e CPF', () => {
  assert.equal(normalizeDocumentNumber('12.345.678/0001-90'), '12345678000190');
  assert.equal(normalizeDocumentNumber('123.456.789-00'), '12345678900');
});

test('identifyDocumentType identifica CNPJ, CPF e OUTRO', () => {
  assert.equal(identifyDocumentType('12.345.678/0001-90'), 'CNPJ');
  assert.equal(identifyDocumentType('123.456.789-00'), 'CPF');
  assert.equal(identifyDocumentType('123'), 'OUTRO');
});

test('calculateContractStatus marca vencido quando data final passou', () => {
  const result = calculateContractStatus(
    { status: 'ATIVO', end_date: '2026-01-01' },
    new Date('2026-09-23T12:00:00')
  );

  assert.equal(result, 'VENCIDO');
});

test('parseMoney normaliza valores brasileiros', () => {
  assert.equal(parseMoney('R$ 12.345,67'), 12345.67);
  assert.equal(parseMoney('1000'), 1000);
});

test('parseDate normaliza data brasileira para ISO', () => {
  assert.equal(parseDate('23/09/2026'), '2026-09-23');
});

test('normalizeStatus aceita variacoes e retorna status valido', () => {
  assert.equal(normalizeStatus('encerrado'), 'ENCERRADO');
  assert.equal(normalizeStatus('Ativo cobrança e faturamento'), 'ATIVO');
  assert.equal(normalizeStatus('Cancelado pelo fornecedor'), 'CANCELADO');
  assert.equal(normalizeStatus('desconhecido'), 'ATIVO');
});

test('inferContractYear extrai exercicio de codigo corporativo', () => {
  assert.equal(inferContractYear('RN-2026-CS-124'), 2026);
  assert.equal(inferContractYear('045', '2025'), 2025);
  assert.equal(inferContractYear('sem ano'), null);
});

test('normalizeContractImportRow gera contrato normalizado e responsaveis', () => {
  const row = {
    Contrato: '045',
    Ano: '2026',
    Empresa: 'Fornecedor Exemplo',
    CNPJ: '12.345.678/0001-90',
    Objeto: 'Prestacao de servicos',
    Unidade: 'Natal',
    Saldo: '500,00',
    Analista: 'Adezio'
  };
  const headerMap = {
    contract_number: 'Contrato',
    contract_year: 'Ano',
    supplier_name: 'Empresa',
    document_number: 'CNPJ',
    object: 'Objeto',
    unit: 'Unidade',
    current_balance: 'Saldo',
    analyst_name: 'Analista'
  };
  const result = normalizeContractImportRow(row, headerMap);

  assert.deepEqual(result.errors, []);
  assert.equal(result.normalized.contract_key, '045/2026');
  assert.equal(result.normalized.document_number, '12345678000190');
  assert.equal(result.normalized.responsibles[0].role, 'ANALISTA');
});

test('readContractsFromSpreadsheet encontra cabecalho apos titulo do relatorio', () => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Data: 09/09/2026 Hora: 09:16:03 - Listagem de Contratos - Por Periodo'],
    [],
    ['Cd.Contrato', 'Contrato', 'Tipo de Contrato', 'Vl. Contrato', 'Filial', '', 'Fornecedor', 'Inicio Vigencia', 'Validade', 'Validade (meses)', 'Status'],
    ['RN-2026-CS-124', 'SELECAO DE ESPETACULOS EM ARTES CENICAS', 'CONTRATO DE SERVICO', 10000, 'SESC SEDE', '', 'ASSOCIACAO CULTURAL TRAPIA', '18/08/2026', '18/02/2027', 6, 'Ativo cobranca e faturamento']
  ]);
  const filePath = path.join(os.tmpdir(), `contracts-import-${Date.now()}.xlsx`);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet');
  XLSX.writeFile(workbook, filePath);

  try {
    const rows = readContractsFromSpreadsheet(filePath);
    const headerMap = buildHeaderMap(rows[0]);
    const result = normalizeContractImportRow(rows[0], headerMap);

    assert.equal(rows.length, 1);
    assert.equal(headerMap.contract_number, 'Cd.Contrato');
    assert.equal(headerMap.object, 'Contrato');
    assert.equal(headerMap.initial_value, 'Vl. Contrato');
    assert.equal(headerMap.unit, 'Filial');
    assert.equal(headerMap.end_date, 'Validade');
    assert.deepEqual(result.errors, []);
    assert.equal(result.normalized.contract_number, 'RN-2026-CS-124');
    assert.equal(result.normalized.contract_year, 2026);
    assert.equal(result.normalized.contract_key, 'RN-2026-CS-124/2026');
    assert.equal(result.normalized.object, 'SELECAO DE ESPETACULOS EM ARTES CENICAS');
    assert.equal(result.normalized.supplier_name, 'ASSOCIACAO CULTURAL TRAPIA');
    assert.equal(result.normalized.initial_value, 10000);
    assert.equal(result.normalized.unit, 'SESC SEDE');
    assert.equal(result.normalized.end_date, '2027-02-18');
    assert.equal(result.normalized.status, 'ATIVO');
    assert.equal(result.normalized.external_status, 'Ativo cobranca e faturamento');
    assert.equal(result.normalized.document_number, null);
    assert.equal(result.normalized.current_balance, null);
  } finally {
    fs.rmSync(filePath, { force: true });
  }
});

test('compareContract identifica mudancas em campos externos', () => {
  const differences = compareContract(
    { supplier_name: 'A', object: 'Objeto antigo', initial_value: '100.00' },
    { supplier_name: 'A', object: 'Objeto novo', initial_value: 100 }
  );

  assert.equal(differences.length, 1);
  assert.equal(differences[0].field, 'object');
});

test('summarizeRows contabiliza a previa da importacao', () => {
  const summary = summarizeRows([
    { action: 'NEW' },
    { action: 'UPDATE' },
    { action: 'UNCHANGED' },
    { action: 'ERROR' }
  ]);

  assert.equal(summary.totalRows, 4);
  assert.equal(summary.newRecords, 1);
  assert.equal(summary.updatedRecords, 1);
  assert.equal(summary.unchangedRecords, 1);
  assert.equal(summary.errorRecords, 1);
});

test('daysUntil calcula diferenca de dias sem horario', () => {
  const result = daysUntil('2026-10-03', new Date('2026-09-23T22:30:00'));

  assert.equal(result, 10);
});

test('expirationBucket classifica faixas de vencimento', () => {
  const today = new Date('2026-09-23T12:00:00');

  assert.equal(expirationBucket('2026-10-23', today), '0-30');
  assert.equal(expirationBucket('2026-11-10', today), '31-60');
  assert.equal(expirationBucket('2026-12-15', today), '61-90');
  assert.equal(expirationBucket('2027-01-15', today), null);
});

test('getChartMaxValue usa pelo menos 1 como escala', () => {
  assert.equal(getChartMaxValue([]), 1);
  assert.equal(getChartMaxValue([{ value: 3 }, { value: 7 }]), 7);
});

test('getBarWidth aplica largura minima apenas para valores positivos', () => {
  assert.equal(getBarWidth(0, 10), 0);
  assert.equal(getBarWidth(1, 100), 4);
  assert.equal(getBarWidth(50, 100), 50);
});

test('alertRules cria chaves estaveis para evitar duplicidade', () => {
  assert.equal(buildExpirationEventKey('abc', 30), 'contract:abc:expiration:30');
  assert.equal(buildBalanceEventKey('abc', 'CRITICAL'), 'contract:abc:balance:CRITICAL');
});

test('classifyBalanceAlert identifica alerta de saldo', () => {
  assert.equal(classifyBalanceAlert(8), 'CRITICAL');
  assert.equal(classifyBalanceAlert(20), 'WARNING');
  assert.equal(classifyBalanceAlert(31), null);
});

test('expirationWarningForDays respeita faixas configuradas', () => {
  assert.equal(expirationWarningForDays(30), 30);
  assert.equal(expirationWarningForDays(14), null);
  assert.equal(expirationWarningForDays(-1), null);
});

(async () => {
  for (const item of tests) {
    await item.fn();
    console.log(`ok - ${item.name}`);
  }

  console.log(`${tests.length} testes executados com sucesso.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
