// Sistema de validación mejorado para formularios
import auth from './auth'

export const validateFormData = (formData, formType) => {
  const errors = {}
  
  switch (formType) {
    case 'materia':
      if (!formData.nombre?.trim()) {
        errors.nombre = 'El nombre de la materia es obligatorio'
      }
      if (!formData.grado?.trim()) {
        errors.grado = 'El grado es obligatorio'
      }
      if (!formData.horario?.trim()) {
        errors.horario = 'El horario es obligatorio'
      }
      break
      
    case 'estudiante':
      if (!formData.nombre?.trim()) {
        errors.nombre = 'El nombre del estudiante es obligatorio'
      }
      if (!formData.codigo?.trim()) {
        errors.codigo = 'El código del estudiante es obligatorio'
      }
      // Validar formato del código
      if (formData.codigo && !/^[A-Za-z0-9]+$/.test(formData.codigo)) {
        errors.codigo = 'El código solo puede contener letras y números'
      }
      break
      
    case 'evento':
      if (!formData.title?.trim()) {
        errors.title = 'El título del evento es obligatorio'
      }
      break
      
    case 'tipoNota':
      if (!formData.titulo?.trim()) {
        errors.titulo = 'El título del tipo de nota es obligatorio'
      }
      break
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const sanitizeFormData = (formData, formType) => {
  const sanitized = { ...formData }
  
  // Sanitizar strings
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].trim()
    }
  })
  
  // Validaciones específicas por tipo
  switch (formType) {
    case 'materia':
      sanitized.nombre = sanitized.nombre?.substring(0, 100)
      sanitized.codigo = sanitized.codigo?.substring(0, 20)
      sanitized.grado = sanitized.grado?.substring(0, 50)
      break
      
    case 'estudiante':
      sanitized.nombre = sanitized.nombre?.substring(0, 100)
      sanitized.codigo = sanitized.codigo?.substring(0, 20).toUpperCase()
      break
      
    case 'evento':
      sanitized.title = sanitized.title?.substring(0, 255)
      sanitized.description = sanitized.description?.substring(0, 1000)
      sanitized.location = sanitized.location?.substring(0, 255)
      break
  }
  
  return sanitized
}

export const showSaveStatus = (message, type = 'success') => {
  // Esta función se puede usar para mostrar estados de guardado
  console.log(`${type === 'success' ? '✅' : '❌'} ${message}`)
}

export const getCurrentUserInfo = () => {
  const user = auth.getCurrentUser()
  return {
    id: user?.id,
    nombre: user?.nombre,
    grado: user?.grado,
    usuario: user?.usuario
  }
}