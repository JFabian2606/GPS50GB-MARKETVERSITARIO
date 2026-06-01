-- ============================================================
-- Marketvesitario - Seed Data (Solo para entorno LOCAL)
-- Para aplicar: pnpm exec supabase db reset
-- ============================================================
-- NOTA: En producción, los usuarios se crean desde el
-- Dashboard de Supabase en Authentication -> Users,
-- luego se actualiza el profile directamente desde la BD.
-- ============================================================

-- Habilitar extensión para hashear contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- UUIDs fijos para los usuarios de prueba
-- superadmin : 00000000-0000-0000-0000-000000000001
-- admin      : 00000000-0000-0000-0000-000000000002
-- estudiante : 00000000-0000-0000-0000-000000000003
-- Contraseña para todos: Test1234!

-- ----------------------------------------------------------------
-- 1. Insertar en auth.users
-- ----------------------------------------------------------------
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES
(
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'superadmin@marketversitario.com',
    crypt('Test1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombres":"Super","apellidos":"Admin"}',
    NOW(), NOW(), '', '', '', ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'admin@marketversitario.com',
    crypt('Test1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombres":"Admin","apellidos":"Prueba"}',
    NOW(), NOW(), '', '', '', ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'estudiante@marketversitario.com',
    crypt('Test1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombres":"Juan","apellidos":"Estudiante"}',
    NOW(), NOW(), '', '', '', ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'tutor@marketversitario.com',
    crypt('Test1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombres":"Ana","apellidos":"Tutor"}',
    NOW(), NOW(), '', '', '', ''
);

-- ----------------------------------------------------------------
-- 2. Insertar los perfiles en nuestra tabla
-- ----------------------------------------------------------------
INSERT INTO profiles (
    id,
    tipo_documento,
    documento_identidad,
    nombres,
    apellidos,
    genero,
    telefono,
    programa_academico,
    rol
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'CC', '1000000001', 'Super', 'Admin',
    'No especificado', '3000000001', 'Administración', 'superadmin'
),
(
    '00000000-0000-0000-0000-000000000002',
    'CC', '1000000002', 'Admin', 'Prueba',
    'No especificado', '3000000002', 'Sistemas', 'admin'
),
(
    '00000000-0000-0000-0000-000000000003',
    'CC', '1000000003', 'Juan', 'Estudiante',
    'Masculino', '3000000003', 'Ingeniería de Sistemas', 'estudiante'
),
(
    '00000000-0000-0000-0000-000000000004',
    'CC', '1000000004', 'Ana', 'Tutor',
    'Femenino', '3000000004', 'Matemáticas', 'tutor'
);

-- ----------------------------------------------------------------
-- 3. Publicaciones de prueba
-- ----------------------------------------------------------------
INSERT INTO publicacion (
    titulo, descripcion, precio, imagen, ubicacion,
    id_usuario, id_categoria, estado, created_at
) VALUES
(
    'Calculadora Casio FX-991LA Plus',
    'Calculadora científica en perfecto estado, apenas usada un semestre. Incluye estuche original. Ideal para cálculo, estadística y física.',
    85000,
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=800&auto=format&fit=crop',
    'Bloque D, Piso 2',
    '00000000-0000-0000-0000-000000000003',
    3, 'activo', NOW() - INTERVAL '2 days'
),
(
    'Libro: Fundamentos de Programación - 3ra Edición',
    'Libro de Joyanes Aguilar, excelente estado, sin subrayado. Perfecto para primer semestre de programación. Lo vendo porque ya lo aprobé.',
    35000,
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800&auto=format&fit=crop',
    'Cafetería Central',
    '00000000-0000-0000-0000-000000000003',
    2, 'activo', NOW() - INTERVAL '3 days'
),
(
    'Laptop HP Pavilion 15 - Core i5 8va Gen',
    'Laptop en buen estado, 8GB RAM, 256GB SSD, batería dura 4 horas. Teclado y pantalla sin daños. Se vende porque compré una nueva. Negociable.',
    1200000,
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop',
    'Entrada Principal - Portería',
    '00000000-0000-0000-0000-000000000003',
    1, 'activo', NOW() - INTERVAL '1 day'
),
(
    'Audífonos JBL Tune 510BT',
    'Audífonos bluetooth en perfecto estado, sin rayones, carga rápida, 40h batería. Solo tienen 2 meses de uso. Incluye cable USB-C.',
    120000,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
    'Bloque A, Sala de Estudio',
    '00000000-0000-0000-0000-000000000003',
    1, 'activo', NOW() - INTERVAL '5 hours'
),
(
    'Bata de Laboratorio Talla M',
    'Bata blanca de laboratorio, talla M, usada solo 2 veces, en perfecto estado. Sin manchas. Marca Halyard.',
    30000,
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop',
    'Bloque de Ciencias, Laboratorio 101',
    '00000000-0000-0000-0000-000000000003',
    4, 'activo', NOW() - INTERVAL '4 days'
),
(
    'Pack de Marcadores Stabilo Boss (12 colores)',
    'Set completo de 12 marcadores fluorescentes Stabilo, sin usar, sellados. Vendo porque me regalaron otro igual.',
    18000,
    'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?q=80&w=800&auto=format&fit=crop',
    'Papelería del Campus',
    '00000000-0000-0000-0000-000000000003',
    3, 'activo', NOW() - INTERVAL '12 hours'
),
(
    'Mouse Gamer Logitech G203 - Negro',
    'Mouse con 6 botones programables, iluminación RGB, cable USB. En perfecto estado, solo 3 meses de uso. Lo cambié por uno inalámbrico.',
    65000,
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop',
    'Bloque de Ingeniería',
    '00000000-0000-0000-0000-000000000003',
    1, 'vendido', NOW() - INTERVAL '7 days'
),
(
    'Apuntes Física Mecánica - Semestre completo',
    'Cuaderno completo de Física I con todos los temas: cinemática, dinámica, trabajo y energía. Muy organizado, con ejemplos resueltos. Fotocopias disponibles.',
    15000,
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop',
    'Fotocopiadora Bloque B',
    '00000000-0000-0000-0000-000000000003',
    2, 'activo', NOW() - INTERVAL '2 hours'
),
(
    'Mochila Totto Impermeable 30L',
    'Mochila color negro, impermeable, con compartimento para laptop hasta 15". Bolsillos organizadores, en muy buen estado. La uso desde hace 1 año.',
    80000,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop',
    'Entrada Principal',
    '00000000-0000-0000-0000-000000000003',
    6, 'reservado', NOW() - INTERVAL '3 days'
);

-- ----------------------------------------------------------------
-- 4. Tutorías de prueba
-- ----------------------------------------------------------------
INSERT INTO tutoria (
    titulo, descripcion, asignatura, nivel, precio, id_usuario, created_at
) VALUES
(
    'Tutoría de Cálculo Diferencial e Integral',
    'Ofrezco clases particulares de Cálculo I y II. Soy estudiante de 7mo semestre de Ingeniería. Precio por hora, grupos de hasta 3 personas. Horario flexible.',
    'Cálculo', 'Universitario', 25000,
    '00000000-0000-0000-0000-000000000004', NOW() - INTERVAL '6 hours'
),
(
    'Programación en Python desde Cero',
    'Aprende a programar en Python con enfoque en ciencia de datos. Clases prácticas con ejercicios reales.',
    'Programación', 'Básico', 35000,
    '00000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 day'
);

-- ----------------------------------------------------------------
-- 5. Solicitudes para probar la campanita
-- ----------------------------------------------------------------

-- Solicitud de Juan Estudiante para la tutoría de Ana Tutor
INSERT INTO solicitudes (
    id_usuario, id_tutoria, mensaje, estado, fecha
) VALUES (
    '00000000-0000-0000-0000-000000000003', 1, 'Hola, me gustaría agendar una hora para el viernes', 'pendiente', NOW() - INTERVAL '2 hours'
);

-- Solicitud de Juan Estudiante para convertirse en tutor (para Admin)
INSERT INTO solicitudes_tutor (
    id_usuario, mensaje, estado, fecha
) VALUES (
    '00000000-0000-0000-0000-000000000003', 'Me gustaría dar tutorías de Física ya que tengo un buen promedio.', 'pendiente', NOW() - INTERVAL '1 day'
);
