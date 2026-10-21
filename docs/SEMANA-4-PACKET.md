# Semana 4 · Build Discipline Packet — Motor de marketing y portada (`/marketing` y `/`)

> Escrito **antes** de tocar código. El commit de este archivo precede al del primer
> archivo de la función; el historial de git lo demuestra.

**Función de la semana:** dos cosas. Una portada que funcione como landing de producto —que
diga qué es ClosetAI, para quién, cuánto cuesta y por qué creerle— y una página pública
`/marketing` con el sistema de marca, la persona objetivo, el contenido de lanzamiento y un
probador A/B que mide titulares con visitas reales.

**Decisiones de marca tomadas por Tamara el 21 de octubre de 2026:**

1. **Titular A/B:** el actual, «Tu estilista, en tu bolsillo.», contra «Ya tienes qué ponerte.»,
   que sale de lo que dijo la persona entrevistada en la Semana 2. La pregunta es si el lenguaje
   de una clienta real le gana al lenguaje de marca.
2. **Persona objetivo:** mujer de 24 a 30 años en la Ciudad de México. Es una **hipótesis**:
   cae dentro del núcleo 18–35 y de los datos de AMVO verificados, pero todavía no se ha
   entrevistado a nadie con ese perfil, y la página lo dice.
3. **Canales:** Instagram y TikTok.
4. **Contenido:** el agente redacta los 10 posts, los 3 guiones y el calendario usando solo datos
   ya verificados; **Tamara los aprueba antes de publicarse**. La página dice que se redactaron
   con IA y los aprobó una persona. Además hay un generador para posts nuevos, marcado como IA y
   «sin revisar» hasta que alguien lo apruebe.

---

## 🧩 Problema

La portada de ClosetAI dice una frase bonita y poco más. Quien llega no sabe en diez segundos
**qué problema le resuelve**, cuánto cuesta, ni por qué creerle a una app que no conoce.
Y todo lo que se construyó en tres semanas —la investigación con fuentes, el simulador de
precios, la privacidad— no aparece en ella.

Además, ClosetAI no tiene con qué salir a buscar a nadie: no hay una voz de marca escrita, no
hay a quién se le habla, no hay un solo post. Y el titular actual se eligió por gusto, nunca se
midió contra otra cosa.

## 👤 Usuaria

1. **La visitante de la portada** — llega desde un post o un enlace, decide en segundos si se
   queda. Es la persona objetivo: mujer de 24 a 30, CDMX.
2. **Tamara, la fundadora** — necesita contenido listo para publicar y una forma honesta de
   saber qué titular funciona mejor.
3. **Quien evalúa ClosetAI** — necesita ver que el marketing dice solo lo que el producto hace.

## 🎯 Éxito (qué debe funcionar al final de la semana)

- La portada explica en una pantalla qué es, para quién y qué cuesta, con una prueba de que
  funciona (la investigación con fuentes) y un camino claro para empezar.
- El titular de la portada es un **experimento real**: cada visitante ve una de dos versiones,
  siempre la misma, y se miden las vistas y los clics.
- `/marketing` carga sin cuenta y muestra: sistema de marca, persona, texto de la landing,
  10 posts, 3 guiones de video, calendario de 14 días, los resultados A/B y los recursos guardados.
- Cada pieza se puede copiar, y los posts, guiones y calendario se pueden exportar.
- El generador crea un post nuevo con IA, lo valida y lo guarda marcado como «sin revisar».
- 2 pruebas A/B + 3 de software, corridas contra producción.

## 🖼️ Concepto de UX

Wireframe en `docs/evidencia/mockups/10-marketing-wireframe.png`. La generación de imágenes de
Gemini sigue sin poderse usar —no tiene nivel gratuito y la facturación no está activa—, así que,
como en la Semana 3, el concepto de UX es el wireframe.

- **La portada se lee de arriba abajo como un argumento:** qué es → el problema dicho con
  palabras de clienta → cómo funciona en tres pasos → prueba (datos con fuente) → precio →
  privacidad → empezar.
- **`/marketing` es una mesa de trabajo, no un folleto:** cada pieza en una tarjeta con su
  canal, su estado (aprobado o sin revisar) y sus botones de copiar y exportar.
- **Los resultados A/B dicen «todavía no hay ganador»** mientras no haya datos suficientes,
  en vez de enseñar un porcentaje que parece decisión y es ruido.

## ✂️ Recorte de alcance

