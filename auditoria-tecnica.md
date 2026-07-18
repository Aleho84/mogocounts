# Auditoría técnica — MogoCounts

> Fecha: 2026-06-21 · Rama: `main` · Commit base: `8f8ffaa`
> Stack: MERN dockerizado (React 19 + Vite / Express 4 + Mongoose 7 / MongoDB 4.4)
> Alcance: 51 archivos versionados (client + server + infra). Auditoría de lectura,
> sin cambios en el código.

## Resumen ejecutivo

MogoCounts es un proyecto **pequeño, limpio y bien organizado** para su tamaño: la
separación en `routes / models / utils / middleware`, el envoltorio de respuestas
(`ApiResponse`), el manejador de errores centralizado, la validación con
`express-validator`, el uso de `helmet` + rate limiting y el cacheo del cálculo de
deudas muestran criterio. El frontend es moderno (React 19, Zustand con
persistencia, Tailwind v4, PWA) y la UX está cuidada.

Sin embargo, **no es apto para producción tal como está**, y el README lo presenta
como "moderno y robusto" / "listo para desplegar". Los riesgos serios son:

1. **No existe control de acceso alguno.** El `_id` del grupo (un ObjectId de
   Mongo, parcialmente predecible) es la única "credencial". Cualquiera que vea o
   adivine ese id tiene lectura/escritura/borrado total y permanente sobre el
   grupo. No hay forma de revocar el acceso.
2. **El dinero se maneja como punto flotante** (`amount: Number`, divisiones
   `amount / involved.length`). En una app cuyo *core* es repartir plata, esto
   produce errores de redondeo acumulables. — ✅ **RESUELTO (2026-06-28):** migrado a
   centavos enteros de punta a punta.
3. **Higiene de secretos y de build floja**: `server/.env` y `client/.env` están
   versionados (hoy sin secretos reales, pero es una fuga garantizada a futuro), y
   los `Dockerfile` hacen `COPY . .` sin `.dockerignore`, metiendo el `.env` dentro
   de la imagen.

Ninguno es difícil de corregir. Hay además varios *quick wins* (sanitización con
`.escape()` que **corrompe los datos**, validaciones de monto faltantes, caché que
no se invalida al tocar participantes, copy ofensivo en la UI) que conviene atacar
ya.

**Veredicto:** base sólida y prolija para un proyecto personal / beta. El manejo de
dinero frágil (hallazgo 2) ya fue **corregido** (ahora se opera en centavos enteros);
queda como bloqueante principal el modelo de seguridad inexistente (hallazgo 1) antes
de cualquier uso real.

---

## Estado de remediación

Trazabilidad de los hallazgos. Se actualiza a medida que se resuelven.

| # | Hallazgo | Sev. | Estado |
|---|----------|------|--------|
| 1 | Sin autenticación/autorización (ObjectId como credencial) | 🔴 | ⬜ Pendiente |
| 2 | Dinero como punto flotante | 🔴 | ✅ **Resuelto (2026-06-28)** |
| 3 | `.env` versionados / sin `.dockerignore` | 🟠 | ⬜ Pendiente |
| 4 | `.escape()` corrompe datos en la entrada | 🟠 | ⬜ Pendiente |
| 5 | Caché de deudas no se invalida con participantes | 🟡 | ⬜ Pendiente |
| 6 | Validación de dominio en gastos | 🟡 | 🟨 Parcial — monto ya validado (`isInt > 0`); falta `payer`/`involved` ∈ participantes |
| 7 | `trust proxy` sin configurar tras Nginx | 🟡 | ⬜ Pendiente |
| 8 | El server arranca aunque MongoDB no conecte | 🟡 | ⬜ Pendiente |
| 9 | Testing prácticamente ausente | 🟡 | 🟨 Parcial — suite de `simplifyDebts` + `npm test`; script manual movido a `scripts/` |
| 10 | Deriva de docs/branding | 🟢 | ⬜ Pendiente |
| 11 | Copy no profesional/ofensivo | 🟢 | 🟨 Parcial — 1 de 3 mensajes neutralizado (colateral del hallazgo 2) |

**Convenciones:** ✅ Resuelto · 🟨 Parcial · ⬜ Pendiente.

---

## Hallazgos críticos (priorizados)

### 🔴 1. No hay autenticación ni autorización — el ObjectId del grupo es la única "credencial"

