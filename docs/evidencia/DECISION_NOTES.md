# Notas de decisión humana

Evidencia de rúbrica: *Human judgment & explanation* (nota semanal de 150-250 palabras).
**Estas notas las revisa y firma Tamara.** Son su voz, no la del agente.

---

## Semana 0 — [2026-08-19] — *borrador del agente, pendiente de firma*

El documento maestro decide "comprar, no construir": ninguna capa de IA se entrena, todas se
consumen por API. Con un mes de plazo es la única decisión defendible, y tiene un costo que
conviene nombrar: dependemos de proveedores que cambian precios y retiran modelos — Gemini 2.5
Flash-Lite ya tiene fecha de retiro (~oct-2026). La mitigación elegida no es evitar la
dependencia sino aislarla: un adapter en `lib/ai/` con el modelo en variable de entorno, para
que migrar cueste una línea y no una refactorización.

La segunda decisión con filo es el modelo de negocio. Se rechazó explícitamente el paywall
retroactivo sobre el clóset, que es lo que más dinero deja a corto plazo en esta categoría y
lo que más reputación destruye (caso Acloset). El clóset queda gratis para siempre y se cobra
solo por servicio nuevo: try-on y estilista completo. Eso obliga a que el costo variable del
usuario gratis sea casi cero — de ahí Flash-Lite para catalogar y el free tier de Gemini para
outfits.

Al ejecutar la migración 001 aparecieron tres huecos que el apéndice daba por supuestos: nadie
creaba la fila de `profiles` al registrarse, el débito de créditos no era atómico y los buckets
de Storage no existían. Se escribió una migración 002 en vez de editar la 001, para que la
diferencia entre lo planeado y lo que hace falta quede visible en el historial.

**Firma:** ____________________

---

## Decisión — [2026-08-19] — TLD `.lat` en vez de `.mx` — *borrador, pendiente de firma*

El plan original pedía un `.mx` porque todo el posicionamiento del producto es ser el primer
estilista con IA hecho para México, y un `.mx` dice eso sin explicarlo. Terminé comprando un
`.lat`. (Esta decisión se tomó cuando el proyecto todavía se llamaba Vestia; el nombre cambió
después a ClosetAI, pero el razonamiento sobre el TLD no.)

El argumento en contra que consideré es real: el $1.80 del primer año es promocional y `.lat`
renueva a ~$41 USD/año, casi lo mismo que costaría `.mx`. O sea, el ahorro es de un año, no
permanente, y a cambio se pierde la señal local más fuerte que existe.

Lo compré igual por dos razones. La primera es de flujo de efectivo, no de costo total: en la
fase donde el proyecto todavía no vale nada y el plazo es de un mes, bajar el desembolso inicial
de ~$45 a $2 USD importa más que optimizar el año dos — si ClosetAI no despega, no gasté $45 en un
dominio muerto, y si despega, pagar $41 el año que entra no será el problema. La segunda es que
`.lat` no contradice la estrategia: la expansión a LATAM ya está en el backlog, y un dominio
regional envejece mejor que uno nacional si el producto crece hacia allá.

Lo que me llevo como riesgo asumido: pierdo señal de confianza en el mercado mexicano, que es
justo el mercado inicial. Si al probar con usuarias reales el dominio genera fricción, `.mx`
sigue siendo comprable después y redirigir cuesta poco.

**Firma:** ____________________