| Fuera | Por qué |
|---|---|
| Publicar en Instagram y TikTok desde la página | Requiere cuentas de negocio y APIs con revisión; el botón de copiar resuelve lo mismo esta semana |
| Imágenes generadas para los posts | La generación de imágenes no tiene nivel gratuito |
| Editar el contenido desde la página | Los textos los aprueba Tamara; un editor público sería una puerta para cambiarlos |
| Declarar un ganador del A/B esta semana | Con el tráfico actual no se llega a una muestra suficiente; se publica el método, no un ganador falso |
| Herramienta de analítica de terceros | Una tabla propia basta para contar vistas y clics, y no manda datos de nadie a otra empresa |
| Tocar `proxy.ts` para asignar la variante | Ahí vive la sesión, que ya se rompió una vez en producción. La variante se elige en el servidor y el navegador la recuerda |

## 🧱 Especificación y criterios de aceptación

| # | Requisito | Criterio de aceptación (comprobable) |
|---|---|---|
| 1 | Portada mejorada | `/` muestra, en orden: titular, problema, cómo funciona (3 pasos), prueba con fuente, precio, privacidad y llamada a empezar |
| 2 | Titular A/B | Cada visitante ve **una** de las dos variantes, y la misma al recargar |
| 3 | Medición honesta | Se cuenta **una vista y un clic por visitante**, no por recarga. El tráfico de las pruebas automáticas no se cuenta |
| 4 | Página pública | `GET /marketing` responde 200 sin sesión |
| 5 | Sistema de marca | Nombre, colores con su código, tipografías, voz (qué sí y qué no) y el riesgo de marca conocido |
| 6 | Persona | Un perfil con cada rasgo marcado como **dato** (con fuente) o **hipótesis** |
| 7 | Texto de la landing | El texto de la portada, con botón de copiar |
| 8 | 10 posts | 10 tarjetas con canal y formato; cada una se copia; se exportan todas |
| 9 | 3 guiones | 3 guiones de video corto con duración y tomas; se copian y exportan |
| 10 | Calendario de 14 días | 14 días, cada uno con canal y la pieza que se publica; se exporta en CSV |
| 11 | Resultados A/B | Vistas, clics y conversión por variante; **sin ganador** si no hay muestra suficiente o la diferencia no es significativa |
| 12 | Generador | Crea un post con IA a partir de un tema; **rechaza** un post que invente cifras; se guarda como «generado con IA, sin revisar» |
| 13 | Recursos guardados | La lista muestra lo guardado con su origen y estado |

## 🏗️ Arquitectura

```
Navegador (/ y /marketing — sin sesión)
   │
   ├── /  (Server Component, dinámico)
   │      lee la cookie `cai_visitante`; si no existe, crea un id al azar
   │      variante = hash(id + experimento) mod 2   ← función pura, probada
   │      └── <Experimento> (cliente): guarda la cookie, registra la vista,
   │                                   registra el clic en «Empezar»
   │
   ├── /marketing (Server Component)
   │      lee marca, persona, contenido y resultados A/B de Postgres
   │      └── tarjetas con copiar / exportar (cliente, sin servidor)
   │      └── generador → Server Action → Gemini → contrato zod
   │                         + rechazo de cifras inventadas → guarda
   ▼
Supabase Postgres
   ├── marketing_assets   (posts, guiones, días del calendario; lectura pública)
   ├── ab_experiments     (los experimentos y sus variantes; lectura pública)
   └── ab_events          (una vista y un clic por visitante; SOLO servidor)
```

**Por qué la variante no se elige en `proxy.ts`:** sería el lugar natural para poner la cookie,
pero ese archivo es el que refresca la sesión, y en la Semana 0 un cambio ahí hizo que la sesión
se cayera sola en producción con todas las pruebas en verde. El costo de la alternativa es menor:
la primera visita elige la variante en el servidor y el navegador guarda la cookie.

**Por qué una vista por visitante:** si se contaran recargas, una sola persona que recarga diez
veces movería el resultado. La unidad del experimento es la persona.

**Privacidad:** `ab_events` guarda el hash del id al azar, nunca la IP, y no se puede leer con la
llave pública. Es la regla que quedó de la Semana 3: una tabla se abre solo si todas sus columnas
son públicas.

## 🧰 Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | Next.js 16 (App Router) | Ya en uso |
| Asignación A/B | Hash FNV-1a en `src/lib/ab.ts` | Determinista, sin dependencias, se prueba en milisegundos |
| Significancia | Prueba z de dos proporciones, en el mismo archivo | Es la prueba estándar para comparar dos tasas de conversión; 30 líneas, sin librería |
| Exportar | `Blob` en el navegador | Un CSV no necesita servidor |
| Generador | Gemini 3.5 Flash, con respaldo Flash-Lite | Ya integrado, con el manejo de saturación de la Semana 2 |
| Base | Supabase Postgres + RLS | Ya en uso |
| Pruebas | Vitest + Playwright | Ya en uso |

## ⚙️ DevOps