**Dónde:** todas las rutas de [server/routes/groups.js](server/routes/groups.js) y
[server/routes/expenses.js](server/routes/expenses.js). Ninguna tiene middleware de
auth.

El diseño es "sin registro" (legítimo, como un Google Doc "con el link alcanza"),
pero está mal instrumentado:

- El "secreto" es un **ObjectId de Mongo**, que **no es aleatorio criptográfico**:
  contiene timestamp + identificador de máquina + contador incremental. Es
  parcialmente predecible/enumerable, así que no sirve como credencial.
- No hay noción de propietario ni de permisos: cualquiera con el id puede
  `PUT /groups/:id` (renombrar), `DELETE /groups/:id/participants` (echar gente),
  `POST/PUT/DELETE /expenses` (alterar o borrar gastos ajenos).
- El acceso es **permanente e irrevocable**: si el link se filtra (historial,
  referrer, captura, alguien que sale del grupo), no hay forma de cortar el acceso.
- `app.use(cors())` en [server/server.js:23](server/server.js:23) habilita **todos
  los orígenes**, así que cualquier web puede pegarle a la API.

**Por qué importa:** es la diferencia entre "datos privados de un grupo" y "datos
de cualquiera, para cualquiera". Para una app de gastos compartidos —que mezcla
nombres reales y montos— es una exposición de datos personales.

**Cómo se arregla (a alto nivel):**
- Si se mantiene el modelo sin registro: generar un **token de acceso aleatorio**
  por grupo (p. ej. `crypto.randomUUID()` o 32 bytes base64url), guardarlo en el
  documento y exigirlo en cada request (header o segmento de URL). El ObjectId deja
  de ser el secreto. Idealmente, separar token de **lectura** vs **escritura**.
- Restringir CORS a los orígenes conocidos (`cors({ origin: [...] })`).
- A futuro, si crece: identidad real (aunque sea anónima persistente) + ownership.

---

### ✅ 2. El dinero se calcula y almacena como punto flotante — RESUELTO (2026-06-28)

**Dónde:** [server/models/Expense.js:14-17](server/models/Expense.js:14) (`amount: Number`),
y los cálculos en [server/utils/debtGraph.js:21](server/utils/debtGraph.js:21)
(`const splitAmount = amount / involved.length;`) y :73 (`Number(amount.toFixed(2))`).

Repartir `100 / 3` en float da `33.33…` y la suma de las deudas simplificadas puede
no cerrar en cero exacto. El algoritmo usa un epsilon de `0.01` para compensar
([debtGraph.js:50-51, 81-82](server/utils/debtGraph.js:50)), lo cual *enmascara*
pero no elimina la deriva: en grupos con muchos gastos los centavos se pierden o se
duplican, y "Marcar como saldado" puede dejar saldos fantasma de centavos.

**Por qué importa:** la propuesta de valor del producto es calcular bien quién le
debe a quién. Errores de redondeo en plata erosionan la confianza en la app.

**Cómo se arregla:** trabajar en **unidades menores enteras** (centavos): guardar
`amount` como entero de centavos y reformular `simplifyDebts` con enteros,
repartiendo el resto de la división de forma determinista (p. ej. el/los primeros
involucrados absorben el centavo sobrante). Alternativamente, una librería decimal
(`decimal.js` / `dinero.js`). Es un cambio acotado porque toda la lógica vive en un
solo archivo.

