# LaurAna - Tienda de Abarrotes

Web App de gestión para tienda de abarrotes, conectada a Google Sheets mediante Google Apps Script.

## Requisitos

- Node.js 18+ 
- npm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Producción

```bash
npm run build
npm start
```

## Estructura de Vistas

| Ruta | Rol | Descripción |
|------|-----|-------------|
| `/` | Público | Catálogo de productos |
| `/senior` | Papá | Dashboard, ventas, alertas |
| `/admin` | Luis | Escáner, facturas, vencimientos |
| `/ayuda` | Todos | Manual interactivo |

## Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Rosa Pastel | `#FFEBEE` | Fondo general |
| Lila Lavanda | `#D1A7E1` | Navegación, iconos |
| Rosa Intenso | `#F06292` | Botones, acciones |
| Negro Carbón | `#1A1A1A` | Texto |
| Éxito | `#66BB6A` | Estados positivos |
| Aviso | `#FFD54F` | Advertencias |
| Error | `#EF5350` | Errores, alertas |

## Google Drive - Imágenes

Las imágenes de Google Drive se convierten automáticamente:

- **Link normal:** `https://drive.google.com/file/d/ID/view`
- **Link web:** `https://lh3.googleusercontent.com/u/0/d/ID`

Si una imagen falla, se usa una imagen por defecto.

## Apps Script

URL del endpoint: `https://script.google.com/macros/s/AKfycbzVoOt1ho2uHnGPzzze9kIIkvxjk5oVh47ZKjUEyUfV-Mqe1XWFONpDeBemtOkpHVKfCw/exec`

Endpoints usados:
- `GET ?action=getProductos`
- `GET ?action=getVentasResumen`
- `GET ?action=getProductosPorVencer&days=15`
- `POST action=registrarVenta`
- `POST action=registrarLote`
