-- ============================================================
-- Marketvesitario - Migración para solicitudes de tutor y avatar
-- ============================================================

-- 1. Añadir avatar_url a la tabla profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);

-- 2. Crear tabla solicitudes_tutor
CREATE TABLE IF NOT EXISTS solicitudes_tutor (
    id_solicitud    SERIAL PRIMARY KEY,
    id_usuario      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mensaje         TEXT,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'aceptada' | 'rechazada'
    fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS (opcional si ya está configurado globalmente, pero buena práctica)
ALTER TABLE solicitudes_tutor ENABLE ROW LEVEL SECURITY;

-- Políticas temporales para pruebas locales (permitir todo a usuarios autenticados)
CREATE POLICY "Permitir select a autenticados en solicitudes_tutor" ON solicitudes_tutor
    FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "Permitir insert a autenticados en solicitudes_tutor" ON solicitudes_tutor
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Permitir update a autenticados en solicitudes_tutor" ON solicitudes_tutor
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir delete a autenticados en solicitudes_tutor" ON solicitudes_tutor
    FOR DELETE USING (auth.role() = 'authenticated');
