const authService = require('../services/authService');
const userService = require('../services/userService');
const { setFlash } = require('../middlewares/attachLocals');

function showLogin(req, res) {
  res.render('auth/login', {
    title: 'Entrar'
  });
}

async function login(req, res, next) {
  try {
    const { registration, password } = req.body;
    const result = await authService.login({ registration, password });

    if (!result.ok) {
      setFlash(req, 'error', result.message);
      return res.redirect('/login');
    }

    req.session.user = result.user;
    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    return res.redirect('/login');
  });
}

function showForgotPassword(req, res) {
  res.render('auth/forgot-password', {
    title: 'Esqueci minha senha'
  });
}

async function requestPasswordReset(req, res, next) {
  try {
    const result = await userService.requestPasswordReset({
      registration: req.body.registration
    });

    setFlash(req, result.ok ? 'success' : 'error', result.message);
    return res.redirect(result.ok ? '/login' : '/senha/esqueci');
  } catch (error) {
    return next(error);
  }
}

function showChangePassword(req, res) {
  res.render('auth/change-password', {
    title: 'Alterar senha'
  });
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      setFlash(req, 'error', 'A confirmacao da senha nao confere.');
      return res.redirect('/senha/alterar');
    }

    const result = await userService.changePassword({
      userId: req.session.user.id,
      currentPassword,
      newPassword
    });

    setFlash(req, result.ok ? 'success' : 'error', result.message);
    return res.redirect(result.ok ? '/dashboard' : '/senha/alterar');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  showLogin,
  login,
  logout,
  showForgotPassword,
  requestPasswordReset,
  showChangePassword,
  changePassword
};
