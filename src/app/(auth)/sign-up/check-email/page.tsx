import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Check your email" };

export default function RevisaTuCorreoPage() {
  return (
    <div className="text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Check your email</h1>
      <p className="mt-4 leading-relaxed text-text-muted text-pretty">
        We sent you a link to confirm your account. Open it on this same device and you’ll go
        straight to your closet.
      </p>
      <p className="mt-6 text-sm text-text-muted">
        If it doesn’t arrive in a few minutes, check your spam folder.
      </p>
      <p className="mt-8 text-sm">
        <Link href="/sign-in" className="text-accent underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
