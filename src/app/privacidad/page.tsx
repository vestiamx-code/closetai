import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description: "Qué datos guarda ClosetAI, para qué, y cómo borrarlos.",
};

export default function PrivacidadPage() {
  return (
    <main className="flex-1">
      <header className="mx-auto w-full max-w-2xl px-6 py-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          ClosetAI
        </Link>
      </header>

      <article className="mx-auto w-full max-w-2xl px-6 pb-24">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Aviso de privacidad
        </h1>
        <p className="mt-2 text-sm text-text-muted">Última actualización: 21 de agosto de 2026</p>

        <div className="mt-8 space-y-8 leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold">Quién responde por tus datos</h2>
            <p className="mt-2 text-pretty">
              ClosetAI, operado por Tamara Muñoz Delgadillo, con domicilio en México y contacto en{" "}
              <a href="mailto:hola@closetai.lat" className="text-accent underline underline-offset-4">
                hola@closetai.lat
              </a>
              . Este aviso se hace conforme a la Ley Federal de Protección de Datos Personales en
              Posesión de los Particulares.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Qué guardamos</h2>
            <ul className="mt-3 space-y-3">
              <li>
                <strong>Tu cuenta:</strong> correo, nombre, y si quieres, tus tallas y tu ciudad.
                La ciudad sirve para saber qué clima vas a tener.
              </li>
              <li>
                <strong>Fotos de tus prendas:</strong> las que subes a tu clóset, y lo que la IA
                dedujo de ellas.
              </li>
              <li>
                <strong>Fotos tuyas de cuerpo completo</strong>, si decides usar la prueba virtual.
                <span className="mt-1 block rounded-lg border border-border bg-surface p-3 text-sm text-pretty">
                  Estas son <strong>datos personales sensibles</strong>. Solo se guardan si tú
                  subes una, viven en un almacenamiento privado al que nadie más tiene acceso, se
                  usan únicamente para generar tus pruebas virtuales, y se borran de verdad cuando
                  borras tu cuenta o la reemplazas.
                </span>
              </li>
              <li>
                <strong>Lo que aceptas y rechazas:</strong> es lo que hace que ClosetAI aprenda tu
                estilo. Puedes ver todo lo que ha aprendido en{" "}
                <Link href="/estilo" className="text-accent underline underline-offset-4">
                  Tu estilo
                </Link>{" "}
                y corregir cualquier cosa.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Con quién se comparten</h2>
            <p className="mt-2 text-pretty">
              Para que la app funcione, tus fotos pasan por proveedores de inteligencia artificial
              que las procesan y devuelven un resultado:
            </p>
            <ul className="mt-3 space-y-2 text-pretty">
              <li>
                <strong>Google (Gemini)</strong> — reconoce tus prendas y arma tus outfits.
              </li>
              <li>
                <strong>fal.ai</strong> — quita el fondo de las fotos y genera las pruebas
                virtuales.
              </li>
              <li>
                <strong>Supabase</strong> — guarda tu cuenta y tus archivos, en servidores de
                Estados Unidos.
              </li>
              <li>
                <strong>Stripe</strong> — procesa los pagos. ClosetAI nunca ve ni guarda los datos
                de tu tarjeta.
              </li>
            </ul>
            <p className="mt-3 text-pretty">
              No vendemos tus datos. No los usamos para publicidad. No hay anuncios en ClosetAI.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Tus derechos ARCO</h2>
            <p className="mt-2 text-pretty">
              Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos. Dos de
              esos derechos los ejerces tú directamente, sin pedirle permiso a nadie:
            </p>
            <ul className="mt-3 space-y-2 text-pretty">
              <li>
                <strong>Rectificar:</strong> corrige tus datos en tu perfil y las inferencias de
                estilo en la pantalla de Tu estilo.
              </li>
              <li>
                <strong>Cancelar:</strong> el botón de borrar cuenta en tu perfil elimina tus
                datos y tus archivos. No se archivan en ningún lado.
              </li>
            </ul>
            <p className="mt-3 text-pretty">
              Para acceso u oposición, escríbenos a{" "}
              <a href="mailto:hola@closetai.lat" className="text-accent underline underline-offset-4">
                hola@closetai.lat
              </a>{" "}
              y respondemos en un máximo de 20 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Enlaces a tiendas</h2>
            <p className="mt-2 text-pretty">
              Cuando ClosetAI te recomienda comprar algo, el enlace puede llevar un código de
              afiliado y podemos ganar una comisión. Eso no cambia lo que te recomendamos: la
              relevancia va primero y el afiliado solo desempata. Los clics salientes se registran
              para saber qué recomendaciones sirven.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Cambios</h2>
            <p className="mt-2 text-pretty">
              Si esto cambia, la fecha de arriba cambia con ello y te avisamos por correo antes de
              que aplique.
            </p>
          </section>
        </div>

        <p className="mt-12 border-t border-border pt-6">
          <Link href="/" className="text-sm text-accent underline underline-offset-4">
            ← Volver
          </Link>
        </p>
      </article>
    </main>
  );
}
