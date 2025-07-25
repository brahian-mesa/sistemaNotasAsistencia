# 🗄️ Sistema de Base de Datos SQLite - Sistema Escolar

## 📋 **Descripción General**

Se ha implementado una base de datos SQLite completa para reemplazar el sistema de archivos planos. Ahora todos los datos se guardan de forma persistente y segura en una base de datos local.

---

## 🚀 **Instalación y Configuración**

### **Paso 1: Instalar Dependencias**

```bash
cd sitema-asistencia-nota
npm install better-sqlite3
```

### **Paso 2: Verificar Instalación**

La base de datos se creará automáticamente cuando inicies la aplicación. No necesitas configurar nada más.

---

## 🗂️ **Estructura de la Base de Datos**

### **Tablas Creadas:**

#### 1. **estudiantes**

```sql
CREATE TABLE estudiantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### 2. **materias**

```sql
CREATE TABLE materias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  grado TEXT NOT NULL,
  horario TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### 3. **asistencias**

```sql
CREATE TABLE asistencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  estudiante_id INTEGER NOT NULL,
  materia_id INTEGER NOT NULL,
  fecha DATE NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('presente', 'ausente')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes (id),
  FOREIGN KEY (materia_id) REFERENCES materias (id),
  UNIQUE(estudiante_id, materia_id, fecha)
)
```

#### 4. **notas**

```sql
CREATE TABLE notas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  estudiante_id INTEGER NOT NULL,
  materia_id INTEGER NOT NULL,
  periodo TEXT NOT NULL,
  tipo_nota TEXT NOT NULL,
  valor REAL NOT NULL,
  observaciones TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes (id),
  FOREIGN KEY (materia_id) REFERENCES materias (id),
  UNIQUE(estudiante_id, materia_id, periodo, tipo_nota)
)
```

#### 5. **notas_personales**

```sql
CREATE TABLE notas_personales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contenido TEXT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

---

## 📊 **Funcionalidades Implementadas**

### **✅ Estudiantes**

- ✅ Carga automática de 39 estudiantes por defecto
- ✅ Agregar nuevos estudiantes
- ✅ Editar estudiantes existentes
- ✅ Eliminar estudiantes
- ✅ Búsqueda y filtrado

### **✅ Materias**

- ✅ Carga automática de 12 materias por defecto
- ✅ Agregar nuevas materias
- ✅ Editar materias existentes
- ✅ Eliminar materias
- ✅ Colores personalizados

### **✅ Asistencia**

- ✅ Guardar asistencia por fecha
- ✅ Consultar asistencia histórica
- ✅ Cambiar entre fechas fácilmente
- ✅ Estadísticas de asistencia
- ✅ Guardado automático en BD

### **✅ Notas**

- ✅ Guardar notas por materia y período
- ✅ Diferentes tipos de notas
- ✅ Cálculo de promedios
- ✅ Historial completo

### **✅ Notas Personales**

- ✅ Guardar notas personales del docente
- ✅ Historial de cambios
- ✅ Persistencia automática

---

## 🎯 **Ventajas de la Base de Datos**

### **🔄 Persistencia de Datos**

- Los datos se mantienen entre sesiones
- No se pierden al cerrar el navegador
- Backup automático de información

### **⚡ Rendimiento**

- Consultas rápidas y eficientes
- Sin archivos temporales
- Optimización automática

### **🔒 Seguridad**

- Datos estructurados y validados
- Integridad referencial
- Transacciones seguras

### **📈 Escalabilidad**

- Fácil agregar nuevas funcionalidades
- Consultas complejas posibles
- Exportación de datos

---

## 🛠️ **Comandos Útiles**

### **Iniciar la Aplicación**

```bash
npm run dev
```

### **Ver Estado de la Base de Datos**

- Ve a la página principal
- Revisa el componente "Estado de la Base de Datos"
- Muestra estadísticas en tiempo real

### **Exportar Datos**

- Usa el botón "Exportar Datos" en el estado de la BD
- Descarga un archivo JSON con todos los datos

---

## 📱 **Interfaz de Usuario**

### **Estado de la Base de Datos**

- **Ubicación:** Página principal (Home)
- **Muestra:**
  - Número de estudiantes
  - Número de materias
  - Número de asistencias
  - Número de notas
  - Estado de conexión
  - Última actualización

### **Indicadores Visuales**

- 🟢 **Verde:** Conexión activa
- 🔄 **Animación:** Actualización en tiempo real
- 📊 **Estadísticas:** Contadores dinámicos

---

## 🔧 **Mantenimiento**

### **Archivo de Base de Datos**

- **Ubicación:** `sitema-asistencia-nota/sistema_escolar.db`
- **Tamaño:** Crece automáticamente según los datos
- **Backup:** Se recomienda hacer copias periódicas

### **Limpieza de Datos**

- Los datos se mantienen automáticamente
- No es necesario limpiar archivos temporales
- La BD se optimiza automáticamente

---

## 🚨 **Solución de Problemas**

### **Error: "Base de datos no encontrada"**

```bash
# Eliminar archivo de BD corrupto
rm sistema_escolar.db
# Reiniciar aplicación (se creará automáticamente)
```

### **Error: "Dependencia no encontrada"**

```bash
# Reinstalar dependencias
npm install better-sqlite3
```

### **Error: "Permisos de escritura"**

- Verificar permisos en la carpeta del proyecto
- Ejecutar como administrador si es necesario

---

## 📈 **Próximas Mejoras**

### **Funcionalidades Planificadas**

- [ ] Backup automático programado
- [ ] Restauración de datos desde archivo
- [ ] Reportes avanzados
- [ ] Sincronización con servidor
- [ ] Auditoría de cambios

### **Optimizaciones**

- [ ] Índices para consultas rápidas
- [ ] Compresión de datos
- [ ] Cache inteligente
- [ ] Consultas optimizadas

---

## 📞 **Soporte**

### **Logs de la Aplicación**

- Abre las herramientas de desarrollador (F12)
- Ve a la pestaña "Console"
- Busca mensajes con emojis: ✅ ❌ 📚 👥 📅

### **Información de Debug**

- Estado de conexión en tiempo real
- Contadores de registros
- Errores detallados
- Tiempo de respuesta

---

## 🎉 **¡Listo para Usar!**

La base de datos está completamente funcional y lista para usar. Todos los datos se guardarán automáticamente y estarán disponibles cada vez que abras la aplicación.

### **✅ Verificación Final**

1. ✅ Dependencias instaladas
2. ✅ Base de datos creada
3. ✅ Datos por defecto cargados
4. ✅ Interfaz actualizada
5. ✅ Funcionalidades probadas

**¡Disfruta de tu nuevo sistema escolar con base de datos! 🎓**
