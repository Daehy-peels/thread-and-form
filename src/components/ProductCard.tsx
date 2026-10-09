"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const price = Number(product.price);
  const stock = product.stock_quantity;
  const outOfStock = stock <= 0;
  const lowStock = !outOfStock && stock <= 5;
  const showError = feedback !== "" && feedback !== "Added to cart";

  async function handleAddToCart() {
    if (outOfStock || adding) return;

    setAdding(true);
    setFeedback("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      setAdding(false);
      return;
    }

    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();

    let error: { message: string } | null = null;

    if (existing) {
      const result = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
      error = result.error;
    } else {
      const result = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1,
      });
      error = result.error;
    }

    if (error) {
      setFeedback(error.message);
    } else {
      setFeedback("Added to cart");
      window.dispatchEvent(new Event("cart:changed"));
      setTimeout(() => setFeedback(""), 1800);
    }

    setAdding(false);
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-900/5">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
        {product.image_url && !imageFailed ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 ease-out group-hover:scale-[1.07]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-neutral-400">
            No image available
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />

        {product.is_featured && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-neutral-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm sm:left-3 sm:top-3">
            Featured
          </span>
        )}

        <span
          className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm sm:right-3 sm:top-3 ${
            outOfStock
              ? "bg-red-50/95 text-red-700"
              : lowStock
                ? "bg-amber-50/95 text-amber-800"
                : "bg-white/90 text-neutral-600"
          }`}
        >
          {outOfStock ? "Sold out" : lowStock ? `Only ${stock} left` : "In stock"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="text-sm font-medium leading-5 text-neutral-900 sm:text-base sm:leading-6">
          {product.name}
        </h3>
        <p className="mt-1 text-sm font-semibold tracking-tight text-neutral-900 sm:text-base">
          ${price.toFixed(2)}
        </p>

        <div className="mt-3 flex-1 sm:mt-4">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock || adding}
            className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-neutral-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:hover:bg-neutral-200 disabled:active:scale-100"
          >
            {adding ? "Adding..." : outOfStock ? "Sold out" : "Add to cart"}
          </button>
        </div>

        <div
          aria-live="polite"
          className={`grid overflow-hidden transition-all duration-300 ${
            feedback ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <p
            className={`min-h-0 text-center text-xs font-medium ${
              showError ? "text-red-600" : "text-green-700"
            }`}
          >
            {feedback || "\u00a0"}
          </p>
        </div>
      </div>
    </article>
  );
}
