# Guion del video — Semana 1 · `/core`

**Video:** `ClosetAI-Semana1-Core.mp4` · **2:59** · **sin pista de audio**, para que
narres tú.

Cada bloque trae el minuto exacto en que empieza en el video. Están medidos sobre
el archivo real, así que si lees a ritmo normal vas a ir embonada. Si te
adelantas, pausa y sigue — nadie se da cuenta.

---

### 0:00 — 0:16 · La portada

> "Esta es ClosetAI, en línea en closetai punto lat. La semana pasada me
> señalaron la objeción más fuerte contra mi propuesta de valor: que le pido a la
> gente fotografiar diez prendas **antes** de darle nada."

*En pantalla: la portada y sus cuatro capacidades.*

---

### 0:16 — 0:37 · Por qué existe `/core`

> "El trabajo va antes del beneficio, y eso es lo que mató a las apps que
> vinieron antes que la mía. Así que esta semana convertí una metodología que ya
> tenía escrita —cómo ClosetAI deduce el estilo de alguien— en un módulo que
> funciona **sin cuenta y sin subir una sola foto**."

*En pantalla: clic en "Extraer mi núcleo" y carga `/core`.*

---

### 0:37 — 1:03 · La entrada

> "No hay cuestionario ni opción múltiple. Escribes con tus palabras, como se lo
> contarías a una amiga. Voy a escribir cómo me visto de verdad."

*En pantalla: se escribe el texto, letra por letra.*

---

### 1:03 — 1:52 · Genera y aparece la tarjeta

> "Y en unos segundos destila mi núcleo.
>
> Aquí está: una esencia en una frase, mis principios, mi paleta, mis siluetas, y
> lo que **no** me va.
>
> Fíjense en eso último. Saber qué evitar vale tanto como saber qué me gusta, y
> es lo que después hace que el estilista no me insista con lo que odio. Y abajo,
> una regla mía, escrita como yo la diría."

*En pantalla: el botón cambia a "Leyéndote…", aparece la tarjeta, y luego un
recorrido lento por los cuatro bloques y la regla.*

**Es el bloque más largo — 49 segundos. Tómatelo con calma.**

---

### 1:52 — 2:15 · Lo que más cuidé

> "Y esto es lo que más cuidé. El módulo dice **qué tan seguro está** y qué le
> faltó preguntarme.
>
> Lo probé con un texto vago a propósito y bajó a 25 por ciento, con la paleta
> vacía. No se inventó nada. Un extractor que le adivina una paleta a alguien que
> nunca mencionó un color se siente listo diez segundos y falso para siempre."

*En pantalla: acercamiento a la línea de confianza.*

---

### 2:15 — 2:40 · Guardar

> "Lo guardo, y aparece abajo con los demás. Solo el núcleo — nunca el texto que
> la persona escribió sobre sí misma, porque eso puede ser muy personal. Cada uno
> queda en una tabla de Supabase."

*En pantalla: clic en Guardar y el panel de núcleos guardados.*

---

### 2:40 — 2:59 · El repositorio

> "Y el repositorio es público. Ahí está el historial de la semana, con el Build
> Discipline Packet commiteado **antes** que el código — hasta abajo del todo."

*En pantalla: la lista de commits en GitHub.*

---

## Si te preguntan algo incómodo

**"¿Y esto no es solo un horóscopo bonito?"**
No: con texto vago se **niega** a inventar. Baja la confianza a 25 % y deja las
listas vacías. Eso está en el video, minuto 1:52.

**"¿Por qué no pide cuenta?"**
Porque pedir registro antes de demostrar valor es exactamente el problema que
esta función ataca.

**Si algo falla mientras presentas**
El nivel gratuito de Gemini tiene un tope diario y a veces devuelve error.
Dilo: *"esto corre en el nivel gratuito y hoy topé la cuota — por eso le puse
reintento automático."* Explicarlo suma más que esconderlo, y está documentado en
el iteration log.
