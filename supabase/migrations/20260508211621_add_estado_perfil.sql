-- Agrega la columna estado a la tabla profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';
