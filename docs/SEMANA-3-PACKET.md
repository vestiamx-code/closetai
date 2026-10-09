# Semana 3 · Build Discipline Packet — Arquitectura de producto y simulador de precios (`/product` y `/pricing`)

> Escrito **antes** de tocar código. El commit de este archivo precede al del primer
> archivo de la función; el historial de git lo demuestra.

**Función de la semana:** dos páginas públicas. `/product` explica qué hace ClosetAI y qué
entra en cada plan. `/pricing` muestra los tres planes y un simulador de ingresos que
calcula, con supuestos editables, cuánto dinero dejaría cada escenario y cuánto cuesta
servirlo.

**Decisiones de negocio tomadas por Tamara el 6 de octubre de 2026** (quedaron fuera del
alcance del agente):

1. Los tres planes son los que ya estaban decididos en el Documento Maestro §2.3: Gratis,
   ClosetAI Completo ($100 MXN una sola vez) y Recarga ($49 MXN por 20 créditos). La
   suscripción **no** se sube a plan; se queda como escenario del simulador, que es
   justamente la pregunta abierta.
2. Los dos segmentos que se comparan son el **núcleo 18–35** y **36+**, el de la
   conversación real de la Semana 2. Son los únicos dos sobre los que hay evidencia propia.

---

## 🧩 Problema

El precio de ClosetAI está decidido, pero **nadie puede comprobarlo**. Vive en una tabla de
un markdown privado: ni una clienta sabe qué incluye cada plan, ni quien evalúa el proyecto
puede ver si el precio cubre lo que cuesta servirlo.

Y hay una pregunta sin responder desde la Semana 2. La conversación real dejó dos cosas
claras: la persona entrevistada **ya paga suscripciones** (Disney+, 339 MXN al mes) y
**nadie ha confirmado** que pagaría un pago único por ClosetAI. El Documento Maestro
apuesta por el pago único; la evidencia de la categoría apunta a los dos lados —Stylebook
lleva 17 años con un pago único de $4.99 USD, y Style DNA factura ~$3M USD al año con
suscripción—. Esa decisión se está tomando a ciegas.

El riesgo concreto: el try-on **cuesta dinero cada vez** (~$0.075 USD por render). Un
precio mal puesto no se nota en la pantalla; se nota cuando cada venta pierde dinero.

## 👤 Usuaria

1. **Tamara, la fundadora** — necesita ver, con números y supuestos explícitos, qué pasa
   con el ingreso y el margen si cambia el precio, la conversión o el uso de créditos.
2. **Quien evalúa ClosetAI** (profesora, inversionista) — necesita ver la aritmética, no
   una afirmación: de dónde sale cada número y qué pasa si el supuesto es falso.
3. **La clienta** — necesita entender en una pantalla qué le dan gratis, qué cuesta y qué
   no se le va a cobrar nunca (el clóset que ya armó).

## 🎯 Éxito (qué debe funcionar al final de la semana)

- `/product` y `/pricing` cargan **sin cuenta** en closetai.lat.
- `/product`: mapa de funciones del producto, cada función marcada con el plan que la
  incluye y con su estado real (ya construida / esta semana / planeada).
- `/pricing`: los 3 planes, los 2 segmentos, la calculadora de ingresos
  (mensual y anual), el selector de escenario, la tabla de supuestos con su fuente, y los
  escenarios guardados.
- La aritmética es **auditable**: cada resultado se puede reproducir con los supuestos que
  están en la pantalla.
- Guardar un escenario escribe en Supabase y aparece en la lista sin recargar.
- 2 pruebas de lógica de precios + 3 de software, corridas contra producción.

## 🖼️ Concepto de UX

Wireframe en `docs/evidencia/mockups/08-pricing-wireframe.png`. Decisiones:

