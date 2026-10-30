// Build de producción (GitHub Pages). La API sigue en localhost porque durante
// la demo el backend se ejecuta en la PC del usuario junto con MongoDB.
export const environment = {
  produccion: true,
  apiUrl: 'http://localhost:3000/api',
} as const;
