# PIAGET AI · Plataforma educativa integral

SaaS minimalista y futurista que centraliza **Gestión Académica, Administrativa,
Finanzas, CRM y Admisiones, Comunicación, Business Intelligence e Inteligencia
Artificial** en una sola interfaz.

La aplicación funciona en **dos modos**:

| Modo | Cuándo | Persistencia |
|------|--------|--------------|
| **Local** | `config.js` vacío | `localStorage` del navegador (ideal para demo) |
| **Supabase** | `config.js` con llaves | Base de datos PostgreSQL en la nube + tiempo real |

Cada módulo es funcional: crear / editar / eliminar estudiantes, mover prospectos
por el funnel, conciliar pagos, publicar comunicados, activar agentes de IA, etc.
Todos los cambios se guardan.

---

## 1. Backend — Supabase

1. Crea un proyecto en <https://supabase.com>.
2. Abre **SQL Editor → New query**, pega el contenido de
   [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
   Esto crea las tablas, habilita *realtime*, define las políticas de la demo y
   carga datos de ejemplo.
3. Ve a **Project Settings → API** y copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   *(Nunca uses la `service_role` en el frontend.)*

> Las políticas RLS incluidas son **permisivas** (acceso anónimo) para que la demo
> funcione sin login. Para producción, sustitúyelas por políticas basadas en
> `auth.uid()` y roles (hay un ejemplo comentado al final del `schema.sql`).

### Conectar la app
Edita `config.js`:
```js
window.PIAGET_CONFIG = {
  supabaseUrl: "https://TUPROYECTO.supabase.co",
  supabaseKey: "eyJhbGciOi...tu_anon_key",
  realtime: true
};
```
Al recargar, el indicador del topbar pasará de **Local** a **Supabase** y los
datos vendrán de tu base. Si abres la app en dos pestañas, los cambios se
sincronizan en vivo.

### Inicio de sesión (autenticación real)
La plataforma está protegida por una **pantalla de acceso**. El esquema crea la
tabla `app_accounts` (contraseñas cifradas con **bcrypt** vía `pgcrypto`) y la
función `fn_login`, que valida credenciales **sin exponer el hash** (la tabla
tiene RLS sin políticas, así que la llave anon no puede leerla).

- **Modo Supabase** (`config.js` con llaves): el login valida con `fn_login`.
  Administra las cuentas en la tabla `app_accounts`. El `schema.sql` ya incluye
  cuentas de ejemplo — **cámbialas antes de producción**:
  | Perfil | Usuario | Contraseña |
  |--------|---------|------------|
  | Dirección | `direccion@jeanpiaget.mx` | `Direccion2026` |
  | Docente | `docente@jeanpiaget.mx` | `Docente2026` |
  | Familia | `familia.hernandez@jeanpiaget.mx` | `Hernandez2026` |
  | Estudiante | `diego.hernandez5a` | `Alumno2026` |
- **Modo local** (sin llaves): valida contra las cuentas del navegador
  (usuarios de Configuración, familias, docentes y accesos de alumnos) — ideal
  para demo. La pantalla muestra un botón con credenciales de ejemplo.

Para dar de alta una cuenta nueva en Supabase:
```sql
insert into app_accounts (kind, name, email, role, vista, password_hash)
values ('Staff','Nombre','correo@jeanpiaget.mx','Dirección','home',
        crypt('SuContraseña', gen_salt('bf')));
```

---

## 2. Repositorio — GitHub

```bash
# en la carpeta del proyecto
git init
git add .
git commit -m "PIAGET AI — primera versión"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/piaget-ai.git
git push -u origin main
```

> La página de entrada ya es **`index.html`** (el sitio público del colegio, con
> el login). La plataforma vive en **`plataforma.html`** y se abre desde el login
> del `index.html`. Todos los archivos se referencian con rutas relativas, así que
> no necesitas cambiar nada más.

---

## 3. Despliegue — Vercel

1. Entra a <https://vercel.com> → **Add New → Project** → importa tu repo de GitHub.
2. **Framework Preset:** *Other* (es un sitio estático, sin build step).
3. En **Environment Variables** agrega (opcional, si prefieres no poner las llaves
   en `config.js`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   y descomenta el bloque correspondiente al inicio de `config.js`.
4. **Deploy.** Vercel publica el sitio en `https://piaget-ai.vercel.app`.
   El archivo [`vercel.json`](vercel.json) ya define rutas limpias y cabeceras de
   seguridad básicas.

Cada `git push` a `main` despliega automáticamente una nueva versión.

---

## 4. Facturación con valor fiscal — Facturama (PAC)

El módulo **Administración → Facturas** emite CFDI 4.0 con **complemento IEDU**
(instituciones educativas: nombre del alumno, CURP, nivel y CCT/RVOE). Funciona en
dos modos:

| Modo | Cuándo | Timbrado |
|------|--------|----------|
| **Demo** | sin backend / sin credenciales | Simulado (UUID y sellos ficticios, **sin valor fiscal**) |
| **Real** | funciones desplegadas + variables de entorno | Timbrado real vía **Facturama**, con valor fiscal |

### Backend (Vercel Serverless Functions)
Las funciones viven en [`api/facturama/`](api/facturama):

```
api/facturama/health.js   GET   ¿backend configurado?
api/facturama/csd.js      POST  carga del CSD del emisor (multiemisor)
api/facturama/cfdi.js     POST  crea + timbra el CFDI (mapea el payload a Facturama)
api/facturama/file.js     GET   descarga PDF / XML por id
api/facturama/cancel.js   POST  cancela un CFDI
api/_lib/facturama.js     util compartida (no es ruta)
```

El frontend nunca habla con Facturama directamente: envía un *payload neutro* a
`/api/facturama/*` y el backend agrega las credenciales y el contrato exacto de
Facturama. **La API key y el CSD nunca quedan en el navegador.**

### Variables de entorno (Vercel → Project → Settings → Environment Variables)
```
FACTURAMA_USER       usuario de tu cuenta API de Facturama
FACTURAMA_PASSWORD   contraseña de la cuenta API
FACTURAMA_ENV        sandbox  (o prod para producción)
```
> Emisor del colegio: **CORPORATIVO JEAN PIAGET · RFC CJP950815CH6 · 626 RESICO ·
> C.P. 54930**. El CSD se carga una sola vez desde *Configuración fiscal* (modalidad
> API Multiemisor → `/api-lite/csds`). Para producción necesitas comprar **folios de
> API** en Facturama y usar el CSD real del emisor.

### Activar el modo real
1. Despliega el proyecto en Vercel (las funciones `/api` se publican solas).
2. Agrega las 3 variables de entorno y vuelve a desplegar.
3. Abre **Facturas → chip de estado → Configuración fiscal**: el panel mostrará
   *“Backend de timbrado conectado · valor fiscal”*. Carga el CSD y timbra.

`config.js` → `facturacionApiBase` se deja en `""` (mismo dominio del deploy).

---

## Estructura del proyecto

```
index.html            Sitio público del colegio + login (página de entrada)
plataforma.html       App de la plataforma (se abre tras iniciar sesión)
config.js             Llaves de Supabase (modo local si está vacío)
store.js              Capa de datos (localStorage ⇄ Supabase + realtime)
styles.css            Sistema de diseño (tokens, componentes)
icons.jsx             Set de iconos de línea
components.jsx        Primitivas UI + charts en SVG
ui_kit.jsx            Modales, formularios, toasts
data.jsx             Datos semilla / valores por defecto
views_*.jsx           Cada módulo (dashboard, académico, finanzas, crm, etc.)
copilot.jsx           Asistente de IA (drawer + página de agentes)
app.jsx               Shell: navegación, routing, tweaks
tweaks-panel.jsx      Panel de variaciones visuales
supabase/schema.sql   Esquema + seed de la base de datos
vercel.json           Configuración de despliegue
```

## Notas técnicas

- **Sin build step:** el frontend usa React + Babel desde CDN, así que se
  despliega como sitio estático. Para producción de alto tráfico conviene
  precompilar (migrar a Vite/Next), pero no es necesario para empezar.
- **IA / Copilot:** las respuestas del asistente son simuladas. Para IA real,
  conecta la capa del Copilot a tu proveedor (OpenAI, Anthropic, etc.) mediante
  una *Edge Function* de Supabase o una *Serverless Function* de Vercel — así la
  llave del modelo nunca queda expuesta en el cliente.
- **Datos:** el botón *Reiniciar demo* (panel de Tweaks) restablece los datos
  semilla en modo local.
