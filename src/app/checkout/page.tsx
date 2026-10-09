"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { computeShipping } from "@/lib/cart";
import type { Product } from "@/lib/types";

type CartRow = {
  id: string;
  quantity: number;
  products: Product | null;
};

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition duration-200 placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";

const primaryButtonClass =
  "group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-700 hover:shadow-lg active:translate-y-0 active:scale-[0.98]";

function EmptyState({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-20 text-center sm:py-24">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 6h18M3 6l1.5 13a2 2 0 0 0 2 1.8h11a2 2 0 0 0 2-1.8L21 6M8 6V4.5A2.5 2.5 0 0 1 10.5 2h3A2.5 2.5 0 0 1 16 4.5V6"
          />
        </svg>
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-900">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-neutral-500">{body}</p>
      <Link href={href} className={`${primaryButtonClass} mt-7`}>
        {cta}
        <span className="transition-transform duration-200 group-hover:translate-x-1">
          &rarr;
        </span>
      </Link>
    </main>
  );
}

export default function CheckoutPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [orderId, setOrderId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserId(user?.id ?? null);
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }

    const [cartRes, profileRes] = await Promise.all([
      supabase
        .from("cart_items")
        .select("id, quantity, products(*)")
        .eq("user_id", user.id),
      supabase
        .from("profiles")
        .select("full_name, shipping_address")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    setRows((cartRes.data ?? []) as unknown as CartRow[]);
    setFullName(profileRes.data?.full_name ?? "");
    setShippingAddress(profileRes.data?.shipping_address ?? "");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleRows = rows.filter((row) => row.products);
  const subtotal = visibleRows.reduce(
    (sum, row) => sum + Number(row.products?.price ?? 0) * row.quantity,
    0,
  );
  const shipping = computeShipping(subtotal);
  const total = subtotal + shipping;

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (placing || !userId) return;

    setPlacing(true);
    setMessage("");

    const supabase = createClient();

    const items = visibleRows.map((row) => ({
      product_id: row.products!.id,
      quantity: row.quantity,
      unit_price: Number(row.products!.price),
    }));

    const { data, error } = await supabase.rpc("place_order", {
      p_shipping_address: shippingAddress.trim(),
      p_total_amount: total,
      p_items: items,
    });

    if (error || !data) {
      console.error("place_order failed:", error?.message);
      setMessageType("error");
      setMessage(
        error?.message ?? "Could not place the order. Please try again.",
      );
      setPlacing(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        shipping_address: shippingAddress.trim(),
      })
      .eq("id", userId);

    window.dispatchEvent(new Event("cart:changed"));

    setOrderId(data as string);
    setMessageType("success");
    setMessage("Order placed successfully. Thank you for shopping with us!");
    setRows([]);
    setPlacing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="skeleton h-9 w-40 rounded" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="skeleton h-72 rounded-xl" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <EmptyState
        title="Checkout"
        body="Sign in to complete your purchase."
        href="/auth"
        cta="Sign in"
      />
    );
  }

  if (orderId) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-20 text-center sm:py-24">
        <span className="animate-fade-up mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-200">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-7 w-7"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <h1
          className="animate-fade-up mt-6 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl"
          style={{ animationDelay: "80ms" }}
        >
          Order confirmed
        </h1>
        <p
          className="animate-fade-up mt-3 text-sm leading-6 text-neutral-500"
          style={{ animationDelay: "140ms" }}
        >
          {message}
        </p>
        <div
          className="animate-fade-up mt-6 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-left"
          style={{ animationDelay: "200ms" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Order reference
          </p>
          <p className="mt-1 break-all font-mono text-sm text-neutral-900">
            {orderId}
          </p>
        </div>
        <div
          className="animate-fade-up mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center"
          style={{ animationDelay: "260ms" }}
        >
          <Link href="/products" className={primaryButtonClass}>
            Continue shopping
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
          <Link
            href="/cart"
            className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 px-6 py-3.5 text-sm font-semibold text-neutral-700 transition duration-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white active:scale-[0.98] sm:w-auto"
          >
            Back to cart
          </Link>
        </div>
      </main>
    );
  }

  if (visibleRows.length === 0) {
    return (
      <EmptyState
        title="Checkout"
        body="Your cart is empty. Add some products before checking out."
        href="/products"
        cta="Browse products"
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-neutral-400">
        <Link href="/cart" className="transition hover:text-neutral-700">
          Cart
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-neutral-600">Checkout</span>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
        Checkout
      </h1>

      <form
        onSubmit={placeOrder}
        className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:gap-10"
      >
        <section className="animate-fade-up space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Shipping details
            </h2>

            <div className="mt-5 space-y-4">
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
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  className={inputClass}
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="shippingAddress"
                  className="mb-1.5 block text-sm font-medium text-neutral-700"
                >
                  Shipping address
                </label>
                <textarea
                  id="shippingAddress"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                  rows={4}
                  autoComplete="street-address"
                  className={`${inputClass} resize-y leading-6`}
                  placeholder="Street, city, postcode, country"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Payment
            </h2>
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-neutral-50 p-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500"
                aria-hidden="true"
              >
                <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                <path strokeLinecap="round" d="M2.5 10h19" />
              </svg>
              <p className="text-sm leading-6 text-neutral-600">
                This is a student project, so payment is simulated. Your order is
                marked as paid the moment you place it — no card details are
                collected.
              </p>
            </div>
          </div>
        </section>

        <aside className="animate-fade-up h-fit lg:sticky lg:top-24" style={{ animationDelay: "80ms" }}>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Order summary
            </p>

            <ul className="mt-5 space-y-3.5">
              {visibleRows.map((row) => {
                const product = row.products!;
                return (
                  <li key={row.id} className="flex items-center gap-3">
                    <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                      {product.image_url && (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
                        {row.quantity}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">
                      {product.name}
                    </span>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-neutral-900">
                      ${(Number(product.price) * row.quantity).toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 space-y-2.5 border-t border-neutral-200 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span className="tabular-nums text-neutral-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Shipping</span>
                <span
                  className={`tabular-nums ${
                    shipping === 0
                      ? "font-semibold text-green-700"
                      : "text-neutral-900"
                  }`}
                >
                  {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-neutral-200 pt-4">
              <span className="font-semibold text-neutral-900">Total</span>
              <span className="text-xl font-semibold tabular-nums tracking-tight text-neutral-900">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              type="submit"
              disabled={placing}
              className={`${primaryButtonClass} mt-6 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-neutral-900 disabled:hover:shadow-sm disabled:active:scale-100`}
            >
              {placing ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Placing order...
                </>
              ) : (
                <>
                  Place order · ${total.toFixed(2)}
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </>
              )}
            </button>

            <div
              aria-live="polite"
              className={`grid overflow-hidden transition-all duration-300 ${
                message ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0">
                <p
                  className={`rounded-lg border p-3 text-sm leading-6 ${
                    messageType === "error"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-green-200 bg-green-50 text-green-700"
                  }`}
                >
                  {message || "\u00a0"}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </main>
  );
}
