# Gubun

Sitio web profesional de herramientas para Windows y scripts para desarrollo de videojuegos.

## Descripción

Gubun es una plataforma que reúne utilidades profesionales para Windows y scripts de calidad para motores de juegos como Unity, Unreal Engine y Godot.

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
│   └── responsive.css
├── js/                     # JavaScript
│   ├── data.js            # Datos de herramientas/scripts
│   ├── search.js          # Sistema de búsqueda
│   └── main.js            # Funcionalidad principal
└── 404.html               # Página de error
```

## Tecnologías

- HTML5 semántico
- CSS3 con variables personalizadas
- JavaScript vanilla (ES6+)
- Diseño responsive (mobile-first)
- Sin dependencias externas

## Características

- **Herramientas Windows**: Catálogo con filtros por categoría y ordenamiento
- **Scripts GameDev**: Código para Unity, Unreal Engine, Godot con preview modal
- **Sistema de búsqueda**: Búsqueda global y filtros locales
- **Diseño responsive**: Optimizado para todos los dispositivos
- **Tema oscuro**: Interfaz moderna para desarrolladores

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

### Agregar nuevas herramientas
Editar `js/data.js` en la sección `tools`:

```javascript
{
    id: "tool-x",
    name: "Nombre",
    category: "sistema",
    description: "Descripción",
    tags: ["Tag1", "Tag2"],
    downloads: 0,
    rating: 5.0,
    icon: "🔧",
    link: "https://...",
    featured: false
}
```

### Agregar nuevos scripts
Editar `js/data.js` en la sección `scripts`:

```javascript
{
    id: "script-x",
    name: "Nombre",
    engine: "unity",
    language: "csharp",
    description: "Descripción",
    tags: ["Tag1"],
    downloads: 0,
    rating: 5.0,
    icon: "🎮",
    code: `código aquí`,
    featured: false
}
```

## Licencia

Todos los derechos reservados © 2025 Gubun
