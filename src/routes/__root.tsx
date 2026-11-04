import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth";
import { applyTheme, getStoredTheme } from "../lib/theme";
import { SiteHeader } from "../components/site/site-header";
import { SiteFooter } from "../components/site/site-footer";
import { CookieConsent } from "../components/site/cookie-consent";
import { Toaster } from "../components/ui/sonner";
import { Logo } from "../components/brand/logo";

function NotFoundComponent() {
  return (
    <div className="aurora-canvas flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md rounded-3xl p-10 text-center">
        <p className="text-gradient text-7xl font-extrabold">404</p>
        <h1 className="mt-4 text-xl font-semibold">This page could not be found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Back to StudyAI
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="aurora-canvas flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md rounded-3xl p-10 text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try again, or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-input px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "StudyAI — An AI Learning Platform by FrenyTech" },
      {
        name: "description",
        content:
          "StudyAI helps university students study smarter with an AI tutor, protected course materials, CBT examination practice, flashcards and personalised learning analytics.",
      },
      { name: "author", content: "FrenyTech" },
      { name: "theme-color", content: "#070b1a" },
      { property: "og:site_name", content: "StudyAI" },
      { property: "og:title", content: "StudyAI — An AI Learning Platform by FrenyTech" },
      {
        property: "og:description",
        content:
          "Your intelligent learning companion for university success. AI tutoring, course materials, CBT practice and better study habits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "StudyAI — An AI Learning Platform by FrenyTech" },
      {
        name: "twitter:description",
        content:
          "Study smarter with StudyAI: AI tutoring, university course materials, CBT practice, flashcards and personalised learning.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // StudyAI's signature deep-navy canvas is the default; a saved light choice
  // is applied once the document exists.
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <CookieConsent />
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Referenced by the 404/error shells above so the brand mark stays consistent.
export const BrandMark = Logo;
