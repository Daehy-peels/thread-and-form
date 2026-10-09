import Image from "next/image";
import Link from "next/link";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All products" },
      { href: "/products?category=mens-clothing", label: "Men" },
      { href: "/products?category=womens-clothing", label: "Women" },
      { href: "/products?category=accessories", label: "Accessories" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/auth", label: "Sign in" },
      { href: "/cart", label: "Your cart" },
      { href: "/checkout", label: "Checkout" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-neutral-950 text-neutral-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(2,1fr)] md:py-14">
        <div className="space-y-4">
          <Link href="/" className="group inline-flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg ring-1 ring-white/15 transition duration-300 group-hover:ring-white/40">
              <Image
                src="/logo.png"
                alt="Thread & Form logo"
                fill
                className="object-cover transition duration-500 group-hover:scale-110"
              />
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              Thread &amp; Form
            </span>
          </Link>
          <p className="max-w-xs text-sm leading-6 text-neutral-400">
            Well-made clothing essentials, cut for everyday. Free shipping on
            orders over $50.
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white">
              {column.title}
            </p>
            <ul className="space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group inline-flex text-neutral-400 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                    <span className="ml-0 h-px w-0 self-end bg-white transition-all duration-300 group-hover:ml-1.5 group-hover:w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} Thread &amp; Form. All rights
            reserved.
          </p>
          <p>Student project — payments are simulated.</p>
        </div>
      </div>
    </footer>
  );
}
