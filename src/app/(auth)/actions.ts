"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

/** What the actions return to the form so it can show the error. */
export type EstadoFormulario = { error?: string; aviso?: string };

const correo = z.string().trim().min(1, "Enter your email").email("That email doesn't look valid");
const contrasena = z.string().min(8, "The password needs at least 8 characters");

const registroSchema = z.object({
  email: correo,
  password: contrasena,
  nombre: z.string().trim().min(1, "What's your name?").max(60),
  // The HTML `required` can be removed from the browser. Consent to process
  // sensitive data has to be checked on the server (§4.4).
  consentimiento: z.literal("on", { message: "We need your consent to create the account." }),
});

const entrarSchema = z.object({ email: correo, password: z.string().min(1, "Enter your password") });

/** First zod error message, in English, to show as is. */
function primerError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check your details";
}

async function urlDelSitio(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}

export async function registrarse(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const datos = registroSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    nombre: formData.get("nombre"),
    consentimiento: formData.get("consentimiento"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: datos.data.email,
    password: datos.data.password,
    options: {
      data: {
        full_name: datos.data.nombre,
        // Records when consent was given.
        consentimiento_privacidad: new Date().toISOString(),
      },
      emailRedirectTo: `${await urlDelSitio()}/auth/callback`,
    },
  });

  if (error) {
    // Supabase messages are technical, so we show our own.
    if (error.message.includes("already registered")) {
      return { error: "That email already has an account. Sign in." };
    }
    return { error: "We couldn't create your account. Please try again." };
  }

  redirect("/registro/revisa-tu-correo");
}

export async function entrar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const datos = entrarSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(datos.data);

  if (error) {
    // On purpose we don't tell "doesn't exist" from "wrong password":
    // saying so reveals which emails have an account.
    return { error: "Wrong email or password." };
  }

  const destino = String(formData.get("destino") ?? "").startsWith("/")
    ? String(formData.get("destino"))
    : "/closet";

  revalidatePath("/", "layout");
  redirect(destino);
}

export async function salir(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function pedirRecuperacion(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const datos = z.object({ email: correo }).safeParse({ email: formData.get("email") });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(datos.data.email, {
    redirectTo: `${await urlDelSitio()}/auth/callback?siguiente=/nueva-contrasena`,
  });

  // Always the same message, whether the account exists or not: if we said "that
  // email is not registered", anyone could find out who has an account.
  return { aviso: "If that email has an account, we sent you a link to change your password." };
}

export async function cambiarContrasena(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const datos = z.object({ password: contrasena }).safeParse({ password: formData.get("password") });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "The link expired. Ask for a new one." };

  const { error } = await supabase.auth.updateUser({ password: datos.data.password });
  if (error) return { error: "We couldn't change your password. Please try again." };

  revalidatePath("/", "layout");
  redirect("/closet");
}
