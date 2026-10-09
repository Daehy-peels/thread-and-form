"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadCart(userId: string | null) {
      if (!userId) {
        setCartCount(0);
        return;
      }
      const { data } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", userId);
      const total = (data ?? []).reduce((sum, row) => sum + row.quantity, 0);
      setCartCount(total);
    }

    async function loadRole(userId: string | null) {
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      setIsAdmin(data?.role === "admin");
    }

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      loadCart(data.user?.id ?? null);
      loadRole(data.user?.id ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user?.email ?? null);
        loadCart(session?.user?.id ?? null);
        loadRole(session?.user?.id ?? null);
      },
    );

    function onCartChanged() {
      supabase.auth
        .getUser()
        .then(({ data }) => loadCart(data.user?.id ?? null));
    }
    window.addEventListener("cart:changed", onCartChanged);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("cart:changed", onCartChanged);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const links = [
    { href: "/products", label: "Shop" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
    { href: "/cart", label: "Cart" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="Thread & Form home"
        >
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg ring-1 ring-neutral-200 transition duration-300 group-hover:ring-neutral-400 group-hover:shadow-sm">
            <Image
              src="/logo.png"
              alt="Thread & Form logo"
              fill
              className="object-cover transition duration-500 group-hover:scale-110"
            />
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-900">
            Thread &amp; Form
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {link.label}
                  {link.href === "/cart" && cartCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
                      {cartCount}
                    </span>
                  )}
                </span>
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-px origin-left bg-neutral-900 transition-transform duration-300 ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900 md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.6L20 7H6"
              />
              <circle cx="10" cy="20" r="1.3" />
              <circle cx="17" cy="20" r="1.3" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {userEmail ? (
            <div className="hidden items-center gap-3 md:flex">
              <span className="max-w-40 truncate text-sm text-neutral-500">
                {userEmail}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition duration-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white active:scale-[0.97]"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="hidden rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-neutral-700 hover:shadow-md active:scale-[0.97] md:inline-flex"
            >
              Sign in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-700 transition hover:bg-neutral-100 md:hidden"
          >
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 block h-0.5 w-5 rounded bg-current transition-all duration-300 ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-5 rounded bg-current transition-all duration-200 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-5 rounded bg-current transition-all duration-300 ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`grid overflow-hidden border-neutral-200 bg-white transition-all duration-300 ease-out md:hidden ${
          open ? "grid-rows-[1fr] border-t opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">
          <nav className="flex flex-col gap-1 px-4 py-3 sm:px-6">
            {links.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    active
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  {link.label}
                  {link.href === "/cart" && cartCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1.5 text-[11px] font-semibold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="mt-2 border-t border-neutral-200 pt-3">
              {userEmail ? (
                <div className="flex flex-col gap-2">
                  <span className="truncate px-3 text-xs text-neutral-500">
                    {userEmail}
                  </span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="block rounded-lg bg-neutral-900 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-neutral-700"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
