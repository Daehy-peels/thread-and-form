"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  const isSignUp = mode === "signup";

  function switchMode(next: Mode) {
    setMode(next);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setMessageType("error");
        setMessage(error.message);
      } else if (data.session) {
        window.location.href = "/";
      } else {
        setMessageType("success");
        setMessage(
          "Account created. Please check your email to confirm your account.",
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setMessageType("error");
        setMessage(error.message);
      } else {
        window.location.href = "/";
      }
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-stretch bg-neutral-50">
      {/* Brand panel */}
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-neutral-900 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5 blur-2xl"
          aria-hidden
        />

        <div className="relative flex items-center gap-3">
          <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl ring-1 ring-white/15">
            <Image
              src="/logo.png"
              alt="Thread & Form logo"
              fill
              className="object-cover"
              priority
            />
          </span>
          <span className="text-lg font-semibold tracking-[0.18em] text-white uppercase">
            Thread &amp; Form
          </span>
        </div>

        <div className="relative space-y-4">
          <h2 className="text-4xl font-semibold leading-tight">
            Well-made essentials,
            <br />
            cut for everyday.
          </h2>
          <p className="max-w-sm text-neutral-400">
            Sign in to shop the latest collections, track your orders, and get
            early access to new drops.
          </p>
        </div>

        <p className="relative text-xs text-neutral-500">
          &copy; {new Date().getFullYear()} Thread &amp; Form. All rights
          reserved.
        </p>
      </section>

      {/* Form panel */}
      <section className="flex w-full items-center justify-center px-4 py-10 sm:py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-3 lg:hidden">
            <span className="flex items-center gap-2.5">
              <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg ring-1 ring-neutral-200">
                <Image
                  src="/logo.png"
                  alt="Thread & Form logo"
                  fill
                  className="object-cover"
                  priority
                />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-900">
                Thread &amp; Form
              </span>
            </span>
            <a
              href="/"
              className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
            >
              Back to shop
            </a>
          </div>

          <h1 className="animate-fade-up text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            {isSignUp ? "Create account" : "Welcome back"}
          </h1>
          <p
            className="animate-fade-up mt-2 text-sm text-neutral-500"
            style={{ animationDelay: "60ms" }}
          >
            {isSignUp
              ? "Sign up to start shopping your favorite styles."
              : "Sign in to continue to your account."}
          </p>

          {/* Segmented toggle */}
          <div className="mt-8 grid grid-cols-2 gap-1 rounded-xl bg-neutral-200/70 p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition duration-200 ${
                !isSignUp
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition duration-200 ${
                isSignUp
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {isSignUp && (
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1.5 block text-sm font-medium text-neutral-700"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  autoComplete="name"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition duration-200 placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                  placeholder="Jane Doe"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-neutral-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition duration-200 placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-neutral-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 pr-16 text-sm text-neutral-900 outline-none transition duration-200 placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium uppercase tracking-wide text-neutral-500 transition hover:text-neutral-900"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-700 hover:shadow-lg active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-neutral-900 disabled:hover:shadow-sm"
            >
              {loading && (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden
                />
              )}
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <div
            aria-live="polite"
            className={`grid overflow-hidden transition-all duration-300 ${
              message ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <p
              role="status"
              className={`min-h-0 rounded-lg border p-3 text-sm leading-6 ${
                messageType === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {message || " "}
            </p>
          </div>

          <p className="mt-8 text-center text-sm text-neutral-500">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isSignUp ? "signin" : "signup")}
              className="font-semibold text-neutral-900 underline underline-offset-2 transition hover:text-neutral-600"
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
