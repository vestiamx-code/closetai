import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The five external users (Week 6): testers 1–3 tried /chat in Week 5,
 * testers 4–5 walk the whole site from /demo. A tester who hasn't written a
 * summary yet comes back as `null`: the page shows them as pending, never
 * filled in.
 */
export type Tester = {
  numero: 1 | 2 | 3 | 4 | 5;
  semana: "Week 5" | "Week 6";
  alcance: string;
  resumen: {
    funciono: string;
    confuso: string;
    puntaje: number;
    loUsaria?: "si" | "tal_vez" | "no";
    paginas?: string[];
    fecha: string;
  } | null;
};

export async function leerTesters(): Promise<Tester[]> {
  const db = createAdminClient();
  const [chat, sitio] = await Promise.all([
    db
      .from("chat_test_summaries")
      .select("tester, funciono, confuso, puntaje, created_at, chat_sessions!inner(es_prueba)")
      .eq("chat_sessions.es_prueba", false),
    db
      .from("site_test_summaries")
      .select("tester, funciono, confuso, puntaje, lo_usaria, paginas, created_at")
      .eq("es_prueba", false),
  ]);
  if (chat.error) throw new Error(chat.error.message);
  // Before migration 016 the table doesn't exist: testers 4 and 5 are simply pending.
  if (sitio.error) console.warn("[testers] site_test_summaries:", sitio.error.message);

  const deChat = new Map((chat.data ?? []).map((r) => [r.tester, r]));
  const deSitio = new Map((sitio.data ?? []).map((r) => [r.tester, r]));

  return ([1, 2, 3, 4, 5] as const).map((n) => {
    if (n <= 3) {
      const r = deChat.get(n);
      return {
        numero: n,
        semana: "Week 5",
        alcance: "/chat",
        resumen: r
          ? { funciono: r.funciono, confuso: r.confuso, puntaje: r.puntaje, fecha: r.created_at }
          : null,
      };
    }
    const r = deSitio.get(n);
    return {
      numero: n,
      semana: "Week 6",
      alcance: "the whole site",
      resumen: r
        ? {
            funciono: r.funciono,
            confuso: r.confuso,
            puntaje: r.puntaje,
            loUsaria: r.lo_usaria,
            paginas: r.paginas,
            fecha: r.created_at,
          }
        : null,
    };
  });
}
