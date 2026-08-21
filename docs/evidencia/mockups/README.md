# Mockups generados por imagen

Generados el 21-ago-2026 con **Gemini (Nano Banana)** desde la cuenta del proyecto,
a partir de prompts escritos en español que describen la paleta, la tipografía y
el copy exacto de cada pantalla.

| Archivo | Pantalla | Módulo |
|---|---|---|
| `01-closet.jpeg` | Mi clóset — cuadrícula con filtros | M2 |
| `02-outfit-del-dia.jpeg` | Qué me pongo hoy — outfit con clima y explicación | M3 |
| `03-tryon.jpeg` | Así te verías — prueba virtual con contador de créditos | M5 |
| `04-paywall.jpeg` | Pago único de $100 MXN | M7 |

---

## Nota de implementación

### Qué se construyó igual que en el mockup

**Mi clóset** (`01`) está implementado y en producción, y salió más parecido de lo
esperado: mismo encabezado serif, mismas píldoras de filtro por categoría, misma
cuadrícula de dos columnas con nombre de prenda y colores debajo. La comparación
está en `docs/evidencia/capturas/04-closet.png` — mockup y pantalla real, lado a lado.

La paleta y las tipografías del mockup **no se eligieron después**: los prompts
describen la paleta que ya estaba en el código desde la Semana 0 (crema #faf7f4,
tinta casi negra, acento terracota #b4532a, Fraunces para títulos e Inter para
texto). El mockup documenta el sistema, no lo inventa.

### Qué cambió al implementar, y por qué

**El contador de prendas.** El mockup dice "12 prendas". La pantalla real dice
"4 prendas" o "1 prenda" según corresponda, en singular o plural. Detalle chico
que un mockup no obliga a resolver y el código sí.

**Los nombres de las prendas.** El mockup los muestra completos ("vestido rojo
acampanado"). En la implementación se truncan con puntos suspensivos, porque
Gemini a veces devuelve subcategorías largas y romperían la cuadrícula. Se
prefirió cortar el texto antes que descuadrar el diseño.

**El try-on** (`03`) todavía no existe como pantalla: la llave de fal.ai se
consiguió el 21-ago y el módulo es de la Semana 3. El mockup fija el contrato
visual — foto de cuerpo entero a pantalla casi completa, contador de créditos
visible siempre (§3.3 M5), y los dos botones de acción abajo.

### Recorte de alcance

**Se descartó el "modo explorar"** que el documento contempla en §2.3 (renders
rápidos de menor fidelidad a 0.5 créditos). Razón: con un depósito inicial de
$10 USD, partir el presupuesto entre dos calidades de render diluye la única
función que de verdad diferencia al producto. El documento ya lo tenía previsto
como el primer recorte si el tiempo apretaba (§6, gestión de riesgo del plazo).

**Se descartó el fondo con foto de la landing.** Los mockups muestran prendas
recortadas sobre blanco; la landing en producción es puramente tipográfica. No
hay fotos propias que usar y comprar banco de imágenes contradice el presupuesto.
Cuando haya clósets reales, las fotos saldrán de ahí.
