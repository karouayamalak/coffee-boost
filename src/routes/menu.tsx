import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchMenu, fetchBeans, formatPrice, FALLBACK_BEANS, FALLBACK_MENU_SECTIONS, type BeanItem } from "@/lib/api";
import { useCart } from "@/components/cart-order-modal";
import { toast } from "sonner";

// ── Drinks ─────────────────────────────────────────────────────────────────
import itemIcedCaramel from "@/assets/drink-iced-caramel.png";
import itemStrawberryMatcha from "@/assets/item-strawberry-matcha.png";
import itemIcedMocha from "@/assets/item-iced-mocha.png";
import itemEspressoCrema from "@/assets/item-espresso-crema.png";

// ── Desserts, Cakes & Bakery ────────────────────────────────────────────────
import itemBasqueCheesecake from "@/assets/item-basque-cheesecake.png";
import itemChocolateCake from "@/assets/item-chocolate-cake.png";
import itemOreoCheesecake from "@/assets/item-oreo-cheesecake.png";
import itemStrawberryCheesecake from "@/assets/item-strawberry-cheesecake.png";
import itemChocolateLava from "@/assets/item-chocolate-lava.png";
import itemStrawberryMochi from "@/assets/item-strawberry-mochi.png";
import itemCroissant from "@/assets/item-croissant.png";
import itemCookie from "@/assets/item-cookie.png";
import itemBrookie from "@/assets/item-brookie.png";
import itemCinnamonRoll from "@/assets/item-cinnamon-roll.png";
import itemGlazedDonut from "@/assets/item-glazed-donut.png";

// ── Savory & Plates ────────────────────────────────────────────────────────
import itemSalmonToast from "@/assets/item-salmon-toast.png";
import itemAvocadoRicotta from "@/assets/item-avocado-ricotta.png";
import itemCaesarSalad from "@/assets/item-caesar-salad.png";
import itemBelgianWaffle from "@/assets/item-belgian-waffle.png";

