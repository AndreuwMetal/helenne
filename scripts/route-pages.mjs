// GitHub Pages solo conoce archivos: sin una copia de index.html por ruta,
// /accesorios respondería con 404 (aunque la app se viera) y Google no la indexaría.
// Pages sirve /accesorios desde accesorios.html; las direcciones antiguas
// (/tienda.html…) usan el mismo archivo y la app las redirige.
import { copyFileSync } from 'node:fs'

const routes = ['tienda', 'accesorios', 'ropa', 'ceramica', 'personalizar']

for (const route of routes) copyFileSync('dist/index.html', `dist/${route}.html`)
// cualquier otra dirección: la app muestra «Esta página no existe»
copyFileSync('dist/index.html', 'dist/404.html')
console.log(`páginas creadas: ${routes.join(', ')} y 404`)
