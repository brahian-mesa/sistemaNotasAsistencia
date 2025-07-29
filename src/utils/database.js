// Sistema de base de datos simulada usando localStorage para el navegador
class LocalDatabase {
  constructor() {
    this.dbName = "sistema_escolar";
    this.initDatabase();
  }

  initDatabase() {
    try {
      // Crear estructura de datos si no existe
      if (!localStorage.getItem(`${this.dbName}_initialized`)) {
        this.createTables();
        this.insertDefaultData();
        localStorage.setItem(`${this.dbName}_initialized`, "true");
        console.log("✅ Base de datos local inicializada correctamente");
      } else {
        console.log("✅ Base de datos local ya existe");
      }
    } catch (error) {
      console.error("❌ Error inicializando base de datos:", error);
    }
  }

  createTables() {
    // Crear estructura de datos en localStorage
    const tables = {
      estudiantes: [],
      materias: [],
      asistencias: [],
      notas: [],
      notas_personales: [],
    };

    Object.keys(tables).forEach((table) => {
      localStorage.setItem(
        `${this.dbName}_${table}`,
        JSON.stringify(tables[table])
      );
    });
  }

  insertDefaultData() {
    // Insertar estudiantes por defecto
    const estudiantesDefault = [
      {
        id: 1,
        nombre: "Agudelo Grisales Juan Sebastian",
        codigo: "S5B001",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        nombre: "Andara Gimenez Alessandra de los",
        codigo: "S5B002",
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        nombre: "Aricapa Velasquez Yahir Santiago",
        codigo: "S5B003",
        created_at: new Date().toISOString(),
      },
      {
        id: 4,
        nombre: "Betancourth Garcia Isabella",
        codigo: "S5B004",
        created_at: new Date().toISOString(),
      },
      {
        id: 5,
        nombre: "Calvo Becerra Yoselin Valeria",
        codigo: "S5B005",
        created_at: new Date().toISOString(),
      },
      {
        id: 6,
        nombre: "Cardona Munera Luciana",
        codigo: "S5B006",
        created_at: new Date().toISOString(),
      },
      {
        id: 7,
        nombre: "Cardona Guevara Jhojan Esneider",
        codigo: "S5B007",
        created_at: new Date().toISOString(),
      },
      {
        id: 8,
        nombre: "Ceballos Ladino Nycoll",
        codigo: "S5B008",
        created_at: new Date().toISOString(),
      },
      {
        id: 9,
        nombre: "Clavijo Trujillo Juan Manuel",
        codigo: "S5B009",
        created_at: new Date().toISOString(),
      },
      {
        id: 10,
        nombre: "FLER",
        codigo: "S5B010",
        created_at: new Date().toISOString(),
      },
      {
        id: 11,
        nombre: "Duque Carrillo Maria José",
        codigo: "S5B011",
        created_at: new Date().toISOString(),
      },
      {
        id: 12,
        nombre: "Franco Ramirez Luis Esteban",
        codigo: "S5B012",
        created_at: new Date().toISOString(),
      },
      {
        id: 13,
        nombre: "Galan Ramirez Gerónimo",
        codigo: "S5B013",
        created_at: new Date().toISOString(),
      },
      {
        id: 14,
        nombre: "EMANUEL",
        codigo: "S5B014",
        created_at: new Date().toISOString(),
      },
      {
        id: 15,
        nombre: "BRITHANI",
        codigo: "S5B015",
        created_at: new Date().toISOString(),
      },
      {
        id: 16,
        nombre: "Guapacha Montoya Felipe",
        codigo: "S5B016",
        created_at: new Date().toISOString(),
      },
      {
        id: 17,
        nombre: "Guapacha Montoya Stiven",
        codigo: "S5B017",
        created_at: new Date().toISOString(),
      },
      {
        id: 18,
        nombre: "Guevara Batero Valery",
        codigo: "S5B018",
        created_at: new Date().toISOString(),
      },
      {
        id: 19,
        nombre: "Jimenez Aricapa Johan Andrés",
        codigo: "S5B019",
        created_at: new Date().toISOString(),
      },
      {
        id: 20,
        nombre: "Ladino Contreras Emanuel",
        codigo: "S5B020",
        created_at: new Date().toISOString(),
      },
      {
        id: 21,
        nombre: "Ladino Bartolo Lun Julian",
        codigo: "S5B021",
        created_at: new Date().toISOString(),
      },
      {
        id: 22,
        nombre: "Ladino Contreras Antwon",
        codigo: "S5B022",
        created_at: new Date().toISOString(),
      },
      {
        id: 23,
        nombre: "Ladino Diaz Yeferson",
        codigo: "S5B023",
        created_at: new Date().toISOString(),
      },
      {
        id: 24,
        nombre: "Ladino Pinto Valeria",
        codigo: "S5B024",
        created_at: new Date().toISOString(),
      },
      {
        id: 25,
        nombre: "León Zuluaga Alan Santiago",
        codigo: "S5B025",
        created_at: new Date().toISOString(),
      },
      {
        id: 26,
        nombre: "Manzo Hernández Alan Manuel",
        codigo: "S5B026",
        created_at: new Date().toISOString(),
      },
      {
        id: 27,
        nombre: "Melchor Senna Ismael",
        codigo: "S5B027",
        created_at: new Date().toISOString(),
      },
      {
        id: 28,
        nombre: "Molina Marin Jhonier",
        codigo: "S5B028",
        created_at: new Date().toISOString(),
      },
      {
        id: 29,
        nombre: "Mosquera Hincapie Eileen",
        codigo: "S5B029",
        created_at: new Date().toISOString(),
      },
      {
        id: 30,
        nombre: "Ortíz Ladino Sebastian",
        codigo: "S5B030",
        created_at: new Date().toISOString(),
      },
      {
        id: 31,
        nombre: "Rendón Tapasco Jackelin",
        codigo: "S5B031",
        created_at: new Date().toISOString(),
      },
      {
        id: 32,
        nombre: "Reyes Medina Dayron Hjosua",
        codigo: "S5B032",
        created_at: new Date().toISOString(),
      },
      {
        id: 33,
        nombre: "Robledo muñoz Isabela",
        codigo: "S5B033",
        created_at: new Date().toISOString(),
      },
      {
        id: 34,
        nombre: "Rodas Ladino Laura Sofia",
        codigo: "S5B034",
        created_at: new Date().toISOString(),
      },
      {
        id: 35,
        nombre: "Suarez Suarez Sofia",
        codigo: "S5B035",
        created_at: new Date().toISOString(),
      },
      {
        id: 36,
        nombre: "Tapasco Tapasco Samuel Alejandro",
        codigo: "S5B036",
        created_at: new Date().toISOString(),
      },
      {
        id: 37,
        nombre: "Toro Velasco Sofia",
        codigo: "S5B037",
        created_at: new Date().toISOString(),
      },
      {
        id: 38,
        nombre: "Velasco Londoño Emily Sofia",
        codigo: "S5B038",
        created_at: new Date().toISOString(),
      },
      {
        id: 39,
        nombre: "Zapata Chiquito Luciana",
        codigo: "S5B039",
        created_at: new Date().toISOString(),
      },
    ];

    localStorage.setItem(
      `${this.dbName}_estudiantes`,
      JSON.stringify(estudiantesDefault)
    );

    // Insertar materias por defecto
    const materiasDefault = [
      {
        id: 1,
        nombre: "Matemáticas",
        codigo: "MAT",
        grado: "5b",
        horario: "Martes, Jueves",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        nombre: "Lenguaje",
        codigo: "LEN",
        grado: "5b",
        horario: "Miércoles, Jueves",
        color: "bg-green-100 text-green-800 border-green-200",
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        nombre: "Ciencias Naturales",
        codigo: "NAT",
        grado: "5b",
        horario: "Lunes, Martes, Viernes",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        created_at: new Date().toISOString(),
      },
      {
        id: 4,
        nombre: "Ciencias Sociales",
        codigo: "SOC",
        grado: "5b",
        horario: "Lunes, Viernes",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        created_at: new Date().toISOString(),
      },
      {
        id: 5,
        nombre: "Inglés",
        codigo: "ING",
        grado: "5b",
        horario: "Martes",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        created_at: new Date().toISOString(),
      },
      {
        id: 6,
        nombre: "Educación Física",
        codigo: "EDF",
        grado: "5b",
        horario: "Lunes",
        color: "bg-red-100 text-red-800 border-red-200",
        created_at: new Date().toISOString(),
      },
      {
        id: 7,
        nombre: "Geometría",
        codigo: "GEO",
        grado: "5b",
        horario: "Miércoles",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        created_at: new Date().toISOString(),
      },
      {
        id: 8,
        nombre: "Educación Artística",
        codigo: "ART",
        grado: "5b",
        horario: "Miércoles",
        color: "bg-pink-100 text-pink-800 border-pink-200",
        created_at: new Date().toISOString(),
      },
      {
        id: 9,
        nombre: "Ética y Valores",
        codigo: "ETI",
        grado: "5b",
        horario: "Jueves",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        created_at: new Date().toISOString(),
      },
      {
        id: 10,
        nombre: "Educación Cívica",
        codigo: "CIV",
        grado: "5b",
        horario: "Lunes",
        color: "bg-teal-100 text-teal-800 border-teal-200",
        created_at: new Date().toISOString(),
      },
      {
        id: 11,
        nombre: "Informática",
        codigo: "INF",
        grado: "5b",
        horario: "Viernes",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        created_at: new Date().toISOString(),
      },
      {
        id: 12,
        nombre: "Educación Religiosa",
        codigo: "REL",
        grado: "5b",
        horario: "Viernes",
        color: "bg-amber-100 text-amber-800 border-amber-200",
        created_at: new Date().toISOString(),
      },
    ];

    localStorage.setItem(
      `${this.dbName}_materias`,
      JSON.stringify(materiasDefault)
    );
    console.log("✅ Datos por defecto insertados");
  }

