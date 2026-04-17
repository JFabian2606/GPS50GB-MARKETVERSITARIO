INSERT INTO Usuario 
(TipoDocumento, Documento_identidad, Nombres, Apellidos, Genero, Email, "Contraseña", Telefono, ProgramaAcademico, Rol)
VALUES
('CC', '123456789', 'Juan', 'Pérez', 'Masculino', 'juan@example.com', '1234', '3001234567', 'Ingeniería', 'usuario'),
('CC', '987654321', 'María', 'Gómez', 'Femenino', 'maria@example.com', '1234', '3007654321', 'Medicina', 'usuario');

INSERT INTO Horario (DiaSemana, HoraInicio, HoraFin)
VALUES
('Lunes', '08:00', '10:00'),
('Martes', '14:00', '16:00');

INSERT INTO Tutoria 
(Titulo, Descripcion, Asignatura, Nivel, Precio, idUsuario, idHorario)
VALUES
('Clases de Matemáticas', 'Álgebra básica', 'Matemáticas', 'Básico', 20000, 1, 1),
('Clases de Biología', 'Anatomía humana', 'Biología', 'Intermedio', 25000, 2, 2);

INSERT INTO Publicacion 
(Titulo, Descripcion, Precio, Fecha_creacion, Estado, Imagen, Ubicacion, idUsuario)
VALUES
('Libro de cálculo', 'Libro en buen estado', 30000, NOW(), 'Disponible', 'img1.jpg', 'Zarzal', 1),
('Venta de laptop', 'Portátil usado', 800000, NOW(), 'Disponible', 'img2.jpg', 'Roldanillo', 2);

INSERT INTO Intercambio 
(idPublicacion, idTutoria, Ofrece, Recibe, Descripcion, Fecha)
VALUES
(1, 1, 'Libro de física', 'Clases de matemáticas', 'Intercambio educativo', NOW());

INSERT INTO Solicitudes 
(idUsuario, idTutoria, Mensaje, Intercambio, Fecha)
VALUES
(2, 1, 'Estoy interesado en la tutoría', 1, NOW());

INSERT INTO ValoracionPublicacion
(idUsuario, idPublicacion, Calificacion, Comentario, Fecha)
VALUES
(2, 1, 5, 'Excelente producto', NOW());

INSERT INTO ValoracionTutoria
(idUsuario, idTutoria, Calificacion, Comentario, Fecha)
VALUES
(1, 2, 5, 'Excelente Clase', NOW());

INSERT INTO Pagos 
(idUsuario, idPublicacion, Monto, MetodoPago, Estado, Fecha)
VALUES
(2, 1, 30000, 'Transferencia', 'Completado', NOW());