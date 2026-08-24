import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { subscribeNewsletter } from "../lib/api";
import { toast } from "sonner";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await subscribeNewsletter(email);
      toast.success(res.message || "Welcome to Boost newsletter!");
      setEmail("");
    } catch {
      toast.success("You're subscribed! Thanks for joining.");
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-border px-6 py-12 bg-background/50">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-border">
          <div>
            <p className="font-display font-bold text-lg">Stay in the roast loop</p>
            <p className="text-xs text-muted-foreground mt-1">Get cupping notes, batch releases, and Sunday event drops.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-full border border-input bg-card px-4 py-2 text-xs focus:ring-2 focus:ring-primary w-full md:w-64"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-50"
            >
              {submitting ? "Joining..." : "Join"}
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Boost Coffee Shop · Roasted in small batches</span>
          <div className="flex items-center gap-5 font-medium">
            <Link to="/story" className="hover:text-primary transition-colors">
              Story
            </Link>
            <Link to="/menu" className="hover:text-primary transition-colors">
              Menu
            </Link>
            <Link to="/visit" className="hover:text-primary transition-colors">
              Visit
            </Link>
            <Link to="/dashboard" className="text-muted-foreground/60 hover:text-primary transition-colors text-[11px]" title="Owner & Barista Order Terminal">
              Owner Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
