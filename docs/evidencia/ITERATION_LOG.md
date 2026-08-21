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

