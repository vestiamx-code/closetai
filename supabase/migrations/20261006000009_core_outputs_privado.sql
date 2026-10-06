-- Cierra la lectura pública de core_outputs.
--
-- La migración 005 dejó la tabla con `select using (true)` y un comentario que
-- decía que la columna `entrada` —el texto que la persona escribe sobre su
-- estilo— "se protege en la vista". No era cierto: con la llave pública, que
-- viaja en el navegador, cualquiera podía pedir la tabla entera por REST y leer
-- los textos completos. Se comprobó el 25 de septiembre de 2026 haciendo
-- exactamente esa petición: respondió 200 con las 15 filas y su texto.
--
-- La página no se entera: `/core` ya leía con la llave de servicio y nunca
-- seleccionó `entrada`. Lo único que cambia es que ahora la base lo impone, en
-- vez de confiar en que el código de la página se acuerde.
--
-- Regla que deja esta migración: una tabla se abre a la llave pública solo si
-- TODAS sus columnas son públicas. Si una no lo es, no se abre ninguna.

drop policy if exists "núcleos visibles para todos" on public.core_outputs;

revoke select on public.core_outputs from anon, authenticated;
grant all on public.core_outputs to service_role;
