"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { responderChat } from "@/lib/ai/gemini";
import {
  CONVERSACIONES_POR_HORA,
  PREGUNTAS,
  RESPUESTA_GUARDRAIL,
  SEGUIMIENTOS_MAXIMOS,
  intakeSchema,
  mensajeSchema,
  motivoDeClasificacion,
  respuestaIntakeSchema,
  resumenSchema,
  revisarMensaje,
  type Intake,
  type MotivoGuardrail,
} from "@/lib/chat";
import { huellaDeQuienPide } from "@/lib/ip";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server Actions of `/chat`.
 *
 * The page is public, so everything is checked here and not in the browser:
 * which question comes next, the guardrail, the limits, and that a rating or a
 * summary belongs to a real conversation. The chat tables are closed to the
 * public key; only this file writes them, with the service key.
 */

export type Mensaje = {
  id: number;
  rol: "usuaria" | "asistente";
  contenido: string;
  outfit?: { titulo: string; prendas: string[]; tip: string } | null;
  guardrail?: MotivoGuardrail | null;
  /** For the assistant's intake questions: which one it is (0, 1, 2). */
  pregunta?: number;
};

export type Respuesta =
  | {
      ok: true;
      mensajes: Mensaje[];
      /** Index of the next intake question, or null once the intake is done. */
      siguiente: number | null;
      seguimientosRestantes: number;
      revision: boolean;
    }
  | { ok: false; error: string };

const sesionSchema = z.string().uuid();

async function esTraficoDePrueba(): Promise<boolean> {
  return (await headers()).get("x-cai-prueba") === "1";
}

/** Starts a conversation. Tester links must bring consent. */
export async function iniciarConversacion(entrada: {
  tester: number | null;
  consentimiento: boolean;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const tester = entrada.tester === 1 || entrada.tester === 2 || entrada.tester === 3 ? entrada.tester : null;
  if (tester && !entrada.consentimiento) {
    return { ok: false, error: "Please accept that the conversation is saved before starting the test." };
  }

  const admin = createAdminClient();
  const visitante = await huellaDeQuienPide();
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("chat_sessions")
    .select("id", { count: "exact", head: true })
    .eq("visitante_hash", visitante)
    .gte("created_at", desde);
  if ((count ?? 0) >= CONVERSACIONES_POR_HORA) {
    return { ok: false, error: "You have started several conversations in the last hour. Wait a while and try again." };
  }

  const { data, error } = await admin
    .from("chat_sessions")
    .insert({
      visitante_hash: visitante,
      es_prueba: await esTraficoDePrueba(),
      tester,
      consentimiento_at: tester ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[chat] could not create the conversation", error);
    return { ok: false, error: "We couldn't start the conversation. Please try again." };
  }
  return { ok: true, id: data.id };
}

async function guardar(
  sessionId: string,
  m: Omit<Mensaje, "id"> & { modelo?: string | null },
): Promise<Mensaje> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      rol: m.rol,
      contenido: m.contenido,
      datos: m.outfit ?? null,
      guardrail: m.guardrail ?? null,
      modelo: m.modelo ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`could not save the message: ${error?.message}`);
  return { ...m, id: data.id };
}

async function marcarParaRevision(sessionId: string, motivo: MotivoGuardrail) {
  const admin = createAdminClient();
  // The first reason stays: it is the one that stopped the conversation.
  await admin
    .from("chat_sessions")
    .update({ needs_review: true, motivo_revision: motivo })
    .eq("id", sessionId)
    .eq("needs_review", false);
}

/**
 * Everything the person writes goes through here. The server decides what it is:
 * the answer to the next intake question, or a follow-up once the three are in.
 */
