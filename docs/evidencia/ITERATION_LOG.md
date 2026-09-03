# Bitácora de iteración

Evidencia de rúbrica: *Testing & iteration* (≥1 mejora derivada de haber probado).
Qué se probó, qué salió mal o incómodo, y qué se cambió por eso.

Formato:

```
## [YYYY-MM-DD] — qué se cambió
**Observado:** qué pasó al probarlo (con usuario real si aplica)
**Diagnóstico:** por qué pasa
**Cambio:** qué se modificó
**Efecto:** medición o impresión posterior
```

---

## [2026-08-19] — Migración 002 añadida tras releer el Apéndice B
**Observado:** el esquema del Apéndice B no arranca: `garments`, `outfits` y todo lo demás
tienen FK a `profiles`, pero nada inserta la fila de `profiles` cuando alguien se registra.
**Diagnóstico:** el apéndice describe `profiles` como "1:1 con auth.users" pero no define el
trigger que lo hace cierto. Faltan además el débito atómico de créditos (§4.2 lo exige) y los
buckets privados de Storage (§4.3 los exige).
**Cambio:** migración 002 con `handle_new_user`, `debit_credits` con advisory lock,
índice único en `credit_ledger.ref` para idempotencia, y los tres buckets privados con políticas
por carpeta `user_id`.
**Efecto:** pendiente — se verifica al aplicar las migraciones contra el proyecto Supabase real.