- **GitHub:** `vestiamx-code/closetai`, rama `main`, CI en verde por commit.
- **Vercel:** despliegue automático en cada push; mínimo 2 esta semana.
- **Supabase:** migración `20261021000010_marketing.sql` (tablas y experimentos) y
  `20261021000011_marketing_contenido.sql` (el contenido, **después** de que Tamara lo apruebe).
  Las dos se aplican solo con su permiso explícito y se verifican por REST.
- **Variables de entorno:** ninguna nueva.
- **Vuelta atrás:** la portada nueva es un solo commit; revertirlo regresa la anterior.

## 🧪 Plan de pruebas

**2 pruebas A/B** (Vitest, sobre `src/lib/ab.ts`):

1. **La asignación es estable y pareja:** el mismo visitante recibe siempre la misma variante,
   y en 10,000 visitantes al azar cada variante queda entre 48% y 52%.
2. **No se declara un ganador falso:** con menos de 100 visitantes por variante, o con una
   diferencia que no es significativa al 95%, el resultado es «sin ganador». Con una diferencia
   grande y muestra suficiente, sí lo hay, y es la variante correcta.

**3 pruebas de software** (Playwright, contra producción):

3. `/marketing` carga sin sesión con 10 posts, 3 guiones y 14 días de calendario.
4. Exportar el calendario descarga un CSV con 14 filas y su encabezado; copiar un post pone su
   texto en el portapapeles.
5. La portada muestra **exactamente uno** de los dos titulares, el mismo al recargar, y una
   visita de prueba **no** se cuenta en los resultados.

Y además: el generador rechaza un post con una cifra que no está en los datos verificados
(prueba unitaria), y la portada tiene las siete secciones en orden (e2e).

**Cada prueba nueva se ve fallar a propósito antes de darla por buena.**

## 🤖 Prompt al agente de código

```
Construye la Semana 4 de ClosetAI (Next.js 16, App Router, Tailwind v4, Supabase).

ALCANCE EXACTO, nada más:
1. src/lib/ab.ts — funciones puras: varianteDe(visitante, experimento) con hash FNV-1a
   mod 2, y resultado(a, b) con prueba z de dos proporciones: sin ganador si alguna
   variante tiene menos de 100 visitantes o p ≥ 0.05.
2. Portada (/): titular A/B, problema, cómo funciona en 3 pasos, prueba con fuente,
   precio, privacidad y llamada a empezar. La variante se elige en el servidor a partir
   de la cookie cai_visitante; NO toques src/proxy.ts.
3. Server Action registrarEvento: una vista y un clic por visitante (unique), hash del
   id, ignora el tráfico marcado como prueba.
4. /marketing: marca, persona (dato vs hipótesis), texto de la landing, 10 posts,
   3 guiones, calendario de 14 días, resultados A/B, generador y recursos guardados.
   Botones de copiar y exportar (md y csv) en el navegador.
5. Generador: Gemini con respaldo; contrato zod; rechaza cifras que no estén en la lista
   de datos verificados; guarda con origen 'generado_ia' y aprobado = false.
6. Migraciones 010 (tablas, experimentos) y 011 (contenido aprobado).

REGLAS:
- Interfaz en español de México.
- Ningún dato que no esté en docs/evidencia/INVESTIGACION-SEMANA-2.md, el Documento
  Maestro §2.3 o la tabla pricing_assumptions.
- No uses la cita de la entrevista en el contenido de redes: el permiso fue para la página
  de investigación y el documento, no para publicidad.
- Pruebas: 2 A/B y 3 de software; verlas fallar antes de creerles.
```

Esa última regla no estaba en las decisiones: la añadió el agente al redactar el plan. El
consentimiento de la Semana 2 se dio para usar la entrevista sin nombre «en la web y en el PDF».
Una campaña en redes es otro uso, y no se le preguntó.

## ✅ Criterios de la rúbrica cubiertos

| Requisito de la semana | Dónde queda |
|---|---|
| Portada mejorada | closetai.lat |
| Sistema de marca | `/marketing` |
| Persona objetivo | `/marketing`, con dato vs hipótesis |
| Texto de la landing | La portada, y en `/marketing` con botón de copiar |
| 10 posts sociales | `/marketing`, tabla `marketing_assets` |
| 3 guiones de video | `/marketing` |
| Calendario de 14 días | `/marketing`, exportable en CSV |
| Prueba A/B de titulares | La portada mide; `/marketing` muestra |
| Recursos guardados | `marketing_assets` y la lista pública |
| 2 pruebas A/B + 3 de software | Plan de pruebas, arriba |
| Commits, despliegues, prompts | Mínimo 5, 2 y 5 |
| Iteración y nota de decisión | `ITERATION_LOG.md` y `DECISION_NOTES.md` |
| Video de 2–3 minutos | Grabado contra producción, narrado por Tamara |