> **Lo que se planeó y no se pudo hacer.** Este plan decía que además habría un mockup generado con
> imagen, como el de la Semana 2. El 9 de octubre se intentó con los cuatro modelos de imagen de
> Gemini y los cuatro respondieron **429, cuota excedida**: la generación de imágenes no tiene nivel
> gratuito y la facturación de la cuenta no está activa. El criterio de la rúbrica pide "mockup **o**
> wireframe", así que la entrega va con el wireframe, y esto queda escrito en vez de callado.

- **Una sola columna**, como `/research`. La calculadora arriba, el resultado inmediatamente
  debajo: quien mueve un número tiene que ver el efecto sin desplazarse.
- El resultado se muestra **en pesos y al mes**, con el anual al lado, nunca solo un
  porcentaje: un margen de 50% no dice si alcanza para comer.
- **Barras en CSS**, sin librería de gráficas: tres barras comparando escenarios pesan menos
  que 200 KB de JavaScript y se ven igual en el teléfono.
- Cada supuesto lleva un distintivo: **verificado** (con fuente y fecha) o **supuesto**
  (sin evidencia todavía). No se mezclan. Es la misma regla de la Semana 2.

## ✂️ Recorte de alcance

Lo que se ve bien y **no** se construye esta semana:

| Fuera | Por qué |
|---|---|
| Cobrar de verdad los planes nuevos | Stripe ya cobra el plan Completo; tocar el cobro por un ejercicio de precios arriesga dinero real |
| Suscripción como plan vivo | Nadie ha dicho que la pagaría. Entra como escenario del simulador, no como oferta |
| Cuenta para guardar escenarios | `/pricing` es público, como `/research`. Guardar se protege con límite por IP, no con login |
| Gráfica interactiva (hover, zoom) | Tres barras en CSS resuelven la comparación; una librería no cabe en el presupuesto de la semana |
| Proyección a 36 meses | 12 meses ya obliga a decidir; más allá es ficción con decimales |
| Simulación de churn | Sin un solo usuario de pago, un modelo de abandono sería inventar un número y luego creerle |

## 🧱 Especificación y criterios de aceptación

| # | Requisito | Criterio de aceptación (comprobable) |
|---|---|---|
| 1 | Páginas públicas | `GET /product` y `GET /pricing` responden 200 sin cookies de sesión |
| 2 | Mapa de funciones | `/product` lista las funciones agrupadas por plan; cada una indica si ya existe, se hizo esta semana o está planeada |
| 3 | 3 planes | `/pricing` muestra Gratis, Completo ($100 MXN único) y Recarga ($49 MXN / 20 créditos), cada uno con lo que incluye y su costo variable para nosotros |
| 4 | 2 segmentos | El simulador calcula por separado el núcleo 18–35 y el de 36+, y muestra el total |
| 5 | Calculadora | Entradas: registros nuevos al mes por segmento, % que paga el Completo, % que compra recarga, créditos usados al mes por persona de pago. Cambiar cualquiera recalcula sin recargar |
| 6 | Ingreso mensual y anual | Muestra ingreso bruto, costo variable, ingreso neto y margen, al mes y a 12 meses |
| 7 | Selector de escenario | Conservador / Base / Optimista cambian los supuestos de conversión; **el optimista nunca puede dar menos que el base, ni el base menos que el conservador** |
| 8 | Tabla de supuestos | Cada supuesto muestra su valor, su origen y si está **verificado** (con fuente y fecha) o es un **supuesto** sin evidencia |
| 9 | Guardar escenario | Escribe una fila en `pricing_scenarios` con sus supuestos y resultados, y aparece en la lista sin recargar |
| 10 | Escenarios guardados | La lista pública muestra nombre, escenario, ingreso neto mensual y fecha |
| 11 | Privacidad y límite | El límite por IP **no guarda la IP**: se guarda su hash. Máximo 20 escenarios por hora por IP |

El requisito 11 nace de una revisión de esta semana: al responder qué datos pide ClosetAI,
se encontró que las IP se guardaban enteras y sin fecha de borrado. La tabla nueva no
repite ese error.

