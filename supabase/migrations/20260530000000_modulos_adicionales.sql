-- ============================================================
-- Migración: Módulos de Disponibilidad y Agenda de Tutorías
-- ============================================================

-- 1. TABLA DISPONIBILIDAD TUTOR
CREATE TABLE IF NOT EXISTS disponibilidad_tutor (
    id              SERIAL PRIMARY KEY,
    id_usuario      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    dia_semana      INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Dom, 1=Lun, etc.
    hora_inicio     TIME NOT NULL,
    hora_fin        TIME NOT NULL,
    UNIQUE (id_usuario, dia_semana, hora_inicio, hora_fin)
);

-- Habilitar RLS en disponibilidad_tutor
ALTER TABLE disponibilidad_tutor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir select público en disponibilidad" ON disponibilidad_tutor
    FOR SELECT USING (true);

CREATE POLICY "Permitir todo al tutor dueño de su disponibilidad" ON disponibilidad_tutor
    FOR ALL USING (auth.uid() = id_usuario);

-- 2. MODIFICAR TABLA SOLICITUDES PARA AGENDAR FECHA Y HORAS
ALTER TABLE solicitudes 
    ADD COLUMN IF NOT EXISTS fecha_agenda DATE,
    ADD COLUMN IF NOT EXISTS hora_inicio TIME,
    ADD COLUMN IF NOT EXISTS hora_fin TIME;
