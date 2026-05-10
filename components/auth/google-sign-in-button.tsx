"use client";

import { useEffect, useRef, useState } from "react";

const GIS_SRC = "https://accounts.google.com/gsi/client";

type GisCredentialResponse = { credential: string };

type GisAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GisCredentialResponse) => void;
    auto_select?: boolean;
    ux_mode?: "popup" | "redirect";
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
    },
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GisAccountsId } };
  }
}

let gisLoader: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisLoader) return gisLoader;

  gisLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS load failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("GIS load failed"));
    document.head.appendChild(s);
  });

  return gisLoader;
}

export type GoogleSignInButtonProps = {
  /** Called with the JWT credential string Google returns. */
  onCredential: (credential: string) => void;
  /** Button copy. Defaults to "continue_with". */
  text?: "signin_with" | "signup_with" | "continue_with";
  /** Pixel width of the rendered button. Defaults to 320. */
  width?: number;
};

/**
 * Renders Google's official "Sign in with Google" button via Google Identity
 * Services. The button is drawn by Google's script into our container div —
 * we don't style it directly (their branding guidelines require their button).
 */
export function GoogleSignInButton({
  onCredential,
  text = "continue_with",
  width = 320,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onCredential);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google sign-in is not configured.");
      return;
    }

    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callbackRef.current(response.credential),
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "rectangular",
          logo_alignment: "left",
          width,
        });
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load Google sign-in.");
      });

    return () => {
      cancelled = true;
    };
  }, [text, width]);

  if (error) {
    return <p className="text-center text-sm text-error-primary">{error}</p>;
  }
  return <div ref={containerRef} className="flex justify-center" />;
}
