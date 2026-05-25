const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const inventoryRoutes = require('./routes/inventory.routes'); // 1. IMPORTAMOS LAS RUTAS DE INVENTARIO

const notFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const { requireAuth } = require('./middlewares/auth.middleware');
const sessionMiddleware = require('./config/session');
const registerSockets = require('./sockets');
const { port, corsOrigin } = require('./config/env');
const { connectPostgres } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(sessionMiddleware);

// Make session user data available in all EJS views
app.use((req, res, next) => {
  res.locals.user = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, email: req.session.userEmail }
    : null;

    res.locals.successMessage = req.session.successMessage || null;
   delete req.session.successMessage;
  next();
});

// Auth routes (public)
app.use('/auth', authRoutes);

// 2. REGISTRAMOS EL MÓDULO DE INVENTARIO
app.use('/inventory', inventoryRoutes);

// 3. ACTUALIZAMOS LA RUTA RAÍZ PARA QUE REDIRIJA AL CATÁLOGO
// Mantenemos el requireAuth por seguridad antes de redirigir
app.get('/', requireAuth, (req, res) => {
  res.redirect('/inventory');
});

app.use('/api', healthRoutes);
app.use(notFound);
app.use(errorHandler);

registerSockets(io);

const bootstrap = async () => {
  try {
    await connectPostgres();
    await connectRedis();

    server.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error('Application bootstrap failed', error);
    process.exit(1);
  }
};

bootstrap();