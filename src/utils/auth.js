// Sistema de autenticación usando solo Supabase (sin localStorage)
import supabase from './supabase'

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.sessionKey = 'supabase_session';
  }

  async testConnection() {
    try {
      const { data, error } = await supabase.from('usuarios').select('count')
      return !error;
    } catch (error) {
      return false;
    }
  }

  // Registrar nuevo usuario
  async register(userData) {
    try {
      const { nombre, usuario, password } = userData;

      // Validaciones básicas
      if (!nombre || !usuario || !password) {
        throw new Error("Todos los campos son obligatorios");
      }

      if (password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }

      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('usuario')
        .eq('usuario', usuario)
        .single();

      if (existingUser) {
        throw new Error("El usuario ya existe");
      }

      // Crear perfil en tabla usuarios
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .insert({
          nombre: nombre,
          usuario: usuario,
          password_hash: password, // En producción esto debería estar hasheado
          grado: null, // No establecer grado por defecto
          rol: "docente",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Auto-login después del registro
      this.currentUser = profileData;
      this.saveSession(profileData);

      return { success: true, usuario: profileData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Iniciar sesión
  async login(loginData) {
    try {
      const { usuario, password } = loginData;

      if (!usuario || !password) {
        throw new Error("Usuario y contraseña son obligatorios");
      }

      // Buscar usuario en la tabla usuarios
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', usuario)
        .eq('password_hash', password)
        .single();

      if (userError || !userData) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      // Guardar sesión en memoria y sessionStorage
      this.currentUser = userData;
      this.saveSession(userData);

      return { success: true, usuario: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cerrar sesión
  async logout() {
    try {
      this.currentUser = null;
      this.clearSession();
      return { success: true };
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      return { success: false, error: error.message };
    }
  }

  // Verificar si está autenticado
  isAuthenticated() {
    try {
      // Verificar usuario en memoria
      if (this.currentUser) {
        return true;
      }
      
      // Intentar cargar desde sessionStorage
      const sessionData = this.loadSession();
      if (sessionData) {
        this.currentUser = sessionData;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      return false;
    }
  }

  // Obtener usuario actual
  getCurrentUser() {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }
      
      // Intentar cargar desde sessionStorage
      const sessionData = this.loadSession();
      if (sessionData) {
        this.currentUser = sessionData;
        return sessionData;
      }
      
      return null;
    } catch (error) {
      console.error("Error obteniendo usuario actual:", error);
      return null;
    }
  }

  // Establecer usuario actual
  setCurrentUser(usuario) {
    this.currentUser = usuario;
    this.saveSession(usuario);
  }

  // Guardar sesión en sessionStorage (se borra al cerrar el navegador)
  saveSession(userData) {
    try {
      sessionStorage.setItem(this.sessionKey, JSON.stringify({
        user: userData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error guardando sesión:", error);
    }
  }

  // Cargar sesión desde sessionStorage
  loadSession() {
    try {
      const sessionData = sessionStorage.getItem(this.sessionKey);
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      
      // Verificar que la sesión no sea muy antigua (24 horas)
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas en ms
      if (Date.now() - parsed.timestamp > maxAge) {
        this.clearSession();
        return null;
      }

      return parsed.user;
    } catch (error) {
      console.error("Error cargando sesión:", error);
      return null;
    }
  }

  // Limpiar sesión
  clearSession() {
    try {
      sessionStorage.removeItem(this.sessionKey);
    } catch (error) {
      console.error("Error limpiando sesión:", error);
    }
  }

  // Refrescar usuario desde la base de datos
  async refreshUser() {
    try {
      if (!this.currentUser) {
        return null;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (error) throw error;

      this.currentUser = data;
      this.setCurrentUser(data);
      
      return data;
    } catch (error) {
      console.error("Error refrescando usuario:", error);
      return null;
    }
  }

  // Obtener todos los usuarios
  async getUsuarios() {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      return [];
    }
  }

  // Actualizar perfil de usuario
  async updateProfile(userData) {
    try {
      if (!this.currentUser) {
        throw new Error("No hay usuario autenticado");
      }

      console.log('🔄 Actualizando perfil con datos:', userData);

      // Filtrar solo los campos que sabemos que existen
      const safeUserData = {
        nombre: userData.nombre,
        grado: userData.grado,
        rol: userData.rol,
        updated_at: new Date().toISOString(),
      };

      // Eliminar campos undefined o null
      Object.keys(safeUserData).forEach(key => {
        if (safeUserData[key] === undefined || safeUserData[key] === null) {
          delete safeUserData[key];
        }
      });

      console.log('🔄 Datos seguros para actualizar:', safeUserData);

      const { data, error } = await supabase
        .from('usuarios')
        .update(safeUserData)
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error actualizando en Supabase:', error);
        
        // Si es error de columna faltante, intentar solo con campos básicos
        if (error.message.includes('Could not find') || error.message.includes('column')) {
          console.log('🔄 Intentando actualización con campos básicos...');
          
          const basicData = {
            nombre: userData.nombre || this.currentUser.nombre,
            updated_at: new Date().toISOString(),
          };

          const { data: basicResult, error: basicError } = await supabase
            .from('usuarios')
            .update(basicData)
            .eq('id', this.currentUser.id)
            .select()
            .single();

          if (basicError) {
            throw basicError;
          }

          console.log('✅ Perfil actualizado con campos básicos:', basicResult);
          this.currentUser = basicResult;
          this.setCurrentUser(basicResult);
          return { success: true, usuario: basicResult };
        }
        
        throw error;
      }

      console.log('✅ Perfil actualizado en Supabase:', data);

      // Actualizar sesión actual
      this.currentUser = data;
      this.setCurrentUser(data);

      console.log('✅ Sesión local actualizada');

      return { success: true, usuario: data };
    } catch (error) {
      console.error('❌ Error en updateProfile:', error);
      return { success: false, error: error.message };
    }
  }
}

// Instancia global
const auth = new AuthManager();
export default auth;