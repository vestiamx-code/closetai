import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { cargarEnv } from "./entorno";

/**
 * El camino del dinero (M7).
 *
 * No se simula el webhook: se construye un evento real, se firma con el mismo
 * secreto que usa Stripe y se manda al endpoint de producción. Si la
 * verificación de firma o la idempotencia estuvieran mal, esta prueba lo vería.
 */

cargarEnv();

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SECRETO = process.env.STRIPE_WEBHOOK_SECRET;
const hay = Boolean(URL_SUPABASE && LLAVE && SECRETO);

const admin = () =>
  createClient(URL_SUPABASE!, LLAVE!, { auth: { autoRefreshToken: false, persistSession: false } });

/** Firma un cuerpo como lo hace Stripe: t=timestamp,v1=hmac(timestamp.cuerpo). */
function firmar(cuerpo: string): string {
  const t = Math.floor(Date.now() / 1000);
  const firma = createHmac("sha256", SECRETO!).update(`${t}.${cuerpo}`).digest("hex");
  return `t=${t},v1=${firma}`;
}

function evento(userId: string, sessionId: string, producto: string, montoCentavos: number) {
  return JSON.stringify({
    id: `evt_prueba_${Date.now()}`,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        amount_total: montoCentavos,
        currency: "mxn",
        payment_status: "paid",
        metadata: { user_id: userId, producto },
      },
    },
  });
}

test.describe.configure({ mode: "serial" });

test.describe("Pagos", () => {
  test.skip(!hay, "Faltan credenciales");

  let userId = "";
  const sessionId = `cs_test_prueba_${Date.now()}`;

  test.beforeAll(async () => {
    const { data, error } = await admin().auth.admin.createUser({
      email: `e2e-pagos-${Date.now()}@closetai.lat`,
      password: "Prueba-E2E-2026!",
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user!.id;
  });

  test.afterAll(async () => {
    if (userId) await admin().auth.admin.deleteUser(userId);
  });

  test("rechaza un webhook sin firma válida", async ({ request }) => {
    const r = await request.post("/api/stripe/webhook", {
      headers: { "stripe-signature": "t=1,v1=firmainventada", "content-type": "application/json" },
      data: evento(userId, "cs_falso", "lifetime", 10000),
    });
    // Sin esto, cualquiera podría regalarse créditos con un POST.
    expect(r.status()).toBe(400);
  });

  test("un pago válido activa el plan y abona 30 créditos", async ({ request }) => {
    const cuerpo = evento(userId, sessionId, "lifetime", 10000);
    const r = await request.post("/api/stripe/webhook", {
      headers: { "stripe-signature": firmar(cuerpo), "content-type": "application/json" },
      data: cuerpo,
    });
    expect(r.status()).toBe(200);

    const a = admin();
    const { data: perfil } = await a.from("profiles").select("plan").eq("id", userId).single();
    expect(perfil?.plan).toBe("lifetime");

    const { data: saldo } = await a.rpc("credit_balance", { p_user: userId });
    expect(Number(saldo)).toBe(30);

    const { data: compra } = await a
      .from("purchases")
      .select("amount_mxn, status, product")
      .eq("stripe_session_id", sessionId)
      .single();
    expect(compra?.amount_mxn).toBe(100);
    expect(compra?.status).toBe("paid");
  });

  test("el mismo pago reenviado NO abona dos veces", async ({ request }) => {
    // Stripe reenvía el evento si no recibe 200 a tiempo. Esto es lo que
    // impide que una sola compra abone créditos varias veces.
    const cuerpo = evento(userId, sessionId, "lifetime", 10000);
    const r = await request.post("/api/stripe/webhook", {
      headers: { "stripe-signature": firmar(cuerpo), "content-type": "application/json" },
      data: cuerpo,
    });
    expect(r.status()).toBe(200);
    expect(await r.json()).toMatchObject({ duplicado: true });

    const { data: saldo } = await admin().rpc("credit_balance", { p_user: userId });
    expect(Number(saldo)).toBe(30);
  });

  test("una recarga posterior suma sin volver a tocar el plan", async ({ request }) => {
    const recarga = `cs_test_recarga_${Date.now()}`;
    const cuerpo = evento(userId, recarga, "credits_20", 4900);
    const r = await request.post("/api/stripe/webhook", {
      headers: { "stripe-signature": firmar(cuerpo), "content-type": "application/json" },
      data: cuerpo,
    });
    expect(r.status()).toBe(200);

    const { data: saldo } = await admin().rpc("credit_balance", { p_user: userId });
    expect(Number(saldo)).toBe(50);
  });

  test("un pago sin metadata queda registrado como incidente, no como error", async ({ request }) => {
    // Responder 500 aquí haría que Stripe reintentara para siempre un evento
    // que nunca se va a poder procesar.
    const cuerpo = JSON.stringify({
      id: "evt_sin_metadata",
      type: "checkout.session.completed",
      data: { object: { id: "cs_sin_metadata", amount_total: 10000, metadata: {} } },
    });
    const r = await request.post("/api/stripe/webhook", {
      headers: { "stripe-signature": firmar(cuerpo), "content-type": "application/json" },
      data: cuerpo,
    });
    expect(r.status()).toBe(200);
    expect(await r.json()).toMatchObject({ error: "sin metadata" });
  });
});
