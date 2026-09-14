# Semana 2 · Investigación verificada

**Fecha de verificación:** 14 de septiembre de 2026.

Este archivo es la **fuente de verdad** de `/research`. Cada dato que aparece en la página
sale de aquí, y cada dato de aquí se comprobó abriendo la fuente, no leyendo el resumen de
un buscador.

La distinción importa porque en esta misma investigación **el buscador se equivocó dos
veces**: resumió que Indyx cobra estilista desde $25 al mes (la página dice $15) y que
GoTrendier cobra 20% + $9 de comisión (el desarrollador dice 14% + $14).

---

## 1. Lo que corrigió esta investigación en el Documento Maestro

El §2.2 del Documento Maestro se escribió en agosto a partir de investigación de escritorio.
Al verificarlo fuente por fuente, **nueve afirmaciones no sobrevivieron tal cual**:

| # | El Documento Maestro decía | Lo que dice la fuente | Consecuencia |
|---|---|---|---|
| 1 | "No existe ningún jugador nativo en español/LATAM" | Hay apps de clóset con interfaz en español en App Store ("Clóset Virtual y Outfits", "IA Outfit Planner – Estilista") | **La tesis cambia:** el hueco no es el idioma, es México (tallas, tiendas, precios en MXN) |
| 2 | Style DNA es "bootstrapped" | Su fundador: *"funded the initial MVP with my personal savings and then attracted angel investors and partnered with a fund"* | Monetizó, pero con capital externo |
| 3 | Acloset: "paywall de €130/año" | App Store EE.UU.: planes de $3.99 a $24.99 USD/mes, o hasta $147.99/año | Cobra por tamaño de clóset |
| 4 | Alta y Doji levantaron en 2026 (implícito) | Alta: jun-2025. Doji: may-2025 | Son rondas de 2025 |
| 5 | Try-on de Google "disponible en México" | Reportado para **Latinoamérica** (may-2026); México no aparece por nombre | Se marca como no confirmado |
| 6 | (no mencionado) | Existe una app llamada **"Closet AI – Outfit Planner"** en iPhone, y "AI Closet" en Google Play | **Riesgo de marca nuevo** |
| 7 | Ticket promedio de moda online ~$1,300 MXN | No encontramos la fuente de esa cifra | Se excluye |
| 8 | (no mencionado) | GoTrendier, mexicana, tiene más de 8 M de usuarios | La segunda mano ya tiene escala en México |
| 9 | (no mencionado) | Indyx cobra $295 USD por catalogar 100 prendas | Evidencia de que catalogar es una fricción real |

## 2. Lo que se descartó por no poder verificarlo

Se quedan **fuera de la página**. Pueden ser ciertos, pero no los pudimos comprobar:

- Que Chicisimo haya sido la app de moda #1 en México en 2014 (la fuente que lo diría bloquea el acceso).
- Que el 90% de las usuarias de GoTrendier sean mujeres.
- Que catalogar en Stylebook tome 6–8 horas por cada 100 prendas.
- Que Doji haya cambiado la raza de usuarios en sus avatares.
- Las rondas de Daydream ($50 M) y Phia ($35 M).
- El fracaso de Pureple por publicidad agresiva.

---

## 3. Competidores, sustitutos y referentes

`tipo`: **competidor** (resuelve lo mismo), **sustituto** (resuelve la necesidad de otra
forma) o **referente** (ya no compite, pero enseña). `amenaza`: 1 baja · 3 alta.

