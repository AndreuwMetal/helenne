# Helenne

Tienda web de [helenne.es](https://helenne.es): estuches y neceseres cosidos a mano.
Los pedidos se cierran por WhatsApp, así que no hay servidor: la web es una
aplicación React que se compila a archivos estáticos.

## Puesta en marcha

Requisitos: Node 20 o superior.

```bash
npm install
npm run dev       # servidor de desarrollo en http://localhost:5173
npm test          # pruebas (Vitest)
npm run lint      # oxlint
npm run build     # compila a dist/ (incluye 404.html para las rutas)
npm run preview   # sirve dist/ en local
```

## Estructura

```
src/
  main.tsx            arranque de React
  App.tsx             rutas y providers
  pages/              una página por ruta
    HomePage          portada
    ShopPage          /tienda
    CollectionPage    /accesorios, /ropa, /ceramica
    CustomPage        /personalizar
    NotFoundPage      cualquier otra dirección
  components/
    layout/           cabecera, pie, menú móvil, buscador, idioma
    story/            portada narrada: escena fija y coreografía del scroll
                      (storyAnimation.ts, claves en services/timeline.ts)
    product/          secuencias de fotogramas, pieza que gira, tarjeta y galería
    cart/             panel del carrito
    providers/        estado global: idioma y carrito (contexto + hook)
    ui/               piezas genéricas: botones y panel lateral
  services/           lógica sin React
    catalog.ts        productos y colecciones (fuente única de datos)
    cart.ts           operaciones del carrito (probadas en cart.test.ts)
    whatsapp.ts       enlaces y mensajes de pedido
    i18n.ts           textos en español e inglés
    search.ts         buscador
    timeline.ts       interpolación de la animación (probada en timeline.test.ts)
    format.ts         precios
    storage.ts        localStorage seguro
  styles/             variables de diseño y estilos base
public/
  frames/<modelo>/    secuencias de giro (generadas, ver abajo)
  img/products/       fotos de cada modelo
  CNAME               dominio de GitHub Pages
tools/frames/         generador de las secuencias de giro
```

Cada componente lleva su hoja de estilos al lado (`*.module.css`).

## Añadir o cambiar un producto

1. Edita `src/services/catalog.ts`: nombre, precio en céntimos (`null` si aún
   no se vende), fotos y número de fotogramas.
2. Copia las fotos a `public/img/products/<modelo>/` (`1.jpg`, `2.jpg`… y `thumb.jpg`).
3. Genera su secuencia de giro (siguiente apartado).

La portada, la tienda, el buscador y el carrito leen del catálogo: no hay que
tocar nada más.

## Secuencias de giro

Las piezas que giran son fotogramas recortados de los vídeos de producto.
El recorte usa Vision de macOS, así que el generador solo funciona en un Mac
(macOS 14 o superior) con `ffmpeg`, `jq` y `uv`.

1. Deja los vídeos en `videos/` (no se suben al repositorio).
2. En `tools/frames/products.json`, indica para cada modelo el vídeo y los
   tramos **sin manos** en segundos.
3. Ejecuta `npm run frames` (o `npm run frames -- hada` para uno solo).
4. Actualiza `frames` en el catálogo con el número de archivos generados.

Para un giro completo de 360°, graba la pieza sola en un plato giratorio,
con fondo liso y buena luz: el recorte sale mucho más limpio.

## Publicación

`.github/workflows/deploy.yml` compila y publica en GitHub Pages cada vez que
se sube algo a `main`. En *Settings → Pages* el origen debe ser
**GitHub Actions**.
