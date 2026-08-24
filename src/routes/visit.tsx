import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { placeReservation } from "@/lib/api";
import { toast } from "sonner";
import { Bean } from "@/components/bean";

export const Route = createFileRoute("/visit")({
  head: () => ({
    meta: [
      { title: "Visit & Contact — Boost Coffee Shop" },
      {
        name: "description",
        content:
          "Find Boost Coffee Shop at 14 Rue des Grains, Algiers. Open Mon–Sat 7:00–19:00, Sunday 8:00–14:00. Reserve a table or order ahead.",
      },
      { property: "og:title", content: "Visit & Contact — Boost Coffee Shop" },
      {
        property: "og:description",
        content: "14 Rue des Grains, Algiers. Open at 7am, six days a week.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VisitPage,
});

const hours = [
  ["Monday – Friday", "7:00 – 19:00"],
  ["Saturday", "7:30 – 19:00"],
  ["Sunday", "8:00 – 14:00"],
  ["Roast days", "Tuesday & Friday"],
];

function VisitPage() {
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guests: 2,
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    seatingPreference: "indoor",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any>(null);

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await placeReservation({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        guests: formData.guests,
        date: (formData.date || new Date().toISOString().split("T")[0]) as string,
        time: formData.time,
        seatingPreference: formData.seatingPreference,
        notes: formData.notes,
      });
      if (res.success) {
        setSuccessInfo(res.reservation || formData);
        toast.success("Table reserved successfully!", {
          description: `See you on ${formData.date} at ${formData.time}!`,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reserve table. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="eyebrow text-primary">Visit</p>
        <h1 className="mt-3 text-5xl md:text-6xl">
          Come get <span className="script text-marker">boosted</span>
        </h1>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-4xl bg-card p-8 shadow-sm">
            <h2 className="text-2xl">The shop</h2>
            <address className="mt-4 not-italic text-muted-foreground">
              14 Rue des Grains
              <br />
              Algiers, Algeria
            </address>
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="font-bold">Email</dt>
                <dd>
                  <a href="mailto:hello@boostcoffee.shop" className="text-primary">
                    hello@boostcoffee.shop
                  </a>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold">Phone</dt>
                <dd>
                  <a href="tel:+213555000123" className="text-primary">
                    +213 555 000 123
                  </a>
                </dd>
              </div>
            </dl>
            <button
              onClick={() => {
                setSuccessInfo(null);
                setIsReserveModalOpen(true);
              }}
              className="mt-8 inline-block rounded-full bg-marker px-7 py-3 font-bold text-marker-foreground transition-transform hover:-translate-y-0.5"
            >
              Reserve a table
            </button>
          </div>

          <div className="rounded-4xl bg-roast p-8 text-roast-foreground shadow-sm">
            <h2 className="text-2xl">Opening hours</h2>
            <dl className="mt-5 divide-y divide-roast-foreground/15">
              {hours.map(([day, time]) => (
                <div key={day} className="flex justify-between py-3 text-sm">
                  <dt className="opacity-80">{day}</dt>
                  <dd className="font-bold">{time}</dd>
                </div>
              ))}
            </dl>
            <p className="script mt-6 text-3xl text-marker">first pour at seven</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-4xl border border-border">
          <iframe
            title="Map showing Boost Coffee Shop in Algiers"
            src="https://www.openstreetmap.org/export/embed.html?bbox=3.03%2C36.75%2C3.09%2C36.79&layer=mapnik"
            loading="lazy"
            className="h-[380px] w-full"
          />
        </div>
      </section>

      {/* Interactive Reservation Modal */}
      {isReserveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsReserveModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-background p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Bean className="h-6 w-5" />
                <h3 className="font-display text-2xl font-bold">Reserve a Table</h3>
              </div>
              <button
                onClick={() => setIsReserveModalOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary transition-colors"
              >
                ✕
              </button>
            </div>

            {successInfo ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <span className="text-3xl">☕</span>
                </div>
                <p className="eyebrow text-marker mt-4">Reservation Confirmed</p>
                <h4 className="font-display text-2xl font-bold mt-1">Table for {successInfo.guests} Guests</h4>
                <p className="mt-3 text-sm text-muted-foreground">
                  We have saved your table for <strong>{successInfo.date}</strong> at{" "}
                  <strong>{successInfo.time}</strong> under <strong>{successInfo.name}</strong>.
                </p>
                <button
                  onClick={() => setIsReserveModalOpen(false)}
                  className="mt-6 rounded-full bg-primary px-8 py-2.5 font-bold text-primary-foreground hover:bg-primary/90"
                >
                  Great, see you then!
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReservation} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Karim B."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+213 555 000 123"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Guests *
                    </label>
                    <select
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "person" : "people"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="hello@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Seating Preference
                  </label>
                  <select
                    value={formData.seatingPreference}
                    onChange={(e) => setFormData({ ...formData, seatingPreference: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                  >
                    <option value="indoor">Indoor main hall</option>
                    <option value="terrace">Outdoor terrace</option>
                    <option value="bar_counter">Roastery bar counter</option>
                    <option value="any">First available table</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Special Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Celebration, quiet corner, laptop socket..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full rounded-full bg-marker py-3 font-bold text-marker-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? "Confirming Table..." : "Confirm Reservation"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