> **✅ Resolución (2026-06-28)** — Se adoptó el enfoque de **centavos enteros de punta
> a punta**. La unidad de la API pasó a ser el centavo (entero); la conversión
> pesos↔centavos vive exclusivamente en el frontend, de modo que el backend nunca
> manipula floats: valida enteros, calcula en enteros y devuelve enteros.
>
> **Backend:**
> - [server/utils/debtGraph.js](server/utils/debtGraph.js) — `simplifyDebts`
>   reescrito con aritmética entera y **reparto determinista del resto** (los
>   primeros `remainder` involucrados absorben 1 centavo extra). Se eliminaron los
>   epsilons (`0.01`) y el `toFixed`; los balances suman **exactamente** cero.
> - [server/models/Expense.js](server/models/Expense.js) — `amount` documentado como
>   centavos, con `min: 0` y `validate: Number.isInteger`.
> - [server/routes/expenses.js](server/routes/expenses.js) — validación de `amount`
>   pasó de `isNumeric()` a `isInt({ gt: 0 }).toInt()` (alta y edición). Esto, de
>   paso, cierra el subcaso de montos negativos/cero del hallazgo 6.
> - [server/models/Group.js](server/models/Group.js) — `cachedDebts.amount`
>   documentado como centavos.
>
> **Frontend:**
> - [client/src/lib/money.js](client/src/lib/money.js) (nuevo) — `toCents`,
>   `fromCents`, `formatMoney`: único puente entre presentación (pesos) y
>   almacenamiento (centavos).
> - [client/src/pages/AddExpense.jsx](client/src/pages/AddExpense.jsx) — el input se
>   edita en pesos (`fromCents` al cargar) y se envía en centavos (`toCents` al
>   guardar), con guarda de monto > 0.
> - [client/src/pages/ExpensesList.jsx](client/src/pages/ExpensesList.jsx) y
>   [client/src/pages/BalanceView.jsx](client/src/pages/BalanceView.jsx) — el display
>   usa `formatMoney`.
>
> **Migración de datos:**
> [server/scripts/migrate-amounts-to-cents.js](server/scripts/migrate-amounts-to-cents.js)
> (nuevo, idempotente vía colección `migrations`) convierte los montos existentes
> (pesos→centavos) e invalida las cachés de deudas. Ejecutar **una vez** por base:
> `npm run migrate:cents` desde `server/`.
>
> **Verificación:** [server/utils/debtGraph.test.js](server/utils/debtGraph.test.js)
> (nuevo) — 7 casos con `node:test` (reparto divisible/indivisible, centavo
> indivisible entre 4, gastos cruzados, settlement, vacíos). Corren con `npm test`.
> Build del cliente y suite del server en verde. El script manual `test-settle.js` se
> renombró/movió a `server/scripts/settle-smoke.js` para que no lo levante el runner.

---

## Mejoras recomendadas

### 🟠 3. `.env` versionados y `COPY . .` sin `.dockerignore`

- `server/.env` y `client/.env` están **trackeados** (`git ls-files`), aunque
  `.gitignore` ya los ignora ([.gitignore:26](.gitignore:26)). Hoy `server/.env`
  solo tiene `MONGODB_URI=...localhost...` (verifiqué el historial: nunca hubo un
  secreto real), pero el patrón asegura que el día que `MONGODB_URI` apunte a un
  Atlas con credenciales, esas credenciales terminen en el repo.
- Ningún `Dockerfile` tiene `.dockerignore` y ambos hacen `COPY . .`
  ([server/Dockerfile:9](server/Dockerfile:9),
  [client/Dockerfile:6](client/Dockerfile:6)), así que el `.env` (y `node_modules`
  del host) se copian dentro de la imagen.

**Fix (quick win):**
```bash
git rm --cached server/.env client/.env
# commitear un server/.env.example sin valores reales
```
Agregar un `.dockerignore` en cada servicio con `node_modules`, `.env`, `dist`,
`.git`.

### 🟠 4. `.escape()` sanitiza en la ENTRADA y corrompe los datos guardados

**Dónde:** [server/routes/groups.js:20-21,49,67,86](server/routes/groups.js:20) y
[server/routes/expenses.js:18-21](server/routes/expenses.js:18) — `.escape()` sobre
`title`, `currency`, `name`, `description`, `payer`, etc.

`.escape()` convierte `& < > " '` a entidades HTML **antes de guardar**. Entonces
"Pizza & Cerveza" se guarda como `Pizza &amp; Cerveza`, y un nombre como
`D'Angelo` como `D&#x27;Angelo`. React ya escapa en el render, así que muestra el
texto **literal con las entidades** (el usuario ve `D&#x27;Angelo`). Es un bug de
corrupción de datos visible, no una protección.

**Por qué importa:** los nombres de participantes son claves de matcheo en
`simplifyDebts` (se comparan por string). Si un nombre se guarda escapado en un lado
y no en otro, los balances pueden no cuadrar.

**Fix:** quitar `.escape()` y confiar el escape al render (React ya lo hace).
Mantener `.trim()` / `.notEmpty()` / validaciones de tipo. Escapar en salida solo
si alguna vez se renderiza HTML sin React.

### 🟡 5. La caché de deudas no se invalida al agregar/quitar participantes

**Dónde:** [server/routes/groups.js:74-77](server/routes/groups.js:74) (alta) y
:93-95 (baja) modifican el grupo y hacen `group.save()`, pero **no** hacen
`$unset: { debtsLastUpdated }`. La invalidación solo ocurre vía los hooks de
`Expense` ([Expense.js:45-47](server/models/Expense.js:45)).

