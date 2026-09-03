# Mockup de `/core` — Semana 1

`05-core-generado.jpg` — generado con imagen (Gemini) **antes** de construir la
pantalla. `05-core-wireframe.png` — wireframe de los tres estados, hecho como
apoyo para resolver el flujo que una sola imagen no alcanza a mostrar.

## Nota de implementación: qué cambió y por qué

El mockup fue referencia, no contrato. Comparándolo con lo que quedó en vivo,
tres cosas se hicieron distinto **a propósito**:

- **El mockup divide la tarjeta en Prendas clave · Colores · Texturas · Silueta.
  La app usa Principios · Paleta · Siluetas · Evitar.** "Prendas clave" y
  "Texturas" describen ropa; lo que este módulo extrae es un criterio. Que
  alguien use lino no es su núcleo de estilo — *"priorizo comodidad sin perder
  estructura"* sí lo es. Y se añadió **Evitar**, que el mockup no contemplaba:
  saber qué NO le va a alguien vale tanto como saber qué sí, y es lo que después
  hace que el estilista no insista con lo que odia.

- **El mockup no muestra qué tan seguro está el modelo.** La app lo enseña
  siempre, junto con qué le faltó saber. Un núcleo que se presenta igual de
  seguro con tres líneas vagas que con un párrafo detallado se siente listo diez
  segundos y falso para siempre. En la corrida 3 esto se ve funcionando: 25 % de
  confianza y las listas vacías.

- **El mockup no tiene dónde guardar ni qué pasó con lo guardado.** La pantalla
  real cierra el ciclo: botón de guardar y, debajo, los núcleos que ya se
  generaron — mostrando solo el núcleo, nunca el texto que la persona escribió
  sobre sí misma.

## Lo que el mockup acertó y se respetó

La estructura de una sola pantalla —escribir arriba, resultado abajo—, la regla
personal entrecomillada como cierre de la tarjeta, y la decisión de que la
entrada fuera un texto libre y no un cuestionario de opción múltiple.
