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
npm run build     # compila a dist/ (con una página por ruta para GitHub Pages)
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
    story/            portada narrada: escena fija y coreografía del scroll;
                      sequenceView.ts dibuja las piezas que tienen fotogramas
                      (storyAnimation.ts, claves en services/timeline.ts)
    three/            modelos 3D (three.js): fichas, forma, telas, despiece y escena
    product/          modelo 3D interactivo, tarjeta y galería
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
  seq/<pieza>/<ancho>/  fotogramas del giro y del despiece (720 y 1280 px)
  textures/           fotos de las telas para los modelos 3D
  img/products/       fotos de cada modelo
  CNAME               dominio de GitHub Pages
scripts/route-pages.mjs  copia index.html para cada ruta al compilar
scripts/sequence/     vídeo de la pieza → fotogramas recortados con su sombra
                      (piece.sh <pieza> <giro.mp4> lo hace todo; revolution.py saca
                      una vuelta en un solo sentido, align.py encaja el despiece)
```

Cada componente lleva su hoja de estilos al lado (`*.module.css`).

## Añadir o cambiar un producto

1. Edita `src/services/catalog.ts`: nombre, precio en céntimos (`null` si aún
   no se vende) y fotos.
2. Copia las fotos a `public/img/products/<modelo>/` (`1.jpg`, `2.jpg`… y `thumb.jpg`).
3. Añade su ficha 3D en `src/components/three/specs.ts` y una imagen fija
   `modelo.png` (ver «Modelos 3D»).

La portada, la tienda, el buscador y el carrito leen del catálogo: no hay que
tocar nada más.

## Modelos 3D

Las piezas son modelos 3D construidos en código con three.js
(`src/components/three/`), no escaneados:

- `specs.ts`: ficha de cada modelo (medidas en cm, forma, tela, forro y
  cremallera). Las medidas están estimadas a partir de los vídeos; con las
  reales basta con cambiar los números.
- `pieceModel.ts`: construye la pieza (neceser o estuche) con sus capas
  separadas (tela, guata, forro), por eso se puede despiezar.
- `fabricTextures.ts`: telas generadas en código (rayas, cuadro) o fotos de la
  tela real (`public/textures/`).
- `modelView.ts`: escena de estudio (luz, sombra, cámara).

Las imágenes fijas `public/img/products/<modelo>/modelo.png` se ven mientras
carga el 3D y como miniatura del Modelo Azul.

## Publicación

`.github/workflows/deploy.yml` compila y publica en GitHub Pages cada vez que
se sube algo a `main`. En *Settings → Pages* el origen debe ser
**GitHub Actions**.