Resultado: si hay un balance cacheado y se elimina un participante con deudas, el
endpoint `/balance` sigue devolviendo el cálculo viejo hasta que se toque algún
gasto. (Relacionado: borrar un participante **no** borra sus gastos, así que
`simplifyDebts` lo sigue contando igual — ver hallazgo 6.)

**Fix:** agregar `await Group.findByIdAndUpdate(id, { $unset: { debtsLastUpdated: 1 } })`
en ambas rutas, o mejor, centralizar la invalidación. Dado que el cálculo es barato
para grupos chicos, evaluar **eliminar la caché** y calcular siempre on-read: borra
toda esta clase de bugs de coherencia.

### 🟡 6. Validación de dominio insuficiente en gastos

**Dónde:** [server/routes/expenses.js:17-23](server/routes/expenses.js:17).

- `amount` solo valida `.isNumeric()`: acepta **negativos, cero y montos enormes**.
  Un monto negativo invierte la deuda; uno gigante rompe el balance.
- `payer` e `involved` **no se validan contra `group.participants`**: se puede
  registrar un gasto con nombres que no pertenecen al grupo, contaminando el grafo
  de deudas (`simplifyDebts` agrega a cualquiera que aparezca como pagador/involucrado).
- `groupId` se valida solo como no vacío (`.escape()` sobre un hex no hace nada); si
  llega un id inválido, Mongoose lanza `CastError` → 500.

**Fix:** `check('amount').isFloat({ gt: 0, max: <límite> })`; validar que `payer` y
cada `involved` ∈ `group.participants` (requiere cargar el grupo); validar `groupId`
con `.isMongoId()`.

### 🟡 7. `trust proxy` sin configurar detrás de Nginx

**Dónde:** [server/server.js:13-20](server/server.js:13) + proxy en
[client/nginx.conf:9-16](client/nginx.conf:9).

El rate limiter usa `req.ip`. Detrás de Nginx (que además no setea
`X-Forwarded-For`/`X-Real-IP`), `req.ip` será la IP del contenedor cliente para
**todos** los usuarios → el límite de 1000/15min se vuelve un **balde global
único**, no por cliente. `express-rate-limit` v8 también puede emitir advertencias
de validación por `X-Forwarded-For`.

**Fix:** `app.set('trust proxy', 1)` y, en `nginx.conf`,
`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Real-IP $remote_addr;`.

### 🟡 8. El server arranca aunque MongoDB no conecte

**Dónde:** [server/server.js:30-32](server/server.js:30) — el `.catch` solo loguea
y `app.listen` corre igual ([:47](server/server.js:47)). Con la DB caída, el server
"está arriba" pero todas las requests fallan/cuelgan, y no hay health check que lo
detecte.

**Fix:** fallar rápido (salir con código ≠ 0 si la conexión inicial falla) o exponer
un `/health` que refleje `mongoose.connection.readyState`, y un `healthcheck` en
`docker-compose.yml`.

### 🟡 9. Testing prácticamente ausente

No hay tests automatizados. El único archivo, [server/test-settle.js](server/test-settle.js),
es un **script manual** que le pega a `http://localhost:3003` con un `groupId`
hardcodeado ([:3](server/test-settle.js:3)) — no es un test, no corre en CI, y está
versionado.

**Por qué importa:** la pieza más crítica y más propensa a bugs (la matemática de
`simplifyDebts`, con floats y epsilons) **no tiene una sola aserción**.

**Fix:** tests unitarios de `simplifyDebts` (Vitest/Jest) cubriendo: reparto exacto,
restos no divisibles, settlements, montos negativos/borde, y que las transacciones
sumen cero. Sacar `test-settle.js` del repo o moverlo a `scripts/`.

### 🟢 10. Deriva entre documentación, branding y configuración

- La ruta raíz responde `"CuentasClaras API is running"`
  ([server/server.js:40](server/server.js:40)) — nombre de otro proyecto.
- El README dice que corre en `:5000` ([README.md:74](README.md:74)) pero el real es
  `:3003` (`.env`, compose). El default del código es 5000.
