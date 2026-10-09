"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type OrderItem = {
  quantity: number;
  unit_price: number;
  products: { name: string } | null;
};

type Order = {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  shipping_address: string;
  created_at: string;
  profiles: { full_name: string | null; email: string } | null;
  order_items: OrderItem[];
};

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  processing: "bg-blue-50 text-blue-700 ring-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  delivered: "bg-green-50 text-green-700 ring-green-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  paid: "bg-green-50 text-green-700 ring-green-200",
  unpaid: "bg-amber-50 text-amber-700 ring-amber-200",
  refunded: "bg-neutral-100 text-neutral-600 ring-neutral-200",
};

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${
        statusStyles[value] ?? "bg-neutral-100 text-neutral-600 ring-neutral-200"
      }`}
    >
      {value}
    </span>
  );
}

type Tab = "overview" | "products" | "orders" | "categories";

const tabs: [Tab, string][] = [
  ["overview", "Overview"],
  ["products", "Products"],
  ["orders", "Orders"],
  ["categories", "Categories"],
];

type ProductForm = {
  id?: string;
  name: string;
  price: string;
  stock: string;
  category_id: string;
  image_url: string;
  description: string;
  is_featured: boolean;
};

const emptyProductForm: ProductForm = {
  name: "",
  price: "",
  stock: "0",
  category_id: "",
  image_url: "",
  description: "",
  is_featured: false,
};

const fieldClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition duration-200 placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-neutral-700 hover:shadow-md active:scale-[0.97]";

const ghostButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition duration-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white active:scale-[0.97]";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function money(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default function AdminPage() {
  const [authState, setAuthState] = useState<
    "loading" | "anon" | "denied" | "admin"
  >("loading");
  const [tab, setTab] = useState<Tab>("overview");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [notice, setNotice] = useState("");

  const [productForm, setProductForm] = useState<ProductForm | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState<string>("all");

  const load = useCallback(async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAuthState("anon");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      setAuthState("denied");
      return;
    }

    setAuthState("admin");

    const [productsRes, categoriesRes, ordersRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("orders")
        .select(
          "id, status, payment_status, total_amount, shipping_address, created_at, profiles(full_name, email), order_items(quantity, unit_price, products(name))",
        )
        .order("created_at", { ascending: false }),
    ]);

    setProducts((productsRes.data ?? []) as Product[]);
    setCategories((categoriesRes.data ?? []) as Category[]);
    setOrders((ordersRes.data ?? []) as unknown as Order[]);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.payment_status === "paid")
        .reduce((sum, o) => sum + Number(o.total_amount), 0),
    [orders],
  );
  const lowStock = useMemo(
    () => products.filter((p) => p.stock_quantity <= 5),
    [products],
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.stock_quantity <= 0).length,
    [products],
  );
  const inventoryValue = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + Number(p.price) * p.stock_quantity,
        0,
      ),
    [products],
  );
  const averageOrder = orders.length > 0 ? revenue / orders.length : 0;

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [products, productQuery]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "all") return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productForm) return;

    const supabase = createClient();
    const payload = {
      name: productForm.name.trim(),
      price: Number(productForm.price),
      stock_quantity: Number(productForm.stock),
      category_id: productForm.category_id || null,
      image_url: productForm.image_url.trim() || null,
      description: productForm.description.trim() || null,
      is_featured: productForm.is_featured,
    };

    const result = productForm.id
      ? await supabase
          .from("products")
          .update(payload)
          .eq("id", productForm.id)
      : await supabase
          .from("products")
          .insert({ ...payload, slug: slugify(productForm.name) });

    if (result.error) {
      setNotice(result.error.message);
      return;
    }
    setNotice("");
    setProductForm(null);
    load();
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);
    setNotice(error?.message ?? "");
    load();
  }

  async function toggleFeatured(product: Product) {
    const supabase = createClient();
    const next = !product.is_featured;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_featured: next } : p)),
    );
    const { error } = await supabase
      .from("products")
      .update({ is_featured: next })
      .eq("id", product.id);
    if (error) setNotice(error.message);
  }

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryName.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from("categories").insert({
      name: categoryName.trim(),
      slug: slugify(categoryName),
    });
    setNotice(error?.message ?? "");
    setCategoryName("");
    load();
  }

  async function deleteCategory(category: Category) {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);
    setNotice(error?.message ?? "");
    load();
  }

  async function updateOrderStatus(order: Order, status: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status } : o)),
    );
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", order.id);
    setNotice(error?.message ?? "");
    if (error) load();
  }

  if (authState === "loading") {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="skeleton h-9 w-56 rounded" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  if (authState === "anon") {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-20 text-center sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          Admin
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Sign in with an admin account to continue.
        </p>
        <Link
          href="/auth"
          className={`${primaryButtonClass} mt-7 px-6 py-3`}
        >
          Sign in
        </Link>
      </main>
    );
  }

  if (authState === "denied") {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-20 text-center sm:py-24">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-200">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path
              strokeLinecap="round"
              d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.5"
            />
          </svg>
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-900">
          Access denied
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Your account does not have admin permissions.
        </p>
        <Link
          href="/products"
          className={`${ghostButtonClass} mt-7 px-6 py-3`}
        >
          Back to shop
        </Link>
      </main>
    );
  }

  const stats = [
    {
      label: "Revenue",
      value: money(revenue),
      hint: `${orders.length} orders · avg ${money(averageOrder)}`,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v18m5-14.5c0-1.4-2.2-2.5-5-2.5s-5 1.1-5 2.5 2.2 2.5 5 2.5 5 1.1 5 2.5-2.2 2.5-5 2.5-5-1.1-5-2.5"
        />
      ),
    },
    {
      label: "Orders",
      value: String(orders.length),
      hint: `${orders.filter((o) => o.status === "pending").length} pending`,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5h16v14H4zM4 10h16M9 5v14"
        />
      ),
    },
    {
      label: "Products",
      value: String(products.length),
      hint: `${money(inventoryValue)} inventory value`,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7l9-4 9 4-9 4-9-4Zm0 5l9 4 9-4m-18 5l9 4 9-4"
        />
      ),
    },
    {
      label: "Low stock",
      value: String(lowStock.length),
      hint: `${outOfStockCount} sold out`,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4l9 16H3l9-16Zm0 6v4m0 3h.01"
        />
      ),
      alert: lowStock.length > 0,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Admin
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Manage products, categories, and orders.
        </p>
      </div>

      <div className="mt-7 -mx-4 flex gap-1.5 overflow-x-auto border-b border-neutral-200 px-4 sm:mx-0 sm:px-0">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? "page" : undefined}
            className={`relative shrink-0 px-3.5 py-2.5 text-sm font-medium transition-colors duration-200 ${
              tab === key
                ? "text-neutral-900"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {label}
            {key === "orders" && orders.length > 0 && (
              <span className="ml-1.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
                {orders.length}
              </span>
            )}
            <span
              className={`absolute inset-x-2 -bottom-px h-0.5 origin-left rounded-full bg-neutral-900 transition-transform duration-300 ${
                tab === key ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        ))}
      </div>

      {notice && (
        <div
          role="alert"
          className="animate-fade-in mt-5 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss"
            className="shrink-0 rounded p-0.5 transition hover:bg-red-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}

      {loadingData ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : tab === "overview" ? (
        <div className="animate-fade-in mt-8 space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="animate-fade-up group rounded-xl border border-neutral-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-900/5"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    {stat.label}
                  </p>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition duration-300 ${
                      stat.alert
                        ? "bg-amber-50 text-amber-600 group-hover:bg-amber-100"
                        : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      {stat.icon}
                    </svg>
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[1.75rem]">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{stat.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Recent orders
                </h2>
                <button
                  type="button"
                  onClick={() => setTab("orders")}
                  className="text-xs font-semibold text-neutral-900 transition hover:text-neutral-500"
                >
                  View all
                </button>
              </div>
              {orders.length === 0 ? (
                <p className="mt-5 text-sm text-neutral-500">No orders yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-neutral-100">
                  {orders.slice(0, 5).map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center justify-between gap-3 py-3 transition-colors duration-200 first:pt-0 last:pb-0 hover:bg-neutral-50/70"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {order.profiles?.full_name ??
                            order.profiles?.email ??
                            "Guest"}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {new Date(order.created_at).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <StatusBadge value={order.status} />
                        <span className="text-sm font-semibold tabular-nums text-neutral-900">
                          {money(Number(order.total_amount))}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Needs restocking
                </h2>
                <button
                  type="button"
                  onClick={() => setTab("products")}
                  className="text-xs font-semibold text-neutral-900 transition hover:text-neutral-500"
                >
                  Manage products
                </button>
              </div>
              {lowStock.length === 0 ? (
                <p className="mt-5 text-sm text-neutral-500">
                  Everything is well stocked.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-neutral-100">
                  {lowStock.slice(0, 5).map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center justify-between gap-3 py-3 transition-colors duration-200 first:pt-0 last:pb-0 hover:bg-neutral-50/70"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                          {product.image_url && (
                            <Image
                              src={product.image_url}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          )}
                        </span>
                        <span className="truncate text-sm font-medium text-neutral-900">
                          {product.name}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                          product.stock_quantity <= 0
                            ? "bg-red-50 text-red-700 ring-red-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {product.stock_quantity <= 0
                          ? "Sold out"
                          : `${product.stock_quantity} left`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      ) : tab === "products" ? (
        <div className="animate-fade-in mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:w-64">
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
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search products..."
                className={`${fieldClass} pl-9`}
              />
            </div>
            <button
              type="button"
              onClick={() => setProductForm({ ...emptyProductForm })}
              className={primaryButtonClass}
            >
              <span className="text-base leading-none">+</span>
              Add product
            </button>
          </div>

          {productForm && (
            <form
              onSubmit={saveProduct}
              className="animate-fade-in mt-5 grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-white p-5 sm:grid-cols-2 sm:p-6"
            >
              <p className="text-sm font-semibold text-neutral-900 sm:col-span-2">
                {productForm.id ? "Edit product" : "New product"}
              </p>

              <div>
                <label htmlFor="p-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Name
                </label>
                <input
                  id="p-name"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  required
                  className={fieldClass}
                  placeholder="Organic Cotton Tee"
                />
              </div>

              <div>
                <label htmlFor="p-category" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Category
                </label>
                <select
                  id="p-category"
                  value={productForm.category_id}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      category_id: e.target.value,
                    })
                  }
                  className={`${fieldClass} cursor-pointer`}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="p-price" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Price (USD)
                </label>
                <input
                  id="p-price"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: e.target.value })
                  }
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className={fieldClass}
                  placeholder="28.00"
                />
              </div>

              <div>
                <label htmlFor="p-stock" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Stock quantity
                </label>
                <input
                  id="p-stock"
                  value={productForm.stock}
                  onChange={(e) =>
                    setProductForm({ ...productForm, stock: e.target.value })
                  }
                  type="number"
                  min="0"
                  required
                  className={fieldClass}
                  placeholder="0"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="p-image" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Image URL
                </label>
                <input
                  id="p-image"
                  value={productForm.image_url}
                  onChange={(e) =>
                    setProductForm({ ...productForm, image_url: e.target.value })
                  }
                  className={fieldClass}
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="p-description" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Description
                </label>
                <textarea
                  id="p-description"
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className={`${fieldClass} resize-y leading-6`}
                  placeholder="A short description of the product."
                />
              </div>

              <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-neutral-700">
                <span className="relative inline-flex">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        is_featured: e.target.checked,
                      })
                    }
                    className="peer sr-only"
                  />
                  <span className="h-5 w-9 rounded-full bg-neutral-300 transition-colors duration-200 peer-checked:bg-neutral-900" />
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
                </span>
                Featured on home page
              </label>

              <div className="flex gap-2 sm:col-span-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setProductForm(null)}
                  className={ghostButtonClass}
                >
                  Cancel
                </button>
                <button type="submit" className={primaryButtonClass}>
                  {productForm.id ? "Save changes" : "Create product"}
                </button>
              </div>
            </form>
          )}

          {filteredProducts.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-neutral-300 py-12 text-center text-sm text-neutral-500">
              No products match “{productQuery}”.
            </p>
          ) : (
            <>
              <div className="mt-6 hidden overflow-hidden rounded-xl border border-neutral-200 bg-white md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50/70 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 text-right font-semibold">Price</th>
                      <th className="px-4 py-3 text-right font-semibold">Stock</th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Featured
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredProducts.map((product) => {
                      const category = categories.find(
                        (c) => c.id === product.category_id,
                      );
                      return (
                        <tr
                          key={product.id}
                          className="transition-colors duration-200 hover:bg-neutral-50/70"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                                {product.image_url && (
                                  <Image
                                    src={product.image_url}
                                    alt=""
                                    fill
                                    sizes="36px"
                                    className="object-cover"
                                  />
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-neutral-900">
                                  {product.name}
                                </span>
                                <span className="block truncate text-xs text-neutral-400">
                                  {product.slug}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {category?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-neutral-900">
                            {money(Number(product.price))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`tabular-nums ${
                                product.stock_quantity <= 0
                                  ? "font-semibold text-red-600"
                                  : product.stock_quantity <= 5
                                    ? "font-semibold text-amber-700"
                                    : "text-neutral-700"
                              }`}
                            >
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={product.is_featured}
                                aria-label={`Feature ${product.name}`}
                                onClick={() => toggleFeatured(product)}
                                className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
                                  product.is_featured
                                    ? "bg-neutral-900"
                                    : "bg-neutral-200 hover:bg-neutral-300"
                                }`}
                              >
                                <span
                                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                                    product.is_featured
                                      ? "translate-x-4"
                                      : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setProductForm({
                                    id: product.id,
                                    name: product.name,
                                    price: String(product.price),
                                    stock: String(product.stock_quantity),
                                    category_id: product.category_id ?? "",
                                    image_url: product.image_url ?? "",
                                    description: product.description ?? "",
                                    is_featured: product.is_featured,
                                  });
                                  window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                }}
                                className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 transition duration-200 hover:bg-neutral-900 hover:text-white"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteProduct(product)}
                                className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 transition duration-200 hover:bg-red-50 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="mt-6 space-y-3 md:hidden">
                {filteredProducts.map((product) => (
                  <li
                    key={product.id}
                    className="rounded-xl border border-neutral-200 bg-white p-4 transition duration-200 hover:border-neutral-300 hover:shadow-md"
                  >
                    <div className="flex gap-3">
                      <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        {product.image_url && (
                          <Image
                            src={product.image_url}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-neutral-900">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-sm text-neutral-500">
                          {categories.find((c) => c.id === product.category_id)
                            ?.name ?? "Uncategorised"}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-sm font-semibold tabular-nums text-neutral-900">
                            {money(Number(product.price))}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                              product.stock_quantity <= 0
                                ? "bg-red-50 text-red-700 ring-red-200"
                                : product.stock_quantity <= 5
                                  ? "bg-amber-50 text-amber-700 ring-amber-200"
                                  : "bg-green-50 text-green-700 ring-green-200"
                            }`}
                          >
                            {product.stock_quantity <= 0
                              ? "Sold out"
                              : `${product.stock_quantity} in stock`}
                          </span>
                          {product.is_featured && (
                            <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 border-t border-neutral-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setProductForm({
                          id: product.id,
                          name: product.name,
                          price: String(product.price),
                          stock: String(product.stock_quantity),
                          category_id: product.category_id ?? "",
                          image_url: product.image_url ?? "",
                          description: product.description ?? "",
                          is_featured: product.is_featured,
                        })}
                        className={`${ghostButtonClass} flex-1 py-1.5 text-xs`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFeatured(product)}
                        className={`${ghostButtonClass} flex-1 py-1.5 text-xs`}
                      >
                        {product.is_featured ? "Unfeature" : "Feature"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product)}
                        className="flex-1 rounded-lg border border-red-200 py-1.5 text-xs font-medium text-red-600 transition duration-200 hover:bg-red-50 active:scale-[0.97]"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : tab === "orders" ? (
        <div className="animate-fade-in mt-8">
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
            {["all", ...ORDER_STATUSES].map((status) => {
              const count =
                status === "all"
                  ? orders.length
                  : orders.filter((o) => o.status === status).length;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setOrderFilter(status)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition duration-200 active:scale-95 ${
                    orderFilter === status
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "border border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
                  }`}
                >
                  {status} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {filteredOrders.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-neutral-300 py-12 text-center text-sm text-neutral-500">
              No {orderFilter === "all" ? "" : `${orderFilter} `}orders yet.
            </p>
          ) : (
            <ul className="mt-6 space-y-3 sm:space-y-4">
              {filteredOrders.map((order, index) => (
                <li
                  key={order.id}
                  className="animate-fade-up rounded-xl border border-neutral-200 bg-white p-5 transition duration-300 hover:border-neutral-300 hover:shadow-md sm:p-6"
                  style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-neutral-900">
                          {order.profiles?.full_name ??
                            order.profiles?.email ??
                            "Guest"}
                        </p>
                        <StatusBadge value={order.status} />
                        <StatusBadge value={order.payment_status} />
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {new Date(order.created_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <p className="mt-0.5 break-all font-mono text-[11px] text-neutral-400">
                        {order.id}
                      </p>
                    </div>
                    <p className="text-lg font-semibold tabular-nums tracking-tight text-neutral-900">
                      {money(Number(order.total_amount))}
                    </p>
                  </div>

                  <ul className="mt-4 space-y-1.5 rounded-lg bg-neutral-50 p-3.5 text-sm text-neutral-600">
                    {order.order_items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="min-w-0 truncate">
                          {item.products?.name ?? "Item"}
                          <span className="text-neutral-400">
                            {" "}
                            &times; {item.quantity}
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums text-neutral-900">
                          {money(Number(item.unit_price) * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {order.shipping_address && (
                    <p className="mt-3 text-xs leading-5 text-neutral-500">
                      <span className="font-semibold text-neutral-700">
                        Ship to:
                      </span>{" "}
                      {order.shipping_address}
                    </p>
                  )}

                  <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <label
                      htmlFor={`status-${order.id}`}
                      className="text-xs font-semibold uppercase tracking-wide text-neutral-500"
                    >
                      Update status
                    </label>
                    <select
                      id={`status-${order.id}`}
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order, e.target.value)}
                      className={`${fieldClass} cursor-pointer py-1.5 sm:w-48`}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status} className="capitalize">
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="animate-fade-in mt-8">
          <form
            onSubmit={addCategory}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="New category name"
              required
              aria-label="New category name"
              className={`${fieldClass} sm:max-w-xs`}
            />
            <button type="submit" className={primaryButtonClass}>
              <span className="text-base leading-none">+</span>
              Add category
            </button>
          </form>

          {categories.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-neutral-300 py-12 text-center text-sm text-neutral-500">
              No categories yet.
            </p>
          ) : (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => {
                const count = products.filter(
                  (p) => p.category_id === category.id,
                ).length;
                return (
                  <li
                    key={category.id}
                    className="animate-fade-up group flex items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900">
                        {category.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-400">
                        {category.slug}
                      </p>
                      <p className="mt-1.5 text-xs text-neutral-500">
                        {count} {count === 1 ? "product" : "products"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCategory(category)}
                      aria-label={`Delete ${category.name}`}
                      className="shrink-0 rounded-md p-1.5 text-neutral-400 transition duration-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 7h16M9 7V5h6v2m-8 0l1 13h8l1-13"
                        />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
