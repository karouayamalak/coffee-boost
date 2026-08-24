import { useState, createContext, useContext, ReactNode } from "react";
import { placeOrder, formatPrice } from "../lib/api";
import { Bean } from "./bean";

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
  note?: string | undefined;
  image?: string | undefined;
}

interface CartContextType {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  items: CartItem[];
  addItem: (item: { name: string; price: number | string; note?: string | undefined; image?: string | undefined }) => void;
  removeItem: (name: string) => void;
  updateQuantity: (name: string, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addItem = (item: { name: string; price: number | string; note?: string | undefined; image?: string | undefined }) => {
    const rawPrice = typeof item.price === "string" ? parseFloat(item.price.replace(/[^0-9.]/g, "")) : item.price;
    const numPrice = isNaN(rawPrice) ? 350 : rawPrice;

    setItems((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      const newItem: CartItem = {
        name: item.name,
        price: numPrice,
        quantity: 1,
        note: item.note,
        image: item.image,
      };
      return [...prev, newItem];
    });
    setIsOpen(true);
  };

  const removeItem = (name: string) => {
    setItems((prev) => prev.filter((i) => i.name !== name));
  };

  const updateQuantity = (name: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.name === name) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter((i): i is CartItem => i !== null)
    );
  };

  const clearCart = () => setItems([]);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        isOpen,
        openCart,
        closeCart,
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        totalPrice,
      }}
    >
      {children}
      {isOpen && <CartModal />}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

function CartModal() {
  const { items, closeCart, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupTime, setPickupTime] = useState("15 mins");
  const [paymentMethod, setPaymentMethod] = useState("Cash on pickup");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setLoading(true);
    try {
      const res = await placeOrder({
        customerName: name,
        customerPhone: phone,
        items,
        total: totalPrice,
        pickupTime: `Ready in ${pickupTime}`,
        paymentMethod,
        specialInstructions: instructions,
      });

      if (res.success) {
        setOrderSuccess(res.order);
        clearCart();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={closeCart}
        aria-label="Close cart backdrop"
      />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-background p-6 shadow-2xl overflow-y-auto sm:rounded-l-3xl border-l border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Bean className="h-6 w-5" />
            <h2 className="font-display text-2xl font-bold">Order Ahead</h2>
          </div>
          <button
            onClick={closeCart}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {orderSuccess ? (
          <div className="my-auto flex flex-col items-center text-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Bean className="h-8 w-7" />
            </div>
            <p className="eyebrow text-marker mt-4">Order Confirmed</p>
            <h3 className="font-display text-3xl font-extrabold mt-1">
              {orderSuccess.orderNumber || "BC-7821"}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Thank you, <strong className="text-foreground">{orderSuccess.customerName}</strong>! Your order is queued on the counter.
            </p>
            <div className="mt-6 rounded-2xl bg-secondary/80 p-4 text-xs text-left w-full space-y-2">
              <p><strong>Pickup:</strong> {orderSuccess.pickupTime || "In 15 minutes"}</p>
              <p><strong>Total:</strong> <span className="font-bold text-primary">{formatPrice(orderSuccess.total || totalPrice)}</span></p>
              <p><strong>Payment:</strong> {orderSuccess.paymentMethod || paymentMethod}</p>
              <p><strong>Location:</strong> 14 Rue des Grains, Algiers</p>
            </div>
            <button
              onClick={() => {
                setOrderSuccess(null);
                closeCart();
              }}
              className="mt-8 w-full rounded-full bg-primary py-3 font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="my-auto flex flex-col items-center text-center py-12">
            <Bean className="h-12 w-10 opacity-30" />
            <p className="mt-4 font-display text-xl">Your order is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your favorite drinks, bakery treats, or savory morning plates.
            </p>
            <button
              onClick={closeCart}
              className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-between pt-4">
            {/* Items list with images */}
            <div className="space-y-3 overflow-y-auto max-h-[32vh] pr-1">
              {items.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl bg-card p-3 border border-border/60"
                >
                  <div className="flex items-center gap-3 flex-1 pr-2">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 object-contain rounded-xl shrink-0 bg-background/50 p-1"
                      />
                    )}
                    <div>
                      <p className="font-display font-bold text-sm leading-tight">{item.name}</p>
                      <p className="text-xs text-primary font-bold mt-0.5">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.name, -1)}
                      className="h-7 w-7 rounded-full bg-secondary text-sm font-bold hover:bg-secondary/70"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.name, 1)}
                      className="h-7 w-7 rounded-full bg-secondary text-sm font-bold hover:bg-secondary/70"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.name)}
                      className="ml-1 text-xs text-muted-foreground hover:text-destructive"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 border-t border-border pt-4 space-y-3">
              <div className="flex justify-between font-display text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(totalPrice)}</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amina K."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2 text-xs focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="0555 12 34 56"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2 text-xs focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Pickup Time</label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-card px-2 py-2 text-xs focus:ring-2 focus:ring-primary"
                  >
                    <option value="15 mins">In 15 mins</option>
                    <option value="30 mins">In 30 mins</option>
                    <option value="45 mins">In 45 mins</option>
                    <option value="1 hour">In 1 hour</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Payment</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-card px-2 py-2 text-xs focus:ring-2 focus:ring-primary"
                  >
                    <option value="Cash on pickup">Cash on pickup</option>
                    <option value="BaridiMob">BaridiMob (RIP)</option>
                    <option value="Carte CIB / Edahabia">Carte CIB / Edahabia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Note / Request (Optional)</label>
                <input
                  type="text"
                  placeholder="Oat milk, extra shot, no sugar..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2 text-xs focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !name || !phone}
                className="mt-2 w-full rounded-full bg-primary py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Placing Order..." : `Confirm Order · ${formatPrice(totalPrice)}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
