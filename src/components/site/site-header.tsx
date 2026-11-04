import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, LayoutDashboard, Menu, Settings, ShieldCheck, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PRIMARY_NAV, isExternal } from "@/lib/brand";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.href]);

  const initials = (profile?.full_name || user?.email || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "glass-panel border-b" : "border-b border-transparent",
      )}
    >
      <div className="section-shell flex h-16 items-center justify-between gap-4 md:h-18">
        <Link to="/" className="rounded-lg" aria-label="StudyAI home">
          <Logo size={30} />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {PRIMARY_NAV.map((item) =>
            isExternal(item.to) ? (
              <a
                key={item.to}
                href={item.to}
                target="_blank"
                rel="noreferrer"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              {isAdmin ? (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin">
                    <ShieldCheck className="size-4" />
                    Admin
                  </Link>
                </Button>
              ) : null}
              <Button size="sm" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </Button>
              <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
                <span
                  className="grid size-8 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary glow-ring"
                  aria-hidden
                >
                  {initials || "S"}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="glass-card inline-flex size-10 items-center justify-center rounded-xl lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="glass-panel overflow-hidden border-b lg:hidden"
          >
            <nav className="section-shell flex flex-col gap-1 py-4" aria-label="Mobile">
              {PRIMARY_NAV.map((item) =>
                isExternal(item.to) ? (
                  <a
                    key={item.to}
                    href={item.to}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-accent"
                  >
                    {item.label}
                  </Link>
                ),
              )}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
                {user ? (
                  <>
                    <Button asChild className="w-full justify-start">
                      <Link to="/dashboard">
                        <LayoutDashboard className="size-4" />
                        Dashboard
                      </Link>
                    </Button>
                    {isAdmin ? (
                      <Button variant="outline" asChild className="w-full justify-start">
                        <Link to="/admin">
                          <ShieldCheck className="size-4" />
                          Admin dashboard
                        </Link>
                      </Button>
                    ) : null}
                    <Button variant="outline" asChild className="w-full justify-start">
                      <Link to="/settings">
                        <Settings className="size-4" />
                        Settings
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => void signOut()}
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <button type="button" onClick={() => navigate({ to: "/login" })}>
                        Sign in
                      </button>
                    </Button>
                    <Button className="w-full" asChild>
                      <button type="button" onClick={() => navigate({ to: "/register" })}>
                        Get Started
                      </button>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
