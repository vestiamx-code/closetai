# Semana 2 · Build Discipline Packet — Investigación y benchmarking (`/research`)

> Escrito **antes** de tocar código. El commit de este archivo precede al del primer
> archivo de la función; el historial de git lo demuestra.

**Función de la semana:** un módulo de investigación público en `/research` que pruebe que
el problema es real e identifique competidores, sustitutos, referentes y huecos.

La investigación ya existía: el §2.2 del Documento Maestro. Pero vivía en un markdown que
nadie podía comprobar, y **al verificarlo fuente por fuente, nueve afirmaciones no
sobrevivieron** (ver `docs/evidencia/INVESTIGACION-SEMANA-2.md`). Esta semana esa
investigación se convierte en un tablero vivo donde cada dato enlaza a su fuente.

---

## 🧩 Problema

ClosetAI se diseñó sobre una tesis de mercado —"no hay nadie para México"— escrita en agosto
con investigación de escritorio. Al revisarla, parte era falsa: **sí hay apps de clóset en
español**, y **ya existe una app llamada "Closet AI"**. Construir tres semanas más sobre una
tesis sin verificar es el error más caro que puede cometer un producto nuevo.

Además, nadie fuera del proyecto —un profesor, una inversionista, una posible usuaria—
puede comprobar hoy por qué ClosetAI tendría lugar en el mercado.

## 👤 Usuaria

1. **Tamara, la fundadora**, que necesita decidir con evidencia: qué construir, a qué precio y
   con qué nombre.
2. **Quien evalúa ClosetAI** (profesor, inversionista), que necesita ver la prueba en vez de
   creerla.
3. **La persona entrevistada**, cuya conversación real se vuelve evidencia con su permiso.

## 🎯 Éxito (qué debe funcionar al final de la semana)

- `/research` carga en producción, **sin sesión**.
- Cada dato de la página enlaza a su fuente y trae fecha de verificación.
- 5 referentes globales, localización a México, y al menos 8 competidores y sustitutos en una
  tabla que se puede filtrar y buscar.
- Un mapa de riesgos donde cada riesgo apunta a la evidencia que lo sostiene.
- Una pregunta de investigación produce un informe **que solo usa los datos verificados** y
  cita cada afirmación; se puede guardar y queda en Supabase.
- **Una conversación real con una persona**, registrada con su consentimiento. Si todavía no
  existe, la página dice "pendiente": nunca se simula.

## 🖼️ Concepto de UX

Una sola página, de arriba abajo, ordenada como se lee un argumento:

1. **Panel de resumen** (widget): cuántos competidores, sustitutos, referentes y riesgos hay,
   el riesgo más alto y si ya hubo validación con una persona.
2. **Pregunta de investigación** → informe con citas → guardar.
3. **5 referentes globales** en tarjetas.
4. **México**: los datos locales.
5. **Competidores y sustitutos**: tabla con filtro por tipo y búsqueda.
6. **Mapa de riesgos**: cuadrícula de probabilidad × impacto.
7. **Validación con una persona real.**
8. **Investigaciones guardadas.**
9. **Lo que descartamos** por no poder verificarlo.

Mockup generado con imagen y wireframe en `docs/evidencia/mockups/`.

## ✂️ Recorte de alcance

Se queda fuera **a propósito**:

- **Que la IA investigue en internet.** Un modelo que busca y resume inventa cifras con total
  seguridad; en esta misma investigación el buscador se equivocó dos veces. La IA solo razona
  sobre datos que una persona ya verificó.
- **Actualizar competidores automáticamente** (scraping). Frágil, contra los términos de varias
  tiendas, y cambia datos sin que nadie los revise.
- **Editar la investigación desde la página.** Los datos entran por migración, con su fuente;
  un formulario público de edición sería una puerta abierta.
- **Gráficas con librería.** El mapa de riesgos es una cuadrícula de CSS.
- **Más de una conversación de validación.** La tarea pide una; hacerla bien vale más que hacer
  cinco apuradas.
- **Cuentas.** Pública, como `/core`.

## 🧱 Especificación y criterios de aceptación

| # | Requisito | Criterio de aceptación (comprobable) |
|---|---|---|
| 1 | Página pública | `GET /research` responde 200 sin cookies de sesión |
| 2 | Panel de resumen | Los conteos salen de la base de datos, no están escritos en el código |
| 3 | 5 referentes globales | 5 tarjetas, cada una con dato clave, lección, enlace a la fuente y fecha |
| 4 | Localización a México | Sección con los datos de México, cada uno con su fuente |
| 5 | Competidores y sustitutos | Tabla con al menos 8 filas de tipo competidor o sustituto |
| 6 | Filtro y búsqueda | Filtrar por tipo muestra solo ese tipo; buscar "mexico" encuentra "México" (sin importar acentos); sin resultados aparece un mensaje, no una tabla vacía |
| 7 | Mapa de riesgos | Cada riesgo se coloca por probabilidad × impacto y muestra su mitigación y su evidencia |
| 8 | Pregunta de investigación | Acepta 20–500 caracteres; el informe pasa un contrato zod; **toda fuente citada existe en los datos**; una afirmación sin fuente se rechaza; si los datos no alcanzan, el informe lo dice en vez de inventar |
| 9 | Guardar | Escribe una fila en `research_outputs` y aparece en la lista sin recargar |
| 10 | Validación humana | Muestra la conversación real registrada; si no hay, dice "pendiente" |
| 11 | Costo y límite | Cada informe registra su costo; una IP no genera más de 10 por hora |

