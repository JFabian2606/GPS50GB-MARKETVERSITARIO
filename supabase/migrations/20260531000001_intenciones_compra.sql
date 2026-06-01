-- ============================================================
-- Migración: Sistema de Intenciones de Compra
-- Rastrea clics en WhatsApp y confirmaciones de compra
-- ============================================================

-- Tabla de intenciones de compra
CREATE TABLE IF NOT EXISTS intenciones_compra (
    id SERIAL PRIMARY KEY,
    id_publicacion INTEGER NOT NULL REFERENCES publicacion(id_publicacion) ON DELETE CASCADE,
    id_comprador UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    codigo_transaccion VARCHAR(20) NOT NULL UNIQUE,
    estado VARCHAR(20) NOT NULL DEFAULT 'clickeado', -- 'clickeado', 'marcado_vendedor', 'confirmado', 'rechazado'
    fecha_clic TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_marcado_vendedor TIMESTAMPTZ NULL,
    fecha_confirmacion TIMESTAMPTZ NULL,
    calificacion_vendedor INTEGER NULL CHECK (calificacion_vendedor BETWEEN 1 AND 5),
    comentario_vendedor TEXT NULL,
    calificacion_comprador INTEGER NULL CHECK (calificacion_comprador BETWEEN 1 AND 5),
    comentario_comprador TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_intenciones_publicacion ON intenciones_compra(id_publicacion);
CREATE INDEX idx_intenciones_comprador ON intenciones_compra(id_comprador);
CREATE INDEX idx_intenciones_estado ON intenciones_compra(estado);
CREATE INDEX idx_intenciones_codigo ON intenciones_compra(codigo_transaccion);

-- Habilitar RLS
ALTER TABLE intenciones_compra ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados pueden ver intenciones
CREATE POLICY "Usuarios autenticados pueden ver intenciones" ON intenciones_compra
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Usuarios pueden crear sus propias intenciones
CREATE POLICY "Usuarios pueden crear intenciones" ON intenciones_compra
    FOR INSERT WITH CHECK (auth.uid() = id_comprador);

-- Política: Vendedores pueden ver intenciones de sus publicaciones
CREATE POLICY "Vendedores pueden ver intenciones de sus publicaciones" ON intenciones_compra
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM publicacion 
            WHERE publicacion.id_publicacion = intenciones_compra.id_publicacion 
            AND publicacion.id_usuario = auth.uid()
        )
    );

-- Política: Vendedores pueden actualizar intenciones de sus publicaciones
CREATE POLICY "Vendedores pueden actualizar intenciones de sus publicaciones" ON intenciones_compra
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM publicacion 
            WHERE publicacion.id_publicacion = intenciones_compra.id_publicacion 
            AND publicacion.id_usuario = auth.uid()
        )
    );

-- Política: Compradores pueden confirmar/rechazar sus propias intenciones
CREATE POLICY "Compradores pueden confirmar sus intenciones" ON intenciones_compra
    FOR UPDATE USING (
        auth.uid() = id_comprador 
        AND estado = 'marcado_vendedor'
    )
    WITH CHECK (
        auth.uid() = id_comprador 
        AND (estado = 'confirmado' OR estado = 'rechazado')
    );
