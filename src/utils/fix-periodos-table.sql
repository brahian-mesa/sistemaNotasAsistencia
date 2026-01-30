-- Script para crear o actualizar la tabla de periodos con usuario_id
-- Ejecuta este script en Supabase SQL Editor

-- Crear la tabla periodos con usuario_id
CREATE TABLE IF NOT EXISTS periodos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, numero)
);

-- Agregar índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_periodos_usuario_id ON periodos(usuario_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE periodos ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios períodos
CREATE POLICY "Users can view their own periodos"
    ON periodos FOR SELECT
    USING (usuario_id = (SELECT id FROM usuarios WHERE usuario = auth.jwt()->>'email' LIMIT 1));

-- Política para que los usuarios puedan insertar sus propios períodos
CREATE POLICY "Users can insert their own periodos"
    ON periodos FOR INSERT
    WITH CHECK (usuario_id = (SELECT id FROM usuarios WHERE usuario = auth.jwt()->>'email' LIMIT 1));

-- Política para que los usuarios puedan actualizar sus propios períodos
CREATE POLICY "Users can update their own periodos"
    ON periodos FOR UPDATE
    USING (usuario_id = (SELECT id FROM usuarios WHERE usuario = auth.jwt()->>'email' LIMIT 1));

-- Política para que los usuarios puedan eliminar sus propios períodos
CREATE POLICY "Users can delete their own periodos"
    ON periodos FOR DELETE
    USING (usuario_id = (SELECT id FROM usuarios WHERE usuario = auth.jwt()->>'email' LIMIT 1));

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla periodos creada exitosamente' as status;
