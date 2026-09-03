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

---

## Semana 2 — [2026-08-21] — Qué tan lejos dejar llegar a la IA — *borrador, pendiente de firma*

El estilista podía construirse de dos maneras. La fácil: pedirle al modelo que
proponga outfits y mostrar lo que devuelva. La que elegí: pasarle únicamente las
prendas que la usuaria tiene, validar que cada id que devuelva exista de verdad,
y descartar el outfit completo si se inventó una prenda.

Cuesta más código y aun así descarta trabajo del modelo. Lo hice porque el
problema de esta categoría no es que la IA proponga poco, es que decepciona
(§2.2, queja #4). Un outfit con una prenda que no tengo no es una sugerencia
imperfecta: es la prueba de que la app no sabe qué hay en mi clóset. Después de
eso, ya no le crees nada.

La decisión que más me costó fue la temperatura del modelo. En la catalogación
la puse baja, porque ahí quiero la misma respuesta siempre. En el estilista la
subí, porque tres outfits idénticos no sirven de nada. Es la misma herramienta
pidiéndole cosas opuestas, y eso solo se ve cuando pruebas.

Lo que me convenció de que iba bien fue una prueba: le veté un color y un estilo,
y el vestido que los tenía desapareció de las tres propuestas. Eso es el producto
funcionando, no el modelo siendo listo.

**Firma:** ____________________

## Semana 3 — [2026-08-21] — Cobrar después, nunca antes — *borrador, pendiente de firma*

En el try-on había un orden que decidir: cobrar el crédito antes de generar el
render, o después. Antes es más fácil de programar y protege contra que alguien
dispare renders sin saldo. Elegí después.

La razón es que un render puede fallar por cosas que no son culpa de la usuaria:
que fal esté saturado, que la foto tenga una pose rara, que se caiga la conexión.
Cobrarle un crédito por un error nuestro es pequeño en dinero y enorme en
confianza. Cien pesos compran treinta créditos; que uno se pierda por nuestra
falla convierte una compra en un reclamo.

El costo de hacerlo bien fue tener que resolver otro problema: si el cobro va
después, dos renders simultáneos podrían gastar el mismo crédito. Eso se resolvió
con un lock por usuaria dentro de la función de base de datos, y con un índice
único que hace imposible cobrar dos veces por el mismo render.

Lo mismo del lado de Stripe. Stripe reenvía el webhook cuando no recibe respuesta
a tiempo, y sin protección una compra abonaría créditos varias veces. La probé a
propósito reenviando el mismo evento: el saldo no se movió.

**Firma:** ____________________

## Semana 4 — [2026-08-21] — El estilista no puede ser vendedor — *borrador, pendiente de firma*

La parte de recomendaciones de compra es donde ClosetAI gana dinero por afiliados,
y por lo mismo es donde más fácil se rompe. Si el estilista empieza a recomendar
de más, deja de ser estilista y se vuelve un catálogo con opinión.

El prompt le dice explícitamente que sea conservador y que devolver dos huecos
reales vale más que cinco inventados. Y el código respeta esa respuesta: si el
modelo dice que el clóset está bien cubierto, la pantalla muestra exactamente eso
en vez de forzar una lista. Es la única parte del producto donde deliberadamente
programé algo para vender menos.

También decidí que todos los enlaces salientes pasen por un resolvedor propio en
lugar de enlazar directo a las tiendas. La razón inmediata es poder cambiar el
código de afiliado sin volver a desplegar. La razón real es que al principio la
comisión no va a ser nada — unos pocos pesos — y lo que sí vale es saber qué
clican: eso dice qué recomendaciones sirven, y eso mejora el producto aunque
nunca llegue una sola venta.

Y la divulgación de que ganamos comisión está en la misma pantalla, en texto
legible, no escondida en los términos.

**Firma:** ____________________

---

## Semana 1 — [2026-09-02] — Que admita cuando no sabe — *borrador, pendiente de firma*

La tarea pedía convertir una metodología previa en un módulo generativo. Pude
haber hecho un extractor de textos genérico y habría cumplido la letra. Elegí
convertir el Apéndice A3 de mi documento maestro —cómo ClosetAI deduce el estilo
de alguien— porque eso resuelve un problema real que ya me habían señalado: que
mi app pide fotografiar diez prendas antes de darte nada. `/core` da algo útil en
un minuto, sin cuenta y sin fotos.

La decisión de la que estoy más segura es la más chica. El prompt obliga al modelo
a declarar qué tan seguro está y qué le faltó saber, y le prohíbe el relleno de
revista. Lo probé con un texto vago a propósito y devolvió 25% de confianza, con
la paleta y las siluetas vacías. Un extractor que le inventa una paleta a alguien
que nunca mencionó un color se siente listo diez segundos y falso para siempre.

Rechacé pedir cuenta para guardar. Es lo cómodo y es exactamente el problema que
esta página ataca.

Y hay una corrección que me costó: dos veces escribí pruebas que estaban verdes
sin probar nada. La segunda pasaba en una décima de segundo porque el texto que
buscaba ya estaba en el párrafo de introducción. Es la misma falla de la semana
pasada con otro disfraz. Ya aprendí a desconfiar de una prueba que pasa
demasiado rápido.

**Firma:** ____________________

