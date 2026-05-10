"use client";

import { ArrowLeft, Mail01 } from "@untitledui/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { useToast } from "@/components/base/toast/toast";
import { auth, fetchCsrf } from "@/lib/api";

function VerifyEmailSentInner() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const wasUnverifiedLogin = params.get("unverified") === "1";
  const { toast } = useToast();
  const [resending, setResending] = useState(false);

  async function onResend() {
    if (!email) {
      toast({
        title: "Missing email",
        description: "Open the verification link from the email we sent, or sign in to resend.",
        variant: "error",
      });
      return;
    }
    setResending(true);
    try {
      await fetchCsrf();
      await auth.resendVerification(email);
      toast({
        title: "Email sent",
        description: "If the address matches an unverified account, a new link is on its way.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't resend",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "error",
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Link
          href="/"
          className="self-center text-4xl font-bold tracking-tight text-primary"
        >
          Creatr
        </Link>
        <div className="w-full rounded-2xl border border-secondary bg-primary p-8 shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Mail01 className="size-6 text-primary" />
          </div>
          <h1 className="mb-2 text-display-xs font-semibold">
            {wasUnverifiedLogin ? "Verify your email first" : "Check your email"}
          </h1>
          <p className="mb-6 text-sm text-tertiary">
            {wasUnverifiedLogin
              ? "We sent a verification link to "
              : "We sent a verification link to "}
            <span className="font-medium text-primary">{email || "your inbox"}</span>
            . Open it to finish setting up your account.
          </p>
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={onResend} isLoading={resending} color="secondary">
              Resend email
            </Button>
            <Button size="md" color="link-color" href="/login">
              Back to sign in
            </Button>
          </div>
          <p className="mt-6 text-xs text-tertiary">
            Didn&apos;t get it? Check your spam folder, or wait a minute and try resending.
          </p>
        </div>
        <Button
          color="tertiary"
          size="sm"
          href="/"
          iconLeading={<ArrowLeft />}
          className="self-center"
        >
          Back to home
        </Button>
      </div>
    </main>
  );
}

export default function VerifyEmailSentPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailSentInner />
    </Suspense>
  );
}
