// Sistema de base de datos simple usando solo Supabase
import supabase from "./supabase";
import auth from "./auth";

class LocalDatabase {
  constructor() {
    this.dbName = "sistema_escolar";
    this.initDatabase();
  }

  // Obtener usuario actual
  getCurrentUser() {
    return auth.getCurrentUser();
  }

  async initDatabase() {
    try {
      console.log("🔄 Inicializando base de datos Supabase...");
      const connected = await this.testConnection();
      if (connected) {
        console.log("✅ Base de datos Supabase conectada correctamente");
      } else {
        console.log("❌ Error conectando a Supabase");
      }
    } catch (error) {
      console.error("❌ Error inicializando base de datos:", error);
    }
  }

  async testConnection() {
    try {
      const { data, error } = await supabase.from("usuarios").select("count");
      return !error;
    } catch (error) {
      return false;
    }
  }

  // ===== ESTUDIANTES =====
  async getEstudiantes() {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("estudiantes")
        .select("*")
        .eq("usuario_id", currentUser?.id)
        .limit(1000); // Limitar resultados para mejor rendimiento

      if (error) throw error;
      
      // Ordenar numéricamente por código
      const estudiantes = data || [];
      return estudiantes.sort((a, b) => {
        const codigoA = parseInt(a.codigo) || 0;
        const codigoB = parseInt(b.codigo) || 0;
        return codigoA - codigoB;
      });
    } catch (error) {
      console.error("Error obteniendo estudiantes:", error);
      return [];
    }
  }

  async guardarEstudiante(estudiante) {
    try {
      // Obtener usuario actual para establecer relación
      const currentUser = this.getCurrentUser();

      // Preparar datos del estudiante basándose en la estructura real de la tabla
      const estudianteData = {
        nombre: estudiante.nombre?.trim(),
        codigo: estudiante.codigo?.trim() || "",
        grado: estudiante.grado || "Sin especificar",
        usuario_id: currentUser?.id || null,
        created_at: new Date().toISOString(),
      };

      // No usar campo apellido - eliminado completamente

      const { data, error } = await supabase
        .from("estudiantes")
        .insert(estudianteData)
        .select()
        .single();

      if (error) throw error;
      console.log("✅ Estudiante guardado:", data.nombre);
      return data;
    } catch (error) {
      console.error("❌ Error guardando estudiante:", error);
      throw error;
    }
  }

  async actualizarEstudiante(id, datos) {
    try {
      const { data, error } = await supabase
        .from("estudiantes")
        .update({
          ...datos,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error actualizando estudiante:", error);
      throw error;
    }
  }

  async eliminarEstudiante(id) {
    try {
      // Eliminar asistencias del estudiante
      await supabase.from("asistencias").delete().eq("estudiante_id", id);
      
      // Eliminar notas individuales del estudiante
      await supabase.from("notas_individuales").delete().eq("estudiante_id", id);
      
      // Finalmente, eliminar el estudiante
      const { error } = await supabase
        .from("estudiantes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      console.log(`✅ Estudiante ${id} y sus datos relacionados eliminados.`);
    } catch (error) {
      console.error("Error eliminando estudiante y sus datos relacionados:", error);
      throw error;
    }
  }

  async getEstudianteById(id) {
    try {
      const { data, error } = await supabase
        .from("estudiantes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error obteniendo estudiante:", error);
      return null;
    }
  }

  // ===== MATERIAS =====
  async getMaterias() {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("materias")
        .select("*")
        .eq("usuario_id", currentUser?.id)
        .order("nombre");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error obteniendo materias:", error);
      return [];
    }
  }

  async guardarMateria(materia) {
    try {
      // Obtener usuario actual para establecer relación
      const currentUser = this.getCurrentUser();

      const materiaData = {
        nombre: materia.nombre?.trim(),
        codigo: materia.codigo?.trim(),
        grado: materia.grado?.trim(),
        horario: materia.horario?.trim(),
        color: materia.color,
        usuario_id: currentUser?.id || null,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("materias")
        .insert(materiaData)
        .select()
        .single();

      if (error) throw error;
      console.log("✅ Materia guardada:", data.nombre);
      return data;
    } catch (error) {
      console.error("❌ Error guardando materia:", error);
      throw error;
    }
  }

  async actualizarMateria(id, datos) {
    try {
      const { data, error } = await supabase
        .from("materias")
        .update({
          ...datos,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error actualizando materia:", error);
      throw error;
    }
  }

  async eliminarMateria(id) {
    try {
      const { error } = await supabase.from("materias").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error eliminando materia:", error);
      throw error;
    }
  }

  async getMateriaById(id) {
    try {
      const { data, error } = await supabase
        .from("materias")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error obteniendo materia:", error);
      return null;
    }
  }

  // ===== ASISTENCIAS =====
  async getAsistencia(fecha) {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("asistencias")
        .select(
          `
          *,
          estudiantes:estudiante_id(nombre, codigo),
          materias:materia_id(nombre)
        `
        )
        .eq("fecha", fecha)
        .eq("usuario_id", currentUser?.id)
        .order("estudiantes(nombre)");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error obteniendo asistencia:", error);
      return [];
    }
  }

  async getAsistencias() {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("asistencias")
        .select("*")
        .eq("usuario_id", currentUser?.id)
        .order("fecha", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error obteniendo asistencias:", error);
      return [];
    }
  }

  async guardarAsistencia(asistencia) {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("asistencias")
        .insert({
          ...asistencia,
          usuario_id: currentUser?.id || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error guardando asistencia:", error);
      throw error;
    }
  }

  async guardarAsistenciaDia(fecha, asistencias) {
    try {
      const currentUser = this.getCurrentUser();

      // Eliminar asistencias existentes para esa fecha y usuario
      await supabase
        .from("asistencias")
        .delete()
        .eq("fecha", fecha)
        .eq("usuario_id", currentUser?.id);

      // Insertar nuevas asistencias
      const nuevasAsistencias = asistencias.map((asistencia) => ({
        estudiante_id: asistencia.estudiante_id || asistencia.estudianteId,
        materia_id: asistencia.materia_id || asistencia.materiaId,
        usuario_id: currentUser?.id || null,
        fecha: fecha,
        estado: asistencia.estado,
        created_at: new Date().toISOString(),
      }));

      console.log("🔍 Datos a insertar:", nuevasAsistencias);

      const { data, error } = await supabase
        .from("asistencias")
        .insert(nuevasAsistencias)
        .select();

      if (error) {
        console.error("❌ Error insertando asistencias:", error);
        throw error;
      }

      console.log(
        `✅ Asistencia guardada para ${fecha}: ${asistencias.length} registros`
      );
      console.log(
        "📊 Estados guardados:",
        data.map((d) => ({ estudiante: d.estudiante_id, estado: d.estado }))
      );
      return true;
    } catch (error) {
      console.error("Error guardando asistencia del día:", error);
      throw error;
    }
  }

  async guardarAsistenciaIndividual(estudianteId, materiaId, fecha, estado) {
    try {
      const currentUser = this.getCurrentUser();

      // Primero eliminar asistencia existente para esta combinación
      await supabase
        .from("asistencias")
        .delete()
        .eq("estudiante_id", estudianteId)
        .eq("materia_id", materiaId)
        .eq("fecha", fecha)
        .eq("usuario_id", currentUser?.id);

      // Insertar nueva asistencia
      const { data, error } = await supabase
        .from("asistencias")
        .insert({
          estudiante_id: estudianteId,
          materia_id: materiaId,
          usuario_id: currentUser?.id || null,
          fecha: fecha,
          estado: estado,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      console.log(`✅ Asistencia individual guardada: Estudiante ${estudianteId}, Materia ${materiaId}, Estado: ${estado}`);
      return data;
    } catch (error) {
      console.error("Error guardando asistencia individual:", error);
      throw error;
    }
  }

  async getAsistenciaEstudiante(estudianteId, fecha) {
    try {
      const { data, error } = await supabase
        .from("asistencias")
        .select("estado")
        .eq("estudiante_id", estudianteId)
        .eq("fecha", fecha)
        .single();

      if (error) return null;
      return data?.estado || null;
    } catch (error) {
      console.error("Error obteniendo asistencia de estudiante:", error);
      return null;
    }
  }

  // ===== PERÍODOS ACADÉMICOS =====
  async getPeriodosAcademicos() {
    try {
      const { data, error } = await supabase
        .from("periodos")
        .select("*")
        .order("id");

      if (error) throw error;

      // Convertir a formato esperado
      const periodos = {};
      data.forEach((periodo) => {
        periodos[periodo.numero] = {
          fechaInicio: periodo.fecha_inicio,
          fechaFin: periodo.fecha_fin,
        };
      });

      return periodos;
    } catch (error) {
      console.error("Error obteniendo períodos académicos:", error);
      // Fallback a valores por defecto
      return {
        1: { fechaInicio: "2025-01-27", fechaFin: "2025-04-04" },
        2: { fechaInicio: "2025-04-07", fechaFin: "2025-06-16" },
        3: { fechaInicio: "2025-07-07", fechaFin: "2025-09-12" },
        4: { fechaInicio: "2025-09-15", fechaFin: "2025-11-28" },
      };
    }
  }

  async guardarPeriodosAcademicos(periodos) {
    try {
      const periodosArray = Object.entries(periodos)
        .filter(([numero, datos]) => datos.fechaInicio && datos.fechaFin) // Solo guardar períodos completos
        .map(([numero, datos]) => ({
          numero: parseInt(numero),
          nombre: `Período ${numero}`,
          fecha_inicio: datos.fechaInicio,
          fecha_fin: datos.fechaFin,
          activo: true,
          created_at: new Date().toISOString(),
        }));

      if (periodosArray.length === 0) {
        console.log("⚠️ No hay períodos completos para guardar");
        return;
      }

      const { error } = await supabase
        .from("periodos")
        .upsert(periodosArray, { onConflict: "numero" });

      if (error) throw error;
      console.log(
        "✅ Períodos académicos guardados:",
        periodosArray.length,
        "períodos"
      );
    } catch (error) {
      console.error("❌ Error guardando períodos académicos:", error);
      throw error;
    }
  }

  // ===== TIPOS DE NOTA =====
  async getTiposNotaPeriodo() {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("tipos_nota_periodo")
        .select("*")
        .eq("usuario_id", currentUser?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) return {};
      return data?.contenido || {};
    } catch (error) {
      console.error("Error obteniendo tipos de nota:", error);
      return {};
    }
  }

  async guardarTiposNotaPeriodo(tiposNota) {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("tipos_nota_periodo")
        .upsert({
          usuario_id: currentUser?.id,
          contenido: tiposNota,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      console.log("✅ Tipos de nota guardados");
      return data;
    } catch (error) {
      console.error("❌ Error guardando tipos de nota:", error);
      throw error;
    }
  }

  // ===== NOTAS DETALLADAS =====
  async getNotasDetalladas() {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("notas_detalladas")
        .select("*")
        .eq("usuario_id", currentUser?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) return {};
      return data?.contenido || {};
    } catch (error) {
      console.error("Error obteniendo notas detalladas:", error);
      return {};
    }
  }

  async guardarNotasDetalladas(notas) {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("notas_detalladas")
        .upsert({
          usuario_id: currentUser?.id,
          contenido: notas,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      console.log("✅ Notas detalladas guardadas");
      return data;
    } catch (error) {
      console.error("❌ Error guardando notas detalladas:", error);
      throw error;
    }
  }

  // ===== NOTAS INDIVIDUALES =====
  async guardarNotaIndividual(
    materiaId,
    estudianteId,
    periodo,
    tipoNotaId,
    titulo,
    valor
  ) {
    try {
      const currentUser = this.getCurrentUser();

      // Validar y convertir tipos de datos
      const safeData = {
        materia_id: parseInt(materiaId),
        estudiante_id: parseInt(estudianteId),
        usuario_id: currentUser?.id,
        periodo: parseInt(periodo),
        tipo_nota_id: parseInt(tipoNotaId) || 1, // Si es muy grande, usar 1 por defecto
        titulo: titulo?.toString() || "",
        valor: parseFloat(valor) || 0,
        updated_at: new Date().toISOString(),
      };

      // Verificar que los IDs sean válidos
      if (
        isNaN(safeData.materia_id) ||
        isNaN(safeData.estudiante_id) ||
        isNaN(safeData.periodo)
      ) {
        throw new Error("IDs de materia, estudiante o período inválidos");
      }

      // Limitar tipo_nota_id a un rango seguro
      if (safeData.tipo_nota_id > 1000 || safeData.tipo_nota_id < 1) {
        safeData.tipo_nota_id = 1;
      }

      console.log("🔄 Guardando nota individual con datos seguros:", safeData);

      const { data, error } = await supabase
        .from("notas_individuales")
        .upsert(safeData, {
          onConflict:
            "materia_id,estudiante_id,periodo,tipo_nota_id,usuario_id",
        })
        .select()
        .single();

      if (error) throw error;
      console.log("✅ Nota individual guardada:", data);
      return data;
    } catch (error) {
      console.error("❌ Error guardando nota individual:", error);
      throw error;
    }
  }

  async actualizarNotaIndividual(notaId, nuevoValor) {
    try {
      const currentUser = this.getCurrentUser();
      
      console.log("🔄 Actualizando nota individual:", {
        notaId,
        nuevoValor,
        usuarioId: currentUser?.id
      });

      const { error, data } = await supabase
        .from("notas_individuales")
        .update({ 
          valor: nuevoValor,
          updated_at: new Date().toISOString()
        })
        .eq("id", notaId)
        .eq("usuario_id", currentUser?.id)
        .select();

      if (error) throw error;
      console.log(`✅ Nota individual actualizada:`, data);
      return data[0];
    } catch (error) {
      console.error("❌ Error actualizando nota individual:", error);
      throw error;
    }
  }

  async eliminarNotaIndividualPorId(notaId) {
    try {
      const currentUser = this.getCurrentUser();
      
      console.log("🗑️ Eliminando nota individual por ID:", {
        notaId,
        usuarioId: currentUser?.id
      });

      const { error, count } = await supabase
        .from("notas_individuales")
        .delete()
        .eq("id", notaId)
        .eq("usuario_id", currentUser?.id);

      if (error) throw error;
      console.log(`✅ Nota individual eliminada por ID. Filas afectadas: ${count}`);
    } catch (error) {
      console.error("❌ Error eliminando nota individual por ID:", error);
      throw error;
    }
  }

  async eliminarNotaIndividual(materiaId, estudianteId, periodo, tipoNotaId) {
    try {
      const currentUser = this.getCurrentUser();
      
      console.log("🗑️ Eliminando nota individual:", {
        materiaId,
        estudianteId,
        periodo,
        tipoNotaId,
        usuarioId: currentUser?.id
      });

      const { error, count } = await supabase
        .from("notas_individuales")
        .delete()
        .eq("materia_id", materiaId)
        .eq("estudiante_id", estudianteId)
        .eq("usuario_id", currentUser?.id)
        .eq("periodo", periodo)
        .eq("tipo_nota_id", tipoNotaId);

      if (error) throw error;
      console.log(`✅ Nota individual eliminada. Filas afectadas: ${count}`);
    } catch (error) {
      console.error("❌ Error eliminando nota individual:", error);
      throw error;
    }
  }

  // ===== NOTAS PERSONALES =====
  async getNotasPersonales() {
    try {
      const currentUser = this.getCurrentUser();
      console.log("🔍 getNotasPersonales - Usuario:", currentUser?.id);

      const { data, error } = await supabase
        .from("notas_personales")
        .select("*")
        .eq("usuario_id", currentUser?.id)
        .single();

      console.log("🔍 getNotasPersonales - Respuesta:", { data, error });

      if (error) {
        console.error("❌ Error en getNotasPersonales:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("❌ Error obteniendo notas personales:", error);
      return null;
    }
  }

  async guardarNotasPersonales(contenido) {
    try {
      const currentUser = this.getCurrentUser();
      console.log("💾 guardarNotasPersonales - Usuario:", currentUser?.id);
      console.log("💾 guardarNotasPersonales - Contenido:", contenido.substring(0, 50) + (contenido.length > 50 ? '...' : ''));

      if (!currentUser?.id) {
        throw new Error("Usuario no autenticado");
      }

      // Primero intentar actualizar si existe
      const { data: existingData, error: selectError } = await supabase
        .from("notas_personales")
        .select("id")
        .eq("usuario_id", currentUser.id)
        .single();

      console.log("🔍 Verificando si existe registro:", { existingData, selectError });

      if (existingData && !selectError) {
        // Actualizar registro existente
        console.log("🔄 Actualizando registro existente:", existingData.id);
        const { data, error } = await supabase
          .from("notas_personales")
          .update({
            contenido: contenido,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData.id)
          .select()
          .single();

        console.log("💾 Respuesta de actualización:", { data, error });
        
        if (error) {
          console.error("❌ Error actualizando notas personales:", error);
          throw error;
        }
        return data;
      } else {
        // Crear nuevo registro
        console.log("➕ Creando nuevo registro");
        const { data, error } = await supabase
          .from("notas_personales")
          .insert({
            usuario_id: currentUser.id,
            contenido: contenido,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        console.log("💾 Respuesta de inserción:", { data, error });
        
        if (error) {
          console.error("❌ Error insertando notas personales:", error);
          throw error;
        }
        return data;
      }
    } catch (error) {
      console.error("❌ Error guardando notas personales:", error);
      throw error;
    }
  }

  // ===== CALENDARIO ESCOLAR PDF =====
  async getCalendarioEscolarPdf() {
    try {
      const currentUser = this.getCurrentUser();
      console.log("📄 getCalendarioEscolarPdf - Usuario:", currentUser?.id);

      const { data, error } = await supabase
        .from("calendario_escolar_pdf")
        .select("*")
        .eq("usuario_id", currentUser?.id)
        .single();

      console.log("📄 getCalendarioEscolarPdf - Respuesta:", { data, error });

      if (error) {
        console.error("❌ Error en getCalendarioEscolarPdf:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("❌ Error obteniendo calendario escolar PDF:", error);
      return null;
    }
  }

  async guardarCalendarioEscolarPdf(archivoData, nombreArchivo) {
    try {
      const currentUser = this.getCurrentUser();
      console.log("💾 guardarCalendarioEscolarPdf - Usuario:", currentUser?.id);
      console.log("💾 guardarCalendarioEscolarPdf - Archivo:", nombreArchivo);

      if (!currentUser?.id) {
        throw new Error("Usuario no autenticado");
      }

      // Primero intentar actualizar si existe
      const { data: existingData, error: selectError } = await supabase
        .from("calendario_escolar_pdf")
        .select("id")
        .eq("usuario_id", currentUser.id)
        .single();

      console.log("🔍 Verificando si existe calendario PDF:", { existingData, selectError });

      if (existingData && !selectError) {
        // Actualizar registro existente
        console.log("🔄 Actualizando calendario PDF existente:", existingData.id);
        const { data, error } = await supabase
          .from("calendario_escolar_pdf")
          .update({
            nombre_archivo: nombreArchivo,
            datos_archivo: archivoData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData.id)
          .select()
          .single();

        console.log("💾 Respuesta de actualización:", { data, error });
        
        if (error) {
          console.error("❌ Error actualizando calendario PDF:", error);
          throw error;
        }
        return data;
      } else {
        // Crear nuevo registro
        console.log("➕ Creando nuevo calendario PDF");
        const { data, error } = await supabase
          .from("calendario_escolar_pdf")
          .insert({
            usuario_id: currentUser.id,
            nombre_archivo: nombreArchivo,
            datos_archivo: archivoData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        console.log("💾 Respuesta de inserción:", { data, error });
        
        if (error) {
          console.error("❌ Error insertando calendario PDF:", error);
          throw error;
        }
        return data;
      }
    } catch (error) {
      console.error("❌ Error guardando calendario escolar PDF:", error);
      throw error;
    }
  }

  async eliminarCalendarioEscolarPdf() {
    try {
      const currentUser = this.getCurrentUser();
      console.log("🗑️ eliminarCalendarioEscolarPdf - Usuario:", currentUser?.id);

      if (!currentUser?.id) {
        throw new Error("Usuario no autenticado");
      }

      const { error } = await supabase
        .from("calendario_escolar_pdf")
        .delete()
        .eq("usuario_id", currentUser.id);

      console.log("🗑️ Respuesta de eliminación:", { error });

      if (error) {
        console.error("❌ Error eliminando calendario PDF:", error);
        throw error;
      }

      console.log("✅ Calendario PDF eliminado correctamente");
      return true;
    } catch (error) {
      console.error("❌ Error eliminando calendario escolar PDF:", error);
      throw error;
    }
  }

  // ===== EVENTOS DE CALENDARIO =====
  async getEventosCalendario() {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("eventos_calendario")
        .select("*")
        .eq("usuario_id", currentUser?.id)
        .order("fecha", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error obteniendo eventos del calendario:", error);
      return [];
    }
  }

  async guardarEventoCalendario(evento) {
    try {
      const currentUser = this.getCurrentUser();

      const eventoData = {
        usuario_id: currentUser?.id,
        titulo: evento.titulo?.trim(),
        descripcion: evento.descripcion?.trim(),
        fecha: evento.fecha,
        hora_inicio: evento.hora_inicio || evento.startTime,
        hora_fin: evento.hora_fin || evento.endTime,
        tipo: evento.tipo || "personal",
        recordatorio: evento.recordatorio || 15,
        ubicacion: evento.ubicacion?.trim() || evento.location?.trim(),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("eventos_calendario")
        .insert(eventoData)
        .select()
        .single();

      if (error) throw error;
      console.log("✅ Evento guardado:", data.titulo);
      return data;
    } catch (error) {
      console.error("❌ Error guardando evento:", error);
      throw error;
    }
  }

  async actualizarEventoCalendario(id, datos) {
    try {
      const { data, error } = await supabase
        .from("eventos_calendario")
        .update({
          ...datos,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error actualizando evento:", error);
      throw error;
    }
  }

  async eliminarEventoCalendario(id) {
    try {
      const { error } = await supabase
        .from("eventos_calendario")
        .delete()
        .eq("id", id);

      if (error) throw error;
      console.log("✅ Evento eliminado");
    } catch (error) {
      console.error("Error eliminando evento:", error);
      throw error;
    }
  }

  // ===== CONFIGURACIÓN DE USUARIO =====
  async getConfiguracionUsuario() {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("configuracion_usuario")
        .select("*")
        .eq("usuario_id", currentUser?.id)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error("Error obteniendo configuración:", error);
      return null;
    }
  }

  async guardarConfiguracionUsuario(configuracion) {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("configuracion_usuario")
        .upsert({
          usuario_id: currentUser?.id,
          tema: configuracion.tema || "light",
          configuraciones: configuracion.configuraciones || {},
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error guardando configuración:", error);
      throw error;
    }
  }

  // ===== ESTADÍSTICAS =====
  async getEstadisticasAsistencia(fechaInicio, fechaFin) {
    try {
      const currentUser = this.getCurrentUser();

      const { data, error } = await supabase
        .from("asistencias")
        .select(
          `
          estudiante_id,
          estado,
          estudiantes:estudiante_id(nombre, codigo)
        `
        )
        .gte("fecha", fechaInicio)
        .lte("fecha", fechaFin)
        .eq("usuario_id", currentUser?.id);

      if (error) throw error;

      // Procesar datos para estadísticas
      const estadisticas = {};
      data.forEach((asistencia) => {
        const estudianteId = asistencia.estudiante_id;
        if (!estadisticas[estudianteId]) {
          estadisticas[estudianteId] = {
            estudiante_nombre: asistencia.estudiantes.nombre,
            estudiante_codigo: asistencia.estudiantes.codigo,
            presentes: 0,
            ausentes: 0,
            total: 0,
          };
        }

        estadisticas[estudianteId].total++;
        if (asistencia.estado === "presente") {
          estadisticas[estudianteId].presentes++;
        } else {
          estadisticas[estudianteId].ausentes++;
        }
      });

      return Object.values(estadisticas);
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      return [];
    }
  }

  // ===== EXPORTAR/IMPORTAR =====
  async exportarDatos() {
    try {
      const datos = {
        estudiantes: await this.getEstudiantes(),
        materias: await this.getMaterias(),
        asistencias: await this.getAsistencias(),
        notas_personales: await this.getNotasPersonales(),
        fecha: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(datos, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sistema_escolar_${new Date().toLocaleDateString()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      return datos;
    } catch (error) {
      console.error("Error exportando datos:", error);
      throw error;
    }
  }

  // ===== UTILIDADES =====
  async getDatabaseInfo() {
    try {
      const info = {
        estudiantes: (await this.getEstudiantes()).length,
        materias: (await this.getMaterias()).length,
        asistencias: (await this.getAsistencias()).length,
        notas_personales: (await this.getNotasPersonales()) ? 1 : 0,
        fecha_ultima_actualizacion: new Date().toISOString(),
        tipo_base_datos: "Supabase",
      };
      return info;
    } catch (error) {
      console.error("Error obteniendo información de la base de datos:", error);
      return null;
    }
  }

  // Eliminar asistencia por ID
  async eliminarAsistencia(id) {
    try {
      const { error } = await supabase
        .from("asistencias")
        .delete()
        .eq("id", id);

      if (error) throw error;
      console.log("✅ Asistencia eliminada:", id);
    } catch (error) {
      console.error("❌ Error eliminando asistencia:", error);
      throw error;
    }
  }

  // Limpiar todas las notas del usuario
  async limpiarNotasPersonales() {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error("Usuario no autenticado");
      }

      // Limpiar notas detalladas
      const { error: errorDetalladas } = await supabase
        .from("notas_detalladas")
        .delete()
        .eq("usuario_id", currentUser.id);

      if (errorDetalladas) throw errorDetalladas;

      // Limpiar notas individuales
      const { error: errorIndividuales } = await supabase
        .from("notas_individuales")
        .delete()
        .eq("usuario_id", currentUser.id);

      if (errorIndividuales) throw errorIndividuales;

      // Limpiar tipos de nota por período
      const { error: errorTiposNota } = await supabase
        .from("tipos_nota_periodo")
        .delete()
        .eq("usuario_id", currentUser.id);

      if (errorTiposNota) throw errorTiposNota;

      console.log("✅ Todas las notas y tipos de nota limpiados");
    } catch (error) {
      console.error("❌ Error limpiando notas:", error);
      throw error;
    }
  }

  // Limpiar períodos académicos del usuario
  async limpiarPeriodosAcademicos() {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error("Usuario no autenticado");
      }

      const { error } = await supabase
        .from("periodos")
        .delete()
        .eq("usuario_id", currentUser.id);

      if (error) throw error;
      console.log("✅ Períodos académicos limpiados");
    } catch (error) {
      console.error("❌ Error limpiando períodos académicos:", error);
      throw error;
    }
  }

  // Limpiar calendario personal del usuario
  async limpiarCalendarioPersonal() {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error("Usuario no autenticado");
      }

      const { error } = await supabase
        .from("eventos_calendario")
        .delete()
        .eq("usuario_id", currentUser.id);

      if (error) throw error;
      console.log("✅ Calendario personal limpiado");
    } catch (error) {
      console.error("❌ Error limpiando calendario personal:", error);
      throw error;
    }
  }

  // Limpiar completamente todos los estudiantes del usuario (función de respaldo)
  async limpiarEstudiantesCompleto() {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error("Usuario no autenticado");
      }

      const { error } = await supabase
        .from("estudiantes")
        .delete()
        .eq("usuario_id", currentUser.id);

      if (error) throw error;
      console.log("✅ Todos los estudiantes eliminados completamente");
    } catch (error) {
      console.error("❌ Error limpiando estudiantes:", error);
      throw error;
    }
  }

  // Limpiar completamente todas las materias del usuario (función de respaldo)
  async limpiarMateriasCompleto() {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error("Usuario no autenticado");
      }

      const { error } = await supabase
        .from("materias")
        .delete()
        .eq("usuario_id", currentUser.id);

      if (error) throw error;
      console.log("✅ Todas las materias eliminadas completamente");
    } catch (error) {
      console.error("❌ Error limpiando materias:", error);
      throw error;
    }
  }

  // Limpiar base de datos
  async limpiarBaseDatos() {
    try {
      await supabase.from("asistencias").delete().neq("id", 0);
      await supabase.from("materias").delete().neq("id", 0);
      await supabase.from("estudiantes").delete().neq("id", 0);

      console.log("✅ Base de datos limpiada");
    } catch (error) {
      console.error("Error limpiando base de datos:", error);
    }
  }
}

// Instancia global
const db = new LocalDatabase();
export default db;
