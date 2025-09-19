// Sistema de logging para desarrollo y producción
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // En producción, podrías enviar errores a un servicio de monitoreo
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

// Función helper para reemplazar console.log en el código
export const devLog = logger.log;
export const devError = logger.error;
export const devWarn = logger.warn;
export const devInfo = logger.info;