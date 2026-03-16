import Link from "next/link";

import "./globals.css";

export const metadata = {
  title: "PageCraft Dashboard",
  description: "Web dashboard for PageCraft captures, crawls, and plugin exports."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:px-8">
          <aside className="panel hidden w-72 shrink-0 flex-col justify-between p-6 lg:flex">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">PageCraft</p>
              <h1 className="mt-3 text-2xl font-semibold text-ink">Capture Ops</h1>
              <nav className="mt-8 space-y-2 text-sm">
                <Link className="block rounded-2xl px-4 py-3 font-medium text-slate-600 transition hover:bg-slate-50 hover:text-ink" href="/projects">
                  Projects
                </Link>
                <Link className="block rounded-2xl px-4 py-3 font-medium text-slate-600 transition hover:bg-slate-50 hover:text-ink" href="/login">
                  Login
                </Link>
                <Link className="block rounded-2xl px-4 py-3 font-medium text-slate-600 transition hover:bg-slate-50 hover:text-ink" href="/settings">
                  Settings
                </Link>
                <Link className="block rounded-2xl px-4 py-3 font-medium text-slate-600 transition hover:bg-slate-50 hover:text-ink" href="/billing">
                  Billing
                </Link>
              </nav>
            </div>
            <p className="text-sm leading-6 text-slate-500">
              This MVP uses a local JSON-backed state store so teams can validate the capture and import flow without full infra.
            </p>
          </aside>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
