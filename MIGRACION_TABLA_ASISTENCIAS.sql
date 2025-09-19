-- =====================================================
-- MIGRACIÓN: Verificar y corregir tabla de asistencias
-- =====================================================
-- Esta migración asegura que la tabla se llame 'asistencias' (plural)
-- Fecha: $(date)
-- Descripción: Verifica que la tabla de asistencias tenga el nombre correcto

-- 1. Verificar si existe la tabla 'asistencia' (singular)
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('asistencia', 'asistencias')
AND table_schema = 'public';

-- 2. Si existe 'asistencia' (singular), renombrarla a 'asistencias' (plural)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asistencia' AND table_schema = 'public') THEN
        ALTER TABLE asistencia RENAME TO asistencias;
        RAISE NOTICE 'Tabla renombrada de "asistencia" a "asistencias"';
    ELSE
        RAISE NOTICE 'La tabla ya se llama "asistencias" o no existe';
    END IF;
END $$;

-- 3. Verificar la estructura final de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'asistencias' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'asistencias';

-- 5. Mostrar estadísticas de la tabla
SELECT 
    COUNT(*) as total_asistencias,
    COUNT(DISTINCT estudiante_id) as estudiantes_con_asistencia,
    COUNT(DISTINCT fecha) as dias_con_asistencia
FROM asistencias;