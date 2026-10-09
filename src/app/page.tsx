"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

const perks = [
  {
    title: "Free shipping",
    body: "On all orders over $50, delivered to your door.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 7h11v9H2zM13 10h4.5l3.5 3.5V16h-8M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
      />
    ),
  },
  {
    title: "Easy returns",
    body: "30-day hassle-free returns on unworn items.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10a9 9 0 1 1 2.6 6.4M3 10V5m0 5h5"
      />
    ),
  },
  {
    title: "Secure checkout",
    body: "Your details and orders are protected end to end.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v6c0 4.4-3 7.9-7 9-4-1.1-7-4.6-7-9V6l7-3Zm-3 9l2 2 4-4"
      />
    ),
  },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(4),
        supabase.from("categories").select("*").order("name"),
      ]);

      let items = (productsRes.data ?? []) as Product[];
      if (items.length === 0) {
        const fallback = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(4);
        items = (fallback.data ?? []) as Product[];
      }

      setFeatured(items);
      setCategories((categoriesRes.data ?? []) as Category[]);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div
          className="pointer-events-none absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-white/[0.07] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-white/[0.05] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_60%)]"
          aria-hidden
        />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-28 lg:py-36">
          <span className="animate-fade-up mb-6 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-white/15">
            <Image
              src="/logo.png"
              alt="Thread & Form logo"
              fill
              className="object-cover"
              priority
            />
          </span>
          <p
            className="animate-fade-up mb-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-neutral-400"
            style={{ animationDelay: "60ms" }}
          >
            Thread &amp; Form
          </p>
          <h1
            className="animate-fade-up max-w-2xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "120ms" }}
          >
            Well-made essentials, cut for everyday.
          </h1>
          <p
            className="animate-fade-up mt-5 max-w-xl text-pretty text-base leading-7 text-neutral-400 sm:text-lg"
            style={{ animationDelay: "180ms" }}
          >
            Thoughtfully designed clothing and accessories built to last. Shop
            the latest collection and find pieces you&apos;ll reach for again
            and again.
          </p>
          <div
            className="animate-fade-up mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/products"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-xl active:translate-y-0 sm:w-auto"
            >
              Shop the collection
              <span className="transition-transform duration-200 group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
            <Link
              href="/auth"
              className="inline-flex w-full items-center justify-center rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/5 active:translate-y-0 sm:w-auto"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Featured pieces
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">
              Hand-picked favourites from this season.
            </p>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900 transition hover:text-neutral-600"
          >
            View all
            <span className="h-px w-4 bg-neutral-900 transition-all duration-300 group-hover:w-7 group-hover:bg-neutral-600" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="skeleton aspect-[4/5] w-full rounded-xl" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/3 rounded" />
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 py-12 text-center text-sm text-neutral-500">
            No products yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      {categories.length > 0 && (
        <section className="border-y border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Shop by category
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="animate-fade-up group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-neutral-900 hover:shadow-lg hover:shadow-neutral-900/5"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <p className="font-semibold text-neutral-900">
                    {category.name}
                  </p>
                  <p className="mt-1.5 flex-1 text-sm leading-6 text-neutral-500">
                    {category.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                    Browse
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </span>
                  <span
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-neutral-900 transition-transform duration-300 group-hover:scale-x-100"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {perks.map((perk) => (
            <div
              key={perk.title}
              className="group flex gap-4 rounded-xl p-2 transition-colors duration-300 hover:bg-neutral-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 transition duration-300 group-hover:bg-neutral-900 group-hover:text-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  {perk.icon}
                </svg>
              </span>
              <div>
                <p className="font-semibold text-neutral-900">{perk.title}</p>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  {perk.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