- El README promete "HTTPS out of the box" y certificados en `/etc/nginx/certs`
  ([README.md:108-118](README.md:108)), pero el `nginx.conf` versionado **solo
  escucha `:4003` en HTTP plano**, sin `listen 443 ssl` ni directivas de
  certificado. (Coherente con el commit "Cleaning Up Legacy SSL"; probablemente la
  TLS la termina el proxy externo `nginx-raspberry`, pero el README quedó viejo.)
- Falta el archivo `LICENSE` aunque el README muestra badge MIT y enlaza `/LICENSE`
  ([README.md:7,120-122](README.md:120)); además el texto dice "propiedad de
  Alejandro Abraham" — licenciamiento contradictorio.

### 🟢 11. Copy no profesional / ofensivo en la UI

- [CreateGroup.jsx:77](client/src/pages/CreateGroup.jsx:77): "hasta el mas retrasado
  de tu amigo".
- [AddExpense.jsx:74](client/src/pages/AddExpense.jsx:74): "No seas retrasado 😒".
- [AddExpense.jsx:184](client/src/pages/AddExpense.jsx:184): placeholder
  "Birras, Puchos, **Drogas**...".

Si la app es pública o de portfolio, esto es un problema reputacional/inclusión.
Cambio trivial.

---

## Análisis por dimensión

### 🧠 Arquitectura — **Buena para su escala**
Monolito por capas, prolijo: `routes` (HTTP), `models` (Mongoose), `utils`
(dominio: `debtGraph`, `ApiResponse`), `middleware` (errores). Frontend con
separación `pages / components / store / lib`. El cliente unifica el manejo de
respuestas con un interceptor de Axios ([api.js:13-26](client/src/lib/api.js:13)) y
el estado en un store Zustand con `persist` ([useStore.js](client/src/store/useStore.js)).
La lógica de negocio vive en las rutas (no hay capa de servicios), lo cual es
aceptable a este tamaño. El único "olor" arquitectónico es el **cacheo de estado
derivado** (las deudas) dentro del documento `Group`: introduce acoplamiento de
invalidación que ya generó el bug 5; dado lo barato del cálculo, conviene
reconsiderarlo.

### 🧩 Calidad del código — **Consistente, con detalles**
Naming claro, componentes legibles, estilo uniforme. Puntos a pulir: comentarios y
ramas muertas en `ExpensesList` ([:17,32](client/src/pages/ExpensesList.jsx:17)),
`useStore()` invocado sin uso en [App.jsx:31](client/src/App.jsx:31), comentarios
de `eslint-disable` en efectos de `AddExpense`
([:46-49](client/src/pages/AddExpense.jsx:46)) que tapan un patrón de set-state en
effect, y la sanitización mal ubicada (hallazgo 4).

### 🐞 Bugs potenciales
Ver hallazgos 2 (floats), 4 (escape corrompe datos), 5 (caché stale), 6 (validación
de dominio). Sumar: borrar un participante no borra sus gastos, así que sigue
apareciendo en balances; `createGroup` en el cliente dispara N `addParticipant` en
paralelo y usa "la última respuesta" como estado final
([useStore.js:27-34](client/src/store/useStore.js:27)) — con `Promise.all` el orden
de resolución no garantiza cuál trae la lista completa (en la práctica funciona
porque cada respuesta devuelve el grupo entero, pero es frágil).

### ⚡ Rendimiento — **Suficiente**
Para grupos chicos no hay cuellos de botella: `simplifyDebts` es O(n) + greedy, y la
caché de deudas evita recomputar. Detalles menores: el store hace round-trips
secuenciales de más (`addExpense` crea y luego re-fetchea todo;
[settleDebt](client/src/store/useStore.js:150) hace create + getExpenses +
getBalance en serie). Nada urgente.

### 🔐 Seguridad — **El punto más débil**
Hallazgo 1 (sin auth, ObjectId como credencial, CORS abierto) es estructural.
Positivo: `helmet`, rate limiting (aunque mal calibrado por el proxy, hallazgo 7),
validación de IDs con regex de 24 hex en varias rutas
([groups.js:36,104,117](server/routes/groups.js:36)), y el `errorHandler` enmascara
errores internos al cliente ([errorHandler.js:8-21](server/middleware/errorHandler.js:8)).
No hay riesgo de inyección NoSQL evidente porque los inputs van como valores
escalares a Mongoose, no como objetos de query.

### 🧪 Testing — **Sin evidencia de tests reales**
Ver hallazgo 9. Cobertura efectiva: 0%.