## 🏗️ Arquitectura

```
Navegador (/product, /pricing — sin sesión)
   │
   │  Server Component: lee planes, funciones y supuestos desde Postgres
   ▼
Next.js 16 (App Router, Vercel)
   │
   ├── /product  — mapa de funciones, estático desde la base
   ├── /pricing  — planes + simulador (cliente) + escenarios guardados
   │        │
   │        │  La aritmética vive en src/lib/precios.ts — sin React, sin red:
   │        │  entra un objeto de supuestos, sale un objeto de resultados.
   │        │  Esa función es la que prueban las pruebas de lógica.
   │        │
   │        ▼
   │   Server Action `guardarEscenario`
   │        │  valida con zod · recalcula en el servidor (no confía en el navegador)
   │        │  · hash de IP · límite 20/hora
   │        ▼
   └──> Supabase Postgres
          ├── pricing_plans     (3 filas, lectura pública)
          ├── pricing_features  (mapa de funciones, lectura pública)
          ├── pricing_assumptions (supuestos con fuente y si están verificados)
          └── pricing_scenarios (escenarios guardados; escritura solo del servidor)
```

**La decisión de diseño de la semana:** el cálculo se hace **dos veces**. En el navegador
para que se vea al instante, y otra vez en el servidor antes de guardar. Si alguien cambia
los números en el navegador, lo que se guarda sigue siendo el resultado de los supuestos,
no el que mandó. Es el mismo principio del contrato de la Semana 2: la pantalla pide, el
servidor decide.

## 🧰 Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | Next.js 16 (App Router) | Ya en uso; Server Components leen la base sin API intermedia |
| Aritmética | TypeScript puro en `src/lib/precios.ts` | Sin React ni red: se prueba con Vitest en milisegundos y se reusa en cliente y servidor |
| Estilos | Tailwind v4 | Ya en uso |
| Gráfica | CSS (`flex` + `height`) | Tres barras no justifican una librería |
| Base | Supabase Postgres + RLS | Ya en uso; lectura pública, escritura solo con la llave de servicio |
| Validación | zod | Mismo patrón que `/core` y `/research` |
| Pruebas | Vitest (lógica) + Playwright (producción) | Ya en uso |
| IA | **ninguna** | El precio es aritmética, no generación. Meterle un modelo sería caro, lento y no reproducible |

Que esta semana no lleve IA es una decisión, no un olvido: un número que cambia cada vez
que se pregunta no sirve para decidir un precio.

## ⚙️ DevOps

- **GitHub:** `vestiamx-code/closetai`, rama `main`, CI en verde por commit.
- **Vercel:** despliegue automático a producción en cada push; mínimo 2 esta semana.
- **Supabase:** migración `20261006000008_pricing.sql`, aplicada a producción **solo con
  permiso explícito de Tamara** y verificada por REST, no por pantalla.
- **Variables de entorno:** ninguna nueva. Se usa `SUPABASE_SERVICE_ROLE_KEY` que ya existe.
- **Vuelta atrás:** las páginas son aditivas; si algo sale mal, se revierte el commit y
  Vercel vuelve al despliegue anterior. La migración solo crea tablas nuevas.

## 🧪 Plan de pruebas

**2 pruebas de lógica de precios** (Vitest, sobre `src/lib/precios.ts`):

1. **Una venta de $100 MXN deja margen positivo aunque la persona queme sus 30 créditos.**
   Stripe cobra 3.6% + $3 MXN + IVA; 30 renders cuestan ~$2.25 USD. La prueba fija el
   resultado en pesos y falla si el margen cae por debajo de 50%.
2. **Los escenarios están ordenados:** con los mismos registros, optimista ≥ base ≥
   conservador, en ingreso neto. Si un cambio de supuestos rompe el orden, es un error de
   modelo, no de opinión.

