"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type SortKey = "newest" | "featured" | "price-asc" | "price-desc";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);

      if (productsRes.error) {
        setError(productsRes.error.message);
      } else {
        setProducts((productsRes.data ?? []) as Product[]);
      }
      setCategories((categoriesRes.data ?? []) as Category[]);
      setLoading(false);
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory) {
      const category = categories.find((c) => c.slug === activeCategory);
      if (category) {
        list = list.filter((p) => p.category_id === category.id);
      }
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q),
      );
    }

    const sorted = [...list];
    if (sort === "price-asc") {
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price-desc") {
      sorted.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "featured") {
      sorted.sort(
        (a, b) => Number(b.is_featured) - Number(a.is_featured),
      );
    }
    return sorted;
  }, [products, categories, activeCategory, query, sort]);

  const activeCategoryName = categories.find(
    (c) => c.slug === activeCategory,
  )?.name;

  const chipClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition duration-200 active:scale-95 ${
      active
        ? "bg-neutral-900 text-white shadow-sm"
        : "border border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
    }`;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 text-xs text-neutral-400">
            <Link href="/" className="transition hover:text-neutral-700">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-neutral-600">
              {activeCategoryName ?? "Shop"}
            </span>
          </nav>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            {activeCategoryName ?? "Shop"}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Browse the latest Thread &amp; Form collections.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-60">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products..."
              className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-9 pr-3 text-sm text-neutral-900 outline-none transition duration-200 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            aria-label="Sort products"
            className="w-full cursor-pointer rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition duration-200 hover:border-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 sm:w-auto"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mt-7 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <Link href="/products" className={chipClass(!activeCategory)}>
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className={chipClass(activeCategory === category.slug)}
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && (
        <p className="mt-4 text-xs text-neutral-400">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
          {query.trim() ? ` matching “${query.trim()}”` : ""}
        </p>
      )}

      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="skeleton aspect-[4/5] w-full rounded-xl" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/3 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load products: {error}
        </p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-300 px-6 py-16 text-center">
          <p className="font-medium text-neutral-900">No products found</p>
          <p className="mt-1.5 text-sm text-neutral-500">
            Try a different search term or browse another category.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-neutral-700 active:scale-[0.98]"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="skeleton h-9 w-40 rounded" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[4/5] rounded-xl" />
            ))}
          </div>
        </main>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
