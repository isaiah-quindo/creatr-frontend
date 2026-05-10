"use client";

import { AlertCircle, CheckCircle, Mail01 } from "@untitledui/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { useToast } from "@/components/base/toast/toast";
import { ApiError, auth, fetchCsrf } from "@/lib/api";

type Status = "verifying" | "success" | "error";

function VerifyEmailConfirmInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus("error");
      setErrorMessage("This link is missing its token. Try opening the link from your email again.");
      return;
    }

    (async () => {
      try {
        await fetchCsrf();
        await auth.verifyEmail(token);
        setStatus("success");
        toast({
          title: "Email verified",
          description: "Welcome to Creatr.",
          variant: "success",
        });
        router.replace("/dashboard");
      } catch (err) {
        let message = "This link is invalid or has expired.";
        if (err instanceof ApiError && err.status === 400 && err.data && typeof err.data === "object") {
          const data = err.data as Record<string, string[] | string>;
          const tokenErr = data.token;
          if (tokenErr) {
            message = Array.isArray(tokenErr) ? tokenErr.join(" ") : String(tokenErr);
          }
        }
        setStatus("error");
        setErrorMessage(message);
      }
    })();
  }, [token, router, toast]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Link
          href="/"
          className="self-center text-4xl font-bold tracking-tight text-primary"
        >
          Creatr
        </Link>
        <div className="w-full rounded-2xl border border-secondary bg-primary p-8 text-center shadow-md">
          {status === "verifying" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Mail01 className="size-6 text-primary" />
              </div>
              <h1 className="mb-2 text-display-xs font-semibold">Verifying your email…</h1>
              <p className="text-sm text-tertiary">Hang tight, this only takes a second.</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-secondary">
                <CheckCircle className="size-6 text-success-primary" />
              </div>
              <h1 className="mb-2 text-display-xs font-semibold">Email verified</h1>
              <p className="mb-6 text-sm text-tertiary">Redirecting you to your dashboard…</p>
              <Button size="lg" href="/dashboard">Continue</Button>
            </>
          )}
          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-secondary">
                <AlertCircle className="size-6 text-error-primary" />
              </div>
              <h1 className="mb-2 text-display-xs font-semibold">Couldn&apos;t verify</h1>
              <p className="mb-6 text-sm text-tertiary">{errorMessage}</p>
              <div className="flex flex-col gap-3">
                <Button size="lg" href="/verify-email/sent">Resend the link</Button>
                <Button size="md" color="link-color" href="/login">Back to sign in</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailConfirmPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailConfirmInner />
    </Suspense>
  );
}
