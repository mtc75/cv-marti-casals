# CV de Martí Casals Caro — web modular + editor de contenido

CV multilingüe (CA / ES / EN) en HTML/CSS/JS, **sin paso de build**, pensado para
publicarse gratis en **GitHub Pages** y editarse sin tocar código mediante un
panel (**Sveltia CMS**, compatible con Decap).

## Estructura

```
.
├── index.html            # Plantilla modular (contenedores vacíos + logos SVG)
├── cvstyle.css           # Diseño (no se toca para editar contenido)
├── js/render.js          # Lee content/*.json y monta cada sección
├── content/              # ← TODO el contenido editable vive aquí
│   ├── perfil.json
│   ├── competencias.json
│   ├── experiencia.json
│   ├── educacion.json
│   ├── certificados.json
│   ├── idiomas.json
│   └── licencias.json
├── admin/                # Panel de edición
│   ├── index.html
│   └── config.yml        # ← CAMBIAR OWNER/REPO aquí
└── EDITAR BE.html        # Versión original monolítica (referencia/copia de seguridad)
```

Cada texto traducible se guarda como `{ "en": …, "ca": …, "es": … }`. El cambio de
idioma de la web es instantáneo (CSS), no recarga nada.

## Ver el CV en local

`fetch()` no funciona abriendo el archivo con doble clic (`file://`). Levanta un
servidor estático (cualquiera sirve):

```bash
cd CV_BO
python3 -m http.server 8765
# abre http://localhost:8765/index.html
```

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (público para Pages gratis) y sube estos archivos.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   rama `main`, carpeta `/ (root)`. Guarda.
3. En 1–2 min tendrás la URL pública (`https://USUARIO.github.io/REPO/`).
   Esa es la que puedes enviar a empresas; cualquiera la ve, sin cuenta.
4. (Opcional) Dominio propio en esa misma pantalla de Pages.

## Activar el editor para Martí (Sveltia CMS)

> ⚠️ **Corrección importante:** con alojamiento **solo en GitHub**, el botón
> *"Login with GitHub"* necesita **una pieza de autenticación** (GitHub no permite
> login sin un intermediario). Es gratis y de configuración única. Tienes dos vías:

### Opción A — "Login with GitHub" (recomendada)
Requiere un pequeño *worker* gratuito de Cloudflare (lo monta el desarrollador una vez):

1. Crea una **GitHub OAuth App** (Settings → Developer settings → OAuth Apps).
2. Despliega el worker oficial **[sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth)**
   en Cloudflare Workers (plan gratuito) con el Client ID/Secret de la OAuth App.
3. En `admin/config.yml`, bajo `backend`, añade:
   ```yaml
   base_url: https://TU-WORKER.workers.dev
   ```
4. Da acceso a Martí como **colaborador** del repositorio (Settings → Collaborators).
   Martí entra en `…/admin/`, pulsa *Login with GitHub* y edita.

### Opción B — Token personal (sin worker)
Sveltia permite autenticarse con un **Personal Access Token** de GitHub. No requiere
worker, pero Martí debe generar y pegar un token (más casero). Útil para empezar rápido.

### Probar el editor en local (sin desplegar nada)
`config.yml` ya tiene `local_backend: true`. Con el repo clonado:
```bash
npx @sveltia/cms-proxy-server   # en una terminal
python3 -m http.server 8765     # en otra
# abre http://localhost:8765/admin/
```
Edita, guarda, y los cambios se escriben directamente en `content/*.json`.

## Cómo funciona la publicación

Martí edita en `…/admin/` → Sveltia hace *commit* en GitHub → GitHub Pages
republica la web automáticamente. **No hay paso de build ni GitHub Actions.**

## Notas / pendientes antes de publicar

- **Datos de ejemplo a sustituir:** teléfono `+34 123 45 67 89`, email
  `042857x@gmail.com`, nº de carnet `0000ABC`. Cámbialos por los reales (desde el panel).
- **Logotipos Cambridge** (CCEA/OFQUAL/QualWhales) van incrustados como SVG en
  `index.html`; los de catalán (C2) son marcadores de color de relleno.
- La web carga Font Awesome 7 desde CDN (requiere conexión).
```
