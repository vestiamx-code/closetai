import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SubirFotoBase, ProbadorPrendas } from "./interacciones";
import { requireUser } from "@/lib/auth";
import { saldo } from "@/lib/credits";
import { firmarRutas } from "@/lib/closet/storage";
import { categoriaParaTryon } from "@/lib/fal";
import type { Prenda } from "@/lib/closet/tipos";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Try it on" };

export default async function ProbarPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: avatar }, { data: prendas }, { data: renders }, creditos] = await Promise.all([
    supabase
      .from("avatar_photos")
      .select("id, image_path, validation_note")
      .eq("is_primary", true)
      .eq("validation", "ok")
      .maybeSingle(),
    supabase.from("garments").select("*").eq("status", "active"),
    supabase
      .from("tryon_renders")
      .select("id, image_path, created_at")
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(12),
    saldo(user.id),
  ]);

  // Solo se ofrecen prendas que el modelo de verdad puede probar.
  const probables = ((prendas ?? []) as Prenda[]).filter((p) => categoriaParaTryon(p.category));

  const [urlsPrendas, urlsRenders, urlAvatar] = await Promise.all([
    firmarRutas("garments", probables.map((p) => p.clean_image_path ?? p.image_path)),
    firmarRutas("renders", (renders ?? []).map((r) => r.image_path).filter(Boolean) as string[]),
    avatar ? firmarRutas("avatars", [avatar.image_path]) : Promise.resolve(new Map()),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Try it on
          </h1>
          <p className="mt-1 text-text-muted">See how it looks on you before you decide.</p>
        </div>
        <Link
          href="/buy"
          className="rounded-full border border-border px-3.5 py-1.5 text-sm text-text-muted transition hover:border-accent/50 hover:text-text"
        >
          {creditos} {creditos === 1 ? "credit" : "credits"}
        </Link>
      </div>

      {!avatar ? (
        <section className="mt-8">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">First, a photo of you</h2>
            <p className="mt-1 leading-relaxed text-text-muted text-pretty">
              Full body, facing the camera, in regular clothes. It is the base every garment will be
              shown on, so the better it is, the better everything else looks.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-text-muted">
              <li>· Facing forward, standing, arms relaxed at your sides.</li>
              <li>· Visible from head to at least the knees.</li>
              <li>· Daylight and a plain background.</li>
              <li>· Fitted clothes help: loose ones confuse the model.</li>
            </ul>
            <SubirFotoBase userId={user.id} />
          </div>
          <p className="mt-4 text-xs text-text-muted text-pretty">
            Your photo is stored in a private bucket, only you can see it, and it is truly deleted if
            you delete your account.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-8 grid gap-6 sm:grid-cols-[200px_1fr]">
            <div>
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface-2">
                {urlAvatar.get(avatar.image_path) ? (
                  <Image
                    src={urlAvatar.get(avatar.image_path)!}
                    alt="Your base photo"
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <p className="mt-2 text-xs text-text-muted">Your base photo</p>
              {avatar.validation_note ? (
                // El aviso de la IA sobre esta foto. No bloquea nada: dice qué
                // cambiar para que el siguiente render salga mejor.
                <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs leading-relaxed text-text-muted">
                  {avatar.validation_note}
                </p>
              ) : null}
              <SubirFotoBase userId={user.id} compacto />
            </div>

            <ProbadorPrendas
              creditos={creditos}
              prendas={probables.map((p) => ({
                id: p.id,
                nombre: p.subcategory ?? "Garment",
                url: urlsPrendas.get(p.clean_image_path ?? p.image_path) ?? null,
              }))}
            />
          </section>

          {renders && renders.length > 0 ? (
            <section className="mt-12 border-t border-border pt-8">
              <h2 className="font-display text-lg font-semibold">Your try-ons</h2>
              <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {renders.map((render) =>
                  render.image_path && urlsRenders.get(render.image_path) ? (
                    <li key={render.id}>
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface-2">
                        <Image
                          src={urlsRenders.get(render.image_path)!}
                          alt="Virtual try-on"
                          fill
                          sizes="(max-width: 640px) 50vw, 200px"
                          className="object-cover"
                        />
                      </div>
                    </li>
                  ) : null,
                )}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