Y además: conversión 0% ⇒ ingreso 0 y costo 0 (que la calculadora no invente ingreso de
usuarios gratis), y el anual es exactamente 12 veces el mensual cuando los supuestos no
cambian en el año — escrito así para que, el día que se agregue estacionalidad, la prueba
falle y obligue a actualizar la explicación.

**3 pruebas de software** (Playwright, contra producción):

3. `/pricing` carga sin sesión, muestra los 3 planes y los 2 segmentos.
4. Cambiar un número de la calculadora cambia el ingreso que se muestra, y cambiar de
   escenario también.
5. Guardar un escenario lo agrega a la lista sin recargar, y el valor guardado coincide con
   el que calculó el servidor, no con el que mandó el navegador.

Y `/product` carga sin sesión y muestra el mapa de funciones.

**Cómo se verifica que una prueba sirve:** cada prueba nueva se ve fallar a propósito —
rompiendo el código que debe proteger— antes de darla por buena. Es la lección de la
Semana 1 y de la Semana 2.

## 🤖 Prompt al agente de código

```
Construye /product y /pricing en ClosetAI (Next.js 16, App Router, Tailwind v4, Supabase).

ALCANCE EXACTO, nada más:
1. src/lib/precios.ts — función pura calcular(supuestos): resultados.
   Sin React, sin red, sin IA. Entradas: registros nuevos al mes por segmento
   (nucleo, mayores), % que compra el plan Completo, % que compra recarga,
   créditos usados al mes por persona de pago, escenario (conservador|base|optimista).
   Constantes con su origen: plan Completo 100 MXN, recarga 49 MXN/20 créditos,
   render de try-on 0.075 USD, tipo de cambio 18.87 MXN/USD, Stripe 3.6% + 3 MXN + IVA 16%.
   Salida: por segmento y total — ingreso bruto, costo variable, neto, margen,
   mensual y a 12 meses.
2. /pricing — 3 planes, 2 segmentos, calculadora, selector de escenario,
   tabla de supuestos (verificado vs supuesto), barras en CSS, escenarios guardados.
3. /product — mapa de funciones por plan, con el estado real de cada una.
4. Server Action guardarEscenario: valida con zod, RECALCULA en el servidor,
   guarda el resultado del servidor, limita a 20 por hora por hash de IP.
   Nunca guardes la IP en claro.
5. Migración 20261006000008_pricing.sql: pricing_plans, pricing_features,
   pricing_assumptions, pricing_scenarios. Lectura pública, escritura solo service_role.

REGLAS:
- Todo el texto de la interfaz en español de México.
- Cada supuesto de la tabla dice si está verificado (con fuente y fecha) o no lo está.
- No inventes datos de mercado: los únicos números verificados son los de
  docs/evidencia/INVESTIGACION-SEMANA-2.md y el Documento Maestro §2.3.
- Nada de IA en estas páginas.
- Pruebas: 2 de lógica (margen por venta, orden de escenarios) y 3 de software
  contra producción. Ver cada prueba nueva fallar antes de darla por buena.
```

## ✅ Criterios de la rúbrica cubiertos

| Requisito de la semana | Dónde queda |
|---|---|
| Página en vivo `/product` y `/pricing` | closetai.lat/product · closetai.lat/pricing |
| Mapa de funciones | `/product` |
| 3 planes | `/pricing` |
| 2 segmentos | Simulador, columnas separadas y total |
| Calculadora de ingresos | `/pricing` |
| Selector de escenario | Conservador / Base / Optimista |
| Tabla de supuestos | `/pricing`, con la marca de verificado |
| Escenarios guardados | Tabla `pricing_scenarios` y lista pública |
| 2 pruebas de precios + 3 de software | Plan de pruebas, arriba |
| Mínimo 5 commits y 2 despliegues | DevOps |
| Log de prompts (mínimo 5) | `docs/evidencia/PROMPT_LOG.md` |
| Iteración y nota de decisión | `ITERATION_LOG.md` y `DECISION_NOTES.md` |
| Video de 2–3 minutos | Grabado contra producción, narrado por Tamara |
