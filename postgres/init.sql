-- 1. Tabla de Health Checks
/*CREATE TABLE IF NOT EXISTS health_checks (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL DEFAULT 'bootstrap'
);

-- 2. Tabla de Usuarios (Los Técnicos)
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 3. Tabla de Inventario (Catálogo de Placas)
CREATE TABLE IF NOT EXISTS inventory (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  part_number   VARCHAR(100) NOT NULL,
  chassis_model VARCHAR(100) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  price         NUMERIC(10, 2) NOT NULL,
  image_url     TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_part_number ON inventory(part_number);
CREATE INDEX IF NOT EXISTS idx_inventory_chassis_model ON inventory(chassis_model);

-- 4. Tabla de Mensajes (Chat P2P)
CREATE TABLE IF NOT EXISTS messages (
  id            SERIAL PRIMARY KEY,
  inventory_id  INT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  sender_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_inventory_id ON messages(inventory_id);

-- ==========================================
-- DATOS DE PRUEBA (SEEDING)
-- ==========================================

-- A. Insertar 2 usuarios para pruebas cruzadas (Contraseña para ambos: admin123)
INSERT INTO users (id, first_name, last_name, email, password_hash) 
VALUES 
  (1, 'Juan', 'Pérez', 'juan@taller.com', '$2b$10$alWKHzSu6G6tZ0/CuKR0L.DlGSB7fHHlGSLYdLTD1lEd2pjl7n9G.'),
  (2, 'Pedro', 'Gómez', 'pedro@taller.com', '$2b$10$alWKHzSu6G6tZ0/CuKR0L.DlGSB7fHHlGSLYdLTD1lEd2pjl7n9G.')
ON CONFLICT (email) DO NOTHING;

-- Sincronizar el contador de IDs (Para que el registro de nuevos usuarios no falle)
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- B. Insertar productos de prueba (Uno para cada técnico)
INSERT INTO inventory (user_id, part_number, chassis_model, title, description, price, image_url)
VALUES 
  -- Esta placa es de Juan (user_id = 1)
  (1, 'BN44-00932A', 'UN55NU7100', 'Fuente de Poder Samsung 55"', 'Fuente extraída de TV con pantalla rota.', 45.00, '/uploads/fuente_samsung.jpg'),
  
  -- Esta placa es de Pedro (user_id = 2)
  (2, 'EAX67133003', '43UJ6200', 'Mainboard LG 43"', 'Placa main funcionando correctamente.', 60.00, '/uploads/mainboard_lg.jpg')
ON CONFLICT DO NOTHING;*/
-- Revocar privilegios por defecto del esquema public por seguridad


-- Revocar privilegios por defecto del esquema public
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- ==========================================
-- MICROSERVICIO: AUTH
-- ==========================================
CREATE USER auth_user WITH PASSWORD 'auth_password_123';
CREATE SCHEMA auth_schema AUTHORIZATION auth_user;
GRANT ALL ON SCHEMA auth_schema TO auth_user;

-- Crear tabla apuntando explícitamente al esquema de auth
CREATE TABLE auth_schema.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'user',
    provider VARCHAR(30) NOT NULL DEFAULT 'local',
    provider_id VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Darle propiedad absoluta de la tabla al usuario del microservicio
ALTER TABLE auth_schema.users OWNER TO auth_user;

-- Insert inicial (Semilla)
INSERT INTO auth_schema.users (email, password, name, role) 
VALUES ('admin@tienda.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6Ttxw5CqQ2V/K5Fkq9F9nS9cH5O6K', 'Admin Principal', 'admin');


-- ==========================================
-- MICROSERVICIO: INVENTORY
-- ==========================================
CREATE USER inventory_user WITH PASSWORD 'inventory_password_123';
CREATE SCHEMA inventory_schema AUTHORIZATION inventory_user;
GRANT ALL ON SCHEMA inventory_schema TO inventory_user;

-- Crear tabla apuntando explícitamente al esquema de inventory
CREATE TABLE inventory_schema.products (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL, -- Hace referencia lógica al usuario, pero NO hay Foreign Key estricta entre esquemas
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- <-- AGREGADO
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- <-- AGREGADO
);

ALTER TABLE inventory_schema.products ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE inventory_schema.products OWNER TO inventory_user;

-- Inserts iniciales (Semilla)
INSERT INTO inventory_schema.products (seller_id, title, price, stock, description) 
VALUES (1, 'Laptop Pro', 1200.50, 10, 'Laptop de alta gama para profesionales'),
       (1, 'Teclado Mecánico', 85.00, 25, 'Teclado mecánico RGB retroiluminado');


-- ==========================================
-- MICROSERVICIO: CHAT
-- ==========================================
CREATE USER chat_user WITH PASSWORD 'chat_password_123';
CREATE SCHEMA chat_schema AUTHORIZATION chat_user;
GRANT ALL ON SCHEMA chat_schema TO chat_user;

CREATE TABLE chat_schema.messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    inventory_id INTEGER,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE chat_schema.messages OWNER TO chat_user;
