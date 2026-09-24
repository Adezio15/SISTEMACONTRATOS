function requireAuth(req, res, next) {
  if (!req.session.user) {
    if (String(req.path || '').startsWith('/api/')) {
      return res.status(401).json({
        ok: false,
        error: 'authentication_required'
      });
    }

    return res.redirect('/login');
  }

  return next();
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  return next();
}

module.exports = {
  requireAuth,
  redirectIfAuthenticated
};
