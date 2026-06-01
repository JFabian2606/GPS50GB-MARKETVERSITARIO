-- ============================================================
-- Migración: Sistema de Confianza para Compras
-- Permite que tanto el comprador como el vendedor marquen como vendido
-- ============================================================

-- Agregar campos para rastrear quién marcó el estado y cuándo
ALTER TABLE publicacion
    ADD COLUMN IF NOT EXISTS comprador_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS fecha_venta TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS marcado_por VARCHAR(20) NULL CHECK (marcado_por IN ('vendedor', 'comprador'));

-- Actualizar estado para incluir 'reservado'
ALTER TABLE publicacion
    ALTER COLUMN estado SET DEFAULT 'activo',
    ADD CONSTRAINT chk_estado CHECK (estado IN ('activo', 'disponible', 'reservado', 'vendido', 'pausado'));

-- Habilitar RLS si no está habilitado
ALTER TABLE publicacion ENABLE ROW LEVEL SECURITY;

-- Política para permitir que cualquier usuario autenticado vea publicaciones
CREATE POLICY "Usuarios autenticados pueden ver publicaciones" ON publicacion
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir que el dueño actualice su publicación
CREATE POLICY "Dueño puede actualizar su publicación" ON publicacion
    FOR UPDATE USING (auth.uid() = id_usuario);

-- Política para permitir que compradores marquen como comprado (sistema de confianza)
-- La validación específica se hace en el API endpoint
CREATE POLICY "Compradores pueden marcar como comprado" ON publicacion
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND auth.uid() != id_usuario
        AND (estado = 'activo' OR estado = 'disponible')
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND auth.uid() != id_usuario
        AND (estado = 'vendido')
    );
