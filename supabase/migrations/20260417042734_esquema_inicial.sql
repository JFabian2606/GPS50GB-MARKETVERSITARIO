-- ============================================================
-- Marketvesitario - Esquema Inicial
-- Migración: 20260417042734_esquema_inicial
-- Adaptado para Supabase (auth.users como base de autenticación)
-- ============================================================

-- ----------------------------------------------------------------
-- 1. PROFILES
-- ----------------------------------------------------------------
CREATE TABLE profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_documento      VARCHAR(20),
    documento_identidad VARCHAR(12) UNIQUE,
    nombres             VARCHAR(100) NOT NULL,
    apellidos           VARCHAR(100) NOT NULL,
    genero              VARCHAR(20),
    telefono            VARCHAR(20),
    programa_academico  VARCHAR(100),
    rol                 VARCHAR(20) NOT NULL DEFAULT 'estudiante', -- 'estudiante' | 'tutor' | 'admin'
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 2. HORARIO
-- Franjas de disponibilidad para las tutorías.
-- ----------------------------------------------------------------
CREATE TABLE horario (
    id_horario  SERIAL PRIMARY KEY,
    dia_semana  VARCHAR(20) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin    TIME NOT NULL
);

-- ----------------------------------------------------------------
-- 3. PUBLICACION
-- Productos o servicios publicados para compra, venta o intercambio.
-- ----------------------------------------------------------------
CREATE TABLE publicacion (
    id_publicacion  SERIAL PRIMARY KEY,
    titulo          VARCHAR(150) NOT NULL,
    descripcion     TEXT,
    precio          NUMERIC(10, 2),
    estado          VARCHAR(50) NOT NULL DEFAULT 'activo', -- 'activo' | 'vendido' | 'pausado'
    imagen          VARCHAR(255),
    ubicacion       VARCHAR(150),
    id_usuario      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 4. TUTORIA
-- Oferta de apoyo académico publicada por un tutor.
-- ----------------------------------------------------------------
CREATE TABLE tutoria (
    id_tutoria  SERIAL PRIMARY KEY,
    titulo      VARCHAR(150) NOT NULL,
    descripcion TEXT,
    asignatura  VARCHAR(100) NOT NULL,
    nivel       VARCHAR(50),
    precio      NUMERIC(10, 2),
    id_usuario  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    id_horario  INT REFERENCES horario(id_horario) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 5. INTERCAMBIO
-- Propuesta de intercambio entre una publicación y/o una tutoría.
-- ----------------------------------------------------------------
CREATE TABLE intercambio (
    id_intercambio  SERIAL PRIMARY KEY,
    id_publicacion  INT REFERENCES publicacion(id_publicacion) ON DELETE CASCADE,
    id_tutoria      INT REFERENCES tutoria(id_tutoria) ON DELETE CASCADE,
    ofrece          TEXT NOT NULL,
    recibe          TEXT NOT NULL,
    descripcion     TEXT,
    fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 6. SOLICITUDES
-- Solicitudes de contacto entre usuarios para tutorías o intercambios.
-- ----------------------------------------------------------------
CREATE TABLE solicitudes (
    id_solicitud    SERIAL PRIMARY KEY,
    id_usuario      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    id_tutoria      INT REFERENCES tutoria(id_tutoria) ON DELETE CASCADE,
    id_intercambio  INT REFERENCES intercambio(id_intercambio) ON DELETE SET NULL,
    mensaje         TEXT,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'aceptada' | 'rechazada'
    fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 7A. VALORACION_PUBLICACION
-- Calificación de un producto/publicación por parte de un usuario.
-- ----------------------------------------------------------------
CREATE TABLE valoracion_publicacion (
    id_valoracion   SERIAL PRIMARY KEY,
    id_usuario      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    id_publicacion  INT NOT NULL REFERENCES publicacion(id_publicacion) ON DELETE CASCADE,
    calificacion    INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id_usuario, id_publicacion) -- Un usuario, una valoración por publicación
);

-- ----------------------------------------------------------------
-- 7B. VALORACION_TUTORIA
-- Calificación de una tutoría recibida por parte de un estudiante.
-- ----------------------------------------------------------------
CREATE TABLE valoracion_tutoria (
    id_valoracion   SERIAL PRIMARY KEY,
    id_usuario      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    id_tutoria      INT NOT NULL REFERENCES tutoria(id_tutoria) ON DELETE CASCADE,
    calificacion    INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id_usuario, id_tutoria) -- Un usuario, una valoración por tutoría
);

-- ----------------------------------------------------------------
-- 8. PAGOS
-- NOTA: La tabla 'pagos' se crea en la migración 20260525000000_sistema_destacados.sql
-- con la estructura correcta para el sistema de publicaciones destacadas.
-- ----------------------------------------------------------------


-- ----------------------------------------------------------------
-- 9. FUNCIÓN + TRIGGER: Auto-actualizar updated_at
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_publicacion_updated_at
    BEFORE UPDATE ON publicacion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tutoria_updated_at
    BEFORE UPDATE ON tutoria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
