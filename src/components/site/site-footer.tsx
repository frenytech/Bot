import { Link } from "@tanstack/react-router";
import { Github, Mail, MessageCircle, Phone } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { BRAND, FOOTER_NAV, isExternal } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-border/60">
      <div className="section-shell py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2.6fr]">
          <div className="max-w-sm">
            <Logo size={32} />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {BRAND.attribution}. StudyAI brings course materials, an AI tutor, CBT practice and
              personalised study tools into one place, so university students can learn with
              confidence.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={BRAND.github}
                target="_blank"
                rel="noreferrer"
                className="glass-card inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground"
              >
                <Github className="size-4" />
                FrenyTech
              </a>
              <a
                href={BRAND.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="glass-card inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_NAV.map((group) => (
              <div key={group.heading}>
                <h3 className="text-sm font-semibold text-foreground">{group.heading}</h3>
                <ul className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      {isExternal(item.to) ? (
                        <a
                          href={item.to}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          to={item.to}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>{BRAND.footerLine}</p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={`mailto:${BRAND.email}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Mail className="size-4" />
              {BRAND.email}
            </a>
            <a
              href={`tel:${BRAND.phone}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Phone className="size-4" />
              {BRAND.phone}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
