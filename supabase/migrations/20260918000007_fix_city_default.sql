-- Corrige la ciudad por omisión de profiles.
--
-- La migración 001 declara `city text default 'Ciudad de México'`, pero cuando
-- se aplicó en la Semana 0 el texto pasó por un camino que leyó el UTF-8 como
-- Mac Roman: la «é» (bytes c3 a9) quedó guardada como «√©» (e2 88 9a c2 a9).
-- Desde entonces, toda cuenta nueva nace con la ciudad mal escrita y así se ve
-- en «Qué me pongo hoy». El clima no fallaba —el código cae a las coordenadas
-- de la CDMX— así que el error solo se notaba al leer la pantalla.
--
-- Lo encontró la suite e2e contra producción el 18-sep-2026: el usuario que crea
-- la prueba del estilista mostró la ciudad rota. Se confirmó creando una cuenta
-- temporal y leyendo sus bytes. Era el único texto con acento fuera de
-- comentarios en las migraciones 001 a 004.

alter table public.profiles alter column city set default 'Ciudad de México';

-- Las filas que ya nacieron rotas. Se reconocen por su forma —«M», dos
-- caracteres y «xico», en vez de «M», «é» y «xico»— para no tener que escribir
-- el texto roto en esta migración.
update public.profiles
   set city = 'Ciudad de México'
 where city ~ '^Ciudad de M..xico$';
