const noteRepository = require('../repositories/noteRepository');

async function createNote({ contractId, userId, note }) {
  if (!note || !note.trim()) {
    return { ok: false, message: 'Informe a observacao.' };
  }

  await noteRepository.createNote({
    contractId,
    userId,
    note: note.trim()
  });

  return { ok: true, message: 'Observacao registrada.' };
}

module.exports = { createNote };
