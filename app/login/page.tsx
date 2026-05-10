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

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchCsrf();
      await auth.login({ email, password });
      toast({
        title: "Signed in",
        description: "Welcome back.",
        variant: "success",
      });
      router.push("/dashboard");
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 403 &&
        typeof err.data === "object" &&
        err.data &&
        (err.data as { code?: string }).code === "email_not_verified"
      ) {
        router.push(`/verify-email/sent?email=${encodeURIComponent(email)}&unverified=1`);
        return;
      }
      const message =
        err instanceof ApiError && err.status === 400
          ? "Invalid email or password."
          : err instanceof Error
            ? err.message
            : "Something went wrong.";
      toast({
        title: "Couldn't sign in",
        description: message,
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
        toast({
          title: "Signed in",
          description: "Welcome back.",
          variant: "success",
        });
        router.push("/dashboard");
      } catch (err) {
        toast({
          title: "Couldn't sign in with Google",
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
          <h1 className="mb-6 text-display-xs font-semibold">Sign in</h1>
          <div className="flex flex-col gap-4">
            <GoogleSignInButton text="signin_with" onCredential={onGoogleCredential} />
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
              isRequired
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              isRequired
            />
            <Button type="submit" size="lg" isLoading={loading}>
              Sign in
            </Button>
          </div>
          <p className="mt-6 text-center text-sm text-tertiary">
            New here?{" "}
            <Button color="link-color" size="sm" href="/register">
              Create an account
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
