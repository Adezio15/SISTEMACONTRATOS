const { getPool } = require('../config/database');

function db(client) {
  return client || getPool();
}

async function createImport(importData, client) {
  const { rows } = await db(client).query(
    `
      insert into contract_imports (
        filename,
        stored_filename,
        user_id,
        status,
        started_at
      )
      values ($1, $2, $3, $4, now())
      returning *
    `,
    [
      importData.filename,
      importData.storedFilename,
      importData.userId,
      importData.status || 'VALIDATING'
    ]
  );

  return rows[0];
}

async function updateImportSummary(importId, summary, client) {
  const { rows } = await db(client).query(
    `
      update contract_imports set
        status = $2,
        total_rows = $3,
        new_records = $4,
        updated_records = $5,
        unchanged_records = $6,
        possible_absent_records = $7,
        error_records = $8,
        error_message = $9,
        updated_at = now()
      where id = $1
      returning *
    `,
    [
      importId,
      summary.status,
      summary.totalRows,
      summary.newRecords,
      summary.updatedRecords,
      summary.unchangedRecords,
      summary.possibleAbsentRecords || 0,
      summary.errorRecords,
      summary.errorMessage || null
    ]
  );

  return rows[0];
}

async function setImportStatus(importId, status, client) {
  const finishedStatuses = ['COMPLETED', 'FAILED', 'CANCELLED'];
  await db(client).query(
    `
      update contract_imports set
        status = $2,
        finished_at = case when $3 then now() else finished_at end,
        updated_at = now()
      where id = $1
    `,
    [importId, status, finishedStatuses.includes(status)]
  );
}

async function createImportRows(importId, rows, client) {
  for (const row of rows) {
    await db(client).query(
      `
        insert into contract_import_rows (
          import_id,
          row_number,
          contract_key,
          action,
          raw_data,
          normalized_data,
          differences,
          errors
        )
        values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb)
      `,
      [
        importId,
        row.rowNumber,
        row.contractKey,
        row.action,
        JSON.stringify(row.rawData),
        JSON.stringify(row.normalizedData),
        JSON.stringify(row.differences),
        JSON.stringify(row.errors)
      ]
    );
  }
}

async function findContractsByKeys(contractKeys, client) {
  if (contractKeys.length === 0) {
    return [];
  }

  const { rows } = await db(client).query(
    'select * from contracts where contract_key = any($1)',
    [contractKeys]
  );

  return rows;
}

async function countContractsNotInKeys(contractKeys, client) {
  if (contractKeys.length === 0) {
    const { rows } = await db(client).query('select count(*)::int as total from contracts');
    return rows[0].total;
  }

  const { rows } = await db(client).query(
    'select count(*)::int as total from contracts where not (contract_key = any($1))',
    [contractKeys]
  );

  return rows[0].total;
}

async function listImports({ limit = 30 } = {}) {
  const { rows } = await getPool().query(
    `
      select
        ci.*,
        u.full_name as user_name
      from contract_imports ci
      left join users u on u.id = ci.user_id
      order by ci.created_at desc
      limit $1
    `,
    [limit]
  );

  return rows;
}

async function getImportById(importId, client) {
  const { rows } = await db(client).query(
    `
      select
        ci.*,
        u.full_name as user_name
      from contract_imports ci
      left join users u on u.id = ci.user_id
      where ci.id = $1
      limit 1
    `,
    [importId]
  );

  return rows[0] || null;
}

async function listImportRows(importId, client) {
  const { rows } = await db(client).query(
    `
      select *
      from contract_import_rows
      where import_id = $1
      order by row_number asc
    `,
    [importId]
  );

  return rows;
}

async function upsertCompany(contract, client) {
  if (!contract.document_number) {
    return null;
  }

  const { rows } = await db(client).query(
    `
      insert into companies (
        legal_name,
        document_number,
        document_type
      )
      values ($1, $2, $3)
      on conflict (document_number) do update set
        legal_name = excluded.legal_name,
        document_type = excluded.document_type,
        updated_at = now()
      returning id
    `,
    [
      contract.supplier_name,
      contract.document_number,
      contract.document_type || 'OUTRO'
    ]
  );

  return rows[0].id;
}

async function insertContract(contract, companyId, client) {
  const { rows } = await db(client).query(
    `
      insert into contracts (
        contract_number,
        contract_year,
        contract_key,
        company_id,
        supplier_name,
        document_number,
        object,
        unit,
        initial_value,
        updated_value,
        current_balance,
        start_date,
        end_date,
        status,
        external_status,
        source,
        first_imported_at,
        last_imported_at
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16,
        now(), now()
      )
      returning *
    `,
    [
      contract.contract_number,
      contract.contract_year,
      contract.contract_key,
      companyId,
      contract.supplier_name,
      contract.document_number,
      contract.object,
      contract.unit,
      contract.initial_value,
      contract.updated_value,
      contract.current_balance,
      contract.start_date,
      contract.end_date,
      contract.status,
      contract.external_status,
      contract.source
    ]
  );

  return rows[0];
}

async function updateContract(contractId, contract, companyId, client) {
  const { rows } = await db(client).query(
    `
      update contracts set
        company_id = $2,
        supplier_name = $3,
        document_number = $4,
        object = $5,
        unit = $6,
        initial_value = $7,
        updated_value = $8,
        current_balance = $9,
        start_date = $10,
        end_date = $11,
        status = $12,
        external_status = $13,
        source = $14,
        last_imported_at = now(),
        updated_at = now()
      where id = $1
      returning *
    `,
    [
      contractId,
      companyId,
      contract.supplier_name,
      contract.document_number,
      contract.object,
      contract.unit,
      contract.initial_value,
      contract.updated_value,
      contract.current_balance,
      contract.start_date,
      contract.end_date,
      contract.status,
      contract.external_status,
      contract.source
    ]
  );

  return rows[0];
}

async function insertHistoryEntries(entries, client) {
  if (!entries || entries.length === 0) {
    return;
  }

  const chunkSize = 500;

  for (let start = 0; start < entries.length; start += chunkSize) {
    const chunk = entries.slice(start, start + chunkSize);
    const params = [];
    const values = chunk.map((entry, index) => {
      const offset = index * 6;
      params.push(
        entry.contractId,
        entry.userId,
        entry.fieldName,
        entry.oldValue,
        entry.newValue,
        entry.importId
      );

      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, 'IMPORTACAO', $${offset + 6})`;
    });

    await db(client).query(
      `
        insert into contract_history (
          contract_id,
          user_id,
          field_name,
          old_value,
          new_value,
          change_source,
          import_id
        )
        values ${values.join(', ')}
      `,
      params
    );
  }
}

async function insertResponsibles(contractId, responsibles, client) {
  for (const responsible of responsibles || []) {
    await db(client).query(
      `
        insert into contract_responsibles (
          contract_id,
          role,
          name
        )
        select $1, $2, $3
        where not exists (
          select 1
          from contract_responsibles
          where contract_id = $1
            and role = $2
            and active = true
            and lower(coalesce(name, '')) = lower($3)
        )
      `,
      [contractId, responsible.role, responsible.name]
    );
  }
}

module.exports = {
  createImport,
  updateImportSummary,
  setImportStatus,
  createImportRows,
  findContractsByKeys,
  countContractsNotInKeys,
  listImports,
  getImportById,
  listImportRows,
  upsertCompany,
  insertContract,
  updateContract,
  insertHistoryEntries,
  insertResponsibles
};
