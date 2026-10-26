import type { Metadata } from "next";
import Link from "next/link";

import { Subidor } from "./subidor";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Add garments" };

export default async function SubirPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/closet" className="text-sm text-text-muted underline underline-offset-4">
        ← Back to the closet
      </Link>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Add garments
      </h1>
      <p className="mt-2 leading-relaxed text-text-muted text-pretty">
        Take the photo on a plain background with good light. AI recognizes the garment, its colors
        and when to wear it — you just confirm.
      </p>

      <Subidor userId={user.id} />

      <div className="mt-10 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">For good photos</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-muted">
          <li>· One garment per photo, laid flat or hanging.</li>
          <li>· A plain background: a wall, the bed, the floor.</li>
          <li>· Daylight if you can. Yellow light changes the colors.</li>
          <li>· It doesn’t matter if the photo is large: it is compressed before uploading.</li>
        </ul>
      </div>
    </div>
  );
}
