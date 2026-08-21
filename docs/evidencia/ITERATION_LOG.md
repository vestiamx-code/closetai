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

