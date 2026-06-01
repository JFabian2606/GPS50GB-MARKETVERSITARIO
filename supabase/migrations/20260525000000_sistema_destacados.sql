-- ============================================================
-- Marketversitario - Sistema de Publicaciones Destacadas
-- Migración: 20260525000000_sistema_destacados
-- ============================================================

-- Añadir columnas de destacado a publicacion
ALTER TABLE publicacion
  ADD COLUMN IF NOT EXISTS destacada       BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS destacada_hasta TIMESTAMPTZ NULL;

-- Añadir columnas de destacado a tutoria
ALTER TABLE tutoria
  ADD COLUMN IF NOT EXISTS destacada       BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS destacada_hasta TIMESTAMPTZ NULL;

-- Nota: La tabla pagos (con estructura correcta) se crea/recrea en la migración
-- 20260525000001_fix_pagos_table.sql para evitar conflictos con pagos legacy.


-- Índice para búsquedas frecuentes (publicaciones destacadas vigentes)
CREATE INDEX IF NOT EXISTS idx_publicacion_destacada
  ON publicacion (destacada, destacada_hasta)
  WHERE destacada = TRUE;

CREATE INDEX IF NOT EXISTS idx_tutoria_destacada
  ON tutoria (destacada, destacada_hasta)
  WHERE destacada = TRUE;
