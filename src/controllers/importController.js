const contractImportService = require('../services/contractImportService');
const { setFlash } = require('../middlewares/attachLocals');
const { formatDateTime } = require('../utils/time');

async function index(req, res, next) {
  try {
    const imports = await contractImportService.listImports();

    res.render('imports/index', {
      title: 'Importar Dados',
      imports,
      formatDateTime
    });
  } catch (error) {
    next(error);
  }
}

async function store(req, res, next) {
  try {
    if (!req.file) {
      setFlash(req, 'error', 'Selecione um arquivo .xlsx, .xls ou .csv.');
      return res.redirect('/importacoes');
    }

    const result = await contractImportService.createPreview({
      file: req.file,
      userId: req.session.user.id
    });

    setFlash(req, 'success', 'Arquivo validado. Confira a previa antes de confirmar.');
    return res.redirect(`/importacoes/${result.importRecord.id}`);
  } catch (error) {
    return next(error);
  }
}

async function show(req, res, next) {
  try {
    const data = await contractImportService.getPreview(req.params.id);

    if (!data) {
      return res.status(404).render('errors/404', {
        title: 'Importacao nao encontrada'
      });
    }

    return res.render('imports/show', {
      title: 'Previa da Importacao',
      ...data,
      formatDateTime
    });
  } catch (error) {
    return next(error);
  }
}

async function confirm(req, res, next) {
  try {
    await contractImportService.confirmImport({
      importId: req.params.id,
      userId: req.session.user.id
    });

    setFlash(req, 'success', 'Importacao confirmada e aplicada com sucesso.');
    return res.redirect(`/importacoes/${req.params.id}`);
  } catch (error) {
    setFlash(req, 'error', error.message || 'Nao foi possivel confirmar a importacao.');
    return res.redirect(`/importacoes/${req.params.id}`);
  }
}

module.exports = {
  index,
  store,
  show,
  confirm
};
