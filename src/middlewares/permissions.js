function requireRole(allowedRoles) {
  return (req, res, next) => {
    const roleKey = req.session.user?.roleKey;

    if (!roleKey || !allowedRoles.includes(roleKey)) {
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
