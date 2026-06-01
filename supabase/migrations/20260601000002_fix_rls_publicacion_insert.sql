-- ============================================================
-- Fix: Política RLS faltante para INSERT en tabla publicacion
-- Al habilitar RLS en sistema_confianza, se omitió la política
-- que permite a usuarios autenticados crear sus propias publicaciones.
-- ============================================================

-- Política para que cualquier usuario autenticado pueda crear publicaciones
CREATE POLICY "Usuarios autenticados pueden crear publicaciones" ON publicacion
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND auth.uid() = id_usuario
    );

-- Política para que el dueño pueda eliminar su propia publicación
CREATE POLICY "Dueño puede eliminar su publicación" ON publicacion
    FOR DELETE USING (auth.uid() = id_usuario);