### 📦 Dependencias — **Modernas y razonables**
Stack actualizado (React 19, RR7, Tailwind v4, Zustand 5, helmet 8,
express-rate-limit 8, express-validator 7). `mongoose@7` (la actual es 8) y
`mongo:4.4.18` está **EOL** (soporte terminó en feb-2024); está pineado por
compatibilidad ARM con Raspberry Pi —tradeoff documentado en el README— pero
conviene tenerlo presente como riesgo de seguridad de la DB. Recomiendo correr
`npm audit` en ambos paquetes (no ejecutado en esta auditoría por no tener red).

### 🚀 DevOps / Deploy — **Funcional, sin observabilidad ni CI**
Multi-stage build prolijo en el cliente; servidor single-stage corriendo como root
con `npm install` (no `npm ci`, build no determinista). **No hay CI/CD**
(`.github/workflows` inexistente), ni `.dockerignore` (hallazgo 3), ni health checks
en `docker-compose.yml`, ni logging estructurado (todo `console.log`). El compose le
pasa `MONGODB_URI` al contenedor **cliente** ([docker-compose.yml:19](docker-compose.yml:19))
que es solo Nginx y no lo usa — inocuo pero confuso. Los puertos están comentados a
propósito (commit de "Proxy Bypass") porque el tráfico entra por la red externa
`nginx-raspberry_app-network`: decisión válida.

---

## Quick wins vs. inversiones

### Quick wins (alto impacto / bajo esfuerzo)
- `git rm --cached` de los `.env` + `.env.example` + `.dockerignore` (hallazgo 3).
- Quitar `.escape()` de las validaciones (hallazgo 4) — corrige corrupción de datos.
- Invalidar caché en alta/baja de participantes, o eliminar la caché (hallazgo 5).
- `amount` con `isFloat({ gt: 0 })` y `groupId` con `isMongoId()` (hallazgo 6).
- `app.set('trust proxy', 1)` + headers en Nginx (hallazgo 7).
- Restringir CORS a orígenes conocidos (parte de hallazgo 1).
- Corregir copy ofensivo, nombre "CuentasClaras", puerto en README, LICENSE
  (hallazgos 10 y 11).

### Inversiones grandes (planificar)
- **Modelo de acceso por token** (hallazgo 1): generar token aleatorio por grupo,
  exigirlo en cada request, separar lectura/escritura, permitir revocación.
- ~~**Dinero en enteros** (hallazgo 2): refactor de `Expense.amount` y `simplifyDebts`
  a centavos, con migración de datos existentes.~~ ✅ **Hecho (2026-06-28)** — ver
  detalle en el hallazgo 2.
- **Suite de tests** + CI (hallazgo 9): unitarios de `simplifyDebts`, de validación
  de rutas, y un workflow de GitHub Actions que corra lint + tests + `npm audit`.

---

## Recomendaciones accionables (orden sugerido)

1. **Sacar los `.env` del control de versiones** y agregar `.dockerignore`.
   ```bash
   git rm --cached server/.env client/.env
   ```
2. **Quitar `.escape()`** de todas las validaciones. Antes/después:
   ```js
   // Antes — corrompe el dato guardado
   check('description', 'Description is required').not().isEmpty().escape()
   // Después — solo limpia, el escape se hace en el render (React)
   check('description', 'Description is required').trim().notEmpty()
   ```
3. **Endurecer la validación de gastos** en
   [expenses.js](server/routes/expenses.js):
   ```js
   check('groupId').isMongoId(),
   check('amount').isFloat({ gt: 0 }),
   // y, tras cargar el grupo, verificar payer ∈ participants y involved ⊆ participants
   ```
4. **Invalidar la caché** al tocar participantes (o eliminarla) en
   [groups.js](server/routes/groups.js).
5. **Configurar `trust proxy`** y los headers en
   [nginx.conf](client/nginx.conf); **restringir CORS** en
   [server.js](server/server.js).
6. **Introducir el token de acceso por grupo** (cambio de modelo de seguridad).
7. ~~**Migrar el dinero a centavos enteros** y reescribir `simplifyDebts` sobre
   enteros.~~ ✅ **Hecho (2026-06-28)** — incluye script de migración idempotente
   (`npm run migrate:cents`).
8. **Agregar tests** de `simplifyDebts` (✅ hecho) y un pipeline de CI (pendiente).
9. **Limpiar la deriva de docs/branding**: nombre de la API, puerto en README,
   sección SSL, archivo `LICENSE`, y el copy de la UI.
