/**
 * Thread & Form — database schema types.
 *
 * Mirrors the Supabase (Postgres) schema applied in the project's Supabase
 * project: three enums, six tables in the `public` schema, plus the built-in
 * `auth.users` table that `profiles` extends. The shape follows the format
 * produced by `supabase gen types typescript`, so it can be swapped for
 * generated output later without touching call sites.
 *
 * Canonical DDL lives in `supabase/schema.sql`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** public.order_status_type */
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

/** public.payment_status_type */
export type PaymentStatus = "unpaid" | "paid" | "refunded";

/** public.user_role_type */
export type UserRole = "customer" | "admin";

export interface Database {
  public: {
    Tables: {
      /** Extends the built-in auth.users table (1:1). */
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          phone: string | null;
          shipping_address: string | null;
          role: UserRole;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          phone?: string | null;
          shipping_address?: string | null;
          role?: UserRole;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string;
          phone?: string | null;
          shipping_address?: string | null;
          role?: UserRole;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          stock_quantity: number;
          image_url: string | null;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          stock_quantity?: number;
          image_url?: string | null;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          stock_quantity?: number;
          image_url?: string | null;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          status: OrderStatus;
          payment_status: PaymentStatus;
          total_amount: number;
          shipping_address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          total_amount: number;
          shipping_address: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          total_amount?: number;
          shipping_address?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          quantity: number;
          unit_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          quantity: number;
          unit_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          quantity?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      /** Atomic checkout: inserts the order + items, locks and decrements stock, clears the cart. */
      place_order: {
        Args: {
          p_shipping_address: string;
          p_total_amount: number;
          p_items: Json;
        };
        Returns: string;
      };
      /** True when the calling authenticated user has role = 'admin'. */
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      order_status_type: OrderStatus;
      payment_status_type: PaymentStatus;
      user_role_type: UserRole;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type CartItem = Database["public"]["Tables"]["cart_items"]["Row"];
