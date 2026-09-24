const roleService = require('../services/roleService');
const userService = require('../services/userService');
const { setFlash } = require('../middlewares/attachLocals');

async function index(req, res, next) {
  try {
    const users = await userService.listUsers();
    res.render('users/index', {
      title: 'Usuarios',
      users
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const roles = await roleService.listRoles();
    res.render('users/form', {
      title: 'Novo usuario',
      roles,
      user: {}
    });
  } catch (error) {
    next(error);
  }
}

async function store(req, res, next) {
  try {
    const result = await userService.createUser(req.body);

    setFlash(req, result.ok ? 'success' : 'error', result.message);
    res.redirect(result.ok ? '/usuarios' : '/usuarios/novo');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index,
  create,
  store
};
