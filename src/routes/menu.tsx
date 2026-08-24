import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchBeans, formatPrice, FALLBACK_BEANS, type BeanItem } from "@/lib/api";
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

export interface MenuItemData {
  id: string;
  name: string;
  note: string;
  price: number;
  badge?: string;
  image: string;
}

export interface MenuSectionData {
  title: string;
  items: MenuItemData[];
}

export const FULL_MENU: MenuSectionData[] = [
  {
    title: "Drinks & Specialty Brews",
    items: [
      { id: "d1", name: "Iced Caramel Macchiato", note: "Layered espresso over chilled whole milk with caramel drizzle, ice cubes & cinnamon dusting", price: 520, badge: "Signature", image: itemIcedCaramel },
      { id: "d2", name: "Iced Strawberry Matcha Latte", note: "Ceremonial grade Japanese matcha, fresh milk, organic strawberry purée, heart ice cubes & sliced strawberries", price: 580, badge: "Popular", image: itemStrawberryMatcha },
      { id: "d3", name: "Iced Dark Mocha Frappé", note: "Blended double espresso, rich dark chocolate fudge, whipped coffee cloud & chocolate curls", price: 540, badge: "Iced Special", image: itemIcedMocha },
      { id: "d4", name: "Espresso Crema Roast", note: "Pure double shot small batch roast with thick golden hazelnut crema", price: 350, badge: "Classic", image: itemEspressoCrema },
    ],
  },
  {
    title: "Desserts, Cakes & Bakery",
    items: [
      { id: "b1", name: "Basque Burnt Cheesecake", note: "Caramelised Basque cheesecake served warm with melted salted caramel & vanilla bean ice cream scoop", price: 550, badge: "Chef Special", image: itemBasqueCheesecake },
      { id: "b2", name: "Triple Chocolate Fudge Cake Slice", note: "Three layers moist chocolate sponge, dark chocolate ganache & chocolate curls", price: 480, badge: "Decadent", image: itemChocolateCake },
      { id: "b3", name: "Oreo Cookies & Cream Cheesecake", note: "Crushed Oreo biscuit crust, rich cream cheese filling, Oreo crumble & dark chocolate drizzle", price: 460, image: itemOreoCheesecake },
      { id: "b4", name: "Strawberry New York Cheesecake", note: "Baked New York style cheesecake on graham cracker crust with fresh strawberry glaze & mint", price: 450, image: itemStrawberryCheesecake },
      { id: "b5", name: "Molten Chocolate Lava Dome", note: "Dark chocolate shell filled with airy chocolate mousse, hot molten lava center & roasted cacao nibs", price: 420, badge: "House Special", image: itemChocolateLava },
      { id: "b6", name: "Strawberry Cream Daifuku Mochi", note: "Soft pink mochi filled with whipped cream, strawberry compote core, chocolate crunch & freeze-dried strawberries", price: 380, image: itemStrawberryMochi },
      { id: "b7", name: "Classic French Butter Croissant", note: "Flaky all-butter golden French pastry, baked fresh every morning at 6am", price: 260, badge: "Fresh Daily", image: itemCroissant },
      { id: "b8", name: "Choc-Chip Sea Salt Cookie", note: "Soft-baked golden cookie with Belgian milk chocolate chunks & Maldon sea salt crystals", price: 240, badge: "Best Seller", image: itemCookie },
      { id: "b9", name: "Dark Chocolate Chunk Brookie", note: "Dense 70% dark chocolate brownie cookie packed with melted chocolate chunks", price: 300, image: itemBrookie },
      { id: "b10", name: "Glazed Cinnamon Roll Swirl", note: "Warm cinnamon cardamom swirl bun with rich vanilla cream cheese glaze", price: 280, image: itemCinnamonRoll },
      { id: "b11", name: "Golden Glazed Honey Donut", note: "Soft fluffy yeast donut coated in honey sugar glaze", price: 220, image: itemGlazedDonut },
    ],
  },
  {
    title: "Savory & Breakfast Plates",
    items: [
      { id: "s1", name: "Smoked Salmon & Cream Cheese Toast", note: "Artisan toasted sourdough, whipped cream cheese, Atlantic smoked salmon & cracked black pepper", price: 680, badge: "Chef Pick", image: itemSalmonToast },
      { id: "s2", name: "Avocado Ricotta Sourdough Toast", note: "Sliced fresh avocado on whipped ricotta spread, extra virgin olive oil, herbs & hemp seeds", price: 580, badge: "Vegetarian", image: itemAvocadoRicotta },
      { id: "s3", name: "Grilled Chicken Caesar Salad Bowl", note: "Marinated grilled chicken breast, crisp romaine lettuce, shaved parmesan, garlic croutons & house Caesar dressing", price: 650, badge: "Healthy", image: itemCaesarSalad },
      { id: "s4", name: "Belgian Butter Waffle with Maple Syrup", note: "Crispy golden Belgian waffle served warm with butter pad & pure maple syrup", price: 450, badge: "Warm Breakfast", image: itemBelgianWaffle },
    ],
  },
];

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

  const { data: beans = FALLBACK_BEANS } = useQuery({
    queryKey: ["beans"],
    queryFn: fetchBeans,
    staleTime: 1000 * 60 * 5,
  });

  const handleAddItem = (item: { name: string; price: number; note?: string | undefined; image?: string | undefined }) => {
    addItem({ name: item.name, price: item.price, note: item.note, image: item.image });
    toast.success(`Added ${item.name}!`, { description: "See your order in the cart.", duration: 2000 });
  };

  const categoryMap: Record<string, string> = {
    "All": "All",
    "Drinks": "Drinks & Specialty Brews",
    "Desserts": "Desserts, Cakes & Bakery",
    "Savory": "Savory & Breakfast Plates",
  };

  const filteredSections = selectedCategory === "All"
    ? FULL_MENU
    : FULL_MENU.filter(s => s.title === categoryMap[selectedCategory]);

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
              {cat === "All" ? "All Items (19)" : cat === "Desserts" ? "Desserts & Cakes (11)" : cat === "Savory" ? "Savory & Plates (4)" : "Drinks & Brews (4)"}
            </button>
          ))}
        </div>

        {/* Menu Sections */}
        <div className="mt-10 space-y-12">
          {filteredSections.map((section) => (
            <div key={section.title}>
              <h2 className="eyebrow text-marker text-sm uppercase tracking-wider mb-4">
                {section.title}
              </h2>

              <div className="divide-y divide-border/60 border-y border-border/60">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-4 py-3.5 px-2 transition-colors hover:bg-card/40 rounded-2xl"
                  >
                    {/* Free-floating transparent PNG food picture */}
                    <div className="shrink-0 h-16 w-16 flex items-center justify-center">
                      <img
                        src={item.image}
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
                ))}
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
