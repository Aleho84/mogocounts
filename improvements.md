# Análisis y Propuestas de Mejora: MogoCounts

Tras revisar la estructura y el código del proyecto, he identificado varias oportunidades de mejora clasificadas por área de impacto.

## 1. Seguridad 🔒

### Críticas
-   **Ausencia de Autenticación Real**: Actualmente, el acceso a los grupos se basa únicamente en conocer el `ID` del grupo. Si bien los `ObjectIDs` de Mongo son difíciles de adivinar, no es un mecanismo seguro. Cualquiera con el enlace tiene control total (puede borrar, editar, ver).
-   **Políticas CORS Permisivas**: El backend tiene habilitado CORS para todos (`app.use(cors())`). Debería restringirse en producción a solo los dominios autorizados.
-   **Falta de Rate Limiting**: No hay protección contra ataques de fuerza bruta o DDOS en la API.

### Propuestas
-   **Implementar Auth (JWT/NextAuth)**: Permitir que los usuarios se registren y sean "dueños" de los grupos. O al menos, agregar una opción de "Contraseña de Grupo" opcional para proteger el acceso.
-   **Security Headers (Helmet)**: Implementar `helmet` en Express para configurar headers HTTP seguros (HSTS, No-Sniff, etc.).
-   **Rate Limiting**: Agregar `express-rate-limit` para limitar peticiones por IP.

## 2. Experiencia de Usuario (UI/UX) 📱

### Críticas
-   **Dependencia de conexión**: Si se pierde la conexión, la app podría fallar al cargar. No hay soporte "Offline" real.
-   **Feedback Visual**: Se usa `sonner` (toasts), lo cual es bueno, pero faltan estados de "Carga" (Skeletons) más detallados en algunas vistas.

### Propuestas
-   **PWA (Progressive Web App)**: Configurar Vite PWA Plugin. Esto permitiría a los usuarios "instalar" la app en su celular, tener icono en el home, y (potencialmente) ver datos cacheados sin internet.
-   **Mejores Skeletons**: Implementar esqueletos de carga que imiten la estructura de la lista de gastos para reducir el "Layout Shift".
-   **Internacionalización (i18n)**: Preparar la app para múltiples idiomas, no solo español hardcodeado.

## 3. Calidad de Código y Arquitectura 🏗️

### Backend
-   **Separación de Responsabilidades**: Los controladores están definidos dentro de los archivos de ruta (`routes/groups.js`).
    *   *Mejora*: Mover la lógica a `controllers/groupController.js` y dejar las rutas solo para definición de endpoints.
-   **Manejo de Errores Global**: Se usan `try/catch` en cada controlador.
    *   *Mejora*: Implementar un middleware global de manejo de errores para evitar repetición de código.
-   **Validación**: Se usa `express-validator` (bien), pero las reglas están en la ruta. Podrían moverse a archivos de validación separados.

### Frontend
-   **Testing**: No hay tests automatizados.
    *   *Mejora*: Integrar **Vitest** + **React Testing Library** para pruebas unitarias de componentes críticos (cálculo de deudas, store).
-   **TypeScript**: El proyecto está en JavaScript. Migrar a **TypeScript** daría mucha más robustez y evitaría errores de tipos en tiempo de ejecución (especialmente con los objetos de gastos y grupos).

## 4. Funcionalidades Potenciales ✨

-   **Exportación**: Permitir exportar el resumen de gastos a PDF o Excel.
-   **Categorías**: Agregar iconos/categorías a los gastos (Comida, Transporte, Hospedaje) para ver gráficos de gastos por rubro.
-   **Moneda Múltiple**: Soporte real para gastos en diferentes monedas dentro del mismo grupo (con conversión automática o manual).

## Plan de Acción Recomendado

Sugiero comenzar por este orden de prioridad:

1.  **Refactor Server (Mvc)**: Separar rutas de controladores (fácil y mejora mantenibilidad).
2.  **Seguridad Básica**: Helmet + Rate Limit.
3.  **PWA**: Convertir la web en instalable (gran valor para el usuario final móvil).
4.  **TypeScript**: Migración progresiva (a largo plazo).
