-- =====================================================
-- ESQUEMA COMPLETO PARA SUPABASE - SISTEMA DE NOTAS
-- =====================================================
-- Este archivo contiene todas las tablas necesarias para el sistema
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- 1. TABLA DE USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'docente',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABLA DE ESTUDIANTES
-- =====================================================
CREATE TABLE IF NOT EXISTS estudiantes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    grado VARCHAR(50),
    grupo VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABLA DE MATERIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS materias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50),
    grado VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABLA DE PERÍODOS ACADÉMICOS
-- =====================================================
CREATE TABLE IF NOT EXISTS periodos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TABLA DE TIPOS DE NOTA POR PERÍODO
-- =====================================================
CREATE TABLE IF NOT EXISTS tipos_nota_periodo (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    periodo VARCHAR(50) NOT NULL,
    tipo_nota VARCHAR(100) NOT NULL,
    porcentaje DECIMAL(5,2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, periodo, tipo_nota)
);

-- =====================================================
-- 6. TABLA DE NOTAS DETALLADAS
-- =====================================================
CREATE TABLE IF NOT EXISTS notas_detalladas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
    estudiante_id INTEGER REFERENCES estudiantes(id) ON DELETE CASCADE,
    periodo VARCHAR(50) NOT NULL,
    tipo_nota VARCHAR(100) NOT NULL,
    nota DECIMAL(5,2),
    observaciones TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, materia_id, estudiante_id, periodo, tipo_nota)
);

-- =====================================================
-- 7. TABLA DE NOTAS INDIVIDUALES
-- =====================================================
CREATE TABLE IF NOT EXISTS notas_individuales (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
    estudiante_id INTEGER REFERENCES estudiantes(id) ON DELETE CASCADE,
    periodo VARCHAR(50) NOT NULL,
    tipo_nota_id INTEGER REFERENCES tipos_nota_periodo(id) ON DELETE CASCADE,
    nota DECIMAL(5,2),
    observaciones TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(materia_id, estudiante_id, periodo, tipo_nota_id, usuario_id)
);

-- =====================================================
-- 8. TABLA DE ASISTENCIA
-- =====================================================
CREATE TABLE IF NOT EXISTS asistencia (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
    estudiante_id INTEGER REFERENCES estudiantes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('presente', 'ausente', 'justificado', 'tardanza')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, materia_id, estudiante_id, fecha)
);

-- =====================================================
-- 9. TABLA DE EVENTOS DEL CALENDARIO PERSONAL
-- =====================================================
CREATE TABLE IF NOT EXISTS eventos_calendario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    tipo_evento VARCHAR(50) DEFAULT 'personal',
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. TABLA DE CALENDARIO ESCOLAR PDF
-- =====================================================
CREATE TABLE IF NOT EXISTS calendario_escolar_pdf (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    datos_archivo TEXT NOT NULL, -- Base64 del PDF
    tamaño_archivo BIGINT,
    tipo_mime VARCHAR(100) DEFAULT 'application/pdf',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id)
);

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- Índices para estudiantes
CREATE INDEX IF NOT EXISTS idx_estudiantes_usuario ON estudiantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_codigo ON estudiantes(codigo);
CREATE INDEX IF NOT EXISTS idx_estudiantes_grado_grupo ON estudiantes(grado, grupo);

-- Índices para materias
CREATE INDEX IF NOT EXISTS idx_materias_usuario ON materias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_materias_grado ON materias(grado);

-- Índices para períodos
CREATE INDEX IF NOT EXISTS idx_periodos_usuario ON periodos(usuario_id);

-- Índices para tipos de nota
CREATE INDEX IF NOT EXISTS idx_tipos_nota_periodo_usuario ON tipos_nota_periodo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tipos_nota_periodo_periodo ON tipos_nota_periodo(periodo);

