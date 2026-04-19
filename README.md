# Gubun

Sitio web profesional de herramientas para Windows y scripts para desarrollo de videojuegos.

## Descripción

Gubun es una plataforma que reúne utilidades profesionales para Windows y scripts de calidad para motores de juegos como Unity, Unreal Engine y Godot. Ahora con base de datos Supabase para estadísticas en tiempo real, autenticación de usuarios y tracking de descargas.

## Estructura del Proyecto

```
/
├── index.html              # Página principal
├── herramientas/           # Catálogo de herramientas Windows
├── scripts/                # Biblioteca de scripts
├── blog/                   # Artículos y tutoriales
├── css/                    # Estilos
│   ├── main.css
│   ├── components.css
│   ├── auth.css           # Estilos de autenticación
│   └── responsive.css
├── js/                     # JavaScript
│   ├── supabase.js        # Cliente Supabase y funciones DB
│   ├── data.js            # Datos locales (fallback)
│   ├── search.js          # Sistema de búsqueda
│   └── main.js            # Funcionalidad principal
├── supabase_schema.sql    # Esquema de base de datos
└── 404.html               # Página de error
```

## Tecnologías

- HTML5 semántico
- CSS3 con variables personalizadas
- JavaScript vanilla (ES6+)
- [Supabase](https://supabase.com) - Backend as a Service
- [Render](https://render.com) - Hosting estático
- Diseño responsive (mobile-first)

## Características

- **Herramientas Windows**: Catálogo con filtros por categoría y ordenamiento
- **Scripts GameDev**: Código para Unity, Unreal Engine, Godot con preview modal
- **Sistema de búsqueda**: Búsqueda global y filtros locales
- **Autenticación**: Registro e inicio de sesión con Supabase Auth
- **Estadísticas en tiempo real**: Conteo real de visitas, descargas y likes
- **Diseño responsive**: Optimizado para todos los dispositivos
- **Tema oscuro**: Interfaz moderna para desarrolladores

## Configuración de Supabase

### 1. Crear Proyecto
- Ir a [supabase.com](https://supabase.com) y crear cuenta
- Crear nuevo proyecto (gratis)
- Guardar URL y anon key

### 2. Configurar Base de Datos
- Ir al SQL Editor de Supabase
- Copiar y ejecutar el contenido de `supabase_schema.sql`
- Esto creará las tablas: `tools`, `scripts`, `downloads`, `views`, `likes`

### 3. Actualizar Credenciales
Editar `js/supabase.js` con tus credenciales:
```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key';
```

## Deploy en Render

### Método 1: GitHub + Render (Recomendado)

1. **Subir a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/Gubun507/Gubun.git
   git push -u origin main
   ```

2. **Configurar en Render**:
   - Ir a [render.com](https://render.com) y crear cuenta
   - Click en "New +" → "Static Site"
   - Conectar repositorio de GitHub
   - Configuración:
     - **Build Command**: (dejar vacío)
     - **Publish Directory**: `/` (raíz)
   - Click "Create Static Site"

3. **El sitio se desplegará automáticamente** en una URL tipo `https://gubun.onrender.com`

### Método 2: Deploy Manual

1. Comprimir todos los archivos en un `.zip`
2. En Render, seleccionar "Upload" en lugar de GitHub
3. Subir el archivo ZIP

## Desarrollo Local

Simplemente abre `index.html` en tu navegador, o usa un servidor local:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

## Personalización

### Datos Estáticos vs Supabase

El sitio funciona en **modo híbrido**:
- **Con Supabase**: Usa la base de datos para herramientas, scripts y estadísticas en tiempo real
- **Sin Supabase**: Usa los datos estáticos de `js/data.js` como fallback

### Modo Offline
Si Supabase no está disponible, el sitio automáticamente usa los datos locales de `js/data.js`.

### Agregar nuevos datos en Supabase

Desde el Dashboard de Supabase → Table Editor:

1. **Herramientas**: Tabla `tools`
   - Campos: `name`, `category`, `description`, `tags`, `icon`, `link`, `featured`

2. **Scripts**: Tabla `scripts`
   - Campos: `name`, `engine`, `language`, `description`, `tags`, `icon`, `code`, `featured`

## API de Supabase

El archivo `js/supabase.js` expone el objeto `GubunDB` con métodos:

```javascript
// Obtener herramientas
const tools = await GubunDB.getTools('sistema');

// Obtener scripts
const scripts = await GubunDB.getScripts('unity', 'csharp');

// Buscar
const results = await GubunDB.search('player');

// Registrar descarga
await GubunDB.recordDownload(toolId, 'tool');

// Registrar vista
await GubunDB.recordView(toolId, 'tool');

// Dar/quitar like
await GubunDB.toggleLike(toolId, 'tool');

// Autenticación
await GubunDB.signUp(email, password);
await GubunDB.signIn(email, password);
await GubunDB.signOut();
const user = await GubunDB.getCurrentUser();
```

## Licencia

Todos los derechos reservados © 2026 Gubun
