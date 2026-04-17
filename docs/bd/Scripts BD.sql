CREATE TABLE Usuario (
    idUsuario SERIAL PRIMARY KEY,
    TipoDocumento VARCHAR(20),
    Documento_identidad VARCHAR(12),
    Nombres VARCHAR(100),
    Apellidos VARCHAR(100),
    Genero VARCHAR(20),
    Email VARCHAR(100) UNIQUE,
    "Contraseña" VARCHAR(30),
    Telefono VARCHAR(20),
    ProgramaAcademico VARCHAR(100),
    Rol VARCHAR(20)
);


CREATE TABLE Horario (
    idHorario SERIAL PRIMARY KEY,
    DiaSemana VARCHAR(20),
    HoraInicio TIME,
    HoraFin TIME
);

CREATE TABLE Publicacion (
    idPublicacion SERIAL PRIMARY KEY,
    Titulo VARCHAR(150),
    Descripcion TEXT,
    Precio NUMERIC(10,2),
    Fecha_creacion TIMESTAMP,
    Estado VARCHAR(50),
    Imagen VARCHAR(255),
    Ubicacion VARCHAR(150),
    idUsuario INT,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario)
);

CREATE TABLE Tutoria (
    idTutoria SERIAL PRIMARY KEY,
    Titulo VARCHAR(150),
    Descripcion TEXT,
    Asignatura VARCHAR(100),
    Nivel VARCHAR(50),
    Precio NUMERIC(10,2),
    idUsuario INT,
    idHorario INT,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idHorario) REFERENCES Horario(idHorario)
);

CREATE TABLE Intercambio (
    idIntercambio SERIAL PRIMARY KEY,
    idPublicacion INT,
    idTutoria INT,
    Ofrece TEXT,
    Recibe TEXT,
    Descripcion TEXT,
    Fecha TIMESTAMP,
    FOREIGN KEY (idPublicacion) REFERENCES Publicacion(idPublicacion),
    FOREIGN KEY (idTutoria) REFERENCES Tutoria(idTutoria)
);

CREATE TABLE Solicitudes (
    idSolicitud SERIAL PRIMARY KEY,
    idUsuario INT,
    idTutoria INT,
    Mensaje TEXT,
    Intercambio INT,
    Fecha TIMESTAMP,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idTutoria) REFERENCES Tutoria(idTutoria),
    FOREIGN KEY (Intercambio) REFERENCES Intercambio(idIntercambio)
);

CREATE TABLE Valoracion (
    idValoracion SERIAL PRIMARY KEY,
    idUsuario INT,
    idPublicacion INT,
    Calificacion INT,
    Comentario TEXT,
    Fecha TIMESTAMP,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idPublicacion) REFERENCES Publicacion(idPublicacion)
);

CREATE TABLE Pagos (
    idPagos SERIAL PRIMARY KEY,
    idUsuario INT,
    idPublicacion INT,
    Monto NUMERIC(10,2),
    MetodoPago VARCHAR(50),
    Estado VARCHAR(50),
    Fecha TIMESTAMP,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idPublicacion) REFERENCES Publicacion(idPublicacion)
);



