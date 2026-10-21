-- Semana 4 · El cierre de la portada ya no repite el titular B.
--
-- «Ya tienes qué ponerte. Solo falta verlo.» es la variante B del experimento: quien
-- veía la variante A la leía igual al final de la página, y la comparación quedaba
-- contaminada. Tamara aprobó el cambio el 21 de octubre de 2026, al verlo.
--
-- Actualiza solo la fila de la portada; el texto sale de
-- docs/evidencia/MARKETING-SEMANA-4.md, igual que en la migración 011.

update public.marketing_assets
   set cuerpo = $c$Antetítulo: Estilista personal con IA · Hecho en México

Titular (experimento A/B):
- A · Tu estilista, en tu bolsillo.
- B · Ya tienes qué ponerte.

Bajada: Fotografía tu ropa, ClosetAI la ordena por ti y cada mañana te dice qué ponerte con lo que
ya tienes.

Botones: Empezar gratis · Probar sin cuenta

El problema. Tienes el clóset lleno y te pones lo mismo. No te falta ropa: te falta verla toda
junta.

Cómo funciona.
1. Fotografía tu ropa. La IA llena el tipo, los colores y la temporada de cada prenda.
2. Arma tu clóset. Todo en tu celular, con el fondo recortado.
3. Te dice qué ponerte. Outfits con lo que ya tienes, para el clima de tu ciudad.

Lo que dicen los datos. Más de 77 millones de personas compraron en línea en México en 2025. El
59% compra ropa. Pero solo el 35% quedó muy satisfecha con su compra de moda en línea. Comprar no es
el problema; saber qué combinar, sí. Cada dato enlaza a su fuente en closetai.lat/research.

Precio. Tu clóset es gratis para siempre. ClosetAI Completo cuesta 100 pesos, una sola vez: sin
mensualidad. Ver la cuenta completa en closetai.lat/pricing.

Tus fotos son tuyas. Viven en un espacio privado al que nadie más entra. Se borran de verdad
cuando las quitas o borras tu cuenta. No vendemos tus datos y no hay anuncios.

Cierre. Tu ropa ya está ahí. Solo falta verla. · Botón: Crear mi clóset gratis$c$
 where id = 'landing';
