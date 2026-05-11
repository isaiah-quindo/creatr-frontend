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

type FieldErrors = Partial<Record<"email" | "password", string>>;

const PASSWORD_HINT = "At least 8 characters.";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await fetchCsrf();
      await auth.register({ email, password });
      router.push(`/verify-email/sent?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 400 &&
        typeof err.data === "object" &&
        err.data
      ) {
        const data = err.data as Record<string, string[] | string>;
        const nextErrors: FieldErrors = {};
        const stray: string[] = [];
        for (const [k, v] of Object.entries(data)) {
          const msg = Array.isArray(v) ? v.join(" ") : String(v);
          if (!msg) continue;
          if (k === "email" || k === "password") {
            nextErrors[k] = msg;
          } else {
            stray.push(msg);
          }
        }
        setErrors(nextErrors);
        // Only toast for non-field errors (e.g. {"non_field_errors": [...]}). Field-level
        // errors render inline under their inputs.
        if (stray.length > 0 && Object.keys(nextErrors).length === 0) {
          toast({
            title: "Couldn't create account",
            description: stray.join(" "),
            variant: "error",
          });
        }
      } else {
        toast({
          title: "Couldn't create account",
          description: err instanceof Error ? err.message : "Something went wrong.",
          variant: "error",
        });
      }
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
              onChange={(v) => {
                setEmail(v);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
              isInvalid={!!errors.email}
              hint={errors.email}
              isRequired
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              hint={errors.password ?? PASSWORD_HINT}
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              isInvalid={!!errors.password}
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
