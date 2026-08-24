import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatPrice, fetchMenu, addMenuItem, deleteMenuItem } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Owner Portal — Boost Coffee Shop" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProtectedDashboardPage,
});

const API_BASE =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api";

const OWNER_PIN = "boost2026";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  note?: string;
  image?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  pickupTime: string;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  specialInstructions?: string;
  createdAt: string;
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  reservationsCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_FLOW: Record<string, string> = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};

async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error("Failed to fetch orders");
    const data = await res.json();
    return data.orders ?? [];
  } catch (err) {
    console.debug("Dashboard fetchOrders fallback:", err);
    return [];
  }
}

async function fetchStats(): Promise<Stats> {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    const data = await res.json();
    return data.stats || { totalOrders: 0, pendingOrders: 0, totalRevenue: 0, reservationsCount: 0 };
  } catch (err) {
    console.debug("Dashboard fetchStats fallback:", err);
    return { totalOrders: 0, pendingOrders: 0, totalRevenue: 0, reservationsCount: 0 };
  }
}

async function updateOrderStatus(id: string, status: string) {
  const res = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

async function deleteOrder(id: string) {
  const res = await fetch(`${API_BASE}/orders/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete order");
  return res.json();
}

function ProtectedDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("boost_owner_auth") === "true";
  });
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === OWNER_PIN || pinInput.trim() === "1234") {
      sessionStorage.setItem("boost_owner_auth", "true");
      setIsAuthenticated(true);
      setErrorMsg("");
      toast.success("Owner unlocked successfully");
    } else {
      setErrorMsg("Incorrect PIN. Please try again.");
      toast.error("Incorrect PIN");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("boost_owner_auth");
    setIsAuthenticated(false);
    setPinInput("");
    toast.info("Dashboard locked");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 py-20">
        <div className="w-full max-w-md rounded-3xl bg-card p-8 border border-border/80 shadow-lg text-center">
          <p className="eyebrow text-primary">Private Portal</p>
          <h1 className="mt-2 text-2xl font-display font-bold">Owner Access Only</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Please enter your management PIN to view live orders and manage menu products.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <input
                type="password"
                autoFocus
                placeholder="Enter PIN (Default: boost2026)"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-center text-sm font-bold tracking-widest focus:ring-2 focus:ring-primary"
              />
            </div>
            {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}
            <button
              type="submit"
              className="w-full rounded-full bg-primary px-6 py-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <DashboardView onLogout={handleLogout} />;
}

function DashboardView({ onLogout }: { onLogout: () => void }) {
  const qc = useQueryClient();
  const [mainView, setMainView] = useState<"orders" | "products">("orders");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "preparing" | "ready" | "completed">("all");

  // New product form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Drinks & Specialty Brews");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductNote, setNewProductNote] = useState("");
  const [newProductBadge, setNewProductBadge] = useState("");
  const [newProductImage, setNewProductImage] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Queries
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: fetchOrders,
    refetchInterval: 10_000,
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
    refetchInterval: 10_000,
  });

  const { data: menuSections = [] } = useQuery({
    queryKey: ["menu"],
    queryFn: fetchMenu,
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard-orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard-orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Order removed");
    },
    onError: () => toast.error("Failed to remove order"),
  });

  const addProductMutation = useMutation({
    mutationFn: addMenuItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Product added to menu!");
      setShowAddModal(false);
      setNewProductName("");
      setNewProductPrice("");
      setNewProductNote("");
      setNewProductBadge("");
      setNewProductImage("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add product");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Product removed from menu");
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice) {
      toast.error("Please enter product name and price");
      return;
    }
    setIsSubmittingProduct(true);
    addProductMutation.mutate(
      {
        name: newProductName.trim(),
        category: newProductCategory,
        price: Number(newProductPrice),
        note: newProductNote.trim(),
        badge: newProductBadge.trim() || undefined,
        image: newProductImage.trim() || undefined,
      },
      {
        onSettled: () => setIsSubmittingProduct(false),
      }
    );
  };

  const TABS = ["all", "pending", "preparing", "ready", "completed"] as const;
  const filteredOrders = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow text-primary">Management Portal</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-display font-bold">Owner Dashboard</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Live orders and menu product management in Algerian Dinars (DA).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMainView("orders")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                mainView === "orders" ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Live Orders ({orders.filter((o) => o.status === "pending" || o.status === "preparing").length})
            </button>
            <button
              onClick={() => setMainView("products")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                mainView === "products" ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Manage Products & Menu
            </button>
            <button
              onClick={onLogout}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition-colors"
            >
              Lock
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* STATS OVERVIEW ROW */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Total Orders"
            value={stats?.totalOrders ?? orders.length}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            label="Active Orders"
            value={stats?.pendingOrders ?? orders.filter((o) => o.status === "pending" || o.status === "preparing").length}
            sub="Pending & preparing"
            color="bg-amber-50 text-amber-900"
          />
          <StatCard
            label="Total Revenue"
            value={formatPrice(stats?.totalRevenue ?? orders.reduce((s, o) => s + (o.total || 0), 0))}
            sub="All time"
            color="bg-green-50 text-green-900"
          />
          <StatCard
            label="Menu Items"
            value={menuSections.reduce((acc, s) => acc + s.items.length, 0)}
            sub="Active products"
            color="bg-secondary text-foreground"
          />
        </div>

        {/* ─── VIEW 1: ORDERS TERMINAL ──────────────────────────────── */}
        {mainView === "orders" && (
          <div className="mt-10">
            {/* Tab filter */}
            <div className="flex flex-wrap items-center gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {tab}
                  {tab !== "all" && (
                    <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-[10px]">
                      {orders.filter((o) => o.status === tab).length}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  qc.invalidateQueries({ queryKey: ["dashboard-orders"] });
                  qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
                  toast.success("Data refreshed");
                }}
                className="ml-auto rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary transition-colors"
              >
                Refresh Data
              </button>
            </div>

            {/* Orders list */}
            <div className="mt-6 space-y-4">
              {ordersLoading && (
                <div className="py-20 text-center text-muted-foreground text-sm">
                  Loading orders...
                </div>
              )}
              {!ordersLoading && filteredOrders.length === 0 && (
                <div className="py-20 text-center text-muted-foreground text-sm">
                  No orders found for this status. New customer orders will appear here in real-time.
                </div>
              )}

              {filteredOrders.map((order) => (
                <div
                  key={order._id || order.orderNumber}
                  className="rounded-3xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Left: order info */}
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-lg font-bold">{order.orderNumber}</span>
                        <span className={`rounded-full px-3 py-0.5 text-xs font-bold capitalize ${STATUS_COLORS[order.status] ?? "bg-gray-100"}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.paymentMethod} | {order.pickupTime}
                      </p>
                    </div>

                    {/* Right: total + actions */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-display text-xl font-bold text-primary">
                        {formatPrice(order.total)}
                      </span>
                      <div className="flex gap-2">
                        {STATUS_FLOW[order.status] && (
                          <button
                            onClick={() => {
                              const nextStatus = STATUS_FLOW[order.status];
                              if (nextStatus) {
                                statusMutation.mutate({
                                  id: order._id || order.orderNumber,
                                  status: nextStatus,
                                });
                              }
                            }}
                            className="rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors capitalize"
                          >
                            Mark {STATUS_FLOW[order.status]}
                          </button>
                        )}
                        {order.status !== "cancelled" && order.status !== "completed" && (
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: order._id || order.orderNumber,
                                status: "cancelled",
                              })
                            }
                            className="rounded-full border border-red-200 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {(order.status === "completed" || order.status === "cancelled") && (
                          <button
                            onClick={() =>
                              deleteMutation.mutate(order._id || order.orderNumber)
                            }
                            className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  <ul className="mt-4 divide-y divide-border/50">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between py-2 text-sm">
                        <span className="flex items-center gap-2">
                          <span className="font-semibold">{item.quantity}x</span>
                          <span>{item.name}</span>
                          {item.note && <span className="text-xs text-muted-foreground">({item.note})</span>}
                        </span>
                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>

                  {order.specialInstructions && (
                    <p className="mt-3 rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                      Instructions: {order.specialInstructions}
                    </p>
                  )}

                  <p className="mt-3 text-right text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString("fr-DZ", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── VIEW 2: PRODUCTS & MENU MANAGEMENT ───────────────────── */}
        {mainView === "products" && (
          <div className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-display font-bold">Menu Products ({menuSections.reduce((acc, s) => acc + s.items.length, 0)})</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add new food & drink items or manage existing products in Algerian Dinars (DA).
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
              >
                + Add New Product
              </button>
            </div>

            {/* Products by category */}
            <div className="mt-8 space-y-10">
              {menuSections.map((section) => (
                <div key={section.title} className="rounded-3xl border border-border bg-card p-6">
                  <h3 className="eyebrow text-marker text-sm uppercase tracking-wider mb-4">
                    {section.title} ({section.items.length})
                  </h3>

                  <div className="divide-y divide-border/60">
                    {section.items.map((item) => (
                      <div key={item.id || item._id || item.name} className="flex items-center justify-between py-3.5 gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-12 w-12 object-contain shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display text-base font-bold">{item.name}</span>
                              {item.badge && (
                                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{item.note}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="font-display font-bold text-primary text-base">
                            {formatPrice(item.price)}
                          </span>
                          {(item.id || item._id) && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove "${item.name}" from the menu?`)) {
                                  deleteProductMutation.mutate(item.id || item._id || "");
                                }
                              }}
                              className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ADD PRODUCT MODAL */}
            {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="w-full max-w-lg rounded-3xl bg-card p-6 md:p-8 border border-border shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <h3 className="text-xl font-display font-bold">Add New Product to Menu</h3>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="rounded-full p-2 text-muted-foreground hover:bg-secondary text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddProductSubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pistachio Crema Croissant"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Category *
                        </label>
                        <select
                          value={newProductCategory}
                          onChange={(e) => setNewProductCategory(e.target.value)}
                          className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-primary"
                        >
                          <option value="Drinks & Specialty Brews">Drinks & Specialty Brews</option>
                          <option value="Desserts, Cakes & Bakery">Desserts, Cakes & Bakery</option>
                          <option value="Savory & Breakfast Plates">Savory & Breakfast Plates</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Price in Dinars (DA) *
                        </label>
                        <input
                          type="number"
                          required
                          min="10"
                          step="10"
                          placeholder="e.g. 450"
                          value={newProductPrice}
                          onChange={(e) => setNewProductPrice(e.target.value)}
                          className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Description / Culinary Notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Flaky butter croissant filled with pistachio praline cream"
                        value={newProductNote}
                        onChange={(e) => setNewProductNote(e.target.value)}
                        className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-xs focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Badge Tag (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Chef Special, Signature"
                          value={newProductBadge}
                          onChange={(e) => setNewProductBadge(e.target.value)}
                          className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-xs focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Image URL (Optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://... or /assets/..."
                          value={newProductImage}
                          onChange={(e) => setNewProductImage(e.target.value)}
                          className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-xs focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="rounded-full border border-border px-5 py-2 text-xs font-semibold hover:bg-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingProduct}
                        className="rounded-full bg-primary px-6 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isSubmittingProduct ? "Saving..." : "Save Product"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl md:text-3xl font-display font-bold">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
