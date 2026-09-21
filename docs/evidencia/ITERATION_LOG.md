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

## [2026-09-08] — Tres pruebas rojas antes de entregar, y ninguna era del código

Al verificar la suite completa contra producción antes de armar la entrega,
fallaron tres: dos de sesión y una del estilista. Todas decían lo mismo — al
navegar a una ruta privada, la app mandaba a `/entrar`.

**Lo primero fue no creerle a la prueba.** Entré al sitio en vivo con una cuenta
recién creada, esperé como esperaría una persona y recorrí las seis rutas
privadas: todas bien. El producto no estaba roto.

**Qué pasaba de verdad.** Instrumenté el navegador y salió limpio: en el instante
en que la URL cambia a `/closet`, **el navegador todavía no tiene la cookie de
sesión**. Llega unos 300 ms después. La redirección la hace el router con la carga
que viene en la misma respuesta de la Server Action; las cabeceras `Set-Cookie` se
procesan por su lado. Con 0 ms de espera fallaban las seis rutas; con 300 ms,
ninguna. Ninguna persona alcanza a hacer clic en ese hueco. Playwright sí.

**Qué quedó.** Un solo `entrarConSesionLista()` en `e2e/entorno.ts`, que no
devuelve el control hasta que la cookie existe. Tres specs tenían su propia copia
del inicio de sesión —y las tres fallaban por lo mismo—; ahora hay una. Y de paso
la prueba afirma algo que nadie comprobaba: **que entrar deja cookie**. Lo verifiqué
saboteando el patrón de búsqueda a propósito, para verla fallar con el motivo que
le escribí, no con otro.

**El segundo hallazgo, más importante.** La compuerta de cuota de Gemini en
`core.spec.ts` estaba en un `beforeAll` y saltaba las cinco pruebas. Solo una llama
al modelo. Las otras cuatro —que `/core` cargue sin sesión, que rechace texto corto,
que el costo quede registrado, que la lista no exponga lo que alguien escribió— no
tocan a Google. La afirmación central de la semana estaba escondida detrás de la
cuota de un proveedor.

**El tercero es un defecto de producto, y es el que más me importa.** Cuando Gemini
respondía 429, la página le decía a la persona *"No pude leer bien lo que escribiste"*.
Su texto estaba perfecto; el que no contestó fue el modelo. Ahora hay un motivo
aparte, `unavailable`, y la página dice la verdad: que el modelo está saturado y que
lo intente en un minuto. Echarle a alguien la culpa de una falla ajena es más caro
que el error técnico.

**Lo que no arreglé, y lo digo.** Corriendo los 58 en paralelo contra producción,
entre cero y cuatro fallan según la corrida; solas y en serie pasan siempre. Es
contención de la suite contra el sitio en vivo, no del código. Queda anotado en vez
de escondido: prefiero una corrida verde con asterisco a un verde que no me creo.

---

# Semana 2 · `/research`

## [2026-09-14] — El buscador se equivocó dos veces antes de la primera línea de código
**Observado:** al verificar la investigación del Documento Maestro, dos cifras venían mal en el
resumen del buscador: Indyx "cobra estilista desde $25 al mes" (la página dice $15) y GoTrendier
"cobra 20% + $9" (el desarrollador dice 14% + $14).

**Lo que cambió:** la regla de la semana es **abrir la fuente**. Cada dato de `/research` se
comprobó en su página; lo que no se pudo abrir quedó fuera, en la lista de descartados. De paso
cayó la tesis de mercado —sí hay apps de clóset en español— y apareció una app que ya se llama
"Closet AI".

## [2026-09-14] — La migración traía comillas invertidas
**Observado:** la Semana 1 se aplicó pegando el SQL dentro de una plantilla de JavaScript en el
editor de Supabase. La migración 006 trae 6 comillas invertidas en sus comentarios: con ese
método, el script se habría roto a la mitad.

**Lo que cambió:** el SQL viajó como texto JSON escapado. Antes de ejecutar se comprobó que el
editor tuviera exactamente el mismo texto (13,547 caracteres, idénticos). Después se verificó
contra la base, no contra la pantalla: 15 fuentes, 7 riesgos, lectura pública sí, escritura
pública rechazada (401) y una conversación sin consentimiento rechazada por la propia base (23514).

## [2026-09-14] — Un 503 le pedía a la persona que cambiara su pregunta
**Observado:** la prueba e2e de generación falló en producción. La página decía *"No pude armar un
informe confiable con esa pregunta. Prueba a formularla de otra forma."*

**Diagnóstico:** reproducido fuera del navegador con la misma pregunta y los mismos datos: Gemini
respondía **503 UNAVAILABLE — "This model is currently experiencing high demand"**. La pregunta
estaba bien. El código solo reconocía la caída del proveedor cuando llegaba como 429.

**Lo que cambió:** `clasificarFalloDelProveedor()` distingue cuota (429) de saturación (503). Lo
usan el reintento y los errores de `/core` y `/research`, que tenían el mismo hueco. **Es el
defecto de la Semana 1 con otro código de error.** La prueba nueva usa el texto literal del 503 y
se verificó saboteando el clasificador.

## [2026-09-14] — Reintentar un modelo saturado solo alargaba la espera
**Observado:** con el 503 ya reconocido, las pruebas siguieron fallando, ahora por tiempo.

**Medido, no supuesto** (misma petición mínima, "responde solo: ok"):

| Modelo | Intento 1 | Intento 2 | Intento 3 |
|---|---|---|---|
| `gemini-3.5-flash` | 503 en 22.3 s | 503 en 1.5 s | 200 en **86.4 s** |
| `gemini-3.5-flash-lite` | 200 en 0.8 s | 200 en 0.5 s | 200 en 0.5 s |

