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
      user: {},
      formAction: '/usuarios',
      isEditing: false
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

async function edit(req, res, next) {
  try {
    const [roles, user] = await Promise.all([
      roleService.listRoles(),
      userService.getUser(req.params.id)
    ]);

    if (!user) {
      return res.status(404).render('errors/404', {
        title: 'Usuario nao encontrado'
      });
    }

    return res.render('users/form', {
      title: 'Editar usuario',
      roles,
      user,
      formAction: `/usuarios/${user.id}`,
      isEditing: true
    });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const result = await userService.updateUser(req.params.id, req.body);

    setFlash(req, result.ok ? 'success' : 'error', result.message);
    return res.redirect(result.ok ? '/usuarios' : `/usuarios/${req.params.id}/editar`);
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await userService.resetPassword({
      userId: req.params.id,
      newPassword: req.body.newPassword
    });

    setFlash(req, result.ok ? 'success' : 'error', result.message);
    return res.redirect('/usuarios');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  index,
  create,
  store,
  edit,
  update,
  resetPassword
};
