-- =====================================================
-- MIGRACIÓN: Cambiar columna 'documento' por 'codigo' en tabla 'estudiantes'
-- =====================================================
-- Esta migración corrige el error: "Could not find the 'documento' column of 'estudiantes' in the schema cache"
-- Fecha: $(date)
-- Descripción: Renombra la columna 'documento' a 'codigo' para ser consistente con la interfaz

-- 1. Verificar la estructura actual de la tabla
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'estudiantes' 
ORDER BY ordinal_position;

-- 2. Renombrar la columna documento a codigo
ALTER TABLE estudiantes RENAME COLUMN documento TO codigo;

-- 3. Actualizar el índice (eliminar el viejo y crear el nuevo)
DROP INDEX IF EXISTS idx_estudiantes_documento;
CREATE INDEX IF NOT EXISTS idx_estudiantes_codigo ON estudiantes(codigo);

-- 4. Verificar que el cambio se aplicó correctamente
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'estudiantes' 
ORDER BY ordinal_position;

-- 5. Mostrar estadísticas de la tabla después de la migración
SELECT 
    COUNT(*) as total_estudiantes,
    COUNT(nombre) as estudiantes_con_nombre,
    COUNT(codigo) as estudiantes_con_codigo
FROM estudiantes;