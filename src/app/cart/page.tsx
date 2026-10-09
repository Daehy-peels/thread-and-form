"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  computeShipping,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING_RATE,
} from "@/lib/cart";
import type { Product } from "@/lib/types";

type CartRow = {
  id: string;
  quantity: number;
  products: Product | null;
};

export default function CartPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

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

    const { data } = await supabase
      .from("cart_items")
      .select("id, quantity, products(*)")
      .eq("user_id", user.id);

    setRows((data ?? []) as unknown as CartRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateQuantity(row: CartRow, delta: number) {
    const next = row.quantity + delta;
    if (next < 1 || busyId) return;

    setBusyId(row.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: next })
      .eq("id", row.id);

    if (!error) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, quantity: next } : r)),
      );
      window.dispatchEvent(new Event("cart:changed"));
    }
    setBusyId(null);
  }

  async function removeRow(row: CartRow) {
    if (busyId) return;
    setBusyId(row.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", row.id);
    if (!error) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      window.dispatchEvent(new Event("cart:changed"));
    }
    setBusyId(null);
  }

  const visibleRows = rows.filter((row) => row.products);
  const subtotal = visibleRows.reduce(
    (sum, row) => sum + Number(row.products?.price ?? 0) * row.quantity,
    0,
  );
  const shipping = computeShipping(subtotal);
  const total = subtotal + shipping;
  const itemCount = visibleRows.reduce((sum, row) => sum + row.quantity, 0);
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal,
  );
  const shippingProgress = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
  );

  const buttonClass =
    "group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-700 hover:shadow-lg active:translate-y-0 active:scale-[0.98]";

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="skeleton h-9 w-40 rounded" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-32 rounded-xl" />
            ))}
          </div>
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </main>
    );
  }

  if (!userId) {
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
              d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.6L20 7H6"
            />
            <circle cx="10" cy="20" r="1.3" />
            <circle cx="17" cy="20" r="1.3" />
          </svg>
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-900">
          Your cart
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Sign in to view and manage your shopping cart.
        </p>
        <Link href="/auth" className={`${buttonClass} mt-7`}>
          Sign in
        </Link>
      </main>
    );
  }

  if (visibleRows.length === 0) {
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
              d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.6L20 7H6"
            />
            <circle cx="10" cy="20" r="1.3" />
            <circle cx="17" cy="20" r="1.3" />
          </svg>
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-900">
          Your cart is empty
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Browse the collection and add a few pieces you love.
        </p>
        <Link href="/products" className={`${buttonClass} mt-7`}>
          Start shopping
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            &rarr;
          </span>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Your cart
        </h1>
        <p className="text-sm text-neutral-500">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px] lg:gap-10">
        <div>
          <ul className="space-y-3 sm:space-y-4">
            {visibleRows.map((row, index) => {
              const product = row.products!;
              const busy = busyId === row.id;
              const atMax = row.quantity >= product.stock_quantity;

              return (
                <li
                  key={row.id}
                  className="animate-fade-up flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 transition duration-300 hover:border-neutral-300 hover:shadow-md sm:gap-4 sm:p-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="group relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-28 sm:w-24">
                    {product.image_url && (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="96px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-900">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-sm text-neutral-500">
                          ${Number(product.price).toFixed(2)} each
                        </p>
                        {atMax && (
                          <p className="mt-1 text-xs font-medium text-amber-700">
                            Max stock reached
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(row)}
                        disabled={busy}
                        aria-label={`Remove ${product.name} from cart`}
                        className="shrink-0 rounded-md p-1 text-neutral-400 transition duration-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            d="M6 6l12 12M18 6L6 18"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={`flex items-center rounded-lg border transition duration-200 ${
                          busy
                            ? "border-neutral-200 opacity-60"
                            : "border-neutral-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(row, -1)}
                          disabled={busy || row.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="flex h-9 w-9 items-center justify-center rounded-l-lg text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          &minus;
                        </button>
                        <span className="w-8 text-center text-sm font-medium tabular-nums text-neutral-900">
                          {row.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(row, 1)}
                          disabled={busy || atMax}
                          aria-label="Increase quantity"
                          className="flex h-9 w-9 items-center justify-center rounded-r-lg text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-semibold tabular-nums text-neutral-900">
                        ${(Number(product.price) * row.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <Link
            href="/products"
            className="group mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-1">
              &larr;
            </span>
            Continue shopping
          </Link>
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Order summary
            </p>

            <div className="mt-5 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-semibold tabular-nums text-neutral-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Shipping</span>
                <span
                  className={`tabular-nums ${
                    shipping === 0
                      ? "font-semibold text-green-700"
                      : "text-neutral-700"
                  }`}
                >
                  {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-neutral-200 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-neutral-900">Total</span>
                <span className="text-xl font-semibold tabular-nums tracking-tight text-neutral-900">
                  ${total.toFixed(2)}
                </span>
              </div>

              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-neutral-900 transition-all duration-700 ease-out"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  {remainingForFreeShipping > 0 ? (
                    <>
                      Add{" "}
                      <span className="font-semibold text-neutral-900">
                        ${remainingForFreeShipping.toFixed(2)}
                      </span>{" "}
                      more for free shipping.
                    </>
                  ) : (
                    <span className="font-semibold text-green-700">
                      You&apos;ve unlocked free shipping.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Link
              href="/checkout"
              className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-700 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
            >
              Proceed to checkout
              <span className="transition-transform duration-200 group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>

            <p className="mt-3 text-center text-xs text-neutral-400">
              Flat shipping ${FLAT_SHIPPING_RATE.toFixed(2)} under $
              {FREE_SHIPPING_THRESHOLD}. Payments are simulated.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
