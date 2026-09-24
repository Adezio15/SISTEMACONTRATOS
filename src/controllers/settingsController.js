const settingsService = require('../services/settingsService');
const { setFlash } = require('../middlewares/attachLocals');

async function index(req, res, next) {
  try {
    const settings = await settingsService.listSettings();

    res.render('settings/index', {
      title: 'Configuracoes',
      settings
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    await settingsService.updateSettings(req.body.settings || {});
    setFlash(req, 'success', 'Configuracoes atualizadas.');
    res.redirect('/configuracoes');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index,
  update
};
