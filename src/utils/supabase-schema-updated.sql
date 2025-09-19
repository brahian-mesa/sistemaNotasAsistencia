-- Esquema de base de datos actualizado para el Sistema Escolar
-- Ejecutar estos comandos en Supabase SQL Editor
-- Este esquema elimina completamente la dependencia de localStorage

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    usuario VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    grado VARCHAR(100),
    rol VARCHAR(100) DEFAULT 'docente',
    setupCompleto BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de estudiantes (con relación a usuario)
CREATE TABLE IF NOT EXISTS estudiantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(100) NOT NULL,
    grado VARCHAR(100),
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(codigo, usuario_id) -- Un código único por usuario
);

-- Tabla de materias (con relación a usuario)
CREATE TABLE IF NOT EXISTS materias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(100),
    grado VARCHAR(100),
    horario TEXT,
    color VARCHAR(200),
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de períodos académicos (globales para todos los usuarios)
CREATE TABLE IF NOT EXISTS periodos_academicos (
    numero INTEGER PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asistencias (con relación a usuario)
CREATE TABLE IF NOT EXISTS asistencias (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER REFERENCES estudiantes(id) ON DELETE CASCADE,
    materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    estado VARCHAR(100) NOT NULL CHECK (estado IN ('presente', 'ausente', 'justificado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tipos de nota por período (con relación a usuario)
CREATE TABLE IF NOT EXISTS tipos_nota_periodo (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    contenido JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id)
);

-- Tabla de notas detalladas (con relación a usuario)
CREATE TABLE IF NOT EXISTS notas_detalladas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    contenido JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id)
);

-- Tabla de notas individuales (con relación a usuario)
CREATE TABLE IF NOT EXISTS notas_individuales (
    id SERIAL PRIMARY KEY,
    materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
    estudiante_id INTEGER REFERENCES estudiantes(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    periodo INTEGER NOT NULL CHECK (periodo BETWEEN 1 AND 4),
    tipo_nota_id INTEGER NOT NULL,
    titulo VARCHAR(500) NOT NULL,
    valor DECIMAL(3,1) NOT NULL CHECK (valor BETWEEN 1.0 AND 5.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(materia_id, estudiante_id, periodo, tipo_nota_id, usuario_id)
);

-- Tabla de notas personales (con relación a usuario)
CREATE TABLE IF NOT EXISTS notas_personales (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    contenido TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id) -- Un usuario solo puede tener un bloc de notas
);

-- Tabla de eventos del calendario personal (con relación a usuario)
CREATE TABLE IF NOT EXISTS eventos_calendario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    tipo VARCHAR(50) DEFAULT 'personal' CHECK (tipo IN ('personal', 'academico', 'trabajo', 'cita')),
    recordatorio INTEGER DEFAULT 15, -- minutos antes
    ubicacion VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de tema (con relación a usuario)
CREATE TABLE IF NOT EXISTS configuracion_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    tema VARCHAR(50) DEFAULT 'light' CHECK (tema IN ('light', 'dark', 'auto')),
    configuraciones JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_estudiantes_usuario ON estudiantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_codigo ON estudiantes(codigo);
CREATE INDEX IF NOT EXISTS idx_materias_usuario ON materias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_materias_grado ON materias(grado);
CREATE INDEX IF NOT EXISTS idx_asistencias_usuario ON asistencias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_estudiante_fecha ON asistencias(estudiante_id, fecha);
CREATE INDEX IF NOT EXISTS idx_tipos_nota_periodo_usuario ON tipos_nota_periodo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notas_detalladas_usuario ON notas_detalladas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notas_individuales_usuario ON notas_individuales(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notas_individuales_materia ON notas_individuales(materia_id);
CREATE INDEX IF NOT EXISTS idx_notas_individuales_estudiante ON notas_individuales(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_notas_personales_usuario ON notas_personales(usuario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_usuario ON eventos_calendario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_fecha ON eventos_calendario(fecha);
CREATE INDEX IF NOT EXISTS idx_configuracion_usuario ON configuracion_usuario(usuario_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_estudiantes_updated_at BEFORE UPDATE ON estudiantes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materias_updated_at BEFORE UPDATE ON materias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_periodos_academicos_updated_at BEFORE UPDATE ON periodos_academicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tipos_nota_periodo_updated_at BEFORE UPDATE ON tipos_nota_periodo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notas_detalladas_updated_at BEFORE UPDATE ON notas_detalladas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notas_individuales_updated_at BEFORE UPDATE ON notas_individuales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notas_personales_updated_at BEFORE UPDATE ON notas_personales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_eventos_calendario_updated_at BEFORE UPDATE ON eventos_calendario FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracion_usuario_updated_at BEFORE UPDATE ON configuracion_usuario FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad (RLS) - Recomendado para producción
-- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notas_individuales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notas_personales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE configuracion_usuario ENABLE ROW LEVEL SECURITY;

-- Insertar períodos académicos por defecto
INSERT INTO periodos_academicos (numero, nombre, fecha_inicio, fecha_fin) VALUES
(1, 'Período 1', '2025-01-27', '2025-04-04'),
(2, 'Período 2', '2025-04-07', '2025-06-16'),
(3, 'Período 3', '2025-07-07', '2025-09-12'),
(4, 'Período 4', '2025-09-15', '2025-11-28')
ON CONFLICT (numero) DO NOTHING;

-- Insertar configuración inicial de tipos de nota
INSERT INTO tipos_nota_periodo (contenido) VALUES
('{
  "1": {
    "nombre": "Quices",
    "porcentaje": 30,
    "color": "#3B82F6"
  },
  "2": {
    "nombre": "Trabajos",
    "porcentaje": 25,
    "color": "#10B981"
  },
  "3": {
    "nombre": "Exámenes",
    "porcentaje": 35,
    "color": "#F59E0B"
  },
  "4": {
    "nombre": "Participación",
    "porcentaje": 10,
    "color": "#8B5CF6"
  }
}')
ON CONFLICT DO NOTHING;

-- Comentarios para documentar el esquema
COMMENT ON TABLE usuarios IS 'Usuarios del sistema (docentes)';
COMMENT ON TABLE estudiantes IS 'Estudiantes asociados a cada usuario/docente';
COMMENT ON TABLE materias IS 'Materias asignadas a cada usuario/docente';
COMMENT ON TABLE periodos_academicos IS 'Períodos académicos del año escolar (globales)';
COMMENT ON TABLE asistencias IS 'Registro de asistencia de estudiantes por materia y fecha';
COMMENT ON TABLE tipos_nota_periodo IS 'Configuración de tipos de nota por período (por usuario)';
COMMENT ON TABLE notas_detalladas IS 'Notas detalladas del sistema (por usuario)';
COMMENT ON TABLE notas_individuales IS 'Notas individuales de estudiantes por materia';
COMMENT ON TABLE notas_personales IS 'Bloc de notas personal de cada docente';
COMMENT ON TABLE eventos_calendario IS 'Eventos del calendario personal de cada docente';
COMMENT ON TABLE configuracion_usuario IS 'Configuraciones personales de cada usuario';