-- Índices para notas detalladas
CREATE INDEX IF NOT EXISTS idx_notas_detalladas_usuario ON notas_detalladas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notas_detalladas_materia ON notas_detalladas(materia_id);
CREATE INDEX IF NOT EXISTS idx_notas_detalladas_estudiante ON notas_detalladas(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_notas_detalladas_periodo ON notas_detalladas(periodo);

-- Índices para notas individuales
CREATE INDEX IF NOT EXISTS idx_notas_individuales_usuario ON notas_individuales(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notas_individuales_materia ON notas_individuales(materia_id);
CREATE INDEX IF NOT EXISTS idx_notas_individuales_estudiante ON notas_individuales(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_notas_individuales_periodo ON notas_individuales(periodo);

-- Índices para asistencia
CREATE INDEX IF NOT EXISTS idx_asistencia_usuario ON asistencia(usuario_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_materia ON asistencia(materia_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_estudiante ON asistencia(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha ON asistencia(fecha);

-- Índices para eventos de calendario
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_usuario ON eventos_calendario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_fecha ON eventos_calendario(fecha);

-- Índices para calendario escolar PDF
CREATE INDEX IF NOT EXISTS idx_calendario_escolar_pdf_usuario ON calendario_escolar_pdf(usuario_id);

-- =====================================================
-- FUNCIONES DE ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

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
CREATE TRIGGER update_periodos_updated_at BEFORE UPDATE ON periodos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tipos_nota_periodo_updated_at BEFORE UPDATE ON tipos_nota_periodo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notas_detalladas_updated_at BEFORE UPDATE ON notas_detalladas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notas_individuales_updated_at BEFORE UPDATE ON notas_individuales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asistencia_updated_at BEFORE UPDATE ON asistencia FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_eventos_calendario_updated_at BEFORE UPDATE ON eventos_calendario FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendario_escolar_pdf_updated_at BEFORE UPDATE ON calendario_escolar_pdf FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================
COMMENT ON TABLE usuarios IS 'Usuarios del sistema (docentes, administradores)';
COMMENT ON TABLE estudiantes IS 'Estudiantes registrados por cada docente';
COMMENT ON TABLE materias IS 'Materias asignadas a cada docente';
COMMENT ON TABLE periodos IS 'Períodos académicos configurados por cada docente';
COMMENT ON TABLE tipos_nota_periodo IS 'Configuración de tipos de nota por período (por usuario)';
COMMENT ON TABLE notas_detalladas IS 'Notas detalladas del sistema (por usuario)';
COMMENT ON TABLE notas_individuales IS 'Notas individuales de estudiantes por materia (por usuario)';
COMMENT ON TABLE asistencia IS 'Registro de asistencia de estudiantes (por usuario)';
COMMENT ON TABLE eventos_calendario IS 'Eventos del calendario personal de cada docente';
COMMENT ON TABLE calendario_escolar_pdf IS 'PDFs de calendario escolar personalizados por usuario';

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_nota_periodo ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_detalladas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_individuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario_escolar_pdf ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios (solo pueden ver su propio perfil)
CREATE POLICY "Usuarios pueden ver su propio perfil" ON usuarios
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON usuarios
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas para estudiantes (solo el usuario propietario)
CREATE POLICY "Usuarios pueden gestionar sus estudiantes" ON estudiantes
    FOR ALL USING (usuario_id = (SELECT id FROM usuarios WHERE auth.uid()::text = id::text));

-- Políticas para materias (solo el usuario propietario)
CREATE POLICY "Usuarios pueden gestionar sus materias" ON materias
    FOR ALL USING (usuario_id = (SELECT id FROM usuarios WHERE auth.uid()::text = id::text));

-- Políticas para períodos (solo el usuario propietario)
CREATE POLICY "Usuarios pueden gestionar sus períodos" ON periodos
    FOR ALL USING (usuario_id = (SELECT id FROM usuarios WHERE auth.uid()::text = id::text));

-- Políticas para tipos de nota (solo el usuario propietario)
CREATE POLICY "Usuarios pueden gestionar sus tipos de nota" ON tipos_nota_periodo
    FOR ALL USING (usuario_id = (SELECT id FROM usuarios WHERE auth.uid()::text = id::text));

-- Políticas para notas detalladas (solo el usuario propietario)
CREATE POLICY "Usuarios pueden gestionar sus notas detalladas" ON notas_detalladas
    FOR ALL USING (usuario_id = (SELECT id FROM usuarios WHERE auth.uid()::text = id::text));

-- Políticas para notas individuales (solo el usuario propietario)
CREATE POLICY "Usuarios pueden gestionar sus notas individuales" ON notas_individuales
    FOR ALL USING (usuario_id = (SELECT id FROM usuarios WHERE auth.uid()::text = id::text));

-- Políticas para asistencia (solo el usuario propietario)
CREATE POLICY "Usuarios pueden gestionar su asistencia" ON asistencia
    FOR ALL USING (usuario_id = (SELECT id FROM usuarios WHERE auth.uid()::text = id::text));

-- Políticas para eventos de calendario (solo el usuario propietario)
CREATE POLICY "Usuarios pueden gestionar sus eventos" ON eventos_calendario
    FOR ALL USING (usuario_id = (SELECT id FROM usuarios WHERE auth.uid()::text = id::text));

-- Políticas para calendario escolar PDF (solo el usuario propietario)
CREATE POLICY "Usuarios pueden gestionar su calendario PDF" ON calendario_escolar_pdf
    FOR ALL USING (usuario_id = (SELECT id FROM usuarios WHERE auth.uid()::text = id::text));

-- =====================================================
-- DATOS INICIALES (OPCIONAL)
-- =====================================================

-- Insertar usuario administrador por defecto (opcional)
-- INSERT INTO usuarios (nombre, email, password_hash, rol) 
-- VALUES ('Administrador', 'admin@sistema.com', 'hash_del_password', 'admin')
-- ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'usuarios', 'estudiantes', 'materias', 'periodos', 
    'tipos_nota_periodo', 'notas_detalladas', 'notas_individuales',
    'asistencia', 'eventos_calendario', 'calendario_escolar_pdf'
)
ORDER BY table_name;

-- Verificar índices creados
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
    'usuarios', 'estudiantes', 'materias', 'periodos', 
    'tipos_nota_periodo', 'notas_detalladas', 'notas_individuales',
    'asistencia', 'eventos_calendario', 'calendario_escolar_pdf'
)
ORDER BY tablename, indexname;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/*
INSTRUCCIONES PARA EJECUTAR EN SUPABASE:

1. Ve a https://supabase.com
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto
4. Ve a SQL Editor (en el menú lateral izquierdo)
5. Copia y pega TODO este código
6. Haz clic en "Run" (botón verde)
7. Espera a que termine la ejecución
8. Verifica que no hay errores en la consola

CARACTERÍSTICAS DEL ESQUEMA:

✅ Todas las tablas incluyen usuario_id para separar datos por usuario
✅ Índices optimizados para mejor rendimiento
✅ Triggers automáticos para updated_at
✅ Políticas de seguridad (RLS) habilitadas
✅ Constraints únicos para evitar duplicados
✅ Comentarios descriptivos en todas las tablas
✅ Tabla calendario_escolar_pdf incluida para PDFs personalizados

TABLAS CREADAS:
- usuarios: Gestión de usuarios del sistema
- estudiantes: Estudiantes por docente
- materias: Materias asignadas
- periodos: Períodos académicos
- tipos_nota_periodo: Configuración de tipos de nota
- notas_detalladas: Notas detalladas
- notas_individuales: Notas individuales
- asistencia: Registro de asistencia
- eventos_calendario: Eventos del calendario personal
- calendario_escolar_pdf: PDFs de calendario personalizados

¡El sistema estará listo para usar después de ejecutar este script!
*/