export async function enviar(sessionIdCrudo: string, textoCrudo: string): Promise<Respuesta> {
  const id = sesionSchema.safeParse(sessionIdCrudo);
  if (!id.success) return { ok: false, error: "That conversation doesn't exist." };
  const sessionId = id.data;

  const admin = createAdminClient();
  const { data: sesion } = await admin
    .from("chat_sessions")
    .select("intake, needs_review")
    .eq("id", sessionId)
    .single();
  if (!sesion) return { ok: false, error: "That conversation doesn't exist." };

  const intake = (sesion.intake ?? {}) as Partial<Intake>;
  const pendiente = PREGUNTAS.findIndex((p) => !intake[p.id]);
  const enIntake = pendiente !== -1;

  const texto = (enIntake ? respuestaIntakeSchema : mensajeSchema).safeParse(textoCrudo);
  if (!texto.success) return { ok: false, error: texto.error.issues[0]?.message ?? "Write a few words." };

  const { count: yaEscritos } = await admin
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("rol", "usuaria");
  const seguimientosHechos = Math.max(0, (yaEscritos ?? 0) - PREGUNTAS.length);
  if (!enIntake && seguimientosHechos >= SEGUIMIENTOS_MAXIMOS) {
    return { ok: false, error: "That’s the limit for this conversation. Start a new one for another outfit." };
  }

  const mensajes: Mensaje[] = [];
  mensajes.push(await guardar(sessionId, { rol: "usuaria", contenido: texto.data }));

  // Layer 1: the deterministic guardrail. The model never sees these messages.
  const alto = revisarMensaje(texto.data);
  if (alto) {
    await marcarParaRevision(sessionId, alto.motivo);
    mensajes.push(
      await guardar(sessionId, { rol: "asistente", contenido: RESPUESTA_GUARDRAIL[alto.motivo], guardrail: alto.motivo }),
    );
    return { ok: true, mensajes, siguiente: enIntake ? pendiente : null, seguimientosRestantes: restantes(seguimientosHechos, enIntake), revision: true };
  }

  if (enIntake) {
    const nuevo = { ...intake, [PREGUNTAS[pendiente].id]: texto.data };
    await admin.from("chat_sessions").update({ intake: nuevo }).eq("id", sessionId);
    const siguiente = PREGUNTAS.findIndex((p) => !nuevo[p.id as keyof Intake]);
    if (siguiente !== -1) {
      mensajes.push(
        await guardar(sessionId, { rol: "asistente", contenido: PREGUNTAS[siguiente].texto, pregunta: siguiente }),
      );
      return { ok: true, mensajes, siguiente, seguimientosRestantes: SEGUIMIENTOS_MAXIMOS, revision: sesion.needs_review };
    }
    // The three are in: the first suggestion.
    return responder(sessionId, intakeSchema.parse(nuevo), texto.data, true, mensajes, 0, sesion.needs_review);
  }

  return responder(
    sessionId,
    intakeSchema.parse(intake),
    texto.data,
    false,
    mensajes,
    seguimientosHechos + 1,
    sesion.needs_review,
  );
}

function restantes(hechos: number, enIntake: boolean): number {
  return enIntake ? SEGUIMIENTOS_MAXIMOS : Math.max(0, SEGUIMIENTOS_MAXIMOS - hechos - 1);
}

