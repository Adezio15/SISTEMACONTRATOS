const contractService = require('../services/contractService');
const documentService = require('../services/documentService');
const noteService = require('../services/noteService');
const taskService = require('../services/taskService');
const { setFlash } = require('../middlewares/attachLocals');
const { formatCurrency, formatDate, formatPercent } = require('../utils/formatters');

async function index(req, res, next) {
  try {
    const data = await contractService.listContracts(req.query);
    const makePageUrl = (page) => {
      const params = new URLSearchParams();
      const values = {
        ...data.filters,
        sort: data.sort.field,
        direction: data.sort.direction,
        page
      };

      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, value);
        }
      });

      return `?${params.toString()}`;
    };

    res.render('contracts/index', {
      title: 'Contratos',
      ...data,
      formatCurrency,
      formatDate,
      formatPercent,
      makePageUrl
    });
  } catch (error) {
    next(error);
  }
}

async function show(req, res, next) {
  try {
    const data = await contractService.getContractDetails(req.params.id);

    if (!data) {
      return res.status(404).render('errors/404', {
        title: 'Contrato nao encontrado'
      });
    }

    return res.render('contracts/show', {
      title: `Contrato ${data.contract.contract_key}`,
      ...data,
      formatCurrency,
      formatDate,
      formatPercent,
      canManageContracts: req.session.user.permissions.includes('contracts.manage')
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  index,
  show,
  addDocument,
  downloadDocument,
  addTask,
  addNote
};

async function addDocument(req, res, next) {
  try {
    const result = await documentService.createDocument({
      contractId: req.params.id,
      userId: req.session.user.id,
      file: req.file,
      category: req.body.category,
      description: req.body.description
    });

    setFlash(req, result.ok ? 'success' : 'error', result.message);
    res.redirect(`/contratos/${req.params.id}#documentos`);
  } catch (error) {
    next(error);
  }
}

async function downloadDocument(req, res, next) {
  try {
    const document = await documentService.getDocumentForDownload(req.params.documentId);

    if (!document || document.contract_id !== req.params.id) {
      return res.status(404).render('errors/404', {
        title: 'Documento nao encontrado'
      });
    }

    return res.download(document.storage_path, document.original_name);
  } catch (error) {
    return next(error);
  }
}

async function addTask(req, res, next) {
  try {
    const result = await taskService.createTask({
      contractId: req.params.id,
      title: req.body.title,
      description: req.body.description,
      responsibleUserId: req.body.responsibleUserId,
      dueDate: req.body.dueDate,
      priority: req.body.priority,
      notes: req.body.notes,
      createdByUserId: req.session.user.id
    });

    setFlash(req, result.ok ? 'success' : 'error', result.message);
    res.redirect(`/contratos/${req.params.id}#pendencias`);
  } catch (error) {
    next(error);
  }
}

async function addNote(req, res, next) {
  try {
    const result = await noteService.createNote({
      contractId: req.params.id,
      userId: req.session.user.id,
      note: req.body.note
    });

    setFlash(req, result.ok ? 'success' : 'error', result.message);
    res.redirect(`/contratos/${req.params.id}#observacoes`);
  } catch (error) {
    next(error);
  }
}