  // ===== ESTUDIANTES =====
  getEstudiantes() {
    try {
      const data = localStorage.getItem(`${this.dbName}_estudiantes`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error obteniendo estudiantes:", error);
      return [];
    }
  }

  guardarEstudiante(estudiante) {
    try {
      const estudiantes = this.getEstudiantes();
      const newId = Math.max(...estudiantes.map((e) => e.id), 0) + 1;
      const nuevoEstudiante = {
        ...estudiante,
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      estudiantes.push(nuevoEstudiante);
      localStorage.setItem(
        `${this.dbName}_estudiantes`,
        JSON.stringify(estudiantes)
      );
      return nuevoEstudiante;
    } catch (error) {
      console.error("Error guardando estudiante:", error);
      throw error;
    }
  }

  actualizarEstudiante(id, datos) {
    try {
      const estudiantes = this.getEstudiantes();
      const index = estudiantes.findIndex((e) => e.id === id);
      if (index !== -1) {
        estudiantes[index] = {
          ...estudiantes[index],
          ...datos,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(
          `${this.dbName}_estudiantes`,
          JSON.stringify(estudiantes)
        );
        return estudiantes[index];
      }
      return null;
    } catch (error) {
      console.error("Error actualizando estudiante:", error);
      throw error;
    }
  }

  eliminarEstudiante(id) {
    try {
      const estudiantes = this.getEstudiantes();
      const filtered = estudiantes.filter((e) => e.id !== id);
      localStorage.setItem(
        `${this.dbName}_estudiantes`,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error("Error eliminando estudiante:", error);
      throw error;
    }
  }

  getEstudianteById(id) {
    try {
      const estudiantes = this.getEstudiantes();
      return estudiantes.find((e) => e.id === id) || null;
    } catch (error) {
      console.error("Error obteniendo estudiante:", error);
      return null;
    }
  }

  // ===== MATERIAS =====
  getMaterias() {
    try {
      const data = localStorage.getItem(`${this.dbName}_materias`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error obteniendo materias:", error);
      return [];
    }
  }

  guardarMateria(materia) {
    try {
      const materias = this.getMaterias();
      const newId = Math.max(...materias.map((m) => m.id), 0) + 1;
      const nuevaMateria = {
        ...materia,
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      materias.push(nuevaMateria);
      localStorage.setItem(`${this.dbName}_materias`, JSON.stringify(materias));
      return nuevaMateria;
    } catch (error) {
      console.error("Error guardando materia:", error);
      throw error;
    }
  }

  actualizarMateria(id, datos) {
    try {
      const materias = this.getMaterias();
      const index = materias.findIndex((m) => m.id === id);
      if (index !== -1) {
        materias[index] = {
          ...materias[index],
          ...datos,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(
          `${this.dbName}_materias`,
          JSON.stringify(materias)
        );
        return materias[index];
      }
      return null;
    } catch (error) {
      console.error("Error actualizando materia:", error);
      throw error;
    }
  }

  eliminarMateria(id) {
    try {
      const materias = this.getMaterias();
      const filtered = materias.filter((m) => m.id !== id);
      localStorage.setItem(`${this.dbName}_materias`, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error eliminando materia:", error);
      throw error;
    }
  }

  getMateriaById(id) {
    try {
      const materias = this.getMaterias();
      return materias.find((m) => m.id === id) || null;
    } catch (error) {
      console.error("Error obteniendo materia:", error);
      return null;
    }
  }

  // ===== ASISTENCIAS =====
  getAsistencia(fecha) {
    try {
      const asistencias = this.getAsistencias();
      const estudiantes = this.getEstudiantes();
      const materias = this.getMaterias();

      return asistencias
        .filter((a) => a.fecha === fecha)
        .map((a) => ({
          ...a,
          estudiante_nombre:
            estudiantes.find((e) => e.id === a.estudiante_id)?.nombre || "",
          estudiante_codigo:
            estudiantes.find((e) => e.id === a.estudiante_id)?.codigo || "",
          materia_nombre:
            materias.find((m) => m.id === a.materia_id)?.nombre || "",
        }))
        .sort((a, b) => a.estudiante_nombre.localeCompare(b.estudiante_nombre));
    } catch (error) {
      console.error("Error obteniendo asistencia:", error);
      return [];
    }
  }

  getAsistencias() {
    try {
      const data = localStorage.getItem(`${this.dbName}_asistencias`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error obteniendo asistencias:", error);
      return [];
    }
  }

  guardarAsistencia(asistencia) {
    try {
      const asistencias = this.getAsistencias();
      const newId = Math.max(...asistencias.map((a) => a.id), 0) + 1;
      const nuevaAsistencia = {
        ...asistencia,
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      asistencias.push(nuevaAsistencia);
      localStorage.setItem(
        `${this.dbName}_asistencias`,
        JSON.stringify(asistencias)
      );
      return nuevaAsistencia;
    } catch (error) {
      console.error("Error guardando asistencia:", error);
      throw error;
    }
  }

  guardarAsistenciaDia(fecha, asistencias) {
    try {
      const todasAsistencias = this.getAsistencias();

      // Eliminar asistencias existentes para esa fecha
      const asistenciasFiltradas = todasAsistencias.filter(
        (a) => a.fecha !== fecha
      );

      // Agregar nuevas asistencias
      const nuevasAsistencias = asistencias.map((asistencia, index) => ({
        id: Date.now() + index,
        estudiante_id: asistencia.estudianteId,
        materia_id: asistencia.materiaId,
        fecha: fecha,
        estado: asistencia.estado,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const todasNuevas = [...asistenciasFiltradas, ...nuevasAsistencias];
      localStorage.setItem(
        `${this.dbName}_asistencias`,
        JSON.stringify(todasNuevas)
      );

      console.log(
        `✅ Asistencia guardada para ${fecha}: ${asistencias.length} registros`
      );
      return true;
    } catch (error) {
      console.error("Error guardando asistencia del día:", error);
      throw error;
    }
  }

  getAsistenciaEstudiante(estudianteId, fecha) {
    try {
      const asistencias = this.getAsistencias();
      const asistencia = asistencias.find(
        (a) => a.estudiante_id === estudianteId && a.fecha === fecha
      );
      return asistencia ? asistencia.estado : null;
    } catch (error) {
      console.error("Error obteniendo asistencia de estudiante:", error);
      return null;
    }
  }

  // ===== NOTAS =====
  getNotas(materiaId, periodo) {
    try {
      const notas = this.getTodasNotas();
      const estudiantes = this.getEstudiantes();
      const materias = this.getMaterias();

      return notas
        .filter((n) => n.materia_id === materiaId && n.periodo === periodo)
        .map((n) => ({
          ...n,
          estudiante_nombre:
            estudiantes.find((e) => e.id === n.estudiante_id)?.nombre || "",
          estudiante_codigo:
            estudiantes.find((e) => e.id === n.estudiante_id)?.codigo || "",
          materia_nombre:
            materias.find((m) => m.id === n.materia_id)?.nombre || "",
        }))
        .sort((a, b) => a.estudiante_nombre.localeCompare(b.estudiante_nombre));
    } catch (error) {
      console.error("Error obteniendo notas:", error);
      return [];
    }
  }

  getTodasNotas() {
    try {
      const data = localStorage.getItem(`${this.dbName}_notas`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error obteniendo notas:", error);
      return [];
    }
  }

  guardarNota(nota) {
    try {
      const notas = this.getTodasNotas();
      const newId = Math.max(...notas.map((n) => n.id), 0) + 1;
      const nuevaNota = {
        ...nota,
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      notas.push(nuevaNota);
      localStorage.setItem(`${this.dbName}_notas`, JSON.stringify(notas));
      console.log("✅ Nota guardada:", nuevaNota);
      return nuevaNota;
    } catch (error) {
      console.error("Error guardando nota:", error);
      throw error;
    }
  }

  actualizarNota(id, datos) {
    try {
      const notas = this.getTodasNotas();
      const index = notas.findIndex((n) => n.id === id);
      if (index !== -1) {
        notas[index] = {
          ...notas[index],
          ...datos,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(`${this.dbName}_notas`, JSON.stringify(notas));
        console.log("✅ Nota actualizada:", notas[index]);
        return notas[index];
      }
      return null;
    } catch (error) {
      console.error("Error actualizando nota:", error);
      throw error;
    }
  }

  // ===== TIPOS DE NOTA (COLUMNAS DINÁMICAS) =====
  getTiposNotaPeriodo() {
    try {
      const data = localStorage.getItem(`${this.dbName}_tipos_nota_periodo`);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Error obteniendo tipos de nota:", error);
      return {};
    }
  }

  guardarTiposNotaPeriodo(tiposNotaPeriodo) {
    try {
      localStorage.setItem(
        `${this.dbName}_tipos_nota_periodo`,
        JSON.stringify(tiposNotaPeriodo)
      );
      console.log("✅ Tipos de nota guardados:", Object.keys(tiposNotaPeriodo));
    } catch (error) {
      console.error("Error guardando tipos de nota:", error);
      throw error;
    }
  }

  // ===== NOTAS DETALLADAS POR MATERIA =====
  getNotasDetalladas() {
    try {
      const data = localStorage.getItem(`${this.dbName}_notas_detalladas`);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Error obteniendo notas detalladas:", error);
      return {};
    }
  }

  guardarNotasDetalladas(notasDetalladas) {
    try {
      localStorage.setItem(
        `${this.dbName}_notas_detalladas`,
        JSON.stringify(notasDetalladas)
      );
      console.log("✅ Notas detalladas guardadas");
    } catch (error) {
      console.error("Error guardando notas detalladas:", error);
      throw error;
    }
  }

  // ===== GUARDAR NOTA INDIVIDUAL =====
  guardarNotaIndividual(
    materiaId,
    estudianteId,
    periodo,
    tipoNotaId,
    titulo,
    valor
  ) {
    try {
      const notasDetalladas = this.getNotasDetalladas();

      // Inicializar estructura si no existe
      if (!notasDetalladas[materiaId]) notasDetalladas[materiaId] = {};
      if (!notasDetalladas[materiaId][estudianteId])
        notasDetalladas[materiaId][estudianteId] = {};
      if (!notasDetalladas[materiaId][estudianteId][`periodo${periodo}`]) {
        notasDetalladas[materiaId][estudianteId][`periodo${periodo}`] = [];
      }

      const periodoKey = `periodo${periodo}`;
      const notasPeriodo = notasDetalladas[materiaId][estudianteId][periodoKey];

      // Buscar si ya existe una nota de este tipo
      const notaExistente = notasPeriodo.find((n) => n.tipoId === tipoNotaId);

      if (notaExistente) {
        // Actualizar nota existente
        notaExistente.valor = parseFloat(valor);
        notaExistente.updated_at = new Date().toISOString();
      } else {
        // Agregar nueva nota
        notasPeriodo.push({
          id: Date.now() + estudianteId,
          tipoId: tipoNotaId,
          titulo: titulo,
          valor: parseFloat(valor),
          fecha: new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString(),
        });
      }

      this.guardarNotasDetalladas(notasDetalladas);
      console.log(
        `✅ Nota individual guardada: ${titulo} = ${valor} para estudiante ${estudianteId}`
      );
      return true;
    } catch (error) {
      console.error("Error guardando nota individual:", error);
      throw error;
    }
  }

  // ===== ELIMINAR NOTA INDIVIDUAL =====
  eliminarNotaIndividual(materiaId, estudianteId, periodo, tipoNotaId) {
    try {
      const notasDetalladas = this.getNotasDetalladas();

      // Verificar que exista la estructura
      if (!notasDetalladas[materiaId] ||
          !notasDetalladas[materiaId][estudianteId] ||
          !notasDetalladas[materiaId][estudianteId][`periodo${periodo}`]) {
        console.log(`⚠️ No se encontraron notas para eliminar`);
        return false;
      }

      const periodoKey = `periodo${periodo}`;
      const notasPeriodo = notasDetalladas[materiaId][estudianteId][periodoKey];

      // Filtrar la nota específica
      const notasOriginal = notasPeriodo.length;
      notasDetalladas[materiaId][estudianteId][periodoKey] = 
        notasPeriodo.filter(n => n.tipoId !== tipoNotaId);

      const notasFinal = notasDetalladas[materiaId][estudianteId][periodoKey].length;

      if (notasOriginal > notasFinal) {
        this.guardarNotasDetalladas(notasDetalladas);
        console.log(`✅ Nota individual eliminada para estudiante ${estudianteId}, tipo ${tipoNotaId}`);
        return true;
      } else {
        console.log(`⚠️ No se encontró la nota para eliminar`);
        return false;
      }
    } catch (error) {
      console.error("Error eliminando nota individual:", error);
      throw error;
    }
  }

  // ===== NOTAS PERSONALES =====
  getNotasPersonales() {
    try {
      const data = localStorage.getItem(`${this.dbName}_notas_personales`);
      const notas = data ? JSON.parse(data) : [];
      return notas.length > 0 ? notas[0] : null;
    } catch (error) {
      console.error("Error obteniendo notas personales:", error);
      return null;
    }
  }

  guardarNotasPersonales(contenido) {
    try {
      const notas = [
        {
          id: 1,
          contenido: contenido,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
        },
      ];
      localStorage.setItem(
        `${this.dbName}_notas_personales`,
        JSON.stringify(notas)
      );
      return notas[0];
    } catch (error) {
      console.error("Error guardando notas personales:", error);
      throw error;
    }
  }

  // ===== ESTADÍSTICAS =====
  getEstadisticasAsistencia(fechaInicio, fechaFin) {
    try {
      const asistencias = this.getAsistencias();
      const estudiantes = this.getEstudiantes();

      return estudiantes
        .map((estudiante) => {
          const asistenciasEstudiante = asistencias.filter(
            (a) =>
              a.estudiante_id === estudiante.id &&
              a.fecha >= fechaInicio &&
              a.fecha <= fechaFin
          );

          const presentes = asistenciasEstudiante.filter(
            (a) => a.estado === "presente"
          ).length;
          const ausentes = asistenciasEstudiante.filter(
            (a) => a.estado === "ausente"
          ).length;
          const total = asistenciasEstudiante.length;

          return {
            estudiante_nombre: estudiante.nombre,
            estudiante_codigo: estudiante.codigo,
            presentes,
            ausentes,
            total,
          };
        })
        .sort((a, b) => a.estudiante_nombre.localeCompare(b.estudiante_nombre));
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      return [];
    }
  }

  // ===== EXPORTAR/IMPORTAR =====
  exportarDatos() {
    try {
      const datos = {
        estudiantes: this.getEstudiantes(),
        materias: this.getMaterias(),
        asistencias: this.getAsistencias(),
        notas: this.getTodasNotas(),
        notas_personales: this.getNotasPersonales(),
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
  getDatabaseInfo() {
    try {
      const info = {
        estudiantes: this.getEstudiantes().length,
        materias: this.getMaterias().length,
        asistencias: this.getAsistencias().length,
        notas: this.getTodasNotas().length,
        notas_personales: this.getNotasPersonales() ? 1 : 0,
        fecha_ultima_actualizacion: new Date().toISOString(),
      };
      return info;
    } catch (error) {
      console.error("Error obteniendo información de la base de datos:", error);
      return null;
    }
  }

  // Limpiar base de datos
  limpiarBaseDatos() {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(this.dbName)
      );
      keys.forEach((key) => localStorage.removeItem(key));
      console.log("✅ Base de datos limpiada");
    } catch (error) {
      console.error("Error limpiando base de datos:", error);
    }
  }
}

// Instancia global
const db = new LocalDatabase();

export default db;
