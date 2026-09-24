const demoContracts = [
  {
    id: 'demo-contract-1',
    contract_number: '045',
    contract_year: 2026,
    contract_key: '045/2026',
    supplier_name: 'Fornecedor Demonstracao Ltda',
    document_number: '12345678000190',
    object: 'Prestacao de servicos continuados para demonstracao local.',
    unit: 'Natal',
    initial_value: 150000,
    updated_value: 165000,
    current_balance: 42000,
    effective_value: 165000,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'ATIVO',
    external_status: 'Vigente',
    source: 'DEMO',
    first_imported_at: '2026-09-01T10:00:00.000Z',
    last_imported_at: '2026-09-23T10:00:00.000Z',
    created_at: '2026-09-01T10:00:00.000Z',
    updated_at: '2026-09-23T10:00:00.000Z',
    responsibles: [
      {
        id: 'demo-responsible-1',
        role: 'ANALISTA',
        name: 'Usuario Local',
        email: 'local@sesc-rn.local',
        registration: 'local'
      }
    ]
  },
  {
    id: 'demo-contract-2',
    contract_number: '019',
    contract_year: 2025,
    contract_key: '019/2025',
    supplier_name: 'Empresa Exemplo de Tecnologia',
    document_number: '98765432000110',
    object: 'Licenciamento e suporte de sistema em ambiente de teste.',
    unit: 'Mossoro',
    initial_value: 80000,
    updated_value: 80000,
    current_balance: 6500,
    effective_value: 80000,
    start_date: '2025-10-01',
    end_date: '2026-10-15',
    status: 'ATIVO',
    external_status: 'Vigente',
    source: 'DEMO',
    first_imported_at: '2026-09-01T10:00:00.000Z',
    last_imported_at: '2026-09-23T10:00:00.000Z',
    created_at: '2026-09-01T10:00:00.000Z',
    updated_at: '2026-09-23T10:00:00.000Z',
    responsibles: [
      {
        id: 'demo-responsible-2',
        role: 'ANALISTA',
        name: 'Usuario Local',
        email: 'local@sesc-rn.local',
        registration: 'local'
      }
    ]
  }
];

const demoTasks = [
  {
    id: 'demo-task-1',
    contract_id: 'demo-contract-2',
    contract_key: '019/2025',
    supplier_name: 'Empresa Exemplo de Tecnologia',
    title: 'Conferir saldo antes da renovacao',
    description: 'Pendencia de demonstracao local.',
    responsible_user_id: 'local-dev-user',
    responsible_name: 'Usuario Local',
    due_date: '2026-10-01',
    priority: 'ALTA',
    status: 'PENDENTE',
    notes: null,
    created_at: '2026-09-23T10:00:00.000Z'
  }
];

const demoNotes = [
  {
    id: 'demo-note-1',
    contract_id: 'demo-contract-1',
    user_name: 'Usuario Local',
    note: 'Observacao de exemplo para validar a navegacao local.',
    created_at: '2026-09-23T10:00:00.000Z'
  }
];

const demoHistory = [
  {
    id: 'demo-history-1',
    field_name: 'current_balance',
    old_value: '50000',
    new_value: '42000',
    change_source: 'SISTEMA',
    user_name: 'Usuario Local',
    created_at: '2026-09-23T10:00:00.000Z'
  }
];

const demoSettings = [
  {
    key: 'expiration_warning_days',
    value: '90',
    description: 'Dias para alerta de vencimento.'
  },
  {
    key: 'balance_warning_percentage',
    value: '30',
    description: 'Percentual de saldo para alerta.'
  },
  {
    key: 'balance_critical_percentage',
    value: '10',
    description: 'Percentual de saldo critico.'
  }
];

function getDemoContracts() {
  return demoContracts;
}

function getDemoContractById(id) {
  return demoContracts.find((contract) => contract.id === id) || null;
}

function getDemoTasks(filters = {}) {
  return demoTasks.filter((task) => {
    if (filters.contractId && task.contract_id !== filters.contractId) {
      return false;
    }

    if (filters.status && task.status !== filters.status) {
      return false;
    }

    if (filters.responsibleUserId && task.responsible_user_id !== filters.responsibleUserId) {
      return false;
    }

    return true;
  });
}

module.exports = {
  getDemoContracts,
  getDemoContractById,
  getDemoTasks,
  demoNotes,
  demoHistory,
  demoSettings
};
