-- ============================================================
-- Fix: Reemplazar tabla pagos legacy con la nueva estructura
-- ============================================================

-- Eliminar tabla pagos vieja (del esquema inicial, estructura diferente)
DROP TABLE IF EXISTS pagos CASCADE;

-- Crear tabla pagos nueva con la estructura correcta para el sistema de destacados
CREATE TABLE pagos (
  id_pago      SERIAL PRIMARY KEY,
  id_usuario   UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo_item    VARCHAR(20)   NOT NULL CHECK (tipo_item IN ('publicacion', 'tutoria')),
  id_item      INTEGER       NOT NULL,
  monto        NUMERIC(10,2) NOT NULL DEFAULT 10000,
  estado       VARCHAR(20)   NOT NULL DEFAULT 'completado' CHECK (estado IN ('completado', 'fallido', 'pendiente')),
  referencia   VARCHAR(100)  NOT NULL,
  metodo_pago  VARCHAR(50),
  ultimos4     VARCHAR(4),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own payments" ON pagos
  FOR SELECT USING (
    auth.uid() = id_usuario
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND rol IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Users insert own payments" ON pagos
  FOR INSERT WITH CHECK (auth.uid() = id_usuario);
