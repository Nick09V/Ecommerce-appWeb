const authService = require('../services/auth.service');
const logger = require('../utils/logger');

const getSignin = (req, res) => {
  res.render('auth/signin', {
    title: 'Iniciar Sesión',
    errors: [],
    old: {},
  });
};

const postSignin = async (req, res, next) => {
  try {
    if (req.validationErrors) {
      return res.render('auth/signin', {
        title: 'Iniciar Sesión',
        errors: req.validationErrors,
        old: { email: req.body.email },
      });
    }

    const { email, password } = req.body;
    const user = await authService.login(email, password);

    req.session.userId = user.id;
    req.session.userName = `${user.first_name} ${user.last_name}`;
    req.session.userEmail = user.email;

    res.redirect('/');
  } catch (error) {
    if (error.status === 401) {
      return res.render('auth/signin', {
        title: 'Iniciar Sesión',
        errors: [error.message],
        old: { email: req.body.email },
      });
    }
    next(error);
  }
};

const getSignup = (req, res) => {
  res.render('auth/signup', {
    title: 'Crear Cuenta',
    errors: [],
    old: {},
  });
};

const postSignup = async (req, res, next) => {
  try {
    if (req.validationErrors) {
      return res.render('auth/signup', {
        title: 'Crear Cuenta',
        errors: req.validationErrors,
        old: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
        },
      });
    }

    const { firstName, lastName, email, password } = req.body;
    const user = await authService.register({ firstName, lastName, email, password });

    req.session.userId = user.id;
    req.session.userName = `${user.first_name} ${user.last_name}`;
    req.session.userEmail = user.email;

    res.redirect('/');
  } catch (error) {
    if (error.status === 409) {
      return res.render('auth/signup', {
        title: 'Crear Cuenta',
        errors: [error.message],
        old: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
        },
      });
    }
    next(error);
  }
};

const getResetPassword = (req, res) => {
  res.render('auth/reset-password', {
    title: 'Restablecer Contraseña',
    errors: [],
    success: null,
    step: 'email',
    email: '',
  });
};

const postVerifyEmail = async (req, res, next) => {
  try {
    if (req.validationErrors) {
      return res.render('auth/reset-password', {
        title: 'Restablecer Contraseña',
        errors: req.validationErrors,
        success: null,
        step: 'email',
        email: req.body.email || '',
      });
    }

    const { email } = req.body;
    const authRepository = require('../repositories/auth.repository');
    const user = await authRepository.findByEmail(email);

    if (!user) {
      return res.render('auth/reset-password', {
        title: 'Restablecer Contraseña',
        errors: ['No se encontró una cuenta con ese correo electrónico'],
        success: null,
        step: 'email',
        email,
      });
    }

    res.render('auth/reset-password', {
      title: 'Restablecer Contraseña',
      errors: [],
      success: null,
      step: 'password',
      email,
    });
  } catch (error) {
    next(error);
  }
};

const postResetPassword = async (req, res, next) => {
  try {
    if (req.validationErrors) {
      return res.render('auth/reset-password', {
        title: 'Restablecer Contraseña',
        errors: req.validationErrors,
        success: null,
        step: 'password',
        email: req.body.email || '',
      });
    }

    const { email, newPassword } = req.body;
    await authService.resetPassword(email, newPassword);

    res.render('auth/reset-password', {
      title: 'Restablecer Contraseña',
      errors: [],
      success: 'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.',
      step: 'email',
      email: '',
    });
  } catch (error) {
    if (error.status === 404) {
      return res.render('auth/reset-password', {
        title: 'Restablecer Contraseña',
        errors: [error.message],
        success: null,
        step: 'email',
        email: req.body.email || '',
      });
    }
    next(error);
  }
};

const postSignout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error('Error destroying session:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/auth/signin');
  });
};

module.exports = {
  getSignin,
  postSignin,
  getSignup,
  postSignup,
  getResetPassword,
  postVerifyEmail,
  postResetPassword,
  postSignout,
};
