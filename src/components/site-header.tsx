import { Link } from "@tanstack/react-router";
import { Bean } from "./bean";
import { useCart } from "./cart-order-modal";

const links = [
  { to: "/story", label: "Story" },
  { to: "/menu", label: "Menu" },
  { to: "/visit", label: "Visit" },
] as const;

const ownerLink = { to: "/dashboard", label: "⚡ Dashboard" };

export function SiteHeader() {
  const { openCart, totalCount } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Bean className="h-7 w-6" />
          <span className="font-display text-xl font-extrabold tracking-tight">boost</span>
        </Link>
        <nav className="hidden gap-8 text-sm font-medium md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={openCart}
          className="relative rounded-full bg-roast px-5 py-2.5 text-sm font-bold text-roast-foreground transition-transform hover:-translate-y-0.5"
        >
          <span>Order ahead</span>
          {totalCount > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-marker text-xs font-bold text-marker-foreground">
              {totalCount}
            </span>
          )}
        </button>
      </div>
      <nav className="flex justify-center gap-6 border-t border-border px-6 py-3 text-sm font-medium md:hidden">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            activeProps={{ className: "text-primary" }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
