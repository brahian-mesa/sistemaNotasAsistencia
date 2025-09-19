import { z } from 'zod';
import React from 'react';

// Esquemas de validación
export const loginSchema = z.object({
  usuario: z.string()
    .min(1, 'El usuario es obligatorio')
    .email('Debe ser un email válido'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export const registerSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  usuario: z.string()
    .min(1, 'El usuario es obligatorio')
    .email('Debe ser un email válido'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export const estudianteSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  codigo: z.string()
    .min(1, 'El código es obligatorio')
    .regex(/^[A-Za-z0-9]+$/, 'El código solo puede contener letras y números')
});

export const materiaSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  codigo: z.string()
    .min(1, 'El código es obligatorio')
    .max(10, 'El código no puede exceder 10 caracteres'),
  grado: z.string()
    .min(1, 'El grado es obligatorio'),
  horario: z.string()
    .min(1, 'El horario es obligatorio')
});

// Función helper para validar
export const validateForm = (schema, data) => {
  try {
    schema.parse(data);
    return { success: true, errors: {} };
  } catch (error) {
    const errors = {};
    // Verificar que error.errors existe y es un array
    if (error.errors && Array.isArray(error.errors)) {
      error.errors.forEach((err) => {
        if (err.path && err.path.length > 0) {
          errors[err.path[0]] = err.message;
        }
      });
    } else {
      // Fallback si no hay errores estructurados
      console.error('Error de validación:', error);
      errors.general = 'Error de validación';
    }
    return { success: false, errors };
  }
};

// Hook personalizado para validación
export const useValidation = (schema) => {
  const [errors, setErrors] = React.useState({});
  const [isValid, setIsValid] = React.useState(false);

  const validate = (data) => {
    const result = validateForm(schema, data);
    setErrors(result.errors);
    setIsValid(result.success);
    return result.success;
  };

  const clearErrors = () => {
    setErrors({});
    setIsValid(false);
  };

  return { errors, isValid, validate, clearErrors };
};