**Lo que cambió:** cada intento tiene 25 s como máximo y, si el proveedor falla, contesta el
modelo ligero. Si la petición está mal, **no** se cambia de modelo: eso escondería el error. El
modelo que contestó de verdad queda en la fila guardada. Resultado: las 4 pruebas de generación
pasan en producción, y los informes y núcleos de hoy los contestó el respaldo — que sin el
cambio habrían sido errores.

## [2026-09-14] — Un verde con cuatro pruebas saltadas
**Observado:** tras desplegar el respaldo, la suite dijo "22 pasan, 0 fallan". Pero había
saltadas, y resultaron ser **las cuatro de generación**: justo las que comprobaban el arreglo.

**Diagnóstico:** la compuerta de cuota solo consultaba el modelo principal, que ya estaba sin
cuota. Saltaba pruebas que la página sí aprueba contestando con el respaldo.

**Lo que cambió:** la compuerta consulta los dos modelos. Con el cambio, las cuatro corren y pasan.
Es la lección de siempre con otra forma: **un verde con saltadas no es un verde**.

## [2026-09-14] — "Ninguna de las revisadas" no es "no existe ninguna"
**Observado:** en la primera corrida en vivo, la fuente decía *"ninguna de las apps de clóset en
español revisadas se presenta con tallas, tiendas o precios de México"* y el informe concluyó
*"no hay competidores locales dedicados a organizar clósets"*. Lo revelador: en "falta validar",
el mismo informe reconocía que podría haber startups locales menores. **Sabía que no sabía, y lo
afirmó igual.**

**Lo que cambió:** prompt v2, con la regla de conservar el límite del dato. Misma pregunta, en
vivo: *"Las apps de clóset revisadas con interfaz en español no se presentan con tallas, tiendas
o precios de México."*

**Una corrección mía, en el camino:** el primer script que verificaba el v2 leía el párrafo
equivocado —la pregunta, no la respuesta— y dijo "no generaliza ✓". Un chequeo que pasa sin
mirar lo que dice mirar. Se repitió leyendo la respuesta desde la base de datos.

## [2026-09-14] — El límite por IP, comprobado sin querer
**Observado:** una corrida más no llegó a producir informe. El registro de costos mostró
**exactamente 10 informes en la última hora desde la misma IP**: el límite anti-abuso funcionó
en producción.

**Lo que cambió:** las pruebas de generación de `/research` y `/core` no contemplaban el límite y
habrían fallado al correrse muchas veces seguidas. Ahora, si aparece el aviso del límite, se
saltan con ese motivo escrito.

## [2026-09-18] — Un mes de cuentas nuevas con la ciudad rota
**Observado:** en la suite completa contra producción, una prueba del estilista falló en celular.
En la pantalla del usuario de prueba decía **"Ciudad de M√©xico"**.

**Diagnóstico:** el texto roto no estaba en el código ni en las pruebas. Se creó una cuenta
temporal sin elegir ciudad y se leyeron sus bytes: `e2 88 9a c2 a9` donde debía ir `c3 a9`. Es la
«é» leída como Mac Roman. La migración 001 declara `city default 'Ciudad de México'`, pero cuando
se aplicó en la Semana 0 el texto pasó por ese camino, y **la base guardó el valor por omisión
roto**. Toda cuenta nueva nacía así. El clima funcionaba igual —el código cae a las coordenadas de
la CDMX—, y ninguna prueba leía la ciudad: por eso nadie lo vio en un mes.

**Una corrección mía:** en la Semana 1 esto ya había aparecido en el perfil de Tamara. Lo corregí
a mano y lo atribuí a un comando de terminal, sin revisar el valor por omisión. **Corregí el síntoma
y no la causa.**

**Lo que cambió:**
- Migración 007: corrige el valor por omisión y repara las filas rotas, reconociéndolas por su forma
  para no escribir el texto roto. Verificado contra la base: 0 perfiles rotos, y una cuenta nueva
  nace con "Ciudad de México", byte por byte.
- Auditoría: era el único texto con acento fuera de comentarios en las migraciones 001 a 004.
- Prueba nueva, `e2e/datos.spec.ts`: crea una cuenta nueva y compara los bytes de su ciudad.

**La falla del estilista, aparte:** corriendo el archivo solo en celular, pasaron las 4. Es
intermitente —una carrera de tiempos cuando la suite corre en paralelo contra producción—, no un
defecto del producto. Queda anotada en vez de escondida.

## [2026-09-21] — Lo que cambió una conversación real
**Observado:** la entrevista (mujer de 57 años, familiar de la fundadora, fuera del segmento) no
confirmó todo lo que suponíamos.

**Lo que cambia en el producto:**
- **El try-on tiene que aceptar una foto sin cara.** Subiría una foto de cuerpo completo, pero "con
  cara lo pensaría 2 veces, por miedo a que las fotos salgan". Hoy la captura guiada pide una foto
  completa.
- **El umbral de fotografiar no es 10 prendas.** Dijo que se vuelve tedioso "después de la prenda
  40". Diez sigue siendo el mínimo para dar valor, pero no es el techo.
- **El pago único no está probado.** Paga Disney+ cada mes; la entrevista no probó si pagaría por
  ClosetAI. Es la pregunta de la siguiente conversación, con alguien del segmento.

**Proceso:** las citas se revisaron contra sus respuestas antes de publicarlas, y solo se publicaron
las que coinciden con lo que ella dijo.
