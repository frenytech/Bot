import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "studyai:cookie-consent";
const OPEN_EVENT = "studyai:open-cookie-settings";

export type Consent = {
  essentials: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

function readStored(): Consent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

function persist(consent: Consent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {
    /* private mode: the banner simply returns next visit */
  }
}

/** Ask the visitor for consent once, and let them revise it later. */
export function recordConsent(consent: Consent) {
  persist(consent);
  const sessionId =
    window.localStorage.getItem("studyai:session-id") ??
    (() => {
      const id = crypto.randomUUID();
      try {
        window.localStorage.setItem("studyai:session-id", id);
      } catch {
        /* ignore */
      }
      return id;
    })();

  // Durable record; the app keeps working if this write fails.
  void supabase.from("cookie_consents").insert({
    session_id: sessionId,
    essentials: consent.essentials,
    analytics: consent.analytics,
    marketing: consent.marketing,
  });
}

/** Lets the cookie policy page reopen the preference centre. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setConsent(readStored());
    setReady(true);

    const onOpen = () => setSettingsOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  const decide = useCallback((next: Omit<Consent, "decidedAt" | "essentials">) => {
    const full: Consent = { essentials: true, ...next, decidedAt: new Date().toISOString() };
    persist(full);
    setConsent(full);
    recordConsent(full);
  }, []);

  const save = useCallback(() => {
    decide({ analytics, marketing });
    setSettingsOpen(false);
  }, [analytics, marketing, decide]);

  if (!ready || consent) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-x-0 bottom-0 z-50 p-4"
          role="region"
          aria-label="Cookie consent"
        >
          <div className="glass-panel mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Cookie className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Your cookie choices</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We use essential cookies to sign you in and protect your study records. Optional
                  cookies help us understand which features help students most.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => decide({ analytics: true, marketing: true })}>
                Accept All
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide({ analytics: false, marketing: false })}>
                Reject Non-Essential
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAnalytics(consent?.analytics ?? false);
                  setMarketing(consent?.marketing ?? false);
                  setSettingsOpen(true);
                }}
              >
                <SlidersHorizontal className="size-4" />
                Cookie Settings
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="glass-panel sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cookie settings</DialogTitle>
            <DialogDescription>
              Essential cookies cannot be turned off because the platform cannot sign you in or
              protect your account without them. You can change these choices at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-semibold">Essential</Label>
                <p className="text-sm text-muted-foreground">
                  Sign-in sessions, security and reading-progress integrity.
                </p>
              </div>
              <Switch checked disabled aria-label="Essential cookies always on" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-semibold">Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Aggregated feature usage so we know what to improve.
                </p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Analytics cookies" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-semibold">Marketing</Label>
                <p className="text-sm text-muted-foreground">
                  Measures whether StudyAI announcements reach students.
                </p>
              </div>
              <Switch checked={marketing} onCheckedChange={setMarketing} aria-label="Marketing cookies" />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={save}>Save preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
