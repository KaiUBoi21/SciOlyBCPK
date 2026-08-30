"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

type Mode = "signin" | "signup";

export default function LoginForm({
  checkEmail,
  initialError,
}: {
  checkEmail: boolean;
  initialError?: string;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    mode === "signin" ? signIn : signUp,
    undefined
  );

  const message = state?.error ?? initialError;

  return (
    <div className="rounded-sm border border-chart-rule bg-chart-ground-raised p-6">
      <div className="mb-5 flex gap-1 font-mono text-xs">
        <button
          type="button"
          onClick={() => setMode("signin")}
          aria-pressed={mode === "signin"}
          className={
            "flex-1 rounded-[2px] px-3 py-1.5 " +
            (mode === "signin"
              ? "bg-division-b text-chart-ground-raised"
              : "text-chart-ink-muted hover:text-chart-ink")
          }
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          aria-pressed={mode === "signup"}
          className={
            "flex-1 rounded-[2px] px-3 py-1.5 " +
            (mode === "signup"
              ? "bg-division-b text-chart-ground-raised"
              : "text-chart-ink-muted hover:text-chart-ink")
          }
        >
          Create account
        </button>
      </div>

      {checkEmail && (
        <p className="mb-4 rounded-[2px] border border-division-c bg-division-c-tint px-3 py-2 text-xs text-chart-ink">
          Check your email for a confirmation link, then sign in.
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-3">
        {mode === "signup" && (
          <Field
            label="Full name"
            name="fullName"
            type="text"
            autoComplete="name"
          />
        )}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />

        {message && (
          <p className="font-mono text-xs text-accent">{message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-[2px] bg-division-b px-3 py-2 text-sm font-medium text-chart-ground-raised disabled:opacity-60"
        >
          {pending
            ? "Working…"
            : mode === "signin"
            ? "Sign in"
            : "Create account"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-xs text-chart-ink-muted">{label}</span>
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        className="rounded-[2px] border border-chart-rule bg-white px-2.5 py-1.5 text-sm text-chart-ink outline-none focus-visible:outline-2"
        style={{ outlineColor: "var(--division-b)" }}
      />
    </label>
  );
}
