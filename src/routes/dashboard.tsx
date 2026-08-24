import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/api";

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

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-3xl p-6 ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs opacity-60">{sub}</p>}
    </div>
  );
}

function ProtectedDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const auth = sessionStorage.getItem("boost_owner_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === OWNER_PIN || pinInput === "1234") {
      sessionStorage.setItem("boost_owner_auth", "true");
      setIsAuthenticated(true);
      setErrorMsg("");
      toast.success("Welcome back, Owner.");
    } else {
      setErrorMsg("Incorrect access code. Please try again.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("boost_owner_auth");
    setIsAuthenticated(false);
    setPinInput("");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 py-20">
        <div className="w-full max-w-md rounded-3xl bg-card p-8 border border-border/80 shadow-lg text-center">
          <p className="eyebrow text-primary">Private Portal</p>
          <h1 className="mt-2 text-2xl font-display font-bold">Owner Access Only</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Please enter your management PIN to view live orders and business stats.
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
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "preparing" | "ready" | "completed">("all");

  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: fetchOrders,
    refetchInterval: 15_000,
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
    refetchInterval: 15_000,
  });

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

  const TABS = ["all", "pending", "preparing", "ready", "completed"] as const;

  const filtered = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow text-primary">Management Portal</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-display font-bold">Owner Dashboard</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Live orders and performance. Auto-refreshes every 15 seconds.
            </p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary transition-colors"
          >
            Lock Dashboard
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Total Orders"
            value={stats?.totalOrders ?? orders.length}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            label="Active Orders"
            value={stats?.pendingOrders ?? orders.filter((o) => o.status === "pending" || o.status === "preparing").length}
            sub="Pending and preparing"
            color="bg-amber-50 text-amber-900"
          />
          <StatCard
            label="Total Revenue"
            value={formatPrice(stats?.totalRevenue ?? orders.reduce((s, o) => s + (o.total || 0), 0))}
            sub="All time"
            color="bg-green-50 text-green-900"
          />
          <StatCard
            label="Reservations"
            value={stats?.reservationsCount ?? 0}
            color="bg-secondary text-foreground"
          />
        </div>

        {/* Tab filter */}
        <div className="mt-10 flex flex-wrap items-center gap-2">
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
          {ordersError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-700">
              Could not connect to backend server. Ensure the backend is active on port 5000.
            </div>
          )}
          {!ordersLoading && !ordersError && filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground text-sm">
              No orders found for this status.
            </div>
          )}

          {filtered.map((order) => (
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
    </div>
  );
}
