"use client";

import { ArrowLeft } from "@untitledui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useToast } from "@/components/base/toast/toast";
import { ApiError, auth, fetchCsrf } from "@/lib/api";

type FieldInvalid = Partial<Record<"email" | "password", boolean>>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invalid, setInvalid] = useState<FieldInvalid>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInvalid({});
    setLoading(true);
    try {
      await fetchCsrf();
      await auth.register({ email, password });
      router.push(`/verify-email/sent?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const messages: string[] = [];
      const nextInvalid: FieldInvalid = {};
      if (
        err instanceof ApiError &&
        err.status === 400 &&
        typeof err.data === "object" &&
        err.data
      ) {
        const data = err.data as Record<string, string[] | string>;
        for (const [k, v] of Object.entries(data)) {
          const msg = Array.isArray(v) ? v.join(" ") : String(v);
          if (k === "email" || k === "password") nextInvalid[k] = true;
          if (msg) messages.push(msg);
        }
      } else {
        messages.push(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      }
      setInvalid(nextInvalid);
      toast({
        title: "Couldn't create account",
        description: messages.join(" ") || "Something went wrong.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const onGoogleCredential = useCallback(
    async (credential: string) => {
      try {
        await fetchCsrf();
        await auth.google(credential);
        router.push("/dashboard");
      } catch (err) {
        toast({
          title: "Couldn't sign up with Google",
          description: err instanceof Error ? err.message : "Something went wrong.",
          variant: "error",
        });
      }
    },
    [router, toast],
  );

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Link
          href="/"
          className="self-center text-4xl font-bold tracking-tight text-primary"
        >
          Creatr
        </Link>
        <form
          onSubmit={onSubmit}
          className="w-full rounded-2xl border border-secondary bg-primary p-8 shadow-md"
        >
          <h1 className="mb-2 text-display-xs font-semibold">
            Create your account
          </h1>
          <p className="mb-6 text-sm text-tertiary">
            You&apos;ll pick your @handle later when you build your portfolio.
          </p>
          <div className="flex flex-col gap-4">
            <GoogleSignInButton text="signup_with" onCredential={onGoogleCredential} />
            <div className="flex items-center gap-3 py-1 text-xs uppercase tracking-wide text-tertiary">
              <span className="h-px flex-1 bg-secondary" />
              or
              <span className="h-px flex-1 bg-secondary" />
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              isInvalid={!!invalid.email}
              isRequired
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              hint="At least 8 characters."
              value={password}
              onChange={setPassword}
              isInvalid={!!invalid.password}
              isRequired
            />
            <Button type="submit" size="lg" isLoading={loading}>
              Create account
            </Button>
          </div>
          <p className="mt-6 text-center text-sm text-tertiary">
            Already have one?{" "}
            <Button color="link-color" size="sm" href="/login">
              Sign in
            </Button>
          </p>
        </form>
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
