-- Script para actualizar el esquema existente
-- Ejecutar estos comandos en Supabase SQL Editor para actualizar las tablas existentes

-- Agregar usuario_id a tipos_nota_periodo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tipos_nota_periodo' AND column_name = 'usuario_id') THEN
        ALTER TABLE tipos_nota_periodo ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_tipos_nota_periodo_usuario ON tipos_nota_periodo(usuario_id);
    END IF;
END $$;

-- Agregar usuario_id a notas_detalladas si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notas_detalladas' AND column_name = 'usuario_id') THEN
        ALTER TABLE notas_detalladas ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_notas_detalladas_usuario ON notas_detalladas(usuario_id);
    END IF;
END $$;

-- Agregar usuario_id a notas_individuales si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notas_individuales' AND column_name = 'usuario_id') THEN
        ALTER TABLE notas_individuales ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_notas_individuales_usuario ON notas_individuales(usuario_id);
    END IF;
END $$;

-- Actualizar constraint único para tipos_nota_periodo
DO $$ 
BEGIN
    -- Eliminar constraint único anterior si existe
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'tipos_nota_periodo' AND constraint_type = 'UNIQUE') THEN
        ALTER TABLE tipos_nota_periodo DROP CONSTRAINT IF EXISTS tipos_nota_periodo_pkey;
    END IF;
    
    -- Agregar nuevo constraint único por usuario_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'tipos_nota_periodo' AND constraint_name = 'tipos_nota_periodo_usuario_unique') THEN
        ALTER TABLE tipos_nota_periodo ADD CONSTRAINT tipos_nota_periodo_usuario_unique UNIQUE (usuario_id);
    END IF;
END $$;

-- Actualizar constraint único para notas_detalladas
DO $$ 
BEGIN
    -- Agregar nuevo constraint único por usuario_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'notas_detalladas' AND constraint_name = 'notas_detalladas_usuario_unique') THEN
        ALTER TABLE notas_detalladas ADD CONSTRAINT notas_detalladas_usuario_unique UNIQUE (usuario_id);
    END IF;
END $$;

-- Actualizar constraint único para notas_individuales
DO $$ 
BEGIN
    -- Eliminar constraint único anterior si existe
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'notas_individuales' AND constraint_name = 'notas_individuales_materia_id_estudiante_id_periodo_tipo_nota_id_key') THEN
        ALTER TABLE notas_individuales DROP CONSTRAINT notas_individuales_materia_id_estudiante_id_periodo_tipo_nota_id_key;
    END IF;
    
    -- Agregar nuevo constraint único incluyendo usuario_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'notas_individuales' AND constraint_name = 'notas_individuales_unique') THEN
        ALTER TABLE notas_individuales ADD CONSTRAINT notas_individuales_unique 
        UNIQUE (materia_id, estudiante_id, periodo, tipo_nota_id, usuario_id);
    END IF;
END $$;

-- Comentarios actualizados
COMMENT ON TABLE tipos_nota_periodo IS 'Configuración de tipos de nota por período (por usuario)';
COMMENT ON TABLE notas_detalladas IS 'Notas detalladas del sistema (por usuario)';
COMMENT ON TABLE notas_individuales IS 'Notas individuales de estudiantes por materia (por usuario)';

-- Verificar que las actualizaciones se aplicaron correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('tipos_nota_periodo', 'notas_detalladas', 'notas_individuales')
  AND column_name = 'usuario_id'
ORDER BY table_name;