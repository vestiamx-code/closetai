# Semana 1 · Build Discipline Packet — Núcleo de estilo (`/core`)

> Escrito **antes** de tocar código. El commit de este archivo precede al del
> primer archivo de la función; el historial de git lo demuestra.

**Función de la semana:** convertir una metodología previa en un módulo
generativo público en `/core`.

La metodología previa es el **Apéndice A3 del Documento Maestro**: cómo ClosetAI
deduce el estilo de una persona a partir de señales. Hoy eso vive escondido —
solo corre después de que alguien sube ropa y reacciona a outfits. Esta semana se
convierte en un módulo que cualquiera puede usar, sin cuenta y sin subir nada.

---

## 🧩 Problema

Para que ClosetAI sirva hoy, hay que fotografiar unas diez prendas. El valor
llega **después** de una hora de trabajo. Esa es la objeción más fuerte que
recibió la propuesta de valor, y es la misma que mató a las apps de esta
categoría: te hacen catalogar tu clóset y solo entonces te dan algo.

Nadie sabe si el criterio de ClosetAI vale la pena antes de invertir esa hora.

## 👤 Usuaria

Alguien que llega a closetai.lat por primera vez, sin cuenta y sin fotos.
También sirve a quien ya tiene cuenta: su núcleo de estilo alimenta al estilista
desde el primer día, en vez de esperar a juntar cinco reacciones.

## 🎯 Éxito (qué debe funcionar al final de la semana)

- `/core` carga en producción, **sin sesión**, en ventana de incógnito.
- Escribo en mis palabras cómo me gusta vestirme y recibo un **núcleo de estilo
  estructurado**, no un párrafo suelto.
- Puedo guardarlo y verlo después en la misma página.
- Cada guardado queda en la tabla `core_outputs` de Supabase.
- Tres corridas con entradas distintas producen tres núcleos distintos y creíbles.

## 🖼️ Concepto de UX

Una sola pantalla, tres estados: formulario vacío → generando → tarjeta de
resultado con botón de guardar. Debajo, lo que ya se guardó. Mockup generado con
imagen en `docs/evidencia/mockups/`.

## ✂️ Recorte de alcance

Se queda fuera **a propósito**:

- **Cuentas en `/core`.** Guardar sin sesión es el punto: pedir registro antes de
  demostrar valor es exactamente el problema que esta función ataca.
- **Editar un núcleo guardado.** Se puede volver a generar; editar campo por
  campo es trabajo de otra semana.
- **Conectar el núcleo al estilista.** Es lo obvio siguiente y por eso mismo no
  se hace ahora: primero hay que probar que el núcleo que sale es bueno.
- **Subir fotos en `/core`.** Toda la gracia es que no hace falta ninguna.

## 🧱 Especificación y criterios de aceptación

| # | Requisito | Criterio de aceptación (comprobable) |
|---|---|---|
| 1 | Página pública | `GET /core` responde 200 sin cookies de sesión |
| 2 | Formulario de entrada | Acepta 40–1000 caracteres; por debajo o por encima, error claro en español |
| 3 | Extracción del núcleo | La respuesta del modelo pasa un contrato zod antes de mostrarse; si no cumple, se muestra error y no se guarda nada |
| 4 | Tarjeta estructurada | Muestra 5 campos: esencia, principios, paleta, siluetas, qué evitar, y una regla |
| 5 | Guardar | Escribe una fila en `core_outputs` y la fila aparece en la lista sin recargar |
| 6 | Vista de guardados | Muestra los núcleos guardados más recientes |
| 7 | Costo registrado | Cada generación escribe su costo en `api_costs` |
| 8 | Límite de uso | Una IP no puede generar más de 10 veces por hora |

## 🏗️ Arquitectura

```
Navegador (/core, sin sesión)
   │  formulario  →  Server Action  generarNucleo()
   ▼
Server Action
   ├─ valida entrada con zod
   ├─ revisa límite por IP
   ├─ llama a Gemini con CORE_PROMPT
   ├─ valida la salida con coreSchema  ← si falla, error y no guarda
   └─ registra costo en api_costs
   │
   ▼  (la usuaria decide guardar)
Server Action  guardarNucleo()
   └─ inserta en core_outputs (cliente admin, RLS solo lectura pública)
   │
   ▼
Supabase Postgres · tabla core_outputs
```

**Por qué Server Action y no ruta de API:** la llave de Gemini nunca sale del
servidor, y no hay endpoint público que alguien pueda golpear directo.

## 🧰 Stack

| Herramienta | Para qué | Por qué esta |
|---|---|---|
| Next.js 16 · Server Actions | Página y lógica de servidor | Ya es el stack del proyecto; la llave se queda en el servidor |
| Gemini `flash` | Extraer el núcleo | Es razonamiento sobre texto, no visión; el modelo barato basta |
| zod | Contrato de la salida | Un modelo devuelve texto libre tarde o temprano; esto es la reja |
| Supabase Postgres | Tabla `core_outputs` | Ya existe el proyecto y las migraciones |
| Tailwind v4 | Estilos | Mismos tokens que el resto de la app |

## ⚙️ DevOps

- Repo: `vestiamx-code/closetai` (público). Rama `main`, deploy automático.
- Migración nueva `005_core_outputs.sql`, aplicada a producción antes de desplegar.
- Sin variables nuevas: reutiliza `GEMINI_API_KEY` y las de Supabase.
- CI de GitHub Actions ya corre lint, tipos, unitarias y build en cada push.

## 🧪 Plan de pruebas

**Automáticas**
1. Unitaria: el contrato zod rechaza un núcleo sin `esencia`.
2. Unitaria: el contrato rechaza más de 5 principios.
3. e2e: `/core` carga sin sesión y muestra el formulario.
4. e2e: enviar texto válido produce una tarjeta con los 5 campos.
5. e2e: el botón de guardar hace aparecer el núcleo en la lista.

**Tres corridas manuales contra el sitio en vivo**, con entradas distintas,
registrando entrada / resultado esperado / resultado real / qué falló / qué cambié.

## 🤖 Prompt al agente de código

> Construye la página pública `/core` en el proyecto ClosetAI (Next.js 16, App
> Router, Server Actions, Tailwind v4, Supabase).
>
> Toma como fuente la metodología del Apéndice A3 del Documento Maestro y
> conviértela en un módulo generativo: la usuaria escribe en sus palabras cómo le
> gusta vestirse y el módulo devuelve un **núcleo de estilo** estructurado con
> esencia, principios, paleta, siluetas, qué evitar y una regla personal.
>
> Requisitos: la página es pública, sin sesión. La salida del modelo pasa por un
> contrato zod antes de mostrarse y no se guarda si no cumple. Botón de guardar
> que escribe en la tabla `core_outputs`. Debajo, la lista de núcleos guardados.
> Registra el costo de cada llamada en `api_costs` y limita a 10 generaciones por
> IP por hora. Escribe el prompt en `src/lib/ai/prompts/core.ts` versionado, como
> los que ya existen. No inventes columnas: escribe primero la migración.
