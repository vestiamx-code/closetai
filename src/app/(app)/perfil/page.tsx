import type { Metadata } from "next";

import { FormularioPerfil } from "./formulario";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tu perfil" };

export default async function PerfilPage() {
  const user = await requireUser();

  const supabase = await createClient();
  const { data: perfil } = await supabase
    .from("profiles")
    .select("display_name, city, size_top, size_bottom, size_shoes, plan")
    .eq("id", user.id)
    .single();

  const { count } = await supabase
    .from("garments")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Tu perfil</h1>
      <p className="mt-2 text-text-muted">
        {user.email} · {count ?? 0} {count === 1 ? "prenda" : "prendas"} ·{" "}
        {perfil?.plan === "lifetime" ? "ClosetAI Completo" : "Plan gratis"}
      </p>

      <FormularioPerfil
        inicial={{
          display_name: perfil?.display_name ?? "",
          city: perfil?.city ?? "",
          size_top: perfil?.size_top ?? "",
          size_bottom: perfil?.size_bottom ?? "",
          size_shoes: perfil?.size_shoes ?? "",
        }}
      />
    </div>
  );
}
