// src/utils/api.js
const API_URL = "http://localhost:8080/api";

// --- ESTUDIANTES ---
export async function getEstudiantes() {
  try {
    const res = await fetch(`${API_URL}/estudiantes`);
    if (!res.ok) throw new Error("Error al obtener estudiantes");
    return res.json();
  } catch (error) {
    console.error("Error API getEstudiantes:", error);
    return [];
  }
}

export async function addEstudiante(estudiante) {
  try {
    const res = await fetch(`${API_URL}/estudiantes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(estudiante),
    });
    if (!res.ok) throw new Error("Error al agregar estudiante");
    return res.json();
  } catch (error) {
    console.error("Error API addEstudiante:", error);
    throw error;
  }
}

export async function updateEstudiante(id, estudiante) {
  try {
    const res = await fetch(`${API_URL}/estudiantes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(estudiante),
    });
    if (!res.ok) throw new Error("Error al actualizar estudiante");
    return res.json();
  } catch (error) {
    console.error("Error API updateEstudiante:", error);
    throw error;
  }
}

export async function deleteEstudiante(id) {
  try {
    const res = await fetch(`${API_URL}/estudiantes/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar estudiante");
    return res.json();
  } catch (error) {
    console.error("Error API deleteEstudiante:", error);
    throw error;
  }
}

// --- MATERIAS ---
export async function getMaterias() {
  try {
    const res = await fetch(`${API_URL}/materias`);
    if (!res.ok) throw new Error("Error al obtener materias");
    return res.json();
  } catch (error) {
    console.error("Error API getMaterias:", error);
    return [];
  }
}

export async function addMateria(materia) {
  try {
    const res = await fetch(`${API_URL}/materias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(materia),
    });
    if (!res.ok) throw new Error("Error al agregar materia");
    return res.json();
  } catch (error) {
    console.error("Error API addMateria:", error);
    throw error;
  }
}

export async function updateMateria(id, materia) {
  try {
    const res = await fetch(`${API_URL}/materias/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(materia),
    });
    if (!res.ok) throw new Error("Error al actualizar materia");
    return res.json();
  } catch (error) {
    console.error("Error API updateMateria:", error);
    throw error;
  }
}

export async function deleteMateria(id) {
  try {
    const res = await fetch(`${API_URL}/materias/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar materia");
    return res.json();
  } catch (error) {
    console.error("Error API deleteMateria:", error);
    throw error;
  }
}

// --- ASISTENCIAS ---
export async function getAsistencias() {
  try {
    const res = await fetch(`${API_URL}/asistencias`);
    if (!res.ok) throw new Error("Error al obtener asistencias");
    return res.json();
  } catch (error) {
    console.error("Error API getAsistencias:", error);
    return [];
  }
}

export async function addAsistencia(asistencia) {
  try {
    const res = await fetch(`${API_URL}/asistencias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(asistencia),
    });
    if (!res.ok) throw new Error("Error al agregar asistencia");
    return res.json();
  } catch (error) {
    console.error("Error API addAsistencia:", error);
    throw error;
  }
}

export async function getAsistenciasPorFecha(fecha) {
  try {
    const res = await fetch(`${API_URL}/asistencias/fecha/${fecha}`);
    if (!res.ok) throw new Error("Error al obtener asistencias por fecha");
    return res.json();
  } catch (error) {
    console.error("Error API getAsistenciasPorFecha:", error);
    return [];
  }
}

// --- NOTAS ---
export async function getNotas() {
  try {
    const res = await fetch(`${API_URL}/notas`);
    if (!res.ok) throw new Error("Error al obtener notas");
    return res.json();
  } catch (error) {
    console.error("Error API getNotas:", error);
    return [];
  }
}

export async function addNota(nota) {
  try {
    const res = await fetch(`${API_URL}/notas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nota),
    });
    if (!res.ok) throw new Error("Error al agregar nota");
    return res.json();
  } catch (error) {
    console.error("Error API addNota:", error);
    throw error;
  }
}

export async function getNotasPorEstudiante(estudianteId) {
  try {
    const res = await fetch(`${API_URL}/notas/estudiante/${estudianteId}`);
    if (!res.ok) throw new Error("Error al obtener notas del estudiante");
    return res.json();
  } catch (error) {
    console.error("Error API getNotasPorEstudiante:", error);
    return [];
  }
}

export async function getNotasPorMateria(materiaId) {
  try {
    const res = await fetch(`${API_URL}/notas/materia/${materiaId}`);
    if (!res.ok) throw new Error("Error al obtener notas de la materia");
    return res.json();
  } catch (error) {
    console.error("Error API getNotasPorMateria:", error);
    return [];
  }
}

// --- NOTAS PERSONALES ---
export async function getNotasPersonales() {
  try {
    const res = await fetch(`${API_URL}/notaspersonales`);
    if (!res.ok) throw new Error("Error al obtener notas personales");
    return res.json();
  } catch (error) {
    console.error("Error API getNotasPersonales:", error);
    return [];
  }
}

export async function addNotaPersonal(notaPersonal) {
  try {
    const res = await fetch(`${API_URL}/notaspersonales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notaPersonal),
    });
    if (!res.ok) throw new Error("Error al agregar nota personal");
    return res.json();
  } catch (error) {
    console.error("Error API addNotaPersonal:", error);
    throw error;
  }
}

export async function updateNotaPersonal(id, notaPersonal) {
  try {
    const res = await fetch(`${API_URL}/notaspersonales/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notaPersonal),
    });
    if (!res.ok) throw new Error("Error al actualizar nota personal");
    return res.json();
  } catch (error) {
    console.error("Error API updateNotaPersonal:", error);
    throw error;
  }
}

export async function deleteNotaPersonal(id) {
  try {
    const res = await fetch(`${API_URL}/notaspersonales/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar nota personal");
    return res.json();
  } catch (error) {
    console.error("Error API deleteNotaPersonal:", error);
    throw error;
  }
}
