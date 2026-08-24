import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchMenu, fetchBeans, formatPrice, FALLBACK_BEANS, FALLBACK_MENU_SECTIONS, type BeanItem } from "@/lib/api";
import { useCart } from "@/components/cart-order-modal";
import { toast } from "sonner";

import { Bean } from "@/components/bean";
import heroCrowd from "@/assets/hero-crowd.png";

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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Boost Coffee Shop — Small Batch Roastery, Algiers" },
      {
        name: "description",
        content:
          "Boost Coffee Shop in Algiers: Specialty Drinks, Fresh Bakes & Savory Breakfast in Algerian Dinars (DA). Open from 7am.",
      },
      { property: "og:title", content: "Boost Coffee Shop — Small Batch Roastery" },
      {
        property: "og:description",
        content: "Drinks, Desserts, and Savory Breakfast served all day in Algiers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ITEMS_PER_PAGE = 5;

function Index() {
  const { addItem, openCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Dynamic menu query from MongoDB database with resilient fallback
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
    // Priority: item's own image > ASSET_MAP by name > croissant placeholder
    const resolvedImg = item.image || ASSET_MAP[item.name] || "/items/item-croissant.png";
    addItem({ name: item.name, price: item.price, note: item.note, image: resolvedImg });
    toast.success(`Added ${item.name} to your order!`, {
      description: "Click 'Order ahead' to checkout.",
      duration: 2500,
    });
  };

  // Flatten items for dynamic pagination
  const filteredSections =
    selectedCategory === "All"
      ? menuSections
      : menuSections.filter((s) => s.title.toLowerCase().includes(selectedCategory.toLowerCase()));

  const allFilteredItems = filteredSections.flatMap((s) =>
    s.items.map((i) => ({ ...i, categoryTitle: s.title }))
  );

  const totalPages = Math.max(1, Math.ceil(allFilteredItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const currentItems = allFilteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  return (
    <div className="overflow-x-hidden">
      {/* ─── HERO — ORIGINAL CENTERED FULL-WIDTH LAYOUT ────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-4 pt-10 text-center">
        <p className="eyebrow text-primary">Coffee shop · Est. 2019 · Small batch</p>
        <div className="relative mt-6 flex items-end justify-center">
          <h1 className="flex select-none items-center justify-center font-display leading-[0.8] text-primary">
            <span className="text-[22vw] md:text-[14rem]">b</span>
            <Bean className="mx-[0.5vw] h-[17vw] w-[13vw] md:h-[11rem] md:w-[8rem]" />
            <span className="text-[22vw] md:text-[14rem]">o</span>
            <span className="text-[22vw] md:text-[14rem]">st</span>
          </h1>
          <span className="script absolute -bottom-3 right-[8%] rotate-[-8deg] text-[12vw] text-marker md:text-[6rem]">
            coffee
          </span>
        </div>

        <img
          src={heroCrowd}
          alt="Illustrated crowd running while carrying a giant coffee bean, latte cup and coffee pot"
          width={1408}
          height={1104}
          className="mx-auto mt-10 w-full max-w-4xl"
        />

        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground">
          We roast in small batches and pour it fast, because the whole town is running on it.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#menu"
            className="rounded-full bg-primary px-7 py-3 font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            See the menu
          </a>
          <Link
            to="/story"
            className="rounded-full border border-border px-7 py-3 font-bold transition-colors hover:bg-secondary"
          >
            Our story
          </Link>
          <button
            onClick={openCart}
            className="rounded-full bg-roast px-7 py-3 font-bold text-roast-foreground transition-transform hover:-translate-y-0.5"
          >
            Order ahead
          </button>
        </div>
      </section>

      {/* ─── TICKER BAR ───────────────────────────────────────────── */}
      <div className="mt-12 border-y border-border bg-roast py-4 text-roast-foreground">
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 px-6 text-center">
          {["Specialty Drinks", "Fresh Bakes", "Savory Breakfast", "Hand Roasted", "Open at 7am"].map((item) => (
            <span key={item} className="eyebrow">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ─── TREATS SHOWCASE ROW (RAINBOW / ARCH CURVE LAYOUT) ──────── */}
      <section className="mx-auto max-w-5xl px-3 sm:px-6 py-12 sm:py-16 md:py-24">
        <div className="relative flex items-center justify-between gap-1 sm:gap-4 md:gap-8 py-4">
          {[
            {
              img: itemCroissant,
              label: "Fresh Bakes",
              name: "Classic French Butter Croissant",
              price: 260,
              arc: "translate-y-5 sm:translate-y-9 md:translate-y-12 -rotate-6",
            },
            {
              img: itemCookie,
              label: "Double Shot",
              name: "Choc-Chip Sea Salt Cookie",
              price: 240,
              arc: "translate-y-1 sm:translate-y-2 md:translate-y-3 -rotate-3",
            },
            {
              img: itemEspressoCrema,
              label: "Craft Roasts",
              name: "Espresso Crema Roast",
              price: 350,
              arc: "-translate-y-3 sm:-translate-y-6 md:-translate-y-8 rotate-0 scale-105 sm:scale-110",
            },
            {
              img: itemBrookie,
              label: "Daily Treats",
              name: "Dark Chocolate Chunk Brookie",
              price: 300,
              arc: "translate-y-1 sm:translate-y-2 md:translate-y-3 rotate-3",
            },
            {
              img: itemCinnamonRoll,
              label: "Single Origin",
              name: "Glazed Cinnamon Roll Swirl",
              price: 280,
              arc: "translate-y-5 sm:translate-y-9 md:translate-y-12 rotate-6",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleAddItem({ name: item.name, price: item.price, image: item.img })}
              className={`group flex flex-1 flex-col items-center min-w-0 cursor-pointer text-center transition-all duration-300 hover:scale-110 hover:z-10 ${item.arc}`}
              title={`Click to add ${item.name} (${item.price} DA)`}
            >
              <div className="flex h-12 w-12 sm:h-20 sm:w-20 md:h-32 md:w-32 items-center justify-center">
                <img
                  src={item.img}
                  alt={item.label}
                  className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:-translate-y-2 group-hover:drop-shadow-lg"
                />
              </div>
              <p className="mt-2 sm:mt-4 font-display text-[10px] sm:text-sm md:text-base font-bold text-primary/90 truncate max-w-full">
                {item.label}
              </p>
              <span className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 group-hover:text-marker font-semibold whitespace-nowrap">
                {formatPrice(item.price)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SPECIALTY HIGHLIGHTS (HOUSE CRAFTED SPECIALS) ─────────── */}
      <section className="border-y border-border bg-card/40 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <p className="eyebrow text-primary">House Crafted Specials</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-display font-bold">Specialty Brews & Sweets</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Artisanal drinks, hot savory plates, and handmade cakes prepared fresh daily in Algiers.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Special 1: Iced Caramel */}
            <div className="group rounded-3xl bg-card p-5 border border-border/60 text-center flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-44 items-center justify-center p-2">
                <img
                  src={itemIcedCaramel}
                  alt="Iced Caramel Macchiato"
                  className="max-h-full object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <div className="mt-2">
                <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[11px] font-bold">
                  Signature Iced
                </span>
                <h3 className="mt-2 text-lg font-display font-semibold">Iced Caramel Macchiato</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Layered espresso, chilled milk, caramel drizzle & cinnamon</p>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="font-display font-bold text-primary">{formatPrice(520)}</span>
                  <button
                    onClick={() => handleAddItem({ name: "Iced Caramel Macchiato", price: 520, note: "Caramel drizzle & cinnamon", image: itemIcedCaramel })}
                    className="rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Special 2: Strawberry Matcha */}
            <div className="group rounded-3xl bg-card p-5 border border-border/60 text-center flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-44 items-center justify-center p-2">
                <img
                  src={itemStrawberryMatcha}
                  alt="Iced Strawberry Matcha Latte"
                  className="max-h-full object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <div className="mt-2">
                <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-[11px] font-bold">
                  Ceremonial Matcha
                </span>
                <h3 className="mt-2 text-lg font-display font-semibold">Strawberry Matcha Latte</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Japanese matcha, organic strawberry purée & heart ice</p>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="font-display font-bold text-primary">{formatPrice(580)}</span>
                  <button
                    onClick={() => handleAddItem({ name: "Iced Strawberry Matcha Latte", price: 580, note: "Strawberry purée & matcha", image: itemStrawberryMatcha })}
                    className="rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Special 3: Basque Cheesecake */}
            <div className="group rounded-3xl bg-card p-5 border border-border/60 text-center flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-44 items-center justify-center p-2">
                <img
                  src={itemBasqueCheesecake}
                  alt="Basque Burnt Cheesecake"
                  className="max-h-full object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <div className="mt-2">
                <span className="rounded-full bg-orange-100 text-orange-900 px-2.5 py-0.5 text-[11px] font-bold">
                  Chef Special
                </span>
                <h3 className="mt-2 text-lg font-display font-semibold">Basque Cheesecake</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Caramelised Basque cake, salted caramel & ice cream scoop</p>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="font-display font-bold text-primary">{formatPrice(550)}</span>
                  <button
                    onClick={() => handleAddItem({ name: "Basque Burnt Cheesecake", price: 550, note: "Salted caramel & vanilla ice cream", image: itemBasqueCheesecake })}
                    className="rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Special 4: Salmon Toast */}
            <div className="group rounded-3xl bg-card p-5 border border-border/60 text-center flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-44 items-center justify-center p-2">
                <img
                  src={itemSalmonToast}
                  alt="Smoked Salmon & Cream Cheese Toast"
                  className="max-h-full object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <div className="mt-2">
                <span className="rounded-full bg-rose-100 text-rose-900 px-2.5 py-0.5 text-[11px] font-bold">
                  Artisan Sourdough
                </span>
                <h3 className="mt-2 text-lg font-display font-semibold">Smoked Salmon Toast</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Atlantic smoked salmon, whipped cream cheese & cracked pepper</p>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="font-display font-bold text-primary">{formatPrice(680)}</span>
                  <button
                    onClick={() => handleAddItem({ name: "Smoked Salmon & Cream Cheese Toast", price: 680, note: "Whipped cream cheese on sourdough", image: itemSalmonToast })}
                    className="rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── THE COUNTER MENU (BOOK OF A MENU STYLE WITH PAGINATION) ──── */}
      <section id="menu" className="mx-auto max-w-4xl scroll-mt-24 px-6 py-20">
        <div className="flex flex-wrap items-baseline justify-between border-b border-border pb-6 gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-primary tracking-tight">
              The counter
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Page {safePage} of {totalPages} · {selectedCategory === "All" ? "Full Collection" : selectedCategory}
            </p>
          </div>
          <p className="script text-2xl md:text-3xl text-marker">served all day</p>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {["All", "Drinks", "Desserts", "Savory"].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`rounded-full px-5 py-1.5 text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/70 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {cat === "All"
                ? `All Items (${allFilteredItems.length})`
                : cat === "Desserts"
                ? "Desserts & Cakes"
                : cat === "Savory"
                ? "Savory & Plates"
                : "Drinks & Brews"}
            </button>
          ))}
        </div>

        {/* Counter Items (Paginated Book Page) */}
        <div className="mt-8 rounded-3xl border border-border/80 bg-card/60 p-4 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <span className="eyebrow text-marker text-xs tracking-wider uppercase">
              {currentItems[0]?.categoryTitle || selectedCategory}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Showing items {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, allFilteredItems.length)} of {allFilteredItems.length}
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {currentItems.map((item) => {
              const itemImg = item.image || ASSET_MAP[item.name] || itemCroissant;
              return (
                <div
                  key={item.id || item._id || item.name}
                  className="group flex items-center gap-4 py-4 px-2 transition-colors hover:bg-card rounded-2xl"
                >
                  {/* Free-floating transparent PNG — no box */}
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

                  {/* Price & Add Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-display text-base md:text-lg font-bold text-primary whitespace-nowrap">
                      {formatPrice(item.price)}
                    </span>
                    <button
                      onClick={() => handleAddItem({ name: item.name, price: item.price, note: item.note, image: itemImg })}
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

          {/* ─── BOOK PAGINATION CONTROLS ───────────────────────────── */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-border/60">
              <button
                onClick={() => {
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                  const menuEl = document.getElementById("menu");
                  if (menuEl) menuEl.scrollIntoView({ behavior: "smooth" });
                }}
                disabled={safePage === 1}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold transition-colors hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none"
              >
                ← Previous Page
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      const menuEl = document.getElementById("menu");
                      if (menuEl) menuEl.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`h-8 w-8 rounded-full text-xs font-bold transition-all ${
                      safePage === pageNum
                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                        : "bg-secondary/70 text-secondary-foreground hover:bg-secondary"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  const menuEl = document.getElementById("menu");
                  if (menuEl) menuEl.scrollIntoView({ behavior: "smooth" });
                }}
                disabled={safePage === totalPages}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold transition-colors hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none"
              >
                Next Page →
              </button>
            </div>
          )}
        </div>

        {/* Order Callout */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/50 p-6 border border-border">
          <div>
            <p className="font-display text-lg font-bold">Order Ahead for Pickup</p>
            <p className="text-xs text-muted-foreground">Cash on pickup · BaridiMob (RIP) · Carte CIB / Edahabia</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openCart}
              className="rounded-full bg-roast px-7 py-3 font-bold text-roast-foreground transition-transform hover:-translate-y-0.5 shadow-md"
            >
              Order ahead →
            </button>
            <Link
              to="/menu"
              className="rounded-full border border-border bg-card px-6 py-3 font-bold transition-colors hover:bg-secondary"
            >
              Full menu page
            </Link>
          </div>
        </div>
      </section>

      {/* ─── BEANS ON THE SHELF ────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/60 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold">Beans on the shelf</h2>
            <p className="text-xs text-muted-foreground">250g whole bean or ground · 1,400 DA</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {beans.map((bean: BeanItem) => (
              <article
                key={bean.name}
                className="flex flex-col justify-between rounded-3xl bg-card p-6 shadow-sm transition-transform hover:-translate-y-1 border border-border/60"
              >
                <div>
                  <p className="eyebrow text-marker text-xs">{bean.roast} roast</p>
                  <h3 className="mt-2 text-xl font-display font-bold">{bean.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{bean.note}</p>
                </div>
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/50">
                  <p className="font-display text-base font-bold text-primary">
                    {formatPrice(bean.price || 1400)} / {bean.weight || "250g"}
                  </p>
                  <button
                    onClick={() =>
                      handleAddItem({
                        name: `${bean.name} Beans (250g)`,
                        price: Number(bean.price) || 1400,
                        note: `${bean.roast} roast`,
                      })
                    }
                    className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    + Bag
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
