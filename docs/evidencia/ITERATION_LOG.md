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

