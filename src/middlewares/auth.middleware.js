const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/auth/signin');
  }
  next();
};

const requireGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  next();
};

module.exports = {
  requireAuth,
  requireGuest,
};
