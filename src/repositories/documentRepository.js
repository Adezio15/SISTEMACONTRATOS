const { getPool } = require('../config/database');

async function listDocuments(contractId) {
  const { rows } = await getPool().query(
    `
      select
        cd.*,
        u.full_name as user_name
      from contract_documents cd
      left join users u on u.id = cd.user_id
      where cd.contract_id = $1
      order by cd.created_at desc
    `,
    [contractId]
  );

  return rows;
}

async function findDocumentById(documentId) {
  const { rows } = await getPool().query(
    `
      select
        cd.*,
        c.contract_key
      from contract_documents cd
      join contracts c on c.id = cd.contract_id
      where cd.id = $1
      limit 1
    `,
    [documentId]
  );

  return rows[0] || null;
}

async function createDocument(document) {
  await getPool().query(
    `
      insert into contract_documents (
        contract_id,
        user_id,
        category,
        description,
        original_name,
        storage_path,
        mime_type,
        file_size
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      document.contractId,
      document.userId,
      document.category,
      document.description,
      document.originalName,
      document.storagePath,
      document.mimeType,
      document.fileSize
    ]
  );
}

module.exports = {
  listDocuments,
  findDocumentById,
  createDocument
};