## 🏗️ Arquitectura

```
Navegador (/research, sin sesión)
   │
   ▼
Server Component
   └─ lee de Supabase: research_sources · research_risks
                       validation_conversations · research_outputs
   │
   ├─ Tabla (cliente): filtro y búsqueda sobre las filas ya cargadas
   ├─ Mapa de riesgos: cuadrícula 3×3
   │
   └─ Formulario → Server Action generarInvestigacion()
        ├─ valida la pregunta con zod
        ├─ revisa límite por IP
        ├─ lee los datos verificados de Supabase
        ├─ llama a Gemini con RESEARCH_PROMPT + esos datos, identificados por id
        ├─ valida el informe: contrato zod + cada fuente citada existe   ← si falla, no se guarda
        └─ registra el costo en api_costs
             │
             ▼  (la persona decide guardar)
        Server Action guardarInvestigacion()  ← revalida: se puede llamar por POST directo
             └─ inserta en research_outputs
```

**Por qué la IA no busca en internet:** el informe solo puede citar ids que existen en la
tabla. Un dato que no está verificado no puede aparecer, porque el contrato lo rechaza.

## 🧰 Stack

| Herramienta | Para qué | Por qué esta |
|---|---|---|
| Next.js 16 · Server Components y Actions | Página y lógica | Stack del proyecto; la llave de Gemini no sale del servidor |
| Supabase Postgres | 4 tablas nuevas | Los datos de investigación son evidencia: tienen que vivir en la base, no en el código |
| Gemini `flash` | Informe a partir de los datos | Razonamiento sobre texto corto; el modelo barato basta |
| zod | Contrato del informe y de las citas | La reja entre lo que dice el modelo y lo que se muestra |
| Tailwind v4 | Estilos y mapa de riesgos | Sin librería de gráficas: una cuadrícula alcanza |

Sin dependencias nuevas.

## ⚙️ DevOps

- Repo `vestiamx-code/closetai` (público). Rama `main`, despliegue automático en Vercel.
- Migración nueva `006_research`: crea las 4 tablas **y siembra los datos verificados** con su
  fuente y fecha. Se aplica a producción **antes** de desplegar.
- RLS en las 4 tablas: lectura pública, escritura solo desde el servidor.
- Sin variables nuevas.
- GitHub Actions corre lint, tipos, unitarias y build en cada push.

## 🧪 Plan de pruebas

**Automáticas**
1. Unitaria: el contrato rechaza un informe que cita una fuente que no existe.
2. Unitaria: el contrato rechaza una afirmación sin fuente.
3. Unitaria: la búsqueda encuentra "México" escribiendo "mexico".
4. e2e: `/research` carga sin sesión y la tabla tiene al menos 8 filas.
5. e2e: buscar algo que no existe muestra el mensaje de "sin resultados".
6. e2e: el mapa de riesgos muestra todos los riesgos.
7. e2e: generar y guardar un informe escribe una fila en `research_outputs`.

**Tres corridas contra el sitio en vivo**, incluida **una pregunta que los datos no pueden
responder**, para comprobar que el informe lo admite en vez de inventar.

**Una conversación real** de Tamara con una persona del segmento, con guía de preguntas sobre
comportamiento pasado —no opiniones sobre la idea—, registrada con consentimiento.

## 🤖 Prompt al agente de código

> Construye la página pública `/research` en ClosetAI (Next.js 16, App Router, Server
> Components y Actions, Tailwind v4, Supabase).
>
> Fuente de verdad: `docs/evidencia/INVESTIGACION-SEMANA-2.md`. No agregues ningún dato que
> no esté ahí, con su fuente.
>
> Primero la migración `006_research`: tablas `research_sources`, `research_risks`,
> `validation_conversations` y `research_outputs`, con RLS de lectura pública y escritura solo
> desde el servidor. Siembra los datos verificados con su URL de fuente y fecha. La tabla de
> validación exige consentimiento y **no se siembra**: la llena Tamara con una conversación real.
>
> La página muestra, en este orden: un panel de resumen con conteos calculados desde la base;
> un formulario de pregunta de investigación; 5 tarjetas de referentes globales; la sección de
> México; la tabla de competidores y sustitutos con filtro por tipo y búsqueda sin acentos; un
> mapa de riesgos 3×3; la conversación de validación o "pendiente"; las investigaciones
> guardadas; y lo que se descartó por no poder verificarlo.
>
> El informe lo genera Gemini **solo** a partir de las filas de la base, identificadas por id.
> Contrato zod: cada afirmación trae al menos una fuente y cada fuente debe existir en los
> datos; si no alcanzan, el informe lo dice. Versiona el prompt en
> `src/lib/ai/prompts/research.ts`. Registra el costo en `api_costs` y limita a 10 informes por
> IP por hora, como en `/core`.
