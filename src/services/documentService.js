const documentRepository = require('../repositories/documentRepository');

async function createDocument({ contractId, userId, file, category, description }) {
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

module.exports = { createDocument };
