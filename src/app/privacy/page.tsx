import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "What data ClosetAI keeps, what for, and how to delete it.",
};

export default function PrivacidadPage() {
  return (
    <main className="flex-1">
      <header className="mx-auto w-full max-w-2xl px-6 py-6">
        <Link href="/" aria-label="ClosetAI, home" className="shrink-0">
          <Logo />
        </Link>
      </header>

      <article className="mx-auto w-full max-w-2xl px-6 pb-24">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy notice
        </h1>
        <p className="mt-2 text-sm text-text-muted">Last updated: October 26, 2026</p>

        <div className="mt-8 space-y-8 leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold">Who is responsible for your data</h2>
            <p className="mt-2 text-pretty">
              ClosetAI, operated by Tamara Muñoz Delgadillo, based in Mexico, contact{" "}
              <a href="mailto:hola@closetai.lat" className="text-accent underline underline-offset-4">
                hola@closetai.lat
              </a>
              . This notice follows Mexico&rsquo;s Federal Law on the Protection of Personal Data Held by
              Private Parties (LFPDPPP).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">What we keep</h2>
            <ul className="mt-3 space-y-3">
              <li>
                <strong>Your account:</strong> email, name, and if you want, your sizes and your city.
                The city is used to know what weather you&rsquo;ll have.
              </li>
              <li>
                <strong>Photos of your garments:</strong> the ones you upload to your closet, and what AI
                inferred from them.
              </li>
              <li>
                <strong>Full-body photos of you</strong>, if you choose to use the virtual try-on.
                <span className="mt-1 block rounded-lg border border-border bg-surface p-3 text-sm text-pretty">
                  These are <strong>sensitive personal data</strong>. They are only kept if you upload
                  one, they live in private storage nobody else can access, they are used only to
                  generate your virtual try-ons, and they are truly deleted when you delete your account
                  or replace them.
                </span>
              </li>
              <li>
                <strong>What you accept and reject:</strong> it is what lets ClosetAI learn your style.
                You can see everything it has learned in{" "}
                <Link href="/style" className="text-accent underline underline-offset-4">
                  Your style
                </Link>{" "}
                and correct anything.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Pages that don&rsquo;t require an account</h2>
            <p className="mt-2 text-pretty">
              <Link href="/core" className="text-accent underline underline-offset-4">
                The style core
              </Link>
              ,{" "}
              <Link href="/research" className="text-accent underline underline-offset-4">
                the research
              </Link>{" "}
              and{" "}
              <Link href="/pricing" className="text-accent underline underline-offset-4">
                the pricing simulator
              </Link>{" "}
              work without signing up. There we keep:
            </p>
            <ul className="mt-3 space-y-2 text-pretty">
              <li>
                <strong>What you write</strong> —your style paragraph, your research question, the name
                you give a scenario. The result is published on those pages; your original text is not
                shown, and since October 6, 2026 the database prevents it from being read from outside.
                Don&rsquo;t put personal details there.
              </li>
              <li>
                <strong>A fingerprint of your connection</strong>, so nobody can use the service thousands
                of times and bring it down. It is a hash of your IP address, not the address: it tells
                visitors apart, it doesn&rsquo;t identify you. It used to be stored in full; we fixed that.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Who it is shared with</h2>
            <p className="mt-2 text-pretty">
              For the app to work, your photos go through artificial intelligence providers that process
              them and return a result:
            </p>
            <ul className="mt-3 space-y-2 text-pretty">
              <li>
                <strong>Google (Gemini)</strong> — recognizes your garments and builds your outfits.
              </li>
              <li>
                <strong>fal.ai</strong> — removes photo backgrounds and generates the virtual try-ons.
              </li>
              <li>
                <strong>Supabase</strong> — stores your account and your files, on servers in the
                United States.
              </li>
              <li>
                <strong>Stripe</strong> — processes payments. ClosetAI never sees or stores your card
                details.
              </li>
            </ul>
            <p className="mt-3 text-pretty">
              We don&rsquo;t sell your data. We don&rsquo;t use it for advertising. There are no ads on ClosetAI.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Your ARCO rights</h2>
            <p className="mt-2 text-pretty">
              Under Mexican law you can access, rectify, cancel or oppose the processing of your data (the
              ARCO rights). Two of them you exercise yourself, without asking anyone&rsquo;s permission:
            </p>
            <ul className="mt-3 space-y-2 text-pretty">
              <li>
                <strong>Rectify:</strong> correct your details in your profile, and the style inferences
                on the Your style screen.
              </li>
              <li>
                <strong>Cancel:</strong> the delete-account button in your profile erases your data and
                your files. They are not archived anywhere.
              </li>
            </ul>
            <p className="mt-3 text-pretty">
              For access or opposition, write to us at{" "}
              <a href="mailto:hola@closetai.lat" className="text-accent underline underline-offset-4">
                hola@closetai.lat
              </a>{" "}
              and we will answer within 20 business days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Links to stores</h2>
            <p className="mt-2 text-pretty">
              When ClosetAI recommends buying something, the link may carry an affiliate code and we may
              earn a commission. That doesn&rsquo;t change what we recommend: relevance comes first and the
              affiliate only breaks ties. Outgoing clicks are logged to learn which recommendations are
              useful.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Changes</h2>
            <p className="mt-2 text-pretty">
              If this changes, the date above changes with it and we will let you know by email before it
              applies.
            </p>
          </section>
        </div>

        <p className="mt-12 border-t border-border pt-6">
          <Link href="/" className="text-sm text-accent underline underline-offset-4">
            ← Back
          </Link>
        </p>
      </article>
    </main>
  );
}
