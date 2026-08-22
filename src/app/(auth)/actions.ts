"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

/** Lo que devuelven las acciones al formulario para pintar el error. */
export type EstadoFormulario = { error?: string; aviso?: string };

const correo = z.string().trim().min(1, "Escribe tu correo").email("Ese correo no se ve válido");
const contrasena = z.string().min(8, "La contraseña necesita al menos 8 caracteres");

const registroSchema = z.object({
  email: correo,
  password: contrasena,
  nombre: z.string().trim().min(1, "¿Cómo te llamas?").max(60),
  // El `required` del HTML se puede quitar desde el navegador. El consentimiento
  // para tratar datos sensibles tiene que comprobarse en el servidor (§4.4).
  consentimiento: z.literal("on", { message: "Necesitamos tu consentimiento para crear la cuenta." }),
});

const entrarSchema = z.object({ email: correo, password: z.string().min(1, "Escribe tu contraseña") });

/** Primer mensaje de error de zod, en español, para mostrar tal cual. */
function primerError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Revisa los datos";
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
        // Queda constancia de cuándo se dio el consentimiento.
        consentimiento_privacidad: new Date().toISOString(),
      },
      emailRedirectTo: `${await urlDelSitio()}/auth/callback`,
    },
  });

  if (error) {
    // Los mensajes de Supabase vienen en inglés y son técnicos.
    if (error.message.includes("already registered")) {
      return { error: "Ese correo ya tiene cuenta. Inicia sesión." };
    }
    return { error: "No pudimos crear tu cuenta. Inténtalo de nuevo." };
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
    // A propósito no distinguimos "no existe" de "contraseña incorrecta":
    // decirlo revela qué correos tienen cuenta.
    return { error: "Correo o contraseña incorrectos." };
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

  // Siempre el mismo mensaje, exista o no la cuenta: si dijéramos "ese correo no
  // está registrado", cualquiera podría averiguar quién tiene cuenta.
  return { aviso: "Si ese correo tiene cuenta, te mandamos un enlace para cambiar tu contraseña." };
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
  if (!user) return { error: "El enlace expiró. Pide uno nuevo." };

  const { error } = await supabase.auth.updateUser({ password: datos.data.password });
  if (error) return { error: "No pudimos cambiar tu contraseña. Intenta de nuevo." };

  revalidatePath("/", "layout");
  redirect("/closet");
}
