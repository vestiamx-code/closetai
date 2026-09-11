# Prompt del núcleo de estilo — `/core`

**Archivo:** `src/lib/ai/prompts/core.ts` · **Versión:** 1 · **Modelo:** `gemini-3.5-flash`
· **Temperatura:** 0.45 · **Salida:** JSON validado por `styleCoreSchema` (zod)

Este es el prompt que convierte el **Apéndice A3 del Documento Maestro** —cómo ClosetAI
deduce el estilo de alguien— en el módulo generativo de la Semana 1. Queda escrito aquí,
palabra por palabra, para que se pueda leer sin abrir el código y para que cualquier
cambio se note al comparar versiones.

---

## La regla que lo gobierna: no inventar

Si alguien escribe tres líneas vagas, el núcleo tiene que salir **corto y decirlo**, no
rellenarse con lugares comunes de revista. Un perfil inventado se siente genérico al
instante, y ahí se pierde justo la confianza que esta página existe para ganar.

Por eso el prompt obliga a devolver dos campos que casi ningún extractor devuelve:

- **`confianza`** (0 a 1): qué tan seguro está de lo que dedujo.
- **`falta`**: qué no alcanzó a deducir y qué preguntaría.

Probado con un texto vago a propósito, el módulo respondió **25 % de confianza, con la
paleta y las siluetas vacías**. Es el resultado que se buscaba.

## Por qué temperatura 0.45

Elegida probando, no por defecto. Con **0** el modelo repetía las mismas cinco frases para
entradas distintas, y el punto de la página es que dos personas reciban dos núcleos que se
sientan suyos. Más **alta**, empezaba a inventar colores y siluetas que nadie mencionó —
justo lo que el prompt prohíbe.

## El texto, tal cual

```text
Eres el extractor de núcleo de estilo de ClosetAI. Alguien te escribe, en sus palabras, cómo le gusta vestirse. Tu trabajo es destilar eso en un núcleo estructurado y accionable.

Devuelve SOLO JSON válido con este esquema:
{ "esencia": "1 frase en es-MX que capture su estilo. Concreta, no poética. Nada de 'elegancia atemporal'.",
  "principios": ["2-5 reglas que ya sigue, deducidas de lo que escribió"],
  "paleta": ["2-6 colores en es-MX que se desprendan de su texto"],
  "siluetas": ["1-4 formas o cortes que le funcionan"],
  "evitar": ["1-4 cosas que por lo que escribió NO le van"],
  "regla": "1 regla personal suya, escrita como si ella la dijera",
  "confianza": 0.0-1.0,
  "falta": "qué no alcanzaste a deducir por falta de información; cadena vacía si el texto alcanzó" }

REGLAS QUE NO SE ROMPEN:
- Todo sale de SU texto. Si no dijo nada de color, la paleta va corta o vacía; no la rellenes.
- Prohibido el relleno de revista: "elegancia atemporal", "versátil y sofisticado", "menos es más". Si tu frase podría describir a cualquiera, está mal.
- Español de México. Dice "playera", no "camiseta"; "tenis", no "zapatillas".
- Si escribió poco o muy vago, baja la "confianza", acorta las listas y di en "falta" qué le preguntarías. Un núcleo honesto y corto vale más que uno completo e inventado.
- "regla" va en primera persona, como algo que ella diría de sí misma.

Si el texto no habla de ropa ni de estilo, devuelve {"error": "motivo breve en es-MX"}.
```

## Qué pasa después de que el modelo responde

El texto que devuelve el modelo **no se muestra ni se guarda tal cual**. Pasa por
`parseStyleCore` (`src/lib/ai/schemas.ts`), que:

1. Exige el esquema completo y los topes de cada lista (2–5 principios, 2–6 colores, etc.).
2. Desenvuelve un arreglo de un solo elemento —el modelo ya devolvió uno en producción— y
   **rechaza** si trae varios.
3. Distingue tres formas de fallar: `rejected` (el modelo dijo que el texto no habla de
   ropa), `unparseable` (no cumplió el contrato) y `unavailable` (el proveedor no contestó).
   La última existe porque decirle a alguien *"no pude leer bien lo que escribiste"* cuando
   el que falló fue Gemini es echarle una culpa que no es suya.

Si el contrato falla, se muestra un error y **no se guarda nada**.

## Versionado

`CORE_PROMPT_VERSION` se escribe en cada fila de `core_outputs` junto con el modelo. Así,
si la calidad de las respuestas cambia, se puede rastrear a qué versión del prompt
pertenece cada núcleo guardado, en vez de adivinar.

---

Ver también: [`docs/evidencia/PROMPT_LOG.md`](evidencia/PROMPT_LOG.md) (las seis sesiones de
la semana) y [`docs/SEMANA-1-PACKET.md`](SEMANA-1-PACKET.md) (el prompt que se le dio al
agente de código).
