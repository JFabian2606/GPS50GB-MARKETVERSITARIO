-- ============================================================
-- MarketVersitario - Sistema de Favoritos / Guardados
-- Migración: 20260601000000_favoritos
-- ============================================================

CREATE TABLE IF NOT EXISTS favoritos (
  id_favorito      SERIAL PRIMARY KEY,
  id_usuario       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  id_publicacion   INTEGER NULL REFERENCES publicacion(id_publicacion) ON DELETE CASCADE,
  id_tutoria       INTEGER NULL REFERENCES tutoria(id_tutoria) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_only_one_item_type CHECK (
    (id_publicacion IS NOT NULL AND id_tutoria IS NULL) OR
    (id_publicacion IS NULL AND id_tutoria IS NOT NULL)
  ),
  UNIQUE (id_usuario, id_publicacion),
  UNIQUE (id_usuario, id_tutoria)
);

-- Habilitar RLS
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view their own favorites" ON favoritos
  FOR SELECT USING (auth.uid() = id_usuario);

CREATE POLICY "Users can add their own favorites" ON favoritos
  FOR INSERT WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Users can delete their own favorites" ON favoritos
  FOR DELETE USING (auth.uid() = id_usuario);
