-- 1. Tabla de Health Checks
CREATE TABLE IF NOT EXISTS health_checks (
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
ON CONFLICT DO NOTHING;