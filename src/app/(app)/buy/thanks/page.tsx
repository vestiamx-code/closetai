import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { saldo } from "@/lib/credits";

export const metadata: Metadata = { title: "Thank you" };

export default async function GraciasPage() {
  const user = await requireUser();
  const creditos = await saldo(user.id);

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-20 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Done, you’re in
      </h1>
      <p className="mt-4 leading-relaxed text-text-muted text-pretty">
        You have <strong className="text-text">{creditos} credits</strong> for virtual try-on and the
        full stylist unlocked.
      </p>
      <p className="mt-3 text-sm text-text-muted text-pretty">
        If the balance still says zero, give it a few seconds and reload: the payment is confirmed by
        Stripe and sometimes takes a moment to arrive.
      </p>
      <Link
        href="/today"
        className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 font-medium text-accent-contrast transition hover:opacity-90"
      >
        See my outfits
      </Link>
    </div>
  );
}
