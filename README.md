# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Estructura de Carpetas

- `src/components/`: Aquí van todos los componentes reutilizables como Navbar, SidebarItem, etc.
- `src/assets/`: Imágenes y recursos estáticos.

## Agregar un nuevo componente

1. Crea el archivo en `src/components/`.
2. Expórtalo en `src/components/index.js` para facilitar los imports.

## Navbar

El Navbar está construido con React y TailwindCSS, siguiendo el diseño solicitado. Puedes personalizar los íconos o agregar rutas según sea necesario.
