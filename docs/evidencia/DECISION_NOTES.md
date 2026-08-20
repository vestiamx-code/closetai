# Notas de decisión humana

Evidencia de rúbrica: *Human judgment & explanation* (nota semanal de 150-250 palabras).
**Estas notas las revisa y firma el dueño del proyecto.** Son su voz, no la del agente.

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

**Firma del dueño:** ____________________