const ASSET_MAP: Record<string, string> = {
  "Iced Caramel Macchiato": itemIcedCaramel,
  "Iced Strawberry Matcha Latte": itemStrawberryMatcha,
  "Iced Dark Mocha Frappé": itemIcedMocha,
  "Espresso Crema Roast": itemEspressoCrema,
  "Basque Burnt Cheesecake": itemBasqueCheesecake,
  "Triple Chocolate Fudge Cake Slice": itemChocolateCake,
  "Oreo Cookies & Cream Cheesecake": itemOreoCheesecake,
  "Strawberry New York Cheesecake": itemStrawberryCheesecake,
  "Molten Chocolate Lava Dome": itemChocolateLava,
  "Strawberry Cream Daifuku Mochi": itemStrawberryMochi,
  "Classic French Butter Croissant": itemCroissant,
  "Choc-Chip Sea Salt Cookie": itemCookie,
  "Dark Chocolate Chunk Brookie": itemBrookie,
  "Glazed Cinnamon Roll Swirl": itemCinnamonRoll,
  "Golden Glazed Honey Donut": itemGlazedDonut,
  "Smoked Salmon & Cream Cheese Toast": itemSalmonToast,
  "Avocado Ricotta Sourdough Toast": itemAvocadoRicotta,
  "Grilled Chicken Caesar Salad Bowl": itemCaesarSalad,
  "Belgian Butter Waffle with Maple Syrup": itemBelgianWaffle,
};

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Counter Menu — Boost Coffee Shop" },
      { name: "description", content: "Specialty Drinks, Fresh Bakery & Savory Breakfast in Algerian Dinars (DA) at Boost Coffee Shop in Algiers." },
      { property: "og:title", content: "Menu — Boost Coffee Shop" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { addItem, openCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const { data: menuSections = FALLBACK_MENU_SECTIONS } = useQuery({
    queryKey: ["menu"],
    queryFn: fetchMenu,
    staleTime: 1000 * 60 * 2,
  });

  const { data: beans = FALLBACK_BEANS } = useQuery({
    queryKey: ["beans"],
    queryFn: fetchBeans,
    staleTime: 1000 * 60 * 5,
  });

  const handleAddItem = (item: { name: string; price: number | string; note?: string | undefined; image?: string | undefined }) => {
    // Priority: item's own image > ASSET_MAP by name > static croissant placeholder
    const resolvedImg = item.image || ASSET_MAP[item.name] || "/items/item-croissant.png";
    addItem({ name: item.name, price: item.price, note: item.note, image: resolvedImg });
    toast.success(`Added ${item.name}!`, { description: "See your order in the cart.", duration: 2000 });
  };

  const filteredSections = selectedCategory === "All"
    ? menuSections
    : menuSections.filter((s) => s.title.toLowerCase().includes(selectedCategory.toLowerCase()));

  const totalItemsCount = menuSections.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-16">
        {/* Header matching exact layout */}
        <div className="flex items-baseline justify-between border-b border-border pb-6">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-primary tracking-tight">
            The counter
          </h1>
          <p className="script text-2xl md:text-3xl text-marker">served all day</p>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {["All", "Drinks", "Desserts", "Savory"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-5 py-1.5 text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/70 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {cat === "All"
                ? `All Items (${totalItemsCount})`
                : cat === "Desserts"
                ? "Desserts & Cakes"
                : cat === "Savory"
                ? "Savory & Plates"
                : "Drinks & Brews"}
            </button>
          ))}
        </div>

        {/* Dynamic Menu Sections */}
        <div className="mt-10 space-y-12">
          {filteredSections.map((section) => (
            <div key={section.title}>
              <h2 className="eyebrow text-marker text-sm uppercase tracking-wider mb-4">
                {section.title} ({section.items.length})
              </h2>

              <div className="divide-y divide-border/60 border-y border-border/60">
                {section.items.map((item) => {
                  const itemImg = item.image || ASSET_MAP[item.name] || itemCroissant;
                  return (
                    <div
                      key={item.id || item._id || item.name}
                      className="group flex items-center gap-4 py-3.5 px-2 transition-colors hover:bg-card/40 rounded-2xl"
                    >
                      {/* Free-floating transparent PNG food picture */}
                      <div className="shrink-0 h-16 w-16 flex items-center justify-center">
                        <img
                          src={itemImg}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5"
                        />
                      </div>

                      {/* Name & Note */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-base md:text-lg font-bold text-foreground leading-tight">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                          {item.note}
                        </p>
                      </div>

                      {/* Dotted leader */}
                      <span className="hidden md:block flex-1 max-w-[80px] border-b border-dotted border-border/80 mx-2 shrink-0" />

                      {/* Price & Add */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-display text-base md:text-lg font-bold text-primary whitespace-nowrap">
                          {formatPrice(item.price)}
                        </span>
                        <button
                          onClick={() => handleAddItem(item)}
                          className="rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-secondary-foreground transition-all hover:scale-105 active:scale-95 hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
                          aria-label={`Add ${item.name} to order`}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Order Callout */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/50 p-6 border border-border">
          <div>
            <p className="font-display text-lg font-bold">Ready to order?</p>
            <p className="text-xs text-muted-foreground">Pick up at the counter · Cash · BaridiMob · CIB / Edahabia</p>
          </div>
          <button
            onClick={openCart}
            className="rounded-full bg-roast px-7 py-3 font-bold text-roast-foreground transition-transform hover:-translate-y-0.5 shadow-md"
          >
            Order ahead →
          </button>
        </div>
      </section>

      {/* Beans on the shelf */}
      <section className="border-y border-border bg-secondary/60 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold">Beans on the shelf</h2>
            <p className="text-xs text-muted-foreground">250g whole bean or ground · 1,400 DA</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {beans.map((bean: BeanItem) => (
              <article key={bean.name} className="flex flex-col justify-between rounded-3xl bg-card p-6 shadow-sm border border-border/60">
                <div>
                  <p className="eyebrow text-marker text-xs">{bean.roast} roast</p>
                  <h3 className="mt-2 text-xl font-display font-bold">{bean.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{bean.note}</p>
                </div>
                <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/50">
                  <p className="font-display text-base font-bold text-primary">
                    {formatPrice(bean.price || 1400)} / {bean.weight || "250g"}
                  </p>
                  <button
                    onClick={() => handleAddItem({ name: `${bean.name} Beans (250g)`, price: Number(bean.price) || 1400, note: `${bean.roast} roast` })}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    + Bag
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
