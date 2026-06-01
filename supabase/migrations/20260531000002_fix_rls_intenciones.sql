-- ============================================================
-- Migración: Corregir Política RLS de Intenciones de Compra
-- Permite al comprador actualizar el estado de 'marcado_vendedor' a 'confirmado' o 'rechazado'
-- ============================================================

DROP POLICY IF EXISTS "Compradores pueden confirmar sus intenciones" ON intenciones_compra;

CREATE POLICY "Compradores pueden confirmar sus intenciones" ON intenciones_compra
    FOR UPDATE USING (
        auth.uid() = id_comprador 
        AND estado = 'marcado_vendedor'
    )
    WITH CHECK (
        auth.uid() = id_comprador 
        AND (estado = 'confirmado' OR estado = 'rechazado')
    );
