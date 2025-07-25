# 📁 Sistema de Archivos y Sincronización Automática

## 🎯 ¿Qué hace este sistema?

Este sistema permite que los datos se guarden automáticamente en archivos JSON y se actualicen en tiempo real en el frontend, sin necesidad de una base de datos externa.

## ✨ Características Principales

### 🔄 Sincronización Manual

- **Guardado manual**: Los datos se guardan solo cuando haces cambios
- **Sin auto-guardado**: No hay actualizaciones automáticas por defecto
- **Detección de cambios**: Solo guarda si los datos han cambiado
- **Control opcional**: Puedes activar auto-guardado si lo deseas

### 📄 Archivos Generados

El sistema genera automáticamente estos archivos JSON:

1. **`estudiantes.json`** - Lista de todos los estudiantes
2. **`materias.json`** - Lista de materias y horarios
3. **`asistencia.json`** - Registros de asistencia
4. **`notas.json`** - Notas de los estudiantes
5. **`notas_personales_YYYY-MM-DD.json`** - Notas personales del docente

### 🎮 Funcionalidades

#### En la Página Principal (Home)

- **Panel de Estado**: Muestra el estado de sincronización
- **Lista de Archivos**: Ve todos los archivos generados
- **Descarga Individual**: Descarga archivos específicos
- **Descarga Masiva**: Descarga todos los archivos juntos
- **Guardado Manual**: Fuerza el guardado inmediato

#### En Asistencia

- Al marcar asistencia, se guarda automáticamente en `asistencia.json`
- Cada cambio genera una notificación
- Los datos se sincronizan en tiempo real

#### En Notas

- Las notas personales se guardan en archivos JSON con fecha
- Cada guardado genera un archivo nuevo
- Se mantiene historial de cambios

## 🚀 Cómo Usar

### 1. Ver Estado de Archivos

Ve a la página principal y verás el panel "Estado de Archivos y Sincronización" que muestra:

- ✅ Estado de auto-guardado
- 🔄 Estado del observador
- 📅 Última actualización
- 📄 Lista de archivos generados

### 2. Guardar Datos

Los datos se guardan automáticamente cuando:

- Marcas asistencia de estudiantes
- Escribes notas personales
- Modificas cualquier información

### 3. Descargar Archivos

- **Individual**: Haz clic en "Descargar" junto a cada archivo
- **Todos**: Usa el botón "📥 Descargar Todos"
- **Manual**: Usa "💾 Guardar Ahora" para forzar el guardado

### 4. Notificaciones

El sistema muestra notificaciones automáticas cuando:

- Se guarda un archivo
- Se actualiza la sincronización
- Ocurre algún error

## 🔧 Configuración Técnica

### Intervalos de Sincronización

- **Auto-guardado**: 5 minutos
- **Observador**: 2 minutos
- **Notificaciones**: 3 segundos
- **Actualización de estado**: 30 segundos

### Formato de Archivos

Todos los archivos se guardan en formato JSON con:

- Datos estructurados
- Timestamps de actualización
- Metadatos de sincronización

### Almacenamiento

- **LocalStorage**: Para datos temporales
- **Archivos JSON**: Para persistencia
- **Notificaciones**: En tiempo real

## 📱 Interfaz de Usuario

### Panel de Estado

```
📁 Estado de Archivos y Sincronización
├── 🔄 Auto-guardado (Cada 5 minutos) [ON/OFF]
├── 👁️ Observador activo (Cada 2 minutos) [ON/OFF]
└── 📅 Última actualización

📄 Archivos Generados
├── estudiantes.json (2.1 KB)
├── materias.json (1.8 KB)
├── asistencia.json (0.5 KB)
└── notas.json (0.3 KB)

💾 Acciones
├── 💾 Guardar Ahora
├── 📥 Descargar Todos
├── 🔄 Actualizar Estado
└── 🔇 Modo Silencioso
```

### Notificaciones

- ✅ Verde: Archivo guardado exitosamente
- 📁 Azul: Información de archivo
- ⚠️ Amarillo: Advertencias
- ❌ Rojo: Errores

## 🎯 Beneficios

1. **Sin Dependencias Externas**: No necesitas base de datos
2. **Sincronización en Tiempo Real**: Los cambios se ven inmediatamente
3. **Backup Automático**: Los archivos se guardan automáticamente
4. **Fácil Portabilidad**: Los archivos JSON son universales
5. **Historial de Cambios**: Cada guardado genera un archivo con fecha

## 🔍 Monitoreo

### Estado de Sincronización

- Verifica que el auto-guardado esté activo
- Confirma que el observador esté funcionando
- Revisa la última actualización

### Archivos Generados

- Verifica que se estén creando los archivos
- Revisa el tamaño de los archivos
- Confirma las fechas de modificación

## 🛠️ Solución de Problemas

### Si no se guardan archivos:

1. Verifica que el navegador permita descargas
2. Revisa la consola del navegador
3. Intenta el guardado manual

### Si no aparecen notificaciones:

1. Verifica que JavaScript esté habilitado
2. Revisa los permisos del navegador
3. Recarga la página

### Si los datos no se actualizan:

1. Verifica la conexión a internet
2. Revisa el estado de sincronización
3. Usa el botón "Actualizar Estado"

## 📈 Próximas Mejoras

- [ ] Sincronización con Google Drive
- [ ] Backup automático en la nube
- [ ] Historial de versiones
- [ ] Comparación de archivos
- [ ] Exportación a Excel mejorada
- [ ] Compresión de archivos

---

**¡El sistema está listo para usar!** 🎉
Cada vez que hagas cambios, verás cómo se guardan automáticamente en archivos JSON y se actualizan en tiempo real en el frontend.