| id | Nombre | Tipo | País | Dato clave verificado | Precio | Lección para ClosetAI | Amenaza | Fuente |
|---|---|---|---|---|---|---|---|---|
| `whering` | Whering | competidor | Reino Unido | 10 M de usuarios, sobre todo Gen Z; ronda de 7 M USD (jul-2026) con eBay Ventures y Google AI Futures Fund | Freemium | El clóset gratis escala: es la puerta de entrada, no el producto | 3 | [tech.eu](https://tech.eu/2026/07/07/whering-lands-7m-as-digital-wardrobe-platform-reaches-10m-users/) |
| `acloset` | Acloset | competidor | Corea del Sur | 4.4★ con 5.1 mil calificaciones; la ficha declara publicidad | $3.99–$24.99 USD/mes | Cobrar por tamaño de clóset castiga a quien más catalogó | 2 | [App Store](https://apps.apple.com/us/app/acloset-ai-fashion-assistant/id1542311809) |
| `stylebook` | Stylebook | competidor | EE.UU. | Pago único; solo iPhone y iPad | $4.99 USD una vez | El pago único barato es un modelo que existe y dura | 1 | [stylebookapp.com](https://www.stylebookapp.com/faq.html) |
| `style-dna` | Style DNA | competidor | Reino Unido | 3 M USD de ingreso anual (fin 2023); 300 mil activos, 70 mil de pago | Freemium + comisión | El nicho monetiza, pero no sin capital: ahorros, ángeles y un fondo | 2 | [Starter Story](https://www.starterstory.com/stories/your-personal-ai-stylist-app) |
| `alta` | Alta | competidor | EE.UU. | Semilla de 11 M USD (jun-2025) liderada por Menlo Ventures, con el fondo de la familia Arnault | — | El capital apuesta por estilista + compra en EE.UU. | 2 | [TechCrunch](https://techcrunch.com/2025/06/16/alta-raises-11m-to-bring-clueless-fashion-tech-to-life-with-all-star-investors/) |
| `doji` | Doji | competidor | EE.UU. | Semilla de 14 M USD (may-2025) liderada por Thrive Capital; por invitación en más de 80 países | — | El try-on con avatar es la apuesta más capitalizada de la categoría | 2 | [TechCrunch](https://techcrunch.com/2025/05/15/doji-raises-14m-to-make-virtual-try-ons-fun-through-ai-avatars) |
| `indyx` | Indyx | competidor | EE.UU. | Catalogar es gratis; por $295 USD ellos catalogan 100 prendas por ti | Estilista desde $15 USD/mes | Hay quien paga $295 por no fotografiar su ropa: la fricción es real | 1 | [myindyx.com](https://www.myindyx.com/how-it-works) |
| `apps-espanol` | Apps de clóset en español | competidor | Varios | Existen en App Store con interfaz en español; ninguna de las revisadas se presenta con tallas, tiendas o precios de México | Variable | Traducir no es localizar | 2 | [App Store](https://apps.apple.com/us/app/ia-outfit-planner-estilista/id6748238625?l=es-MX) |
| `closet-ai-ios` | "Closet AI – Outfit Planner" | competidor | — | Mismo nombre, en iPhone; menos de mil descargas | Pro $4.99 USD/mes | Mismo nombre en la misma tienda | 2 | [ficha](https://mwm.ai/es/apps/closet-ai-outfit-planner/6761792851) |
| `google-tryon` | Try-on de Google | sustituto | EE.UU. | Doppl cerró el 30-abr-2026 y el try-on pasó a Search; reportado en Latinoamérica (may-2026), México no confirmado por nombre | Gratis | Si Google regala el try-on, el valor tiene que venir de tu clóset | 3 | [Google](https://support.google.com/labs/answer/16537062?hl=en) · [Tech Outlook](https://www.thetechoutlook.com/new-release/software-apps/googles-virtual-try-on-feature-now-available-in-latin-america/) |
| `gotrendier` | GoTrendier | sustituto | México | Más de 8 M de usuarios; 4.6★ con 74 mil calificaciones | Comisión 14% + $14 MXN | La segunda mano ya tiene escala en México: integrarla, no competirle | 1 | [App Store MX](https://apps.apple.com/mx/app/gotrendier-compra-y-vende-moda/id1110389914) |
| `chicisimo` | Chicisimo | referente | España | Fundada en 2010; cerró en 2020 sin encontrar comprador | — | Murió sin monetizar; sus fundadores dijeron que se les escapó la segunda mano | 1 | [Capital](https://capital.es/2020/10/22/cierra-la-start-up-espanola-de-moda-chicisimo/) |

**Referentes globales** (las 5 tarjetas de benchmark): `whering`, `stylebook`, `style-dna`,
`indyx`, `google-tryon`.

## 4. México

| id | Dato | Fuente |
|---|---|---|
| `mx-compradores` | Más de 77 millones de compradores digitales en 2025; eran 37 millones en 2018 | [Milenio con datos de AMVO](https://www.milenio.com/negocios/mexico-supera-77-millones-compradores-digitales-2025-amvo) (mar-2026) |
| `mx-ropa` | El 59% de los compradores digitales compra ropa | [Milenio con datos de AMVO](https://www.milenio.com/negocios/mexico-supera-77-millones-compradores-digitales-2025-amvo) (mar-2026) |
| `mx-satisfaccion` | Más del 50% planeó comprar moda en línea, pero solo el 35% calificó su experiencia como "muy satisfactoria" | [AMVO](https://blog.amvo.org.mx/blog/moda-en-ecommerce-2025-alto-inter%C3%A9s-baja-conversi%C3%B3n) (ago-2025) |

## 5. Riesgos

Probabilidad e impacto de 1 a 3. Cada riesgo apunta a la evidencia que lo sostiene.

| id | Riesgo | Prob. | Impacto | Mitigación | Evidencia |
|---|---|---|---|---|---|
| `friccion` | La gente abandona antes de catalogar su ropa | 3 | 3 | `/core` da valor sin fotos; captura por lotes; 10 prendas para empezar | `indyx` |
| `google-gratis` | Google regala el try-on en su buscador | 3 | 2 | El try-on no es el producto; el producto es vestirte con lo que ya tienes | `google-tryon` |
| `nombre` | Ya existen apps llamadas "Closet AI" | 3 | 2 | Verificar IMPI y decidir nombre antes de invertir en marca | `closet-ai-ios` |
| `capital` | Competidores con 7 a 14 M USD de capital | 3 | 2 | Competir donde no están: México, español, presupuesto | `whering`, `alta`, `doji` |
| `whering-mx` | Whering llega en serio a México | 2 | 3 | Localización real que traducir no da | `whering`, `apps-espanol` |
| `monetizar` | Nadie paga | 2 | 3 | Pago único de $100 MXN; validarlo en conversaciones reales | `chicisimo`, `stylebook`, `style-dna` |
| `satisfaccion` | Mucho interés en moda online, poca satisfacción | 2 | 2 | Prometer menos y mostrar el resultado antes de cobrar | `mx-satisfaccion` |
