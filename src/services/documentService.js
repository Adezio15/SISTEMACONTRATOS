const documentRepository = require('../repositories/documentRepository');
const { hasDatabaseConfig } = require('../config/database');
const fs = require('fs');

async function createDocument({ contractId, userId, file, category, description }) {
  if (!hasDatabaseConfig()) {
    return { ok: false, message: 'Modo local demo: configure DATABASE_URL para anexar documentos.' };
  }

  if (!file) {
    return { ok: false, message: 'Selecione um arquivo.' };
  }

  await documentRepository.createDocument({
    contractId,
    userId,
    category: category || 'OUTROS',
    description: description?.trim() || null,
    originalName: file.originalname,
    storagePath: file.path,
    mimeType: file.mimetype,
    fileSize: file.size
  });

  return { ok: true, message: 'Documento anexado com sucesso.' };
}

async function getDocumentForDownload(documentId) {
  if (!hasDatabaseConfig()) {
    return null;
  }

  const document = await documentRepository.findDocumentById(documentId);

  if (!document || !fs.existsSync(document.storage_path)) {
    return null;
  }

  return document;
}

module.exports = {
  createDocument,
  getDocumentForDownload
};
