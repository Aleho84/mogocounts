# MogoCounts 💸

[![Status](https://img.shields.io/badge/status-active-success.svg?style=plastic)](https://github.com/Aleho84/mogocounts)
[![GitHub Version](https://img.shields.io/github/package-json/v/aleho84/mogocounts?style=plastic)](https://github.com/Aleho84/mogocounts)
[![GitHub Issues](https://img.shields.io/github/issues/aleho84/mogocounts?style=plastic)](https://github.com/Aleho84/mogocounts/issues)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/aleho84/mogocounts?style=plastic)](https://github.com/Aleho84/mogocounts/commits/main/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=plastic)](/LICENSE)

**MogoCounts** es una aplicación web moderna y robusta diseñada para facilitar la gestión de gastos compartidos en grupos de amigos, familias o compañeros de viaje. Permite llevar un registro detallado de quién pagó qué y calcular automáticamente las deudas para simplificar los saldos finales.

## 🚀 Características Principales

-   **Gestión de Grupos**: Crea grupos ilimitados con múltiples participantes.
-   **Registro de Gastos**: Agrega gastos especificando el pagador y los involucrados.
-   **Balance Simplificado**: Algoritmo inteligente que calcula la forma más eficiente de saldar las deudas (quién le debe a quién).
-   **Interfaz Premium**: Diseño visual atractivo y responsivo ("Mobile First"), construido con TailwindCSS y animaciones fluidas (Framer Motion).
-   **Modo Oscuro**: Interfaz optimizada para bajo consumo y comodidad visual.
-   **Soporte Docker**: Lista para desplegar en contenedores, optimizada para arquitectura ARM (Raspberry Pi).

## 🛠️ Tecnologías Utilizadas

El proyecto sigue una arquitectura **MERN** (Mongo, Express, React, Node) dockerizada:

### Frontend (`/client`)
-   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Estilos**: [TailwindCSS v4](https://tailwindcss.com/)
-   **Estado Global**: [Zustand](https://github.com/pmndrs/zustand) con persistencia local.
-   **UI/Iconos**: [Lucide React](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/) (Toasts).
-   **Animaciones**: [Framer Motion](https://www.framer.com/motion/).
-   **Servidor Web**: Nginx (Proxy Inverso + SSL).

### Backend (`/server`)
-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Framework**: [Express](https://expressjs.com/)
-   **Base de Datos**: [MongoDB](https://www.mongodb.com/) (Drivers Mongoose).
-   **Validación**: Express-Validator.

### Infraestructura
-   **Contenedores**: Docker & Docker Compose.
-   **Base de Datos**: Imagen `mongo:4.4.18` (Compatible con Raspberry Pi 4).
-   **Seguridad**: HTTPS habilitado con certificados (soporte para Certbot montado).

## 📂 Estructura del Proyecto

```
mogocounts/
├── client/                 # Código fuente del Frontend
│   ├── src/                # Componentes, Páginas, Store
│   ├── public/             # Assets estáticos (logo, etc)
│   ├── nginx.conf          # Configuración de Nginx (Proxy/SSL)
│   ├── Dockerfile          # Construcción de imagen Cliente
│   └── vite.config.js      # Configuración de Vite (Proxy dev)
├── server/                 # Código fuente del Backend API
│   ├── models/             # Esquemas de Mongoose
│   ├── routes/             # Endpoints de la API
│   ├── Dockerfile          # Construcción de imagen Servidor
│   └── server.js           # Punto de entrada
├── data/db/                # Persistencia de MongoDB (generado al correr)
├── docker-compose.yml      # Orquestación de servicios
└── README.md               # Documentación del proyecto
```

## ⚡ Instalación y Ejecución

### 1. Desarrollo Local

Necesitarás tener instalado Node.js y MongoDB localmente (o cambiar la URI en `.env`).

**Backend:**
```bash
cd server
npm install
npm run dev
# Corre en http://localhost:5000
```

**Frontend:**
```bash
cd client
npm install
npm run dev
# Corre en http://localhost:5173
```
*Nota: El frontend en desarrollo usa un proxy en `vite.config.js` para redirigir `/api` al backend local.*

### 2. Despliegue con Docker (Raspberry Pi / Producción)

El proyecto está configurado para levantar todo el stack con un solo comando.

**Requisitos:** Docker y Docker Compose.

1.  Clona el repositorio en tu servidor/Raspberry Pi.
2.  (Opcional) Si tienes certificados SSL de Certbot, asegúrate que las rutas en `docker-compose.yml` coincidan con tus archivos `.pem`.
3.  Ejecuta:

```bash
docker-compose up -d --build
```

La aplicación estará disponible en:
-   **Web**: `https://<TU-IP-O-DOMINIO>`
-   **API**: `https://<TU-IP-O-DOMINIO>/api`

#### Configuración de Variables de Entorno
El archivo `docker-compose.yml` maneja las variables principales.
-   **Frontend**: Asegúrate de que `client/.env` tenga `VITE_API_URL=/api` para que las peticiones pasen por el proxy relativo de Nginx.

## 🔒 Certificados SSL

El proyecto espera certificados en `/etc/nginx/certs` dentro del contenedor cliente.
-   **Por defecto**: El `Dockerfile` del cliente genera certificados autofirmados ("localhost") para que HTTPS funcione "out of the box".
-   **Producción (Certbot)**: Edita `docker-compose.yml` para montar tus certificados reales (LetsEncrypt) como volúmenes:

```yaml
volumes:
  - /path/to/fullchain.pem:/etc/nginx/certs/server.crt:ro
  - /path/to/privkey.pem:/etc/nginx/certs/server.key:ro
```

## 📄 Licencia

Este proyecto es propiedad de **Alejandro Abraham**.