async function responder(
  sessionId: string,
  intake: Intake,
  texto: string,
  esPrimera: boolean,
  mensajes: Mensaje[],
  seguimientosHechos: number,
  yaEnRevision: boolean,
): Promise<Respuesta> {
  const admin = createAdminClient();
  const { data: historialCrudo } = await admin
    .from("chat_messages")
    .select("rol, contenido")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(30);
  // The current message is already saved; it goes as "new message", not history.
  const historial = (historialCrudo ?? []).slice(0, -1) as Array<{ rol: "usuaria" | "asistente"; contenido: string }>;

  const resultado = await responderChat({
    intake,
    historial,
    mensaje: esPrimera ? "Suggest an outfit for me." : texto,
    esPrimera,
  });

  await admin.from("api_costs").insert({
    provider: "google",
    operation: "chat_reply",
    est_cost_usd: resultado.estCostUsd,
  });

  const quedan = Math.max(0, SEGUIMIENTOS_MAXIMOS - seguimientosHechos);

  if (!resultado.ok) {
    return {
      ok: false,
      error: resultado.proveedorCaido
        ? "The stylist is overloaded right now. Wait a minute and send it again."
        : "I couldn't put an answer together this time. Please send it again.",
    };
  }

  // Layer 2: the model's own classification.
  const motivo = motivoDeClasificacion(resultado.respuesta.clasificacion);
  if (motivo) {
    await marcarParaRevision(sessionId, motivo);
    mensajes.push(
      await guardar(sessionId, { rol: "asistente", contenido: RESPUESTA_GUARDRAIL[motivo], guardrail: motivo, modelo: resultado.model }),
    );
    return { ok: true, mensajes, siguiente: null, seguimientosRestantes: quedan, revision: true };
  }

  mensajes.push(
    await guardar(sessionId, {
      rol: "asistente",
      contenido: resultado.respuesta.respuesta,
      outfit: resultado.respuesta.outfit ?? null,
      modelo: resultado.model,
    }),
  );
  return { ok: true, mensajes, siguiente: null, seguimientosRestantes: quedan, revision: yaEnRevision };
}

/** Thumbs up or down. One per answer; rating again changes nothing. */
export async function calificar(messageId: number, rating: number): Promise<{ ok: boolean }> {
  const datos = z
    .object({ messageId: z.number().int().positive(), rating: z.union([z.literal(1), z.literal(-1)]) })
    .safeParse({ messageId, rating });
  if (!datos.success) return { ok: false };

  const admin = createAdminClient();
  // Only an assistant's model answer can be rated, not a question or a guardrail.
  const { data: m } = await admin
    .from("chat_messages")
    .select("id")
    .eq("id", datos.data.messageId)
    .eq("rol", "asistente")
    .not("modelo", "is", null)
    .is("guardrail", null)
    .maybeSingle();
  if (!m) return { ok: false };

  const { error } = await admin
    .from("chat_ratings")
    .upsert({ message_id: m.id, rating: datos.data.rating }, { onConflict: "message_id", ignoreDuplicates: true });
  if (error) console.error("[chat] could not save the rating", error);
  revalidatePath("/chat");
  return { ok: !error };
}

/** The external tester's summary, at the end of their session. */
export async function guardarResumen(
  sessionIdCrudo: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = sesionSchema.safeParse(sessionIdCrudo);
  const datos = resumenSchema.safeParse({
    tester: formData.get("tester"),
    funciono: formData.get("funciono"),
    confuso: formData.get("confuso") ?? "",
    puntaje: formData.get("puntaje"),
  });
  if (!id.success || !datos.success) {
    return { ok: false, error: datos.success ? "That conversation doesn't exist." : (datos.error.issues[0]?.message ?? "Check the form.") };
  }

  const admin = createAdminClient();
  // The summary must belong to a tester conversation, by the same tester, that
  // actually got an answer: a summary of a test that never happened is not evidence.
  const { data: sesion } = await admin
    .from("chat_sessions")
    .select("tester")
    .eq("id", id.data)
    .single();
  if (!sesion || sesion.tester !== datos.data.tester) return { ok: false, error: "This isn’t a tester conversation." };
  const { count } = await admin
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", id.data)
    .eq("rol", "asistente")
    .not("modelo", "is", null);
  if (!count) return { ok: false, error: "Finish the three questions and get a suggestion first." };

  const { error } = await admin.from("chat_test_summaries").upsert(
    { session_id: id.data, ...datos.data },
    { onConflict: "session_id" },
  );
  if (error) {
    console.error("[chat] could not save the summary", error);
    return { ok: false, error: "We couldn't save your summary. Please try again." };
  }
  revalidatePath("/chat");
  return { ok: true };
}
