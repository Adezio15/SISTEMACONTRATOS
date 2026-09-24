function requireRole(allowedRoles) {
  return (req, res, next) => {
    const roleKey = req.session.user?.roleKey;

    if (!roleKey || !allowedRoles.includes(roleKey)) {
      if (String(req.path || '').startsWith('/api/')) {
        return res.status(403).json({
          ok: false,
          error: 'access_denied'
        });
      }

      return res.status(403).render('errors/403', {
        title: 'Acesso negado'
      });
    }

    return next();
  };
}

function requirePermission(permissionKey) {
  return (req, res, next) => {
    const permissions = req.session.user?.permissions || [];

    if (!permissions.includes(permissionKey)) {
      if (String(req.path || '').startsWith('/api/')) {
        return res.status(403).json({
          ok: false,
          error: 'access_denied'
        });
      }

      return res.status(403).render('errors/403', {
        title: 'Acesso negado'
      });
    }

    return next();
  };
}

module.exports = {
  requireRole,
  requirePermission
};