## [2026-08-19] — Scripts de instalación bloqueados en vez de aprobados
**Observado:** con el scaffold recién creado, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit` y
`pnpm build` fallaban todos con `ERR_PNPM_IGNORED_BUILDS` por `@google/genai` y `protobufjs`.
pnpm 11 corre una verificación de dependencias antes de cada script y se niega a seguir mientras
haya scripts de instalación sin decidir.
**Diagnóstico:** no es un error, es una barrera de cadena de suministro. pnpm obliga a decidir
explícitamente qué paquete puede ejecutar código durante la instalación.
**Cambio:** en vez de aprobar a ciegas, se revisó qué ejecuta cada uno: `@google/genai` publica
su `dist/` ya compilado y sus lifecycle scripts son no-ops; el postinstall de `protobufjs` solo
imprime advertencias de versión. Ninguno hace falta → ambos quedan en `false` en
`pnpm-workspace.yaml`, con el porqué anotado en el archivo.
**Efecto:** pipeline verde sin conceder ejecución de código en instalación a ninguna dependencia.
Si alguno resulta necesario, se cambia con una nota del motivo.

## [2026-08-19] — Franjas grises en el grid de la landing
**Observado:** al abrir la landing en un viewport de 390×844 (iPhone), la sección de features
mostraba dos franjas grises verticales pegadas a los bordes de la pantalla.
**Diagnóstico:** el grid usaba el truco de `gap-px` sobre un contenedor con `bg-border` para
dibujar líneas divisorias de 1px. Como ese mismo contenedor llevaba el padding horizontal
(`px-6`), el color de borde se pintaba también en el área de padding, no solo en los huecos.
Además las tarjetas quedaban con `px-1` en móvil, casi pegadas al texto.
**Cambio:** se abandonó el truco de líneas y se separaron responsabilidades — un contenedor con
el padding, y dentro un grid con `gap` normal. Menos CSS y sin artefacto.
**Efecto:** verificado en claro y en oscuro a 390×844. Encontrado mirando la página, no
corriendo pruebas: ninguna prueba automática habría detectado esto.

## [2026-08-20] — `revoke from public` dejó al propio servidor sin permisos
**Observado:** con la base ya en producción, la primera llamada a `debit_credits`
devolvió `42501 permission denied for function`. El resto del esquema funcionaba.
**Diagnóstico:** la migración 002 hacía `revoke all on function … from public` con
la intención de que ninguna usuaria pudiera mover créditos por su cuenta. Pero en
Postgres el rol `public` no son "los visitantes": son **todos los roles**. Al
revocarle a `public` se le quitó el permiso también a `service_role`, que es
exactamente quien tiene que ejecutar esas funciones desde el servidor.
**Cambio:** migración 004 que devuelve `execute` a `service_role` únicamente, y una
advertencia en la 002 para que nadie repita el razonamiento. `credit_balance`
sigue sin darse a `authenticated` a propósito: recibe un uuid y es SECURITY
DEFINER, así que cualquiera podría consultar el saldo de otra pasando su id.
**Efecto:** ciclo de créditos verificado completo. Sin esta prueba, el error
habría aparecido hasta la Semana 3, con una usuaria intentando pagar.

## [2026-08-20] — El modelo devolvió un arreglo donde el contrato pedía un objeto
**Observado:** la primera subida real desde la interfaz falló con *"La IA no pudo
leer esta foto"*, aunque el mismo modelo y la misma imagen habían funcionado en la
prueba unitaria minutos antes.
**Diagnóstico:** el log del servidor lo dijo sin rodeos:
`expected object, received array`. Con `responseMimeType: application/json` pero
sin esquema, `gemini-3.5-flash-lite` a veces envuelve el objeto en un arreglo de
un elemento. Es variación normal de los modelos, no un error de la imagen.
**Cambio:** dos capas. (1) Se le entrega al modelo el **esquema exacto** vía
`responseJsonSchema`, para que no tenga margen de desviarse. (2) El parser
desenvuelve un arreglo de un solo elemento — pero **rechaza** uno con varios,
porque una foto es una prenda y aceptar la primera en silencio sería inventar.
**Efecto:** subida verde. Y dos pruebas unitarias nuevas que fijan el
comportamiento para que no se vuelva a colar.
**Lo que esto vale:** el contrato de zod se escribió el 19-ago, antes de tener
siquiera la API key, y su única razón de ser era *"un LLM puede devolver
cualquier cosa"*. Al día siguiente devolvió cualquier cosa. Sin ese contrato,
esto se habría guardado en la base de datos como una prenda rota.

## [2026-08-20] — Next 16 renombró `middleware.ts`
**Observado:** el proyecto trae un `AGENTS.md` que obliga a leer la documentación
de la versión instalada antes de escribir código.
**Diagnóstico:** al leerla, `middleware.js` aparece **deprecado y renombrado a
`proxy.js`** en Next 16. Toda la documentación de Supabase para Next usa el nombre
viejo. Con `middleware.ts`, el archivo simplemente no se ejecuta: la sesión nunca
se refresca y las rutas privadas quedan sin proteger — **sin un solo error visible**.
**Cambio:** el archivo se llama `src/proxy.ts` y exporta `proxy`. El build lo
confirma: imprime `ƒ Proxy (Middleware)` en la lista de rutas.
**Efecto:** la prueba e2e #1 verifica que la protección de rutas sí funciona, en vez
de asumirlo.

## [2026-08-21] — La interfaz confirmaba antes de saber si había guardado
**Observado:** la prueba e2e del estilista fallaba al verificar que rechazar un
outfit dejara un `feedback_event`. La interfaz mostraba *"No te vuelvo a proponer
algo así"*, pero la base de datos no tenía nada.
**Diagnóstico:** dos cosas. La prueba consultaba la base antes de que la Server
Action terminara, sí — pero eso solo era posible porque **la interfaz confirmaba
de forma optimista**: `setListo(...)` corría antes del `await`, y el resultado de
la acción se descartaba sin mirarlo. Si el evento no se guardaba, la usuaria veía
un mensaje diciendo que ClosetAI había aprendido algo que nunca aprendió.
**Cambio:** la confirmación se muestra después de que el servidor responde, y si
la acción devuelve error se pinta el error en vez del mensaje de éxito. Además,
la acción ahora revisa el resultado del insert de `feedback_events` y lo registra
en el log del servidor: sin ese evento, M4 no aprende nada, así que fallar en
silencio ahí es lo peor que puede pasar.
**Efecto:** las tres pruebas del estilista en verde, y ahora una falla real se
vería en pantalla en vez de esconderse tras una palomita.


## [2026-08-21] — Las pruebas estaban verdes con la sesión rota en producción
**Observado:** con las cuatro semanas terminadas y todo el pipeline en verde —
lint, tipos, 14 unitarias, build, 16 e2e — entré al sitio en vivo con la cuenta
demo y el clóset apareció vacío. Al navegar a otra sección, la app me pedía la
contraseña otra vez. Intermitente: a veces sí, a veces no.

**Por qué las pruebas no lo vieron:** porque afirmaban lo que no debían. La
comprobación era *"la página carga sin error"*, y la pantalla de inicio de sesión
carga perfectamente. Una sesión caída se veía exactamente igual que un éxito.
Diecinueve pruebas en verde y el producto no funcionaba en producción.

**Diagnóstico:** `proxy.ts` redirige en dos casos —a `/entrar` sin sesión, y a
`/closet` si ya la tienes— y en ambos devolvía un `NextResponse.redirect()` recién
creado. Las cookies que `getUser()` acababa de refrescar viven en otro objeto de
respuesta, y se iban a la basura. Supabase **rota** el token de refresco: entrega
uno nuevo y anula el anterior. Al tirar el nuevo, el navegador se quedaba con uno
muerto.

Lo intermitente tiene explicación: Supabase acepta el mismo refresh token repetido
durante unos segundos, así que la petición siguiente alcanzaba a reparar la cookie
y la falla se tapaba sola. Con arranques en frío de Vercel de por medio, ese margen
no alcanza. En local nunca se veía.

**Cambio:** `redirigirConSesion()` copia las cookies a la redirección. Y de paso,
las cookies de sesión ahora van marcadas `Secure` sobre HTTPS — no lo estaban, ni
en producción; el flag se decide por el protocolo real, así que localhost sigue
funcionando igual.

**Sobre la prueba de regresión — dos intentos fallidos antes del bueno:**
1. La primera versión entraba y navegaba por las rutas privadas. Pasaba **con y
   sin** el arreglo: recién entrada el token no ha vencido, así que no hay rotación
   que perder.
2. La segunda envejecía el token a mano para forzar la rotación, y también pasaba
   sin el arreglo — por el margen de reutilización del refresh token, la petición
   siguiente reparaba la cookie.
3. La tercera afirma lo estrecho y exacto: que la **respuesta de redirección misma**
   traiga la cookie nueva. Ese es el invariante que se rompía.

Y aun así casi la doy por buena mal: `headersArray()` es asíncrono en esta versión
de Playwright, así que fallaba con un `TypeError` — y una prueba que revienta
también "falla". Estuve a un paso de registrar como detección lo que era un error
mío. **Una prueba de regresión no sirve hasta que la ves fallar por el motivo
correcto**, con el mensaje que escribiste, y pasar al aplicar el arreglo. Ese ciclo
completo está verificado.

**Efecto:** 19 e2e en verde, y dos vueltas completas contra el sitio en vivo con la
cuenta demo: 20 de 20, incluidas diez idas y vueltas seguidas entre secciones.

## [2026-09-02] — Dos pruebas mal escritas antes de una bien escrita
**Observado:** la prueba de `/core` fallaba con la tarjeta visible en pantalla. El
módulo funcionaba; la prueba no.

**Primer intento.** Afirmaba `getByText("Tu núcleo de estilo")`. Falló siempre,
aunque la tarjeta estuviera ahí. El encabezado usa `uppercase` de CSS y Playwright
lee el texto **ya transformado**: buscaba "Tu núcleo de estilo" contra "TU NÚCLEO
DE ESTILO".

**Segundo intento.** Lo cambié a una expresión insensible a mayúsculas. Entonces
pasó — pero pasó **al instante, en 0.1 s**, sin que hubiera ocurrido ninguna
generación. El párrafo de introducción de la página dice *"destilo tu núcleo de
estilo: tus principios, tu paleta"*, así que la aserción coincidía con la página
recién cargada. La prueba estaba verde y no probaba nada.

**Lo que quedó.** Las aserciones se anclan al elemento de la tarjeta, no a la
página: `page.locator("article")`. Así no hay forma de que coincidan con el texto
de la introducción.

**Por qué importa:** es exactamente la misma falla de la Semana 0, con otro
disfraz. Allá la prueba afirmaba que "la página carga sin error" y la pantalla de
login carga perfecto. Aquí afirmaba un texto que ya existía antes de generar nada.
Las dos veces la aserción podía cumplirse **sin que la función funcionara**.

Y hubo un rato en que creí que el bug estaba en el producto: llegué a instrumentar
la Server Action paso por paso para encontrar dónde se colgaba. Los logs mostraron
`modelo respondió, ok = true` en 7.7 s — el módulo llevaba todo el tiempo bien.
Cuando una prueba y el producto se contradicen, la prueba también es sospechosa.
