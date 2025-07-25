// Sistema de autenticación simple usando localStorage
class AuthManager {
  constructor() {
    this.currentUser = this.getCurrentUser();
  }

  // Registrar nuevo usuario
  register(userData) {
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
      const usuarios = this.getUsuarios();
      if (usuarios.find((u) => u.usuario === usuario)) {
        throw new Error("El usuario ya existe");
      }

      // Crear nuevo usuario
      const nuevoUsuario = {
        id: Date.now().toString(),
        nombre,
        usuario,
        password, // En producción esto debería estar hasheado
        fechaRegistro: new Date().toISOString(),
        rol: "docente",
      };

      // Guardar usuario
      usuarios.push(nuevoUsuario);
      localStorage.setItem("usuarios", JSON.stringify(usuarios));

      // Auto-login después del registro
      this.setCurrentUser(nuevoUsuario);

      return { success: true, usuario: nuevoUsuario };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Iniciar sesión
  login(loginData) {
    try {
      const { usuario, password } = loginData;

      if (!usuario || !password) {
        throw new Error("Usuario y contraseña son obligatorios");
      }

      const usuarios = this.getUsuarios();
      const usuarioEncontrado = usuarios.find(
        (u) => u.usuario === usuario && u.password === password
      );

      if (!usuarioEncontrado) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      // Guardar sesión
      this.setCurrentUser(usuarioEncontrado);

      return { success: true, usuario: usuarioEncontrado };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cerrar sesión
  logout() {
    localStorage.removeItem("currentUser");
    this.currentUser = null;
    return { success: true };
  }

  // Verificar si está autenticado
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Obtener usuario actual
  getCurrentUser() {
    try {
      const userData = localStorage.getItem("currentUser");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Establecer usuario actual
  setCurrentUser(usuario) {
    localStorage.setItem("currentUser", JSON.stringify(usuario));
    this.currentUser = usuario;
  }

  // Obtener todos los usuarios
  getUsuarios() {
    try {
      const usuarios = localStorage.getItem("usuarios");
      return usuarios ? JSON.parse(usuarios) : [];
    } catch {
      return [];
    }
  }

  // Actualizar perfil de usuario
  updateProfile(userData) {
    try {
      if (!this.currentUser) {
        throw new Error("No hay usuario autenticado");
      }

      const usuarios = this.getUsuarios();
      const index = usuarios.findIndex((u) => u.id === this.currentUser.id);

      if (index === -1) {
        throw new Error("Usuario no encontrado");
      }

      // Actualizar datos
      usuarios[index] = { ...usuarios[index], ...userData };
      localStorage.setItem("usuarios", JSON.stringify(usuarios));

      // Actualizar sesión actual
      this.setCurrentUser(usuarios[index]);

      return { success: true, usuario: usuarios[index] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Instancia global
const auth = new AuthManager();
export default auth;
