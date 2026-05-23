-- ============================================================
-- Migración: Tabla de categorías y Storage bucket para imágenes
-- ============================================================

-- ----------------------------------------------------------------
-- 1. TABLA CATEGORIAS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria    SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL UNIQUE,
    descripcion     TEXT,
    activa          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agregar columna categoria a publicacion (referencia)
ALTER TABLE publicacion 
    ADD COLUMN IF NOT EXISTS id_categoria INT REFERENCES categorias(id_categoria) ON DELETE SET NULL;

-- ----------------------------------------------------------------
-- 2. SEED DE CATEGORÍAS INICIALES
-- ----------------------------------------------------------------
INSERT INTO categorias (nombre, descripcion) VALUES
    ('Tecnología y Electrónica', 'Computadores, celulares, periféricos y más'),
    ('Libros y Copias', 'Libros universitarios, fotocopias y apuntes'),
    ('Útiles Universitarios', 'Calculadoras, cuadernos, lapiceros y materiales'),
    ('Ropa y Accesorios', 'Batas, uniformes, ropa y accesorios'),
    ('Servicios Estudiantiles', 'Tutorías, diseño, traducciones y servicios'),
    ('Otros', 'Artículos que no encajan en las categorías anteriores')
ON CONFLICT (nombre) DO NOTHING;

-- ----------------------------------------------------------------
-- 3. STORAGE BUCKET para imágenes de publicaciones
-- ----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
    VALUES ('publicaciones-imagenes', 'publicaciones-imagenes', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Cualquier usuario autenticado puede subir
CREATE POLICY "Usuarios autenticados pueden subir imágenes"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'publicaciones-imagenes');

-- Policy: Cualquiera puede ver imágenes (bucket público)
CREATE POLICY "Imágenes públicas de publicaciones"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'publicaciones-imagenes');

-- Policy: El dueño puede eliminar su imagen
CREATE POLICY "Dueño puede eliminar su imagen"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'publicaciones-imagenes' AND auth.uid()::text = (storage.foldername(name))[1